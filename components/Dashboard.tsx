import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, Truck, Activity, CalendarClock, Search, Filter, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import StatCard from './StatCard';
import { fetchVehiculos, fetchShiftChanges } from '../services/supabase';

// Dashboard completo: estadísticas de flota y cambios de turno con tabla y gráfico.
const Dashboard: React.FC = () => {
    const [vehiculos, setVehiculos] = useState<any[]>([]);
    const [shifts, setShifts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const [{ data: vData }, { data: sData }] = await Promise.all([fetchVehiculos(), fetchShiftChanges()]);
            setVehiculos(vData || []);
            setShifts(sData || []);
            setLoading(false);
        };
        load();
    }, []);

    const totalVehicles = vehiculos.length;
    const operationalVehicles = vehiculos.filter((v) => v.activo !== false).length;
    const maintenanceVehicles = totalVehicles - operationalVehicles;
    const recentIssues = shifts.length;

    const chartData = useMemo(() => {
        const counts: Record<string, number> = {};
        shifts.forEach((s) => {
            const day = s.inicio ? new Date(s.inicio).toLocaleDateString('es-AR', { weekday: 'short' }) : 'N/D';
            counts[day] = (counts[day] || 0) + 1;
        });
        const days = ['lun.', 'mar.', 'mié.', 'jue.', 'vie.', 'sáb.', 'dom.'];
        return days.map((d) => ({ name: d, issues: counts[d] || 0 }));
    }, [shifts]);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Panel de Control</h1>
                    <p className="text-slate-500 mt-1">Visión general con datos de la base (flota y cambios de turno).</p>
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

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Flota" value={totalVehicles} icon={Truck} color="blue" />
                <StatCard title="Operativos" value={operationalVehicles} icon={CheckCircle} color="green" trendUp trend="-" />
                <StatCard title="En Mantenimiento" value={maintenanceVehicles} icon={AlertTriangle} color="amber" trendUp={false} trend="-" />
                <StatCard title="Cambios de turno" value={recentIssues} icon={Activity} color="red" />
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: shift list */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800">Últimos cambios de turno</h3>
                            {loading && <span className="text-xs text-slate-500">Cargando...</span>}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Fecha</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Chofer</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Resumen</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(shifts || []).slice(0, 10).map((s) => (
                                        <tr key={s.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-sm text-slate-700">{s.inicio ? new Date(s.inicio).toLocaleString() : '-'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{s.entregado_email || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600 whitespace-pre-line">{s.resumen || '-'}</td>
                                        </tr>
                                    ))}
                                    {!loading && shifts.length === 0 && (
                                        <tr><td colSpan={3} className="px-4 py-4 text-sm text-slate-500 text-center">Sin registros</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right: chart and status */}
                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-800">Cambios por día</h3>
                            <CalendarClock className="text-slate-400" size={20} />
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="issues" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.issues > 4 ? '#ef4444' : '#f59e0b'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg">
                        <h3 className="font-bold text-lg mb-2">Estado del Sistema</h3>
                        <p className="text-slate-300 text-sm mb-4">
                            Monitoreando cambios de turno y flota en tiempo real.
                        </p>
                        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            SYSTEM ONLINE
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
