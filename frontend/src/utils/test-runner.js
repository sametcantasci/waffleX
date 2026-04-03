import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const parseLatency = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
};

const classifySignal = ({ status, latency }) => {
    const latencyMs = parseLatency(latency);

    if ([403, 406, 429].includes(Number(status))) {
        return {
            signal: 'ENFORCEMENT_DETECTED',
            reason: 'The request variant triggered an explicit enforcement response.',
            attribution: status === 429 ? 'RATE_LIMIT_LAYER' : 'EDGE_WAF',
            differential: 'ENFORCEMENT_DRIFT',
        };
    }

    if (latencyMs >= 1500) {
        return {
            signal: 'ANOMALY',
            reason: 'Significant latency increase suggests deeper inspection or inconsistent handling.',
            attribution: 'DEEP_INSPECTION',
            differential: 'DEEP_INSPECTION_VARIANCE',
        };
    }

    if (Number(status) >= 200 && Number(status) < 300) {
        return {
            signal: 'BYPASS_POTENTIAL',
            reason: 'The request variant was accepted without explicit enforcement.',
            attribution: 'POTENTIAL_PASS',
            differential: 'BEHAVIORALLY_CONSISTENT',
        };
    }

    if (Number(status) >= 500) {
        return {
            signal: 'ORIGIN_ERROR',
            reason: 'The origin application produced a server-side error.',
            attribution: 'ORIGIN_APPLICATION',
            differential: 'ORIGIN_RESPONSE_DIVERGENCE',
        };
    }

    if (Number(status) === 0) {
        return {
            signal: 'REQUEST_FAILURE',
            reason: 'The request could not be completed successfully.',
            attribution: 'UNKNOWN',
            differential: 'N/A',
        };
    }

    return {
        signal: 'OBSERVED_RESPONSE',
        reason: 'A response was received, but no stronger heuristic classification applied.',
        attribution: 'UNDETERMINED',
        differential: 'RESPONSE_INTERPRETATION_DRIFT',
    };
};

export const sendProxyRequest = async ({
    targetUrl,
    method = 'GET',
    headers = {},
    cookies = '',
    payload = undefined,
    basePayload = '',
    mutationLabel = 'BASELINE',
    mutationDepth = 0,
}) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/proxy`, {
            targetUrl,
            method,
            headers,
            cookies,
            payload,
        });

        const data = response?.data || {};
        const status = Number(data.status ?? 0);
        const latencyMs = parseLatency(data.latency);
        const length = Number(data.responseLength ?? data.length ?? 0);

        const classified = classifySignal({
            status,
            latency: latencyMs,
        });

        return {
            status,
            latency: `${latencyMs}ms`,
            length,
            signal: classified.signal,
            reason: classified.reason,
            attribution: classified.attribution,
            differential: classified.differential,
            basePayload,
            variantValue: payload ?? targetUrl,
            mutationLabel,
            mutationDepth,
            wafSignals: Array.isArray(data.wafSignals) ? data.wafSignals : [],
        };
    } catch (error) {
        const status = Number(error?.response?.status ?? 0);
        const latencyMs = parseLatency(error?.response?.data?.latency ?? 0);

        const classified = classifySignal({
            status,
            latency: latencyMs,
        });

        return {
            status,
            latency: `${latencyMs}ms`,
            length: 0,
            signal: classified.signal,
            reason:
                classified.reason ||
                error?.message ||
                'The request failed before a usable response was returned.',
            attribution: classified.attribution || 'UNKNOWN',
            differential: classified.differential || 'N/A',
            basePayload,
            variantValue: payload ?? targetUrl,
            mutationLabel,
            mutationDepth,
            wafSignals: [],
        };
    }
};