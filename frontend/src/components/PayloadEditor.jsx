import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/api';

const PayloadEditor = () => {
    const [payloads, setPayloads] = useState([]);
    const [selectedFile, setSelectedFile] = useState('');
    const [content, setContent] = useState('');
    const [loadingList, setLoadingList] = useState(true);
    const [loadingContent, setLoadingContent] = useState(false);
    const [saving, setSaving] = useState(false);
    const [statusObject, setStatusObject] = useState({ type: null, message: '' }); // type: 'success' | 'error'

    // Fetch list of files on mount
    useEffect(() => {
        const fetchPayloads = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/payloads`);
                setPayloads(res.data);
                if (res.data.length > 0) {
                    setSelectedFile(res.data[0]);
                }
            } catch (err) {
                console.error("Failed to fetch payloads:", err);
                setStatusObject({ type: 'error', message: 'Failed to connect to backend payload server.' });
            } finally {
                setLoadingList(false);
            }
        };
        fetchPayloads();
    }, []);

    // Fetch content when selection changes
    useEffect(() => {
        if (!selectedFile) return;

        const fetchContent = async () => {
            setLoadingContent(true);
            try {
                const res = await axios.get(`${API_BASE_URL}/payloads/${selectedFile}`);
                setContent(res.data);
                setStatusObject({ type: null, message: '' });
            } catch (err) {
                console.error(`Failed to load ${selectedFile}:`, err);
                setStatusObject({ type: 'error', message: `Failed to read ${selectedFile}` });
                setContent('');
            } finally {
                setLoadingContent(false);
            }
        };
        fetchContent();
    }, [selectedFile]);

    const handleSave = async () => {
        if (!selectedFile) return;
        setSaving(true);
        setStatusObject({ type: null, message: '' });

        try {
            await axios.put(`${API_BASE_URL}/payloads/${selectedFile}`, {
                content: content
            });
            setStatusObject({ type: 'success', message: 'File saved successfully' });

            // clear success message after 3 seconds
            setTimeout(() => {
                setStatusObject(prev => prev.type === 'success' ? { type: null, message: '' } : prev);
            }, 3000);

        } catch (err) {
            console.error("Failed to save:", err);
            setStatusObject({ type: 'error', message: 'Failed to write changes to disk' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 max-h-[calc(100vh-100px)]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-white shadow-sm z-10 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Payload Corpus Editor</h2>
                    <p className="text-sm text-slate-500">Modify attack signatures directly on the filesystem</p>
                </div>

                <div className="flex items-center space-x-4">
                    {/* Status Message */}
                    {statusObject.message && (
                        <div className={`flex items-center text-sm font-medium px-3 py-1.5 rounded-md ${statusObject.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {statusObject.type === 'success' ? <CheckCircle2 size={16} className="mr-2" /> : <AlertCircle size={16} className="mr-2" />}
                            {statusObject.message}
                        </div>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={saving || loadingContent || !selectedFile}
                        className="bg-indigo-800 hover:bg-indigo-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-800/20"
                    >
                        {saving ? <RefreshCw size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                        Save Payload
                    </button>
                </div>
            </div>

            {/* Layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* File List */}
                <div className="w-64 bg-white border-r border-slate-200 overflow-y-auto">
                    <div className="p-4">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Local Filesystem</h3>
                        {loadingList ? (
                            <div className="flex items-center justify-center p-4 text-slate-400">
                                <RefreshCw size={20} className="animate-spin" />
                            </div>
                        ) : payloads.length === 0 ? (
                            <p className="text-sm text-slate-500 px-2 italic">No .txt files found in payloads directory.</p>
                        ) : (
                            <ul className="space-y-1">
                                {payloads.map(filename => (
                                    <li key={filename}>
                                        <button
                                            onClick={() => setSelectedFile(filename)}
                                            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${selectedFile === filename
                                                ? 'bg-indigo-50 text-indigo-800 border border-indigo-800/20'
                                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                }`}
                                        >
                                            {filename}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 bg-slate-900 p-4 relative flex flex-col">
                    {loadingContent && (
                        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                            <RefreshCw size={32} className="animate-spin text-indigo-800" />
                        </div>
                    )}

                    <div className="flex items-center justify-between px-2 pb-3 mb-2 border-b border-slate-800">
                        <span className="text-sm font-mono text-slate-400">
                            /backend/payloads/{selectedFile || '...'}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                            {content.split('\n').length} lines
                        </span>
                    </div>

                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="flex-1 w-full bg-transparent text-slate-300 font-mono text-sm leading-relaxed outline-none resize-none px-2 custom-scrollbar"
                        placeholder="Select a file or type request variants here (one per line)..."
                        spellCheck="false"
                    />
                </div>
            </div>
        </div>
    );
};

export default PayloadEditor;
