import React from 'react';

// Formulario simple para cambiar la contraseña del usuario actual.
const ChangePassword: React.FC = () => {
    return (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 max-w-2xl">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Cambiar contraseña</h1>

            <p className="text-slate-600 mb-6">Complete estos campos para restablecer su contraseña.</p>

            <div className="space-y-6">
                <div>
                    <label className="block text-slate-700 text-sm font-medium mb-2">
                        Nueva contraseña
                    </label>
                    <input
                        type="password"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700"
                    />
                </div>

                <div>
                    <label className="block text-slate-700 text-sm font-medium mb-2">
                        Confirmar contraseña
                    </label>
                    <input
                        type="password"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700"
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <button className="px-6 py-2.5 bg-blue-500 text-white font-medium rounded hover:bg-blue-600 transition-colors">
                        Enviar
                    </button>
                    <button className="px-6 py-2.5 bg-rose-500 text-white font-medium rounded hover:bg-rose-600 transition-colors">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
