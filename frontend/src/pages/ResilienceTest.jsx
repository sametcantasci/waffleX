import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Play, Square, AlertTriangle } from 'lucide-react';
import LogConsole from '../components/LogConsole';

const API_BASE_URL = 'http://localhost:3001/api';

const ResilienceTest = () => {
    const [targetUrl, setTargetUrl] = useState('');
    const [method, setMethod] = useState('GET');
    const [requestCount, setRequestCount] = useState(100);
    const [intervalMs, setIntervalMs] = useState(50);
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState([]);
    const [progress, setProgress] = useState({ current: 0 });
    const [stats, setStats] = useState({ passed: 0, blocked: 0, other: 0 });
    const [thresholdPayload, setThresholdPayload] = useState('{"test":1}');

    const abortControllerRef = React.useRef(null);

    useEffect(() => {
        const fetchPayload = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/payloads/threshold.txt`);
                const lines = res.data.split(/\r?\n/).filter((l) => l.trim() !== '');
                if (lines.length > 0) setThresholdPayload(lines[0]);
            } catch {
                console.warn('No baseline threshold payload found; using default test body');
            }
        };
        fetchPayload();
    }, []);

    const handleRunTest = async () => {
        if (!targetUrl || requestCount <= 0) return;
        setIsRunning(true);
        setLogs([]);
        setStats({ passed: 0, blocked: 0, other: 0 });
        setProgress({ current: 0 });

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        let baseline = null;

        for (let i = 0; i < requestCount; i += 1) {
            if (signal.aborted) break;
            setProgress({ current: i + 1 });

            let finalUrl = targetUrl;
            if (method === 'GET') {
                const separator = targetUrl.includes('?') ? '&' : '?';
                finalUrl = `${targetUrl}${separator}t=${Date.now()}_${i}`;
            }

            const startTime = Date.now();
            const result = await axios.post(`${API_BASE_URL}/proxy`, {
                targetUrl: finalUrl,
                method,
                headers: {},
                cookies: '',
                payload: ['POST', 'PUT'].includes(method) ? thresholdPayload : undefined,
            }).then((res) => res.data).catch((error) => ({
                status: 500,
                latency: Date.now() - startTime,
                responseLength: 0,
                fingerprint: 'transport_error',
                wafSignals: ['TRANSPORT_ERROR'],
                error: error.message,
            }));

            if (!baseline) baseline = result;
            const signalName = [403, 406].includes(result.status)
                ? 'ENFORCED'
                : result.status === 429
                    ? 'RATE_LIMITED'
                    : result.latency > Math.max((baseline.latency || 0) * 1.5, 1000)
                        ? 'LATENCY ANOMALY'
                        : 'BASELINE OBSERVATION';

            const interpretation = result.status !== baseline.status
                ? 'ENFORCEMENT_DRIFT'
                : result.latency > Math.max((baseline.latency || 0) * 1.5, 1000)
                    ? 'DEEP_INSPECTION_VARIANCE'
                    : 'BASELINE_CONSISTENT';

            const attribution = result.status === 429
                ? 'RATE_LIMIT_LAYER'
                : [403, 406].includes(result.status)
                    ? 'EDGE_WAF'
                    : interpretation === 'DEEP_INSPECTION_VARIANCE'
                        ? 'DEEP_INSPECTION'
                        : 'UNDETERMINED';

            setLogs((prev) => [...prev, {
                time: new Date().toLocaleTimeString(),
                basePayload: `Baseline Request [Iteration ${i + 1}]`,
                payload: `Baseline Request [Iteration ${i + 1}]`,
                mutationLabel: 'BASELINE',
                mutationDepth: 0,
                status: result.status,
                latency: result.latency,
                signal: signalName,
                attribution,
                reason: interpretation === 'ENFORCEMENT_DRIFT'
                    ? 'Repeated baseline requests shifted from accepted behavior into explicit enforcement'
                    : interpretation === 'DEEP_INSPECTION_VARIANCE'
                        ? 'Repeated baseline requests triggered a meaningful latency increase'
                        : 'Baseline request remained behaviorally stable',
                differential: {
                    interpretation,
                    confidence: interpretation === 'BASELINE_CONSISTENT' ? 'LOW' : 'MEDIUM',
                    signals: interpretation === 'BASELINE_CONSISTENT' ? ['CONSISTENT'] : ['STATUS_OR_LATENCY_DRIFT'],
                },
            }]);

            setStats((prev) => {
                const next = { ...prev };
                if (result.status >= 200 && result.status < 300) next.passed += 1;
                else if ([403, 406, 429].includes(result.status)) next.blocked += 1;
                else next.other += 1;
                return next;
            });

            if (i < requestCount - 1 && !signal.aborted && intervalMs > 0) await sleep(intervalMs);
        }

        setIsRunning(false);
    };

    const handleStop = () => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        setIsRunning(false);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 p-6 space-y-6 max-h-[calc(100vh-73px)] overflow-y-auto">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 shrink-0">
                <AlertTriangle className="text-amber-500 mt-1 flex-shrink-0" size={20} />
                <div>
                    <h3 className="text-sm font-bold text-amber-900">Resilience and Rate-Limit Analysis</h3>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                        Sends repeated baseline requests in an authorized environment to observe enforcement transitions, latency drift, and rate-limiting behavior.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 shrink-0">
                <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-center">
                    <div className="flex items-center justify-between w-full gap-4">
                        <div className="flex space-x-4 flex-1 mr-4">
                            <div className="w-32">
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Method</label>
                                <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-800 font-medium">
                                    <option>GET</option><option>POST</option><option>PUT</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Target URL</label>
                                <input type="url" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="http://target/api/login" className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-800 font-mono" />
                            </div>
                            <div className="w-24">
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Count</label>
                                <input type="number" value={requestCount} onChange={(e) => setRequestCount(parseInt(e.target.value, 10) || 0)} className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-800 font-medium text-center" />
                            </div>
                            <div className="w-24">
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Delay (ms)</label>
                                <input type="number" value={intervalMs} onChange={(e) => setIntervalMs(parseInt(e.target.value, 10) || 0)} className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-800 font-medium text-center" />
                            </div>
                        </div>
                        <div className="w-40 shrink-0 border-l border-slate-100 pl-6">
                            {isRunning ? (
                                <button onClick={handleStop} className="w-full bg-red-100 hover:bg-red-200 text-red-700 py-3 rounded-lg text-sm font-bold transition-colors flex items-center justify-center border border-red-200">
                                    <Square size={16} className="mr-2" fill="currentColor" /> Stop
                                </button>
                            ) : (
                                <button onClick={handleRunTest} disabled={!targetUrl || requestCount <= 0} className="w-full bg-indigo-800 hover:bg-indigo-900 text-white py-3 rounded-lg text-sm font-bold transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200">
                                    <Play size={16} className="mr-2" fill="currentColor" /> Run Sequence
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center mb-4">
                            <Activity size={18} className="text-indigo-800 mr-2" />
                            <h3 className="text-sm font-bold text-slate-800">Run Summary</h3>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between"><span className="text-slate-500">Accepted</span><span className="font-bold text-emerald-600">{stats.passed}</span></div>
                            <div className="flex items-center justify-between"><span className="text-slate-500">Enforced</span><span className="font-bold text-amber-600">{stats.blocked}</span></div>
                            <div className="flex items-center justify-between"><span className="text-slate-500">Other</span><span className="font-bold text-slate-700">{stats.other}</span></div>
                            <div className="pt-3 border-t border-slate-100"><span className="text-xs text-slate-500">Progress</span><div className="mt-1 text-sm font-semibold text-slate-800">{progress.current} / {requestCount}</div></div>
                        </div>
                    </div>
                </div>
            </div>
            <LogConsole logs={logs} />
        </div>
    );
};

export default ResilienceTest;
