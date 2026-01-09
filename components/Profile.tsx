import React, { useState } from 'react';

// Muestra los datos de perfil del usuario con campos solo lectura (placeholder).
const Profile: React.FC = () => {
    // Dummy data from screenshot
    const [formData] = useState({
        username: 'user',
        firstName: 'user',
        lastName: 'user',
        email: 'user'
    });

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <h1 className="text-2xl font-bold text-blue-600">Mi perfil</h1>
            </div>

            {/* Data Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-6">DATOS</h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Usuario</label>
                        <input
                            type="text"
                            readOnly
                            value={formData.username}
                            className="w-full px-3 py-2 border border-slate-200 rounded text-sm bg-white text-slate-700 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Nombre</label>
                        <input
                            type="text"
                            readOnly
                            value={formData.firstName}
                            className="w-full px-3 py-2 border border-slate-200 rounded text-sm bg-white text-slate-700 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Apellido</label>
                        <input
                            type="text"
                            readOnly
                            value={formData.lastName}
                            className="w-full px-3 py-2 border border-slate-200 rounded text-sm bg-white text-slate-700 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
                        <input
                            type="text"
                            readOnly
                            value={formData.email}
                            className="w-full px-3 py-2 border border-slate-200 rounded text-sm bg-white text-slate-700 focus:outline-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
