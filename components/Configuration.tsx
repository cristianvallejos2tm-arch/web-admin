import React, { useState } from 'react';
import { Save, Bell, Globe, Shield, Info } from 'lucide-react';

const Configuration: React.FC = () => {
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [systemNotifs, setSystemNotifs] = useState(true);
    const [language, setLanguage] = useState('es');

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800">Configuración</h1>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    <Save size={18} />
                    Guardar Cambios
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* General Settings */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Globe size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">General</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Nombre de la Aplicación</label>
                            <input
                                type="text"
                                value="CAM Control Vehicular"
                                readOnly
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Idioma</label>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="es">Español</option>
                                <option value="en">English</option>
                                <option value="pt">Português</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                            <Bell size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Notificaciones</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                            <div>
                                <p className="text-sm font-medium text-slate-700">Alertas por Email</p>
                                <p className="text-xs text-slate-500">Recibir reportes diarios</p>
                            </div>
                            <button
                                onClick={() => setEmailAlerts(!emailAlerts)}
                                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${emailAlerts ? 'bg-blue-600' : 'bg-slate-200'}`}
                            >
                                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out mt-1 ml-1 ${emailAlerts ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                            <div>
                                <p className="text-sm font-medium text-slate-700">Notificaciones System</p>
                                <p className="text-xs text-slate-500">Alertas en tiempo real</p>
                            </div>
                            <button
                                onClick={() => setSystemNotifs(!systemNotifs)}
                                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${systemNotifs ? 'bg-blue-600' : 'bg-slate-200'}`}
                            >
                                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out mt-1 ml-1 ${systemNotifs ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* System Info */}
                <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                            <Info size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Información del Sistema</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Versión</p>
                            <p className="text-slate-800 font-mono text-sm">v1.0.4-beta</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Build</p>
                            <p className="text-slate-800 font-mono text-sm">2024.12.12.01</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Licencia</p>
                            <p className="text-green-600 font-medium text-sm flex items-center gap-1">
                                <Shield size={14} />
                                Enterprise Active
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Configuration;
