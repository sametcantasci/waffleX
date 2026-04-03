import React, { useState, useEffect } from 'react';
import { fetchIpInfo } from '../utils/ip-checker';
import { Settings, Globe, RefreshCw } from 'lucide-react';

const Header = () => {
    const [ipData, setIpData] = useState({ ip: 'Loading...', countryCode: 'XX', country: 'Loading...', isp: 'Loading...', error: null });
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [proxyUrl, setProxyUrl] = useState('');

    const loadIpData = async (proxy = '') => {
        setLoading(true);
        const data = await fetchIpInfo(proxy);
        setIpData(data);
        setLoading(false);
    };

    useEffect(() => { loadIpData(); }, []);
    const handleApplyProxy = () => { loadIpData(proxyUrl); setShowSettings(false); };

    return (
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
            <div className="flex items-center space-x-3">
                <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-800 shadow-md border border-indigo-900 overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-800/30 to-transparent"></div>
                    <span className="text-xl font-black text-white font-sans tracking-tighter italic z-10 drop-shadow-md">W<span className="text-indigo-200">X</span></span>
                </div>
                <div>
                    <h1 className="text-xl font-bold font-sans text-slate-900 tracking-tight">Waffle<span className="text-indigo-800">X</span></h1>
                    <p className="text-xs text-slate-500 font-medium tracking-wide">Adaptive semantic analysis for WAF resilience testing</p>
                </div>
            </div>
            <div className="flex items-center space-x-6 relative">
                <div className="flex items-center space-x-4 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 transition-all">
                    {loading ? (
                        <div className="flex items-center space-x-2 text-slate-500"><RefreshCw size={16} className="animate-spin" /><span className="text-sm font-medium">Resolving node IP...</span></div>
                    ) : ipData.error ? (
                        <div className="flex items-center space-x-2 text-red-500"><span className="text-sm font-medium">Connection error</span></div>
                    ) : (
                        <>
                            <div className="flex items-center space-x-2" title={ipData.country}>
                                {ipData.countryCode !== 'XX' ? (
                                    <img src={`https://flagcdn.com/w40/${ipData.countryCode.toLowerCase()}.png`} srcSet={`https://flagcdn.com/w80/${ipData.countryCode.toLowerCase()}.png 2x`} width="24" alt={ipData.country} className="rounded-sm border border-slate-300 shadow-sm" />
                                ) : (
                                    <Globe className="text-slate-400" size={20} />
                                )}
                            </div>
                            <div className="h-6 w-px bg-slate-300"></div>
                            <div className="flex flex-col justify-center"><span className="text-xs text-slate-500 uppercase font-semibold tracking-wide">Origin IP</span><span className="text-sm font-bold text-slate-800 font-mono">{ipData.ip}</span></div>
                            <div className="h-6 w-px bg-slate-300"></div>
                            <div className="flex flex-col justify-center max-w-[150px]"><span className="text-xs text-slate-500 uppercase font-semibold tracking-wide">ISP Network</span><span className="text-sm font-medium text-slate-700 truncate">{ipData.isp}</span></div>
                        </>
                    )}
                </div>
                <button onClick={() => setShowSettings(!showSettings)} className={`p-2.5 rounded-lg border transition-all ${showSettings ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`} title="Proxy Settings"><Settings size={20} /></button>
                {showSettings && (
                    <div className="absolute top-14 right-0 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 animate-in fade-in slide-in-from-top-2">
                        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center"><RefreshCw size={14} className="mr-2 text-indigo-800" />Node Request Proxy</h3>
                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">Configure an HTTP/HTTPS proxy for WaffleX origin traffic. Useful for routing validation traffic through an internal test proxy or an intercepting proxy in a controlled environment.</p>
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Proxy URL (http:// or https://)</label>
                            <input type="text" value={proxyUrl} onChange={(e) => setProxyUrl(e.target.value)} placeholder="http://127.0.0.1:8080" className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-800 font-mono" />
                        </div>
                        <div className="flex space-x-2"><button onClick={handleApplyProxy} className="flex-1 bg-indigo-800 hover:bg-indigo-900 text-white py-2 rounded-md text-sm font-medium transition-colors">Apply Proxy Configuration</button></div>
                        {proxyUrl && <div className="mt-2 text-center"><button onClick={() => { setProxyUrl(''); loadIpData(''); setShowSettings(false); }} className="text-xs text-red-500 hover:text-red-700 font-medium">Clear Proxy</button></div>}
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
