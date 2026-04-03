import React, { useRef, useEffect } from 'react';
import { Terminal, Download } from 'lucide-react';

const toneForSignal = (signal) => {
    if (signal === 'ENFORCED') return 'text-red-400';
    if (signal === 'RATE_LIMITED') return 'text-amber-400';
    if (signal === 'NORMALIZATION DRIFT') return 'text-fuchsia-300';
    if (signal === 'DEEP INSPECTION') return 'text-amber-300';
    if (signal === 'ORIGIN DIVERGENCE') return 'text-sky-300';
    if (signal === 'BYPASS POTENTIAL') return 'text-emerald-400';
    return 'text-slate-300';
};

const LogConsole = ({ logs }) => {
    const tableRef = useRef(null);

    useEffect(() => {
        if (tableRef.current) tableRef.current.scrollTop = tableRef.current.scrollHeight;
    }, [logs]);

    const handleDownload = () => {
        if (logs.length === 0) return;
        let fileContent = `WaffleX Execution Logs - ${new Date().toLocaleString()}\n`;
        fileContent += '-------------------------------------------------\n\n';
        logs.forEach((log, idx) => {
            fileContent += `[${log.time}] Event #${idx + 1}\n`;
            fileContent += `Base Payload: ${log.basePayload || log.payload || '<empty payload>'}\n`;
            fileContent += `Variant: ${log.variantValue || log.payload || '<empty payload>'}\n`;
            fileContent += `Mutation: ${log.mutationLabel || 'BASELINE'} (depth=${log.mutationDepth ?? 0})\n`;
            fileContent += `Status: ${log.status === 0 ? 'ERR' : log.status} | Latency: ${log.latency}ms\n`;
            fileContent += `Signal: ${log.signal || 'OBSERVATION'} | Attribution: ${log.attribution || 'UNDETERMINED'}\n`;
            fileContent += `Differential: ${log.differential?.interpretation || 'N/A'}\n`;
            fileContent += `Reason: ${log.reason || 'N/A'}\n`;
            fileContent += '-------------------------------------------------\n';
        });

        const blob = new Blob([fileContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wafflex-logs-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Terminal size={18} className="text-slate-500" />
                    <h3 className="text-sm font-bold text-slate-800">Live Stream Engine</h3>
                    <span className="bg-indigo-50 text-indigo-800 border border-indigo-800/20 text-xs font-bold px-2 py-0.5 rounded-full ml-2">{logs.length} Events</span>
                </div>
                <button onClick={handleDownload} disabled={logs.length === 0} className="flex items-center space-x-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 hover:text-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm" title="Export Logs as Text File">
                    <Download size={14} />
                    <span>Export</span>
                </button>
            </div>

            <div className="flex-1 overflow-auto bg-slate-900" ref={tableRef}>
                <table className="w-full text-left border-collapse font-mono text-sm">
                    <thead className="sticky top-0 bg-slate-800 text-slate-300 z-10 shadow-sm shadow-slate-900/50">
                        <tr>
                            <th className="py-3 px-4 w-24 font-semibold tracking-wider text-[11px] border-b border-slate-700">Time</th>
                            <th className="py-3 px-4 font-semibold tracking-wider text-[11px] border-b border-slate-700">Base Payload</th>
                            <th className="py-3 px-4 w-44 font-semibold tracking-wider text-[11px] border-b border-slate-700">Mutation Strategy</th>
                            <th className="py-3 px-4 w-24 font-semibold tracking-wider text-[11px] border-b border-slate-700">Status</th>
                            <th className="py-3 px-4 w-48 font-semibold tracking-wider text-[11px] border-b border-slate-700">Detection Signal</th>
                            <th className="py-3 px-4 w-52 font-semibold tracking-wider text-[11px] border-b border-slate-700">Differential</th>
                            <th className="py-3 px-4 w-24 font-semibold tracking-wider text-[11px] border-b border-slate-700 text-right">Latency</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="py-12 text-center text-slate-500 italic">Waiting for assessment execution...</td>
                            </tr>
                        ) : logs.map((log, idx) => {
                            const isBlocked = [403, 406, 429].includes(log.status);
                            const isAccepted = log.status >= 200 && log.status < 300;
                            const isError = log.status === 0 || log.status >= 500;
                            let statusBadgeStyle = 'bg-slate-700 text-slate-300';
                            if (isBlocked) statusBadgeStyle = 'bg-red-900/40 text-red-400 border border-red-800/50';
                            else if (isAccepted) statusBadgeStyle = 'bg-green-900/40 text-green-400 border border-green-800/50';
                            else if (isError) statusBadgeStyle = 'bg-orange-900/40 text-orange-400 border border-orange-800/50';

                            const differentialText = log.differential?.interpretation || 'N/A';
                            const confidence = log.differential?.confidence ? ` (${log.differential.confidence})` : '';
                            const mutationText = `${log.mutationLabel || 'BASELINE'} · d${log.mutationDepth ?? 0}`;

                            return (
                                <tr key={`${log.time}-${idx}`} className="hover:bg-slate-800/50 transition-colors group align-top">
                                    <td className="py-2.5 px-4 text-slate-500 group-hover:text-slate-400">{log.time}</td>
                                    <td className="py-2.5 px-4 text-slate-200 max-w-[320px]">
                                        <div className="truncate" title={log.basePayload || log.payload}>{log.basePayload || log.payload || '<empty payload>'}</div>
                                        {log.variantValue && log.variantValue !== log.basePayload && (
                                            <div className="text-[11px] text-slate-500 truncate mt-1" title={log.variantValue}>{log.variantValue}</div>
                                        )}
                                    </td>
                                    <td className="py-2.5 px-4 text-[11px] text-slate-300">
                                        <div className="font-bold tracking-wider text-slate-200">{mutationText}</div>
                                        <div className="mt-1 text-slate-500 truncate" title={log.attribution}>{log.attribution || 'UNDETERMINED'}</div>
                                    </td>
                                    <td className="py-2.5 px-4">
                                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold leading-none ${statusBadgeStyle}`}>{log.status === 0 ? 'ERR' : log.status}</span>
                                    </td>
                                    <td className="py-2.5 px-4 text-xs">
                                        <div className={`font-bold tracking-wider ${toneForSignal(log.signal)}`}>{log.signal || 'OBSERVATION'}</div>
                                        <div className="mt-1 text-slate-500 leading-relaxed">{log.reason || 'No explanation available'}</div>
                                    </td>
                                    <td className="py-2.5 px-4 text-xs text-slate-300">
                                        <div className="font-bold tracking-wider text-slate-200">{differentialText}{confidence}</div>
                                        {log.differential?.signals?.length > 0 && (
                                            <div className="mt-1 text-slate-500">{log.differential.signals.join(' · ')}</div>
                                        )}
                                    </td>
                                    <td className="py-2.5 px-4 text-right text-slate-400 tabular-nums">{log.latency}ms</td>
                                </tr>
                            );
                        })}
                        <tr className="h-4"></tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LogConsole;
