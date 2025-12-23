import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginForm, setLoginForm] = useState({ username: '', password: '' });

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (loginForm.username === 'admin@admin.com' && loginForm.password === 'admin') {
            setIsAuthenticated(true);
        } else {
            alert('Credenciales incorrectas');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 w-full max-w-md">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded bg-amber-500 flex items-center justify-center text-slate-900 font-bold text-xl">
                            P
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">PATAGONIA</h1>
                            <p className="text-sm text-amber-500 font-medium">FLEET COMMAND</p>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Iniciar Sesión</h2>
                    <p className="text-slate-500 mb-6">Ingresa tus credenciales para acceder</p>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Usuario</label>
                            <input
                                type="text"
                                value={loginForm.username}
                                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                placeholder="pwadt"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Contraseña</label>
                            <input
                                type="password"
                                value={loginForm.password}
                                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                placeholder="••••••••"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                        >
                            Ingresar
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
            {/* Sidebar */}
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Mobile Header */}
            <div className="md:hidden fixed w-full bg-slate-900 text-white p-4 z-20 flex justify-between items-center shadow-md">
                <span className="font-bold tracking-wide">PATAGONIA FLEET</span>
                <button className="text-amber-500 font-bold">MENU</button>
            </div>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 transition-all duration-300">
                <div className="max-w-7xl mx-auto">
                    {activeTab === 'dashboard' && <Dashboard />}
                    {activeTab === 'vehicles' && (
                        <div className="flex items-center justify-center h-[60vh] text-slate-400">
                            <p>Módulo de Gestión de Flota (Próximamente)</p>
                        </div>
                    )}
                    {activeTab === 'checklists' && (
                        <div className="flex items-center justify-center h-[60vh] text-slate-400">
                            <p>Historial Completo de Reportes (Próximamente)</p>
                        </div>
                    )}
                    {activeTab === 'analytics' && (
                        <div className="flex items-center justify-center h-[60vh] text-slate-400">
                            <p>Analytics Avanzado & Gemini Insights (Próximamente)</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default App;
