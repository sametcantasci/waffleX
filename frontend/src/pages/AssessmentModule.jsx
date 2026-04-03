import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Play, Square, RefreshCw, Crosshair, Code } from 'lucide-react';
import LogConsole from '../components/LogConsole';
import SemanticConsistencyPanel from '../components/SemanticConsistencyPanel';
import { sendProxyRequest } from '../utils/test-runner';

const API_BASE_URL = 'http://localhost:3001/api';

const buildMutationPlan = (basePayload, selectedFile, mutationDepth = 2) => {
    const family = [];
    const seen = new Set();

    const pushVariant = (variantValue, mutationLabel, depth) => {
        if (!variantValue || seen.has(variantValue)) return;
        seen.add(variantValue);
        family.push({
            basePayload,
            variantValue,
            mutationLabel,
            mutationDepth: depth,
        });
    };

    pushVariant(basePayload, 'BASELINE', 0);

    if (mutationDepth >= 1) {
        pushVariant(encodeURIComponent(basePayload), 'URL_ENCODED', 1);
        pushVariant(`${basePayload}%00`, 'NULL_SUFFIX', 1);
    }

    if (mutationDepth >= 2) {
        pushVariant(encodeURIComponent(encodeURIComponent(basePayload)), 'DOUBLE_ENCODED', 2);
        pushVariant(basePayload.replaceAll('/', '%2f'), 'DELIMITER_ENCODED', 2);
        pushVariant(`${basePayload}/.`, 'PATH_SUFFIX', 2);
    }

    if (mutationDepth >= 3) {
        pushVariant(basePayload.replaceAll('../', '..%2f'), 'MIXED_DELIMITERS', 3);
        pushVariant(`${basePayload}%20`, 'WHITESPACE_SUFFIX', 3);
        pushVariant(basePayload.replaceAll('/', '\\'), 'BACKSLASH_MUTATION', 3);
    }

    return family;
};

const summarizeFamilies = (logs = []) => {
    if (!logs.length) return [];

    const grouped = new Map();

    for (const log of logs) {
        const key = log.basePayload || log.payload || 'unknown';
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(log);
    }

    return Array.from(grouped.entries()).map(([basePayload, entries]) => {
        const accepted = entries.filter((e) => Number(e.status) >= 200 && Number(e.status) < 300).length;
        const enforced = entries.filter((e) => [403, 406, 429].includes(Number(e.status))).length;
        const anomalous = entries.filter((e) => String(e.signal || '').includes('ANOMALY')).length;
        const uniqueOutcomes = new Set(
            entries.map((e) => `${e.status}-${e.signal || ''}-${e.differential || ''}`)
        ).size;

        const familySize = entries.length;
        const dominant = Math.max(accepted, enforced, anomalous, 1);
        const consistencyScore = Math.round((dominant / Math.max(familySize, 1)) * 100);

        let likelyFault = 'CONSISTENT_ENFORCEMENT';
        let notes = 'Family behavior appears relatively consistent.';

        if (accepted > 0 && enforced > 0) {
            likelyFault = 'SEMANTIC_REASONING_GAP';
            notes = 'Equivalent variants produced both accepted and enforced outcomes.';
        } else if (anomalous > 0) {
            likelyFault = 'DEEP_INSPECTION_VARIANCE';
            notes = 'Latency anomalies suggest deeper inspection or inconsistent handling.';
        } else if (accepted === familySize) {
            likelyFault = 'UNIFORM_PASS_BEHAVIOR';
            notes = 'All equivalent variants were accepted without explicit enforcement.';
        } else if (uniqueOutcomes > 2) {
            likelyFault = 'RESPONSE_INTERPRETATION_DRIFT';
            notes = 'Multiple response patterns suggest interpretation drift across the path.';
        }

        return {
            basePayload,
            accepted,
            enforced,
            anomalous,
            uniqueOutcomes,
            familySize,
            consistencyScore,
            likelyFault,
            notes,
        };
    });
};

const normalizeLatency = (value) => {
    if (typeof value === 'number') return `${value}ms`;
    if (typeof value === 'string') return value;
    return '0ms';
};

