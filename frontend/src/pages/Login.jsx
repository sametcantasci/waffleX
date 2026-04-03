import React, { useState } from 'react';
import { Lock, User, ArrowRight } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (!username.trim()) {
            setError('Please enter a username to continue.');
            return;
        }
        onLoginSuccess();
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-96 bg-indigo-900/5 -skew-y-6 transform origin-top-left -z-10"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-800/5 rounded-full blur-3xl -z-10"></div>
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6"><div className="relative flex items-center justify-center w-16 h-16 rounded-xl bg-indigo-800 shadow-xl border border-indigo-900 overflow-hidden group"><div className="absolute inset-0 bg-gradient-to-br from-indigo-800/50 to-transparent"></div><span className="text-3xl font-black text-white font-sans tracking-tighter italic z-10 drop-shadow-md">W<span className="text-indigo-200">X</span></span></div></div>
                <h2 className="mt-2 text-center text-3xl font-bold font-sans text-slate-900 tracking-tight">Waffle<span className="text-indigo-800">X</span> Prototype</h2>
                <p className="mt-2 text-center text-sm text-slate-500 font-medium tracking-wide">Reviewer and demo access screen</p>
            </div>
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-xl sm:px-10 border border-slate-200">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium flex items-center animate-in fade-in slide-in-from-top-1"><Lock size={16} className="mr-2 flex-shrink-0" />{error}</div>}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Reviewer Name</label>
                            <div className="relative mt-1"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><User size={18} /></div><input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="appearance-none block w-full pl-10 px-3 py-3 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-800 focus:border-indigo-800 sm:text-sm transition-colors text-slate-800 font-medium" placeholder="Enter your name" autoFocus /></div>
                        </div>
                        <div className="pt-2"><button type="submit" className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg shadow-md shadow-indigo-200 text-sm font-bold text-white bg-indigo-800 hover:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-800 transition-all uppercase tracking-wider group">Continue to Dashboard<ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" /></button></div>
                    </form>
                    <div className="mt-8 text-center border-t border-slate-100 pt-6"><p className="text-xs text-slate-500 font-medium max-w-[250px] mx-auto leading-relaxed">For authorized review and controlled demonstration use only.</p></div>
                </div>
            </div>
        </div>
    );
};

export default Login;
