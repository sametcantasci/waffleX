import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export const sendProxyRequest = async ({ targetUrl, method, headers, cookies, payload }) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/proxy`, {
            targetUrl,
            method,
            headers,
            cookies,
            payload,
        });
        return response.data;
    } catch (error) {
        console.error('Proxy Request Error:', error);
        return {
            status: 0,
            latency: 0,
            error: error.message,
            isHardError: true,
            responseLength: 0,
            fingerprint: 'transport_error',
            wafSignals: ['TRANSPORT_ERROR'],
        };
    }
};

export const detectVectorHint = (payloadFile = '', payloadValue = '') => {
    const file = payloadFile.toLowerCase();
    const value = payloadValue.toLowerCase();
    if (file.includes('lfi') || value.includes('/etc/passwd') || value.includes('win.ini')) return 'lfi';
    if (file.includes('xss') || value.includes('<script') || value.includes('javascript:')) return 'xss';
    if (file.includes('sqli') || value.includes("' or") || value.includes('union select')) return 'sqli';
    if (file.includes('rce') || value.includes('bash -c') || value.includes('powershell')) return 'rce';
    if (file.includes('redirect') || value.includes('http://') || value.includes('https://')) return 'redirect';
    return 'generic';
};

const safeEncodeURIComponent = (value) => {
    try {
        return encodeURIComponent(value);
    } catch {
        return value;
    }
};

const slashEncode = (value) => value.replaceAll('/', '%2f').replaceAll('\\', '%5c');
const doubleEncode = (value) => safeEncodeURIComponent(safeEncodeURIComponent(value));
const mixedSlash = (value) => value.replaceAll('/', '/./').replaceAll('\\', '\\\\.\\');
const whitespaceSuffix = (value) => `${value}%20`;
const commentSuffix = (value) => `${value}/**/`;
const htmlEntity = (value) => value.replaceAll('<', '&#x3c;').replaceAll('>', '&#x3e;');
const delimiterVariant = (value) => value.replaceAll('=', '%3d').replaceAll('&', '%26');

export const buildMutationPlan = (basePayload, { vectorHint = 'generic', depth = 2 } = {}) => {
    const variants = [{
        mutationLabel: 'BASELINE',
        mutationDepth: 0,
        variantValue: basePayload,
    }];

    const candidates = [
        { mutationLabel: 'URL_ENCODED', mutationDepth: 1, variantValue: safeEncodeURIComponent(basePayload) },
        { mutationLabel: 'DOUBLE_ENCODED', mutationDepth: 2, variantValue: doubleEncode(basePayload) },
        { mutationLabel: 'SLASH_ENCODED', mutationDepth: 1, variantValue: slashEncode(basePayload) },
        { mutationLabel: 'MIXED_DELIMITERS', mutationDepth: 2, variantValue: mixedSlash(basePayload) },
        { mutationLabel: 'WHITESPACE_SUFFIX', mutationDepth: 1, variantValue: whitespaceSuffix(basePayload) },
    ];

    if (vectorHint === 'xss') {
        candidates.push(
            { mutationLabel: 'HTML_ENTITY', mutationDepth: 2, variantValue: htmlEntity(basePayload) },
            { mutationLabel: 'DELIMITER_SHIFT', mutationDepth: 2, variantValue: delimiterVariant(basePayload) }
        );
    }

    if (vectorHint === 'sqli' || vectorHint === 'rce') {
        candidates.push({ mutationLabel: 'COMMENT_SUFFIX', mutationDepth: 2, variantValue: commentSuffix(basePayload) });
    }

    const filtered = candidates.filter((entry) => entry.mutationDepth <= depth && entry.variantValue !== basePayload);
    const deduped = [];
    const seen = new Set();
    for (const item of [...variants, ...filtered]) {
        if (seen.has(item.variantValue)) continue;
        seen.add(item.variantValue);
        deduped.push(item);
    }
    return deduped;
};

export const analyzeDifferential = (baseline, variant) => {
    if (!baseline) {
        return {
            drift: false,
            interpretation: 'BASELINE_REFERENCE',
            confidence: 'LOW',
            signals: ['BASELINE'],
            responseDelta: 0,
            latencyShift: 0,
        };
    }

    const signals = [];
    const responseDelta = Math.abs((variant.responseLength || 0) - (baseline.responseLength || 0));
    const latencyShift = (variant.latency || 0) - (baseline.latency || 0);
    const statusChanged = baseline.status !== variant.status;
    const latencySpike = (variant.latency || 0) > Math.max((baseline.latency || 0) * 1.5, (baseline.latency || 0) + 250);
    const shapeChanged = responseDelta > 120;
    const fingerprintChanged = baseline.fingerprint && variant.fingerprint && baseline.fingerprint !== variant.fingerprint;

    if (statusChanged) signals.push('STATUS_DRIFT');
    if (latencySpike) signals.push('LATENCY_SPIKE');
    if (shapeChanged) signals.push('RESPONSE_SHAPE_CHANGE');
    if (fingerprintChanged) signals.push('FINGERPRINT_CHANGE');

    let interpretation = 'BEHAVIORALLY_CONSISTENT';
    let confidence = 'LOW';

    if (statusChanged && baseline.status >= 200 && baseline.status < 300 && [403, 406, 429].includes(variant.status)) {
        interpretation = 'ENFORCEMENT_DRIFT';
        confidence = 'HIGH';
    } else if (statusChanged && baseline.status === 403 && variant.status >= 200 && variant.status < 300) {
        interpretation = 'NORMALIZATION_MISMATCH';
        confidence = 'HIGH';
    } else if (latencySpike && shapeChanged) {
        interpretation = 'DEEP_INSPECTION_VARIANCE';
        confidence = 'MEDIUM';
    } else if (shapeChanged || fingerprintChanged) {
        interpretation = 'ORIGIN_RESPONSE_DIVERGENCE';
        confidence = 'MEDIUM';
    }

    return {
        drift: signals.length > 0,
        interpretation,
        confidence,
        signals,
        responseDelta,
        latencyShift,
    };
};

export const attributeLayer = (result, differential) => {
    if ([403, 406].includes(result.status)) return 'EDGE_WAF';
    if (result.status === 429) return 'RATE_LIMIT_LAYER';
    if (differential?.interpretation === 'NORMALIZATION_MISMATCH') return 'PARSER_INCONSISTENCY';
    if (differential?.interpretation === 'DEEP_INSPECTION_VARIANCE') return 'DEEP_INSPECTION';
    if (differential?.interpretation === 'ORIGIN_RESPONSE_DIVERGENCE') return 'ORIGIN_APPLICATION';
    if (result.status >= 200 && result.status < 300) return 'POTENTIAL_PASS';
    return 'UNDETERMINED';
};

export const describeSignal = (result, differential) => {
    if ([403, 406].includes(result.status)) return 'ENFORCED';
    if (result.status === 429) return 'RATE_LIMITED';
    if (differential?.interpretation === 'NORMALIZATION_MISMATCH') return 'NORMALIZATION DRIFT';
    if (differential?.interpretation === 'DEEP_INSPECTION_VARIANCE') return 'DEEP INSPECTION';
    if (differential?.interpretation === 'ORIGIN_RESPONSE_DIVERGENCE') return 'ORIGIN DIVERGENCE';
    if (result.latency > 800) return 'LATENCY ANOMALY';
    if (result.status >= 200 && result.status < 300) return 'BYPASS POTENTIAL';
    return 'OBSERVATION';
};

export const buildReason = (result, differential) => {
    if (!differential) return 'No comparison data available';
    if (differential.interpretation === 'BASELINE_REFERENCE') return 'Reference variant used to compare semantically equivalent requests';
    if (differential.interpretation === 'NORMALIZATION_MISMATCH') return 'A semantically equivalent variant crossed the defensive path differently than the baseline';
    if (differential.interpretation === 'ENFORCEMENT_DRIFT') return 'Equivalent requests triggered different enforcement outcomes';
    if (differential.interpretation === 'DEEP_INSPECTION_VARIANCE') return 'Latency and response shape shifted enough to suggest deeper inspection';
    if (differential.interpretation === 'ORIGIN_RESPONSE_DIVERGENCE') return 'Equivalent requests produced a materially different origin response';
    if (result.status >= 200 && result.status < 300) return 'The request variant was accepted without explicit enforcement';
    return 'Observed response did not clearly map to a known drift category';
};

export const summarizeFamily = (basePayload, variants) => {
    const accepted = variants.filter((item) => item.status >= 200 && item.status < 300).length;
    const enforced = variants.filter((item) => [403, 406, 429].includes(item.status)).length;
    const anomalous = variants.filter((item) => item.differential?.interpretation === 'DEEP_INSPECTION_VARIANCE' || item.signal === 'LATENCY ANOMALY').length;
    const inconsistent = variants.filter((item) => item.differential?.drift).length;
    const uniqueOutcomes = new Set(variants.map((item) => `${item.status}:${item.signal}:${item.differential?.interpretation || 'NONE'}`)).size;
    const familySize = variants.length || 1;
    const consistencyScore = Math.max(0, Math.round(100 - ((uniqueOutcomes - 1) / familySize) * 100));

    let likelyFault = 'CONSISTENT_ENFORCEMENT';
    if (accepted > 0 && enforced > 0) likelyFault = 'SEMANTIC_REASONING_GAP';
    else if (anomalous > 0) likelyFault = 'DEEP_INSPECTION_VARIANCE';
    else if (inconsistent > 0) likelyFault = 'RESPONSE_INTERPRETATION_DRIFT';
    else if (accepted === familySize) likelyFault = 'UNIFORM_PASS_BEHAVIOR';

    return {
        basePayload,
        familySize,
        accepted,
        enforced,
        anomalous,
        inconsistent,
        uniqueOutcomes,
        consistencyScore,
        likelyFault,
    };
};
