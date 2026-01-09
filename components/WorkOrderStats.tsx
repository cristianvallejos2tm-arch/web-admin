import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowLeft } from 'lucide-react';

interface WorkOrderStatsProps {
    onBack: () => void;
    orders: any[];
}

const WorkOrderStats: React.FC<WorkOrderStatsProps> = ({ onBack, orders }) => {
    // Calcula totales que se muestran en la gráfica según los estados actuales.
    const counts = useMemo(() => {
        const total = orders.length;
        const pendientes = orders.filter((o) => o.estado !== 'cerrada' && o.estado !== 'cancelada').length;
        const finalizadas = orders.filter((o) => o.estado === 'cerrada' || o.estado === 'cancelada').length;
        return [
            { name: 'Totales', value: total, color: '#e0f2fe' },
            { name: 'Pendientes', value: pendientes, color: '#fef3c7' },
            { name: 'Finalizadas', value: finalizadas, color: '#dcfce7' },
        ];
    }, [orders]);

    // Renderiza la vista de estadísticas con botón volver y el gráfico resumen.
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-blue-600">Estad�sticas de O.T.</h1>
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} />
                    Volver
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 pt-10">
                <h2 className="text-sm font-bold text-slate-800 mb-8 uppercase tracking-wide">CANTIDAD DE O.T.</h2>

                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={counts}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            barSize={100}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#475569', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {counts.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color === '#e0f2fe' ? '#38bdf8' : entry.color === '#fef3c7' ? '#fbbf24' : '#4ade80'} strokeWidth={1} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default WorkOrderStats;
