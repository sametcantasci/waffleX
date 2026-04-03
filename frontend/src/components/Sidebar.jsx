import React from 'react';
import { NavLink } from 'react-router-dom';
import { Crosshair, Activity, FileText } from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { name: 'Assessment Module', path: '/', icon: Crosshair },
        { name: 'Resilience Testing', path: '/resilience', icon: Activity },
        { name: 'Payload Editor', path: '/editor', icon: FileText },
    ];

    return (
        <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-[calc(100vh-73px)] h-full overflow-y-auto hidden md:flex">
            <div className="p-4 py-6">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 px-3">Assessment Modules</h2>
                <nav className="space-y-1">
                    {navItems.map((item) => (
                        <NavLink key={item.name} to={item.path} className={({ isActive }) => `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors group ${isActive ? 'bg-indigo-800/20 text-indigo-200 border border-indigo-800/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                            <item.icon size={18} className="mr-3 flex-shrink-0 transition-colors text-slate-400 group-hover:text-slate-300" />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>
            </div>
            <div className="mt-auto p-4 border-t border-slate-800">
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                    <h3 className="text-xs font-bold text-slate-300 mb-1">Assessment Safety</h3>
                    <p className="text-[10px] text-slate-500 leading-relaxed">Ensure you are authorized to assess the selected targets. WaffleX sends controlled request variants for defensive validation and parser-drift analysis.</p>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
