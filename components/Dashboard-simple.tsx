import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle, AlertTriangle, Activity, Search, Filter, Download } from 'lucide-react';
import { supabase } from '../services/supabase';
import InspectionDetailModal from './InspectionDetailModal';

interface Inspeccion {
    id: string;
    patente: string;
    kilometraje: number;
    checklist_critico: any;
    checklist_preventivo: any;
    danios: any;
    created_at: string;
    estado_global?: string;
}

// Panel/vista resumen con estadísticas de inspecciones y reporte reciente.
const Dashboard: React.FC = () => {
    const [inspecciones, setInspecciones] = useState<Inspeccion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedInspection, setSelectedInspection] = useState<Inspeccion | null>(null);

    useEffect(() => {
        fetchInspecciones();
    }, []);

    const fetchInspecciones = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('inspecciones')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            setInspecciones(data || []);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching inspecciones:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Calcular estadísticas desde datos reales
    const vehiculosUnicos = new Set(inspecciones.map(i => i.patente)).size;
    const inspeccionesConProblemas = inspecciones.filter(i => {
        const critico = i.checklist_critico || {};
        const preventivo = i.checklist_preventivo || {};
        return Object.values(critico).some(v => v === false) ||
            Object.values(preventivo).some(v => v === false);
    }).length;
    const inspeccionesOk = inspecciones.length - inspeccionesConProblemas;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
                    <p className="text-slate-500">Cargando datos...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-red-800 font-bold mb-2">Error al cargar datos</h3>
                <p className="text-red-600">{error}</p>
                <button
                    onClick={fetchInspecciones}
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
                    <h1 className="text-2xl font-bold text-slate-900">Panel de Control</h1>
                    <p className="text-slate-500 mt-1">Visión general de la flota y cambios de turno</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por patente..."
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                        <Filter size={18} />
                        Filtros
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">
                        <Download size={18} />
                        Exportar
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500">Total Flota</h3>
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Truck className="text-blue-600" size={20} />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{vehiculosUnicos}</p>
                    <p className="text-xs text-slate-500 mt-2">Vehículos únicos</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500">Operativos</h3>
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="text-green-600" size={20} />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{inspeccionesOk}</p>
                    <p className="text-sm text-green-600 mt-2">Sin observaciones</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500">Con Observaciones</h3>
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                            <AlertTriangle className="text-amber-600" size={20} />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{inspeccionesConProblemas}</p>
                    <p className="text-sm text-amber-600 mt-2">Requieren atención</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500">Total Inspecciones</h3>
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Activity className="text-purple-600" size={20} />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{inspecciones.length}</p>
                    <p className="text-xs text-slate-500 mt-2">Últimas 10 registros</p>
                </div>
            </div>

            {/* Reportes Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">Reportes Recientes</h2>
                    <button
                        onClick={fetchInspecciones}
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vehículo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kilometraje</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {inspecciones.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        No hay inspecciones registradas
                                    </td>
                                </tr>
                            ) : (
                                inspecciones.map((inspeccion) => {
                                    const critico = inspeccion.checklist_critico || {};
                                    const preventivo = inspeccion.checklist_preventivo || {};
                                    const tieneProblemas = Object.values(critico).some(v => v === false) ||
                                        Object.values(preventivo).some(v => v === false);

                                    return (
                                        <tr key={inspeccion.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-600 font-mono text-xs">
                                                        {inspeccion.patente.substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{inspeccion.patente}</p>
                                                        <p className="text-sm text-slate-500">ID: {inspeccion.id.substring(0, 8)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-slate-900">{inspeccion.kilometraje?.toLocaleString()} km</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-slate-900">
                                                    {new Date(inspeccion.created_at).toLocaleDateString('es-AR')}
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    {new Date(inspeccion.created_at).toLocaleTimeString('es-AR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {tieneProblemas ? (
                                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                                                        Con observaciones
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        OK
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button
                                                    onClick={() => setSelectedInspection(inspeccion)}
                                                    className="text-blue-600 hover:text-blue-900 font-medium"
                                                >
                                                    Ver detalles
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Detalles */}
            <InspectionDetailModal
                inspeccion={selectedInspection}
                onClose={() => setSelectedInspection(null)}
            />
        </div>
    );
};

export default Dashboard;
