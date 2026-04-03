import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import AssessmentModule from './AssessmentModule';
import ResilienceTest from './ResilienceTest';
import PayloadEditor from '../components/PayloadEditor';

const Dashboard = () => {
    return (
        <Router>
            <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans text-slate-800 antialiased selection:bg-indigo-100 selection:text-indigo-900">
                <Header />

                <div className="flex flex-1 overflow-hidden">
                    <Sidebar />

                    <main className="flex-1 border-l border-slate-200 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] bg-white overflow-hidden relative z-0">
                        <Routes>
                            <Route path="/" element={<AssessmentModule />} />
                            <Route path="/resilience" element={<ResilienceTest />} />
                            <Route path="/editor" element={<PayloadEditor />} />
                        </Routes>
                    </main>
                </div>
            </div>
        </Router>
    );
};

export default Dashboard;
