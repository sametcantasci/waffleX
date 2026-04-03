import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, Square, Loader2, AlertCircle, RefreshCw, Crosshair, Code } from 'lucide-react';
import LogConsole from '../components/LogConsole';
import { sendProxyRequest } from '../utils/test-runner';

const API_BASE_URL = 'http://localhost:3001/api';

const AssessmentModule = () => {
    const [targetUrl, setTargetUrl] = useState('');
    const [method, setMethod] = useState('GET');
    const [customHeaders, setCustomHeaders] = useState('');
    const [cookies, setCookies] = useState('');
    const [postBody, setPostBody] = useState('');
    const [intervalMs, setIntervalMs] = useState(100);
    const [selectedFile, setSelectedFile] = useState('');
    const [payloadFiles, setPayloadFiles] = useState([]);

    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState([]);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [loadingFiles, setLoadingFiles] = useState(true);

    const abortControllerRef = React.useRef(null);

    useEffect(() => {
        const fetchPayloads = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/payloads`);
                const filtered = res.data.filter(f => f !== 'threshold.txt');
                setPayloadFiles(filtered);
                if (filtered.length > 0) setSelectedFile(filtered[0]);
            } catch (err) {
                console.error("Failed to load payload list:", err);
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

    const handleRunTest = async () => {
        if (!targetUrl || !selectedFile) return;

        setIsRunning(true);
        setLogs([]);

        let payloadLines = [];
        try {
            const res = await axios.get(`${API_BASE_URL}/payloads/${selectedFile}`);
            payloadLines = res.data.split(/\r?\n/).filter(line => line.trim() !== '');
        } catch (err) {
            setLogs(prev => [...prev, {
                time: new Date().toLocaleTimeString(),
                payload: `Error loading request-variant file: ${selectedFile}`,
                status: 0,
                latency: 0
            }]);
            setIsRunning(false);
            return;
        }

        setProgress({ current: 0, total: payloadLines.length });

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        for (let i = 0; i < payloadLines.length; i++) {
            if (signal.aborted) break;

            const pLoad = payloadLines[i];
            setProgress(prev => ({ ...prev, current: i + 1 }));

            // 1. Dynamic Injection in Headers
            let dynamicHeaders = {};
            if (customHeaders) {
                try {
                    const parsed = JSON.parse(customHeaders);
                    for (const [key, val] of Object.entries(parsed)) {
                        dynamicHeaders[key] = injectPayload(val, pLoad);
                    }
                } catch (e) {
                    console.warn("Invalid custom headers JSON");
                }
            }

            // 2. Dynamic Injection in Cookies
            const dynamicCookies = injectPayload(cookies, pLoad);

            // 3. Dynamic Injection in URL
            // If the user did not put [X] and it is a GET request, we will naively append ?q=[X] for backward compatibility
            let dynamicUrl = targetUrl;
            if (targetUrl.includes('[X]')) {
                dynamicUrl = injectPayload(targetUrl, pLoad);
            } else if (method === 'GET') {
                const separator = targetUrl.includes('?') ? '&' : '?';
                dynamicUrl = `${targetUrl}${separator}q=${encodeURIComponent(pLoad)}`;
            }

            // 4. Dynamic Injection in POST Body
            let dynamicBody = undefined;
            if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
                if (postBody) {
                    dynamicBody = injectPayload(postBody, pLoad);
                } else {
                    dynamicBody = pLoad; // default: insert the request variant directly if body is empty
                }
            }

            const result = await sendProxyRequest({
                targetUrl: dynamicUrl,
                method,
                headers: dynamicHeaders,
                cookies: dynamicCookies,
                payload: dynamicBody
            });

            setLogs(prev => [...prev, {
                time: new Date().toLocaleTimeString(),
                payload: pLoad,
                status: result.status,
                latency: result.latency
            }]);

            if (i < payloadLines.length - 1 && !signal.aborted) {
                await sleep(intervalMs);
            }
        }

        setIsRunning(false);
    };

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setIsRunning(false);
    };

    const renderMethodColors = (m) => {
        switch (m) {
            case 'GET': return 'bg-slate-100 text-slate-800 border-slate-300';
            case 'POST': return 'bg-indigo-50 text-indigo-900 border-indigo-200';
            case 'PUT': return 'bg-amber-50 text-amber-900 border-amber-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-300';
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-100 p-6 space-y-6 max-h-[calc(100vh-73px)] overflow-y-auto">

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 shrink-0">

                {/* Left Column: Assessment Config */}
                <div className="xl:col-span-3 bg-white rounded-sm shadow-sm border-t-4 border-t-indigo-800 border-x border-b border-slate-200 p-6 space-y-5">
                    <div className="flex items-start justify-between mb-2 gap-4">
						<div className="flex flex-col">
							<div className="flex items-center">
								<Crosshair size={22} className="text-indigo-800 mr-2" />
								<h2 className="text-xl font-bold text-slate-900 tracking-tight">Assessment Configuration</h2>
							</div>
						
							<div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-indigo-950 text-indigo-200 border border-indigo-800 text-[11px] font-bold tracking-wider w-fit">
								Adaptive Engine Status: ACTIVE
							</div>
						</div>

						<div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-sm border border-slate-200">
							Use <span className="text-indigo-800 font-bold px-1">[X]</span> for request-variant injection points
						</div>
					</div>

                    {/* URL Row */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-full md:w-32">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Method</label>
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
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Target URL</label>
                            <input
                                type="url"
                                value={targetUrl}
                                onChange={(e) => setTargetUrl(e.target.value)}
                                placeholder="https://api.example.com/v1/users?id=[X]"
                                className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-indigo-800 focus:border-indigo-800 font-mono shadow-inner text-slate-800 placeholder-slate-400"
                            />
                        </div>
                    </div>

                    {/* Meta Row: Headers & Cookies */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="flex items-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Custom Headers (JSON)
                            </label>
                            <textarea
                                value={customHeaders}
                                onChange={(e) => setCustomHeaders(e.target.value)}
                                placeholder='{\n  "User-Agent": "Mozilla/5.0 [X]",\n  "X-Forwarded-For": "10.0.[X].1"\n}'
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

                    {/* Post Body */}
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

                {/* Right Column: Execution Config */}
                <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-6 flex flex-col justify-between h-full bg-gradient-to-br from-white to-slate-50">
                    <div>
                        <div className="mb-6 border-b border-slate-200 pb-3">
							<div className="flex items-center">
								<Play size={20} className="text-slate-800 mr-2" />
								<h2 className="text-lg font-bold text-slate-900 tracking-tight">Execution Engine</h2>
							</div>
							<p className="mt-2 text-xs text-slate-500 leading-relaxed">
								Controlled request-variant execution for authorized WAF resilience testing and parser-drift analysis.
							</p>
						</div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Vector List</label>
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
                                        {payloadFiles.map((f) => {
											const baseName = f.replace('.txt', '').toLowerCase();

											let label = `${baseName.toUpperCase()} Signatures`;

											if (baseName === 'lfi') label = 'Adaptive LFI (Semantic)';
											else if (baseName === 'sqli') label = 'Adaptive SQLi (Semantic)';
											else if (baseName === 'xss') label = 'Adaptive XSS (Semantic)';
											else if (baseName === 'rce') label = 'Adaptive RCE (Semantic)';
											else if (baseName === 'threshold') label = 'Baseline Threshold Validation';

											return (
												<option key={f} value={f}>
													{label}
												</option>
											);
                                        })}
                                    </select>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Interval (ms)</label>
                                <input
                                    type="number"
                                    value={intervalMs}
                                    onChange={(e) => setIntervalMs(parseInt(e.target.value) || 0)}
                                    min="0"
                                    className="w-full text-sm px-4 py-2 bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-indigo-800 shadow-sm text-slate-800 font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        {isRunning ? (
                            <div className="flex flex-col space-y-4 bg-slate-50 p-4 border border-slate-200 rounded-sm">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                    <span className="uppercase tracking-wide">Progress</span>
                                    <span className="text-indigo-800 text-sm">{Math.round((progress.current / progress.total) * 100 || 0)}%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2 shadow-inner overflow-hidden">
                                    <div className="bg-indigo-800 h-2 transition-all duration-300" style={{ width: `${(progress.current / progress.total) * 100 || 0}%` }}></div>
                                </div>
                                <div className="text-center text-[10px] text-slate-500 font-mono">
                                    {progress.current} / {progress.total} Vectors Injected
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

            {/* Main Console Area */}
            <div className="flex-1 min-h-[400px]">
                <LogConsole logs={logs} />
            </div>

        </div>
    );
};

export default AssessmentModule;

