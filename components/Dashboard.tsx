import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    CheckCircle,
    Truck,
    Activity,
    CalendarClock,
    Search,
    Download,
    RefreshCcw,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import StatCard from './StatCard';
import { fetchVehiculos, fetchShiftChanges, fetchWorkOrdersTotals } from '../services/supabase';

type ShiftFilterWindow = '7d' | '30d' | 'all';
type ShiftRow = {
    id?: string;
    inicio?: string | null;
    entregado_email?: string | null;
    resumen?: string | null;
};
const PAGE_SIZE = 10;

// Dashboard completo: estadisticas de flota y cambios de turno con tabla y grafico.
const Dashboard: React.FC = () => {
    const [vehiculos, setVehiculos] = useState<any[]>([]);
    const [shifts, setShifts] = useState<ShiftRow[]>([]);
    const [workOrderSummary, setWorkOrderSummary] = useState<{
        total: number;
        finalizadas: number;
        sinIniciar: number;
        enCurso: number;
        vencidas: number;
    }>({ total: 0, finalizadas: 0, sinIniciar: 0, enCurso: 0, vencidas: 0 });
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [shiftWindow, setShiftWindow] = useState<ShiftFilterWindow>('7d');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const loadData = useCallback(async () => {
        setLoading(true);
        setErrorMessage(null);
        try {
            const [{ data: vData, error: vError }, { data: sData, error: sError }, totals] = await Promise.all([
                fetchVehiculos(),
                fetchShiftChanges(),
                fetchWorkOrdersTotals(),
            ]);
            if (vError || sError) {
                throw vError || sError;
            }
            setVehiculos(vData || []);
            setShifts((sData as ShiftRow[]) || []);
            setWorkOrderSummary({
                total: totals?.total ?? 0,
                finalizadas: totals?.finalizadas ?? 0,
                sinIniciar: totals?.sinIniciar ?? 0,
                enCurso: totals?.enCurso ?? 0,
                vencidas: totals?.vencidas ?? 0,
            });
        } catch (error) {
            console.error('Error fetching dashboard stats', error);
            setErrorMessage('No se pudieron cargar los datos del dashboard.');
            setVehiculos([]);
            setShifts([]);
            setWorkOrderSummary({
                total: 0,
                finalizadas: 0,
                sinIniciar: 0,
                enCurso: 0,
                vencidas: 0,
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const filteredShifts = useMemo(() => {
        const nowMs = Date.now();
        const fromMs =
            shiftWindow === '7d'
                ? nowMs - 7 * 24 * 60 * 60 * 1000
                : shiftWindow === '30d'
                    ? nowMs - 30 * 24 * 60 * 60 * 1000
                    : Number.NEGATIVE_INFINITY;
        const query = searchTerm.trim().toLowerCase();

        return shifts.filter((shift) => {
            const shiftMs = shift.inicio ? new Date(shift.inicio).getTime() : Number.NaN;
            if (Number.isFinite(shiftMs) && shiftMs < fromMs) return false;
            if (!query) return true;
            const emailText = (shift.entregado_email || '').toLowerCase();
            const resumenText = (shift.resumen || '').toLowerCase();
            return emailText.includes(query) || resumenText.includes(query);
        });
    }, [shifts, shiftWindow, searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, shiftWindow]);

    const totalPages = Math.max(1, Math.ceil(filteredShifts.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const pageStart = (safePage - 1) * PAGE_SIZE;
    const paginatedShifts = filteredShifts.slice(pageStart, pageStart + PAGE_SIZE);

    const totalVehicles = vehiculos.length;
    const operationalVehicles = vehiculos.filter((v) => v.activo !== false).length;
    const maintenanceVehicles = totalVehicles - operationalVehicles;
    const recentIssues = filteredShifts.length;

    const chartData = useMemo(() => {
        const days = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];
        const counts = [0, 0, 0, 0, 0, 0, 0];
        filteredShifts.forEach((shift) => {
            if (!shift.inicio) return;
            const date = new Date(shift.inicio);
            if (Number.isNaN(date.getTime())) return;
            const jsDay = date.getDay();
            const mondayBased = (jsDay + 6) % 7;
            counts[mondayBased] += 1;
        });
        return days.map((label, index) => ({ name: label, issues: counts[index] }));
    }, [filteredShifts]);

    const exportFilteredShifts = useCallback(() => {
        if (filteredShifts.length === 0) return;
        const csvRows = [
            ['fecha', 'chofer', 'resumen'],
            ...filteredShifts.slice(0, 2000).map((shift) => [
                shift.inicio ? new Date(shift.inicio).toLocaleString('es-AR') : '-',
                shift.entregado_email || '-',
                (shift.resumen || '-').replace(/\r?\n/g, ' '),
            ]),
        ];
        const csvContent = csvRows
            .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const datePart = new Date().toISOString().slice(0, 10);
        link.href = url;
        link.setAttribute('download', `cambios_turno_dashboard_${datePart}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [filteredShifts]);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Panel de Control</h1>
                    <p className="text-slate-500 mt-1">Vision general con datos de flota y cambios de turno.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar chofer o resumen..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>
                    <select
                        value={shiftWindow}
                        onChange={(e) => setShiftWindow(e.target.value as ShiftFilterWindow)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="7d">Ultimos 7 dias</option>
                        <option value="30d">Ultimos 30 dias</option>
                        <option value="all">Todo el historial</option>
                    </select>
                    <button
                        type="button"
                        onClick={() => void loadData()}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        disabled={loading}
                    >
                        <RefreshCcw size={18} />
                        Recargar
                    </button>
                    <button
                        type="button"
                        onClick={exportFilteredShifts}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={filteredShifts.length === 0}
                    >
                        <Download size={18} />
                        Exportar
                    </button>
                </div>
            </div>

            {errorMessage && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm">
                    {errorMessage}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <StatCard title="Total Flota" value={totalVehicles} icon={Truck} color="blue" />
                <StatCard title="Operativos" value={operationalVehicles} icon={CheckCircle} color="green" trendUp trend="-" />
                <StatCard title="En Mantenimiento" value={maintenanceVehicles} icon={AlertTriangle} color="amber" trendUp={false} trend="-" />
                <StatCard title="Cambios de turno" value={recentIssues} icon={Activity} color="red" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {[
                    {
                        label: 'O.T. Totales',
                        value: workOrderSummary.total,
                        icon: CheckCircle,
                        color: 'blue',
                        progressColor: '#38bdf8',
                        progress: 100,
                    },
                    {
                        label: 'O.T. Finalizadas',
                        value: workOrderSummary.finalizadas,
                        icon: CheckCircle,
                        color: 'green',
                        progressColor: '#34d399',
                        progress: workOrderSummary.total ? (workOrderSummary.finalizadas / Math.max(1, workOrderSummary.total ?? 0)) * 100 : 0,
                    },
                    {
                        label: 'O.T. Sin iniciar',
                        value: workOrderSummary.sinIniciar,
                        icon: Truck,
                        color: 'amber',
                        progressColor: '#facc15',
                        progress: workOrderSummary.total ? (workOrderSummary.sinIniciar / Math.max(1, workOrderSummary.total ?? 0)) * 100 : 0,
                    },
                    {
                        label: 'O.T. En curso',
                        value: workOrderSummary.enCurso,
                        icon: Activity,
                        color: 'blue',
                        progressColor: '#60a5fa',
                        progress: workOrderSummary.total ? (workOrderSummary.enCurso / Math.max(1, workOrderSummary.total ?? 0)) * 100 : 0,
                    },
                    {
                        label: 'O.T. Vencidas',
                        value: workOrderSummary.vencidas,
                        icon: AlertTriangle,
                        color: 'red',
                        progressColor: '#f43f5e',
                        progress: workOrderSummary.total ? (workOrderSummary.vencidas / Math.max(1, workOrderSummary.total ?? 0)) * 100 : 0,
                    },
                ].map((stat) => (
                    <div key={stat.label} className="space-y-2">
                        <StatCard title={stat.label} value={stat.value} icon={stat.icon} color={stat.color} subtitle="" />
                        <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                            <div
                                className="h-1 rounded-full"
                                style={{
                                    width: `${Math.max(0, Math.min(100, stat.progress))}%`,
                                    background: stat.progressColor,
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: shift list */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800">Ultimos cambios de turno</h3>
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
                                    {paginatedShifts.map((s) => (
                                        <tr key={s.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-sm text-slate-700">{s.inicio ? new Date(s.inicio).toLocaleString() : '-'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{s.entregado_email || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600 whitespace-pre-line">{s.resumen || '-'}</td>
                                        </tr>
                                    ))}
                                    {!loading && filteredShifts.length === 0 && (
                                        <tr><td colSpan={3} className="px-4 py-4 text-sm text-slate-500 text-center">Sin registros para el filtro actual</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between gap-3">
                            <div className="text-xs text-slate-500">
                                Mostrando {filteredShifts.length === 0 ? 0 : pageStart + 1}-{Math.min(pageStart + PAGE_SIZE, filteredShifts.length)} de {filteredShifts.length} cambios de turno.
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={safePage <= 1}
                                    className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Anterior
                                </button>
                                <span className="text-xs text-slate-500">
                                    Pagina {safePage} de {totalPages}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={safePage >= totalPages}
                                    className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: chart and status */}
                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-800">Cambios por dia</h3>
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
                            Monitoreando cambios de turno y flota.
                        </p>
                        <div className={`flex items-center gap-2 text-xs font-mono ${errorMessage ? 'text-rose-300' : 'text-emerald-400'}`}>
                            <span className="relative flex h-3 w-3">
                                {!errorMessage && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                                <span className={`relative inline-flex rounded-full h-3 w-3 ${errorMessage ? 'bg-rose-400' : 'bg-emerald-500'}`}></span>
                            </span>
                            {errorMessage ? 'DATOS NO DISPONIBLES' : loading ? 'ACTUALIZANDO DATOS' : 'SYSTEM ONLINE'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
