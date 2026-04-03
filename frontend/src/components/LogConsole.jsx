import React, { useRef, useEffect } from 'react';
import { Terminal, Download } from 'lucide-react';

const LogConsole = ({ logs }) => {
    const tableRef = useRef(null);

    // Auto-scroll to bottom on new log
    useEffect(() => {
        if (tableRef.current) {
            tableRef.current.scrollTop = tableRef.current.scrollHeight;
        }
    }, [logs]);

    const handleDownload = () => {
        if (logs.length === 0) return;

        let fileContent = `Wafflex Execution Logs - ${new Date().toLocaleString()}\n`;
        fileContent += `-------------------------------------------------\n\n`;

        logs.forEach((log, idx) => {
            fileContent += `[${log.time}] Sequence #${idx + 1}\n`;
            fileContent += `Payload: ${log.payload || "<empty payload>"}\n`;
            fileContent += `Status: ${log.status === 0 ? "ERR" : log.status} | Latency: ${log.latency}ms\n`;
            fileContent += `-------------------------------------------------\n`;
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

            {/* Header */}
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Terminal size={18} className="text-slate-500" />
                    <h3 className="text-sm font-bold text-slate-800">Live Stream Engine</h3>
                    <span className="bg-indigo-50 text-indigo-800 border border-indigo-800/20 text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                        {logs.length} Events
                    </span>
                </div>
                <button
                    onClick={handleDownload}
                    disabled={logs.length === 0}
                    className="flex items-center space-x-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 hover:text-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    title="Export Logs as Text File"
                >
                    <Download size={14} />
                    <span>Export</span>
                </button>
            </div>

            {/* Table Body Area */}
            <div className="flex-1 overflow-auto bg-slate-900" ref={tableRef}>
                <table className="w-full text-left border-collapse font-mono text-sm">
                    <thead className="sticky top-0 bg-slate-800 text-slate-300 z-10 shadow-sm shadow-slate-900/50">
                        <tr>
                            <th className="py-3 px-4 w-28 font-semibold tracking-wider text-xs border-b border-slate-700">Time</th>
                            <th className="py-3 px-4 font-semibold tracking-wider text-xs border-b border-slate-700">Request Variant</th>
                            <th className="py-3 px-4 w-32 font-semibold tracking-wider text-xs border-b border-slate-700">Status</th>
                            <th className="py-3 px-4 w-40 font-semibold tracking-wider text-xs border-b border-slate-700">Action/Analysis</th>
                            <th className="py-3 px-4 w-24 font-semibold tracking-wider text-xs border-b border-slate-700 text-right">Latency</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="py-12 text-center text-slate-500 itlaic">
                                    Waiting for assessment execution...
                                </td>
                            </tr>
                        ) : (
                            logs.map((log, idx) => {

                                // Determine styling based on WAF context
                                // 403 / 406 = WAF Blocked (Red/Green depending on perspective, but usually Red = WAF success, Green = Bypass)
                                // The prompt says: "Red for Blocked (Success for WAF), Green for Passed (Potential Bypass)."

								const isBlocked = log.status === 403 || log.status === 406 || log.status === 429;
								const isBypass = log.status >= 200 && log.status < 300;
								const isError = log.status === 0 || log.status >= 500;
								
								const latencyValue = parseInt(log.latency, 10);
								const hasDelayAnomaly = latencyValue > 800;

								let statusBadgeStyle = "bg-slate-700 text-slate-300";
								let actionText = "EVALUATING";
								let actionStyle = "text-slate-400";

								if (isBlocked) {
									statusBadgeStyle = "bg-red-900/40 text-red-400 border border-red-800/50";
									actionText = "BLOCKED (WAF)";
									actionStyle = "text-red-400 font-bold tracking-wider";
								} else if (hasDelayAnomaly) {
									statusBadgeStyle = "bg-amber-900/40 text-amber-400 border border-amber-800/50";
									actionText = "ANOMALY (DELAY DETECTED)";
									actionStyle = "text-amber-400 font-bold tracking-wider";
								} else if (isBypass) {
									statusBadgeStyle = "bg-green-900/40 text-green-400 border border-green-800/50";
									actionText = "BYPASS POTENTIAL";
									actionStyle = "text-green-400 font-bold tracking-wider";
								} else if (isError) {
									statusBadgeStyle = "bg-orange-900/40 text-orange-400 border border-orange-800/50";
									actionText = "UPSTREAM ERROR";
									actionStyle = "text-orange-400";
								}

                                return (
                                    <tr key={idx} className="hover:bg-slate-800/50 transition-colors group">
                                        <td className="py-2.5 px-4 text-slate-500 group-hover:text-slate-400 transition-colors">
                                            {log.time}
                                        </td>
                                        <td className="py-2.5 px-4 text-slate-200 truncate max-w-[200px]" title={log.payload}>
                                            {log.payload || "<empty payload>"}
                                        </td>
                                        <td className="py-2.5 px-4 text-slate-100 flex items-center">
                                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold leading-none ${statusBadgeStyle}`}>
                                                {log.status === 0 ? "ERR" : log.status}
                                            </span>
                                        </td>
                                        <td className={`py-2 px-4 text-xs ${actionStyle}`}>
                                            {actionText}
                                        </td>
                                        <td className="py-2 px-4 text-right text-slate-400 tabular-nums">
                                            {log.latency}ms
                                        </td>
                                    </tr>
                                );
                            })
                        )}

                        {/* Dummy row to ensure padding at bottom */}
                        <tr className="h-4"></tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LogConsole;