const AssessmentModule = () => {
    const [targetUrl, setTargetUrl] = useState('');
    const [method, setMethod] = useState('GET');
    const [customHeaders, setCustomHeaders] = useState('');
    const [cookies, setCookies] = useState('');
    const [postBody, setPostBody] = useState('');
    const [intervalMs, setIntervalMs] = useState(100);
    const [selectedFile, setSelectedFile] = useState('');
    const [payloadFiles, setPayloadFiles] = useState([]);
    const [mutationDepth, setMutationDepth] = useState(2);
    const [adaptiveMode, setAdaptiveMode] = useState(true);

    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState([]);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [loadingFiles, setLoadingFiles] = useState(true);
    const [familySummaries, setFamilySummaries] = useState([]);

    const abortControllerRef = useRef(null);

    useEffect(() => {
        const fetchPayloads = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/payloads`);
                const filtered = res.data.filter((f) => f !== 'threshold.txt');
                setPayloadFiles(filtered);
                if (filtered.length > 0) setSelectedFile(filtered[0]);
            } catch (err) {
                console.error('Failed to load payload list:', err);
            } finally {
                setLoadingFiles(false);
            }
        };

        fetchPayloads();
    }, []);

    const injectPayload = (inputStr, pLoad) => {
        if (typeof inputStr !== 'string') return inputStr;
        return inputStr.includes('[X]') ? inputStr.replaceAll('[X]', pLoad) : inputStr;
    };

    const renderMethodColors = (m) => {
        switch (m) {
            case 'GET':
                return 'bg-slate-100 text-slate-800 border-slate-300';
            case 'POST':
                return 'bg-indigo-50 text-indigo-900 border-indigo-200';
            case 'PUT':
                return 'bg-amber-50 text-amber-900 border-amber-200';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-300';
        }
    };

    const getVectorLabel = (fileName) => {
        const baseName = String(fileName || '').replace('.txt', '').toLowerCase();

        if (baseName === 'lfi') return 'Adaptive LFI (Semantic)';
        if (baseName === 'sqli') return 'Adaptive SQLi (Semantic)';
        if (baseName === 'xss') return 'Adaptive XSS (Semantic)';
        if (baseName === 'rce') return 'Adaptive RCE (Semantic)';
        if (baseName === 'redirect') return 'Adaptive Redirect (Semantic)';
        if (baseName === 'threshold') return 'Baseline Threshold Validation';

        return `${baseName.toUpperCase()} Signatures`;
    };

    const handleRunTest = async () => {
        if (!targetUrl || !selectedFile) return;

        setIsRunning(true);
        setLogs([]);
        setFamilySummaries([]);

        let payloadLines = [];
        try {
            const res = await axios.get(`${API_BASE_URL}/payloads/${selectedFile}`);
            payloadLines = res.data.split(/\r?\n/).filter((line) => line.trim() !== '');
        } catch (err) {
            setLogs([
                {
                    time: new Date().toLocaleTimeString(),
                    basePayload: `Error loading request-variant file: ${selectedFile}`,
                    payload: `Error loading request-variant file: ${selectedFile}`,
                    status: 0,
                    latency: '0ms',
                    signal: 'LOAD_FAILURE',
                    differential: 'N/A',
                    mutationLabel: 'SYSTEM',
                    reason: 'Unable to load payload corpus',
                },
            ]);
            setIsRunning(false);
            return;
        }

        const executionPlan = [];
        for (const basePayload of payloadLines) {
            const family = adaptiveMode
                ? buildMutationPlan(basePayload, selectedFile, mutationDepth)
                : [
                    {
                        basePayload,
                        variantValue: basePayload,
                        mutationLabel: 'BASELINE',
                        mutationDepth: 0,
                    },
                ];

            for (const item of family) executionPlan.push(item);
        }

        setProgress({ current: 0, total: executionPlan.length });

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        const collectedLogs = [];

        for (let i = 0; i < executionPlan.length; i++) {
            if (signal.aborted) break;

            const plan = executionPlan[i];
            const variantPayload = plan.variantValue;

            setProgress({ current: i + 1, total: executionPlan.length });

            let dynamicHeaders = {};
            if (customHeaders) {
                try {
                    const parsed = JSON.parse(customHeaders);
                    for (const [key, val] of Object.entries(parsed)) {
                        dynamicHeaders[key] = injectPayload(val, variantPayload);
                    }
                } catch {
                    console.warn('Invalid custom headers JSON');
                }
            }

            const dynamicCookies = injectPayload(cookies, variantPayload);

            let dynamicUrl = targetUrl;
            if (targetUrl.includes('[X]')) {
                dynamicUrl = injectPayload(targetUrl, variantPayload);
            } else if (method === 'GET') {
                const separator = targetUrl.includes('?') ? '&' : '?';
                dynamicUrl = `${targetUrl}${separator}q=${encodeURIComponent(variantPayload)}`;
            }

            let dynamicBody = undefined;
            if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
                if (postBody) {
                    dynamicBody = injectPayload(postBody, variantPayload);
                } else {
                    dynamicBody = variantPayload;
                }
            }

            let result;
            try {
                result = await sendProxyRequest({
                    targetUrl: dynamicUrl,
                    method,
                    headers: dynamicHeaders,
                    cookies: dynamicCookies,
                    payload: dynamicBody,
                    basePayload: plan.basePayload,
                    mutationLabel: plan.mutationLabel,
                    mutationDepth: plan.mutationDepth,
                });
            } catch (err) {
                result = {
                    status: 0,
                    latency: '0ms',
                    signal: 'REQUEST_FAILURE',
                    differential: 'N/A',
                    reason: err?.message || 'Request execution failed',
                    attribution: 'UNKNOWN',
                    variantValue: variantPayload,
                    mutationLabel: plan.mutationLabel,
                    mutationDepth: plan.mutationDepth,
                    length: 0,
                };
            }

            const logEntry = {
                time: new Date().toLocaleTimeString(),
                basePayload: plan.basePayload,
                payload: result.variantValue || variantPayload,
                variantValue: result.variantValue || variantPayload,
                mutationLabel: result.mutationLabel || plan.mutationLabel,
                mutationDepth: result.mutationDepth ?? plan.mutationDepth,
                status: result.status,
                latency: normalizeLatency(result.latency),
                signal: result.signal || 'UNKNOWN',
                differential: result.differential || 'N/A',
                reason: result.reason || '',
                attribution: result.attribution || 'UNKNOWN',
                length: result.length || 0,
            };

            collectedLogs.push(logEntry);
            setLogs([...collectedLogs]);

            if (i < executionPlan.length - 1 && !signal.aborted) {
                await sleep(intervalMs);
            }
        }

        setFamilySummaries(summarizeFamilies(collectedLogs));
        setIsRunning(false);
    };

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setIsRunning(false);
    };

    return (
        <div className="h-[calc(100vh-73px)] overflow-y-auto bg-slate-100">
            <div className="flex flex-col p-6 space-y-6 min-h-full">
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 shrink-0">
                    <div className="xl:col-span-3 bg-white rounded-sm shadow-sm border-t-4 border-t-indigo-800 border-x border-b border-slate-200 p-6 space-y-5">
                        <div className="flex items-start justify-between mb-2 gap-4">
                            <div className="flex flex-col">
                                <div className="flex items-center">
                                    <Crosshair size={22} className="text-indigo-800 mr-2" />
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                                        Assessment Configuration
                                    </h2>
                                </div>

                                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-indigo-950 text-indigo-200 border border-indigo-800 text-[11px] font-bold tracking-wider w-fit">
                                    Adaptive Engine Status: ACTIVE
                                </div>
                            </div>

                            <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-sm border border-slate-200">
                                Use <span className="text-indigo-800 font-bold px-1">[X]</span> for request-variant injection points
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="w-full md:w-32">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Method
                                </label>
                                <select
                                    value={method}
                                    onChange={(e) => setMethod(e.target.value)}
                                    className={`w-full text-sm px-3 py-2.5 rounded-sm focus:outline-none focus:ring-1 focus:ring-indigo-800 font-bold border transition-colors ${renderMethodColors(method)}`}
                                >
                                    <option>GET</option>
                                    <option>POST</option>
                                    <option>PUT</option>
                                    <option>PATCH</option>
                                    <option>DELETE</option>
                                    <option>OPTIONS</option>
                                </select>
                            </div>

                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Target URL
                                </label>
                                <input
                                    type="url"
                                    value={targetUrl}
                                    onChange={(e) => setTargetUrl(e.target.value)}
                                    placeholder="https://api.example.com/v1/users?id=[X]"
                                    className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-indigo-800 focus:border-indigo-800 font-mono shadow-inner text-slate-800 placeholder-slate-400"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="flex items-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Custom Headers (JSON)
                                </label>
                                <textarea
                                    value={customHeaders}
                                    onChange={(e) => setCustomHeaders(e.target.value)}
                                    placeholder='{"User-Agent": "Mozilla/5.0 [X]", "X-Forwarded-For": "10.0.[X].1"}'
                                    className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-indigo-800 focus:border-indigo-800 font-mono h-32 custom-scrollbar shadow-inner text-slate-800 placeholder-slate-400 leading-relaxed"
                                    spellCheck="false"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="flex items-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Cookies
                                </label>
                                <textarea
                                    value={cookies}
                                    onChange={(e) => setCookies(e.target.value)}
                                    placeholder="session=eyJhbGciOiJI[X]...; _ga=GA1.2.1;"
                                    className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-indigo-800 focus:border-indigo-800 font-mono h-32 custom-scrollbar shadow-inner text-slate-800 placeholder-slate-400 leading-relaxed"
                                    spellCheck="false"
                                />
                            </div>
                        </div>

                        {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
                            <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        <Code size={14} className="mr-1.5 text-slate-500" />
                                        Request Body (Raw Data)
                                    </label>
                                </div>

                                <textarea
                                    value={postBody}
                                    onChange={(e) => setPostBody(e.target.value)}
                                    placeholder='{"username": "admin", "password": "[X]"}'
                                    className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-indigo-800 focus:border-indigo-800 font-mono h-32 custom-scrollbar shadow-inner text-slate-800 placeholder-slate-400 leading-relaxed"
                                    spellCheck="false"
                                />
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-6 flex flex-col justify-between h-full bg-gradient-to-br from-white to-slate-50">
                        <div>
                            <div className="mb-6 border-b border-slate-200 pb-3">
                                <div className="flex items-center">
                                    <Play size={20} className="text-slate-800 mr-2" />
                                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                                        Execution Engine
                                    </h2>
                                </div>

                                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                                    Controlled request-variant execution for authorized WAF resilience testing and parser-drift analysis.
                                </p>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                        Vector List
                                    </label>

                                    {loadingFiles ? (
                                        <div className="flex items-center justify-center p-3 border border-slate-200 rounded-sm bg-slate-50">
                                            <RefreshCw size={16} className="animate-spin text-slate-400 mr-2" />
                                            <span className="text-sm text-slate-500 font-medium">Loading modules...</span>
                                        </div>
                                    ) : (
                                        <select
                                            value={selectedFile}
                                            onChange={(e) => setSelectedFile(e.target.value)}
                                            className="w-full text-sm px-3 py-2.5 bg-white border border-slate-300 text-slate-800 rounded-sm focus:outline-none focus:ring-1 focus:ring-indigo-800 font-semibold shadow-sm"
                                        >
                                            {payloadFiles.map((f) => (
                                                <option key={f} value={f}>
                                                    {getVectorLabel(f)}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                            Interval (ms)
                                        </label>
                                        <input
                                            type="number"
                                            value={intervalMs}
                                            onChange={(e) => setIntervalMs(parseInt(e.target.value, 10) || 0)}
                                            min="0"
                                            className="w-full text-sm px-4 py-2 bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-indigo-800 shadow-sm text-slate-800 font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                            Mutation Depth
                                        </label>
                                        <select
                                            value={mutationDepth}
                                            onChange={(e) => setMutationDepth(parseInt(e.target.value, 10))}
                                            className="w-full text-sm px-3 py-2.5 bg-white border border-slate-300 text-slate-800 rounded-sm focus:outline-none focus:ring-1 focus:ring-indigo-800 font-semibold shadow-sm"
                                        >
                                            <option value={1}>1 - Low mutation</option>
                                            <option value={2}>2 - Medium mutation</option>
                                            <option value={3}>3 - High mutation</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="rounded-sm border border-slate-200 bg-slate-50 px-3 py-3">
                                    <label className="flex items-start gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={adaptiveMode}
                                            onChange={(e) => setAdaptiveMode(e.target.checked)}
                                            className="mt-1"
                                        />
                                        <div>
                                            <div className="text-sm font-semibold text-slate-800">
                                                Adaptive mutation mode
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                Generate semantically equivalent request variants for normalization and parser-drift testing.
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            {isRunning ? (
                                <div className="flex flex-col space-y-4 bg-slate-50 p-4 border border-slate-200 rounded-sm">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                        <span className="uppercase tracking-wide">Progress</span>
                                        <span className="text-indigo-800 text-sm">
                                            {Math.round((progress.current / progress.total) * 100 || 0)}%
                                        </span>
                                    </div>

                                    <div className="w-full bg-slate-200 rounded-full h-2 shadow-inner overflow-hidden">
                                        <div
                                            className="bg-indigo-800 h-2 transition-all duration-300"
                                            style={{ width: `${(progress.current / progress.total) * 100 || 0}%` }}
                                        />
                                    </div>

                                    <div className="text-center text-[10px] text-slate-500 font-mono">
                                        {progress.current} / {progress.total} Variants Executed
                                    </div>

                                    <button
                                        onClick={handleStop}
                                        className="w-full bg-white hover:bg-slate-50 text-red-600 py-2.5 rounded-sm text-sm font-bold transition-colors flex items-center justify-center border border-red-200 shadow-sm"
                                    >
                                        <Square size={16} className="mr-2" fill="currentColor" />
                                        HALT EXECUTION
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleRunTest}
                                    disabled={!targetUrl || !selectedFile}
                                    className="w-full bg-indigo-800 hover:bg-indigo-900 text-white py-3.5 rounded-sm text-sm font-bold transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md uppercase tracking-wider"
                                >
                                    <Play size={16} className="mr-2" fill="currentColor" />
                                    Start Adaptive Analysis
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="w-full">
                    <SemanticConsistencyPanel summaries={familySummaries} />
                </div>

                <div className="flex-1 min-h-[400px]">
                    <LogConsole logs={logs} />
                </div>
            </div>
        </div>
    );
};

export default AssessmentModule;