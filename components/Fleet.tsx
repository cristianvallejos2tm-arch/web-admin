import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle, AlertTriangle, Activity, Search, Calendar, TrendingUp, MoreVertical, Trash2, FileText, Plus } from 'lucide-react';
import { supabase } from '../services/supabase';

interface Inspeccion {
    id: string;
    patente: string;
    kilometraje: number;
    checklist_critico: any;
    checklist_preventivo: any;
    created_at: string;
}

interface VehiculoStats {
    patente: string;
    totalInspecciones: number;
    ultimaInspeccion: Inspeccion | null;
    tieneProblemas: boolean;
    kilometrajePromedio: number;
}

// Vista de flota que agrupa inspecciones por patente y presenta estado/kilometraje.
const Fleet: React.FC = () => {
    const [vehiculos, setVehiculos] = useState<VehiculoStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [openRow, setOpenRow] = useState<string | null>(null);

    useEffect(() => {
        fetchVehiculos();
    }, []);

    const fetchVehiculos = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('inspecciones')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Agrupar inspecciones por patente
            const vehiculosMap = new Map<string, VehiculoStats>();

            data?.forEach((inspeccion: Inspeccion) => {
                const patente = inspeccion.patente;

                if (!vehiculosMap.has(patente)) {
                    vehiculosMap.set(patente, {
                        patente,
                        totalInspecciones: 0,
                        ultimaInspeccion: null,
                        tieneProblemas: false,
                        kilometrajePromedio: 0
                    });
                }

                const vehiculo = vehiculosMap.get(patente)!;
                vehiculo.totalInspecciones++;

                // Actualizar última inspección
                if (!vehiculo.ultimaInspeccion ||
                    new Date(inspeccion.created_at) > new Date(vehiculo.ultimaInspeccion.created_at)) {
                    vehiculo.ultimaInspeccion = inspeccion;
                }

                // Verificar si tiene problemas
                const critico = inspeccion.checklist_critico || {};
                const preventivo = inspeccion.checklist_preventivo || {};
                if (Object.values(critico).some(v => v === false) ||
                    Object.values(preventivo).some(v => v === false)) {
                    vehiculo.tieneProblemas = true;
                }

                // Calcular kilometraje promedio
                vehiculo.kilometrajePromedio = inspeccion.kilometraje || 0;
            });

            setVehiculos(Array.from(vehiculosMap.values()));
            setError(null);
        } catch (err: any) {
            console.error('Error fetching vehiculos:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredVehiculos = vehiculos.filter(v =>
        v.patente.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
                    <p className="text-slate-500">Cargando flota...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-red-800 font-bold mb-2">Error al cargar flota</h3>
                <p className="text-red-600">{error}</p>
                <button
                    onClick={fetchVehiculos}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Vehículos</h1>
                    <p className="text-slate-500 mt-1">Listado y gestión de la flota</p>
                </div>
                <div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors">
                        <Plus size={16} />
                        Nuevo
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500">Total Vehículos</h3>
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Truck className="text-blue-600" size={20} />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{vehiculos.length}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500">Operativos</h3>
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="text-green-600" size={20} />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">
                        {vehiculos.filter(v => !v.tieneProblemas).length}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500">Con Observaciones</h3>
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                            <AlertTriangle className="text-amber-600" size={20} />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">
                        {vehiculos.filter(v => v.tieneProblemas).length}
                    </p>
                </div>
            </div>

            {/* Controls: show rows, search, exports */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <label className="text-sm text-slate-600">Mostrar</label>
                    <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))} className="px-2 py-1 border rounded">
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                    <span className="text-sm text-slate-600">registros</span>
                </div>

                <div className="flex items-center gap-3">
                    <label className="text-sm text-slate-600 hidden md:block">Buscar:</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder=""
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>
                    <button className="px-3 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600">Excel</button>
                    <button className="px-3 py-2 bg-cyan-400 text-white rounded hover:bg-cyan-500">Pdf</button>
                </div>
            </div>

            {/* Vehicles Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">Vehículos de la Flota</h2>
                    <button
                        onClick={fetchVehiculos}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
                    >
                        <Activity size={16} />
                        Actualizar
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"># Int.</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dominio</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Modelo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Km</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Año</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Base</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Op.</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Función</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Sector</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider"> </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredVehiculos.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="px-6 py-8 text-center text-slate-500">No se encontraron vehículos</td>
                                </tr>
                            ) : (
                                filteredVehiculos.slice(0, rowsPerPage).map((vehiculo, idx) => (
                                    <tr key={vehiculo.patente} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-600 font-mono text-xs">{idx + 1}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-600 font-mono text-xs">{vehiculo.patente.substring(0,2)}</div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{vehiculo.patente}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-900">-</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {vehiculo.tieneProblemas ? (
                                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">Operativo</span>
                                            ) : (
                                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Operativo</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-900">{vehiculo.kilometrajePromedio?.toLocaleString() || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-900">-</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-900">-</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-900">-</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-900">-</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-900">-</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="relative inline-block text-left">
                                                <button onClick={() => setOpenRow(openRow === vehiculo.patente ? null : vehiculo.patente)} className="p-2 rounded bg-white border hover:bg-slate-50">
                                                    <MoreVertical size={16} />
                                                </button>
                                                {openRow === vehiculo.patente && (
                                                    <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-20">
                                                        <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Ver ficha</button>
                                                        <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Orden de Trabajo</button>
                                                        <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Asignar Plan Mant.</button>
                                                        <div className="border-t" />
                                                        <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Editar</button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Fleet;
