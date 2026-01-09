import React, { useEffect, useState } from 'react';
import { Plus, ChevronRight, Loader2, Eye, X } from 'lucide-react';
import ShiftChangeForm from './ShiftChangeForm';
import { fetchShiftChanges, fetchUsuariosLite, supabase } from '../services/supabase';

interface ShiftChangeData {
    id: string;
    inicio: string;
    fin?: string | null;
    entregado_por?: string | null;
    recibido_por?: string | null;
    entregado_email?: string | null;
    recibido_email?: string | null;
    resumen?: string | null;
    novedades?: any;
}

interface ShiftChangeProps {
    userName?: string;
}

// Lista cambios de turno, refresca en tiempo real y permite generar/reportar cada turno.
const ShiftChange: React.FC<ShiftChangeProps> = ({ userName }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [view, setView] = useState<'list' | 'new' | 'detail'>('list');
    const [shifts, setShifts] = useState<ShiftChangeData[]>([]);
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [selected, setSelected] = useState<ShiftChangeData | null>(null);
    const refreshTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasLoadedRef = React.useRef(false);

    const loadData = async (opts?: { silent?: boolean }) => {
        const shouldShowLoading = !opts?.silent && !hasLoadedRef.current;
        if (shouldShowLoading) {
            setLoading(true);
        }
        const [{ data, error }, { data: users }] = await Promise.all([fetchShiftChanges(), fetchUsuariosLite()]);
        if (shouldShowLoading) {
            setLoading(false);
        }
        if (error) {
            console.error('Error cargando cambios de turno', error);
            setErrorMsg('No se pudieron cargar los cambios de turno. Revisa pol?icas de lectura en "cambios_turno".');
            return;
        }
        setErrorMsg(null);
        setShifts(data || []);
        setUsuarios(users || []);
        hasLoadedRef.current = true;
    };

    useEffect(() => {
        if (view !== 'list') {
            return;
        }
        loadData();
        const pollId = setInterval(() => {
            loadData({ silent: true });
        }, 10000);
        const channel = supabase
            .channel('cambios_turno-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'cambios_turno' }, () => {
                if (refreshTimerRef.current) {
                    clearTimeout(refreshTimerRef.current);
                }
                refreshTimerRef.current = setTimeout(() => {
                    loadData({ silent: true });
                }, 400);
            })
            .subscribe();

        return () => {
            clearInterval(pollId);
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
            }
            supabase.removeChannel(channel);
        };
    }, [view]);

    const formatUserName = (id?: string | null) => {
        if (!id) return '-';
        const u = usuarios.find((x) => x.id === id);
        return u?.nombre || u?.email || id;
    };

    const filteredShifts = shifts.filter((shift) => {
        const text = `${shift.resumen || ''} ${shift.entregado_email || ''} ${shift.recibido_email || ''}`.toLowerCase();
        return text.includes(searchTerm.toLowerCase());
    });

    if (view === 'new') {
        return <ShiftChangeForm userName={userName} onBack={() => { setView('list'); loadData(); }} />;
    }

    if (view === 'detail' && selected) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2"><Eye size={20}/> Detalle Cambio de Turno</h1>
                    <div className="flex gap-3">
                        <button
                            onClick={() => window.print()}
                            className="px-3 py-2 bg-slate-700 text-white rounded-md text-sm hover:bg-slate-800"
                        >
                            Imprimir
                        </button>
                        <button
                            onClick={() => { setSelected(null); setView('list'); }}
                            className="px-3 py-2 bg-slate-200 text-slate-700 rounded-md text-sm hover:bg-slate-300"
                        >
                            Volver
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-700">
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                            <p className="text-xs text-slate-500">Fecha</p>
                            <p className="text-base font-bold text-slate-800">{selected.inicio ? new Date(selected.inicio).toLocaleString() : '—'}</p>
                            <p className="text-xs text-slate-500 mt-3">Km de la unidad</p>
                            <p className="text-base font-bold text-slate-800">{(selected.resumen || '').match(/Km:\s*([^|]+)/)?.[1]?.trim() || '—'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                            <p className="text-xs text-slate-500">Nombre y Apellido</p>
                            <p className="text-base font-bold text-slate-800">{selected.entregado_email || formatUserName(selected.entregado_por)}</p>
                            <p className="text-xs text-slate-500 mt-3">Hs. de la unidad</p>
                            <p className="text-base font-bold text-slate-800">{(selected.resumen || '').match(/Hs:\s*([^|]+)/)?.[1]?.trim() || '—'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                            <p className="text-xs text-slate-500">Vehículo</p>
                            <p className="text-base font-bold text-slate-800">{(selected.resumen || '').match(/Vehículo:\s*([^|]+)/)?.[1]?.trim() || selected.resumen || '—'}</p>
                        </div>
                    </div>

                    {selected.novedades?.checklist && Array.isArray(selected.novedades.checklist) && (
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            {selected.novedades.checklist.map((sec: any, idx: number) => (
                                <div key={idx} className="border-b border-slate-200 last:border-b-0">
                                    <div className="bg-slate-900 text-white px-4 py-2 text-sm font-bold">
                                        {sec.title || sec.titulo || 'Sección'}
                                    </div>
                                    <table className="w-full text-sm">
                                        <tbody>
                                            {(sec.items || []).map((it: any) => {
                                                const status = it.status || '';
                                                const bg = status.toLowerCase() === 'malo' || status.toLowerCase() === 'falta' ? 'bg-rose-50' : '';
                                                return (
                                                    <tr key={it.id} className={`border-b border-slate-200 last:border-b-0 ${bg}`}>
                                                        <td className="px-4 py-2 font-semibold text-slate-800">{it.item}</td>
                                                        <td className="px-4 py-2 text-slate-700 w-40">{status}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-blue-600">Cambio de Turnos</h1>
                <button
                    onClick={() => setView('new')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                    <Plus size={18} />
                    Generar nuevo
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">LISTADO CAMBIOS DE TURNO</h2>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-600">Mostrar</label>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => setRowsPerPage(Number(e.target.value))}
                            className="px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span className="text-sm text-slate-600">registros</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="text-sm text-slate-600">Buscar:</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-3 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                        />
                        <button className="px-3 py-1.5 bg-cyan-500 text-white text-sm font-medium rounded hover:bg-cyan-600 transition-colors">
                            Excel
                        </button>
                        <button className="px-3 py-1.5 bg-cyan-500 text-white text-sm font-medium rounded hover:bg-cyan-600 transition-colors">
                            Pdf
                        </button>
                    </div>
                </div>

                {errorMsg && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">{errorMsg}</div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-bold text-slate-600">#</th>
                                <th className="px-4 py-3 text-left text-sm font-bold text-slate-600">Inicio</th>
                                <th className="px-4 py-3 text-left text-sm font-bold text-slate-600">Chofer</th>
                                <th className="px-4 py-3 text-left text-sm font-bold text-slate-600">Resumen</th>
                                <th className="px-4 py-3 text-left text-sm font-bold text-slate-600">Detalles</th>
                                <th className="px-4 py-3 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-4 text-sm text-slate-500"><Loader2 className="animate-spin inline mr-2" size={16}/>Cargando...</td></tr>
                            ) : filteredShifts.slice(0, rowsPerPage).map((shift) => (
                                <tr key={shift.id} className="hover:bg-slate-50 bg-rose-50/30 transition-colors">
                                    <td className="px-4 py-4 text-sm text-slate-600 font-medium">{shift.id.slice(0, 8)}</td>
                                    <td className="px-4 py-4 text-sm text-slate-600">{shift.inicio ? new Date(shift.inicio).toLocaleString() : '—'}</td>
                                    <td className="px-4 py-4 text-sm text-slate-700">{shift.entregado_email || formatUserName(shift.entregado_por)}</td>
                                    <td className="px-4 py-4 text-sm text-slate-600 whitespace-pre-line">{shift.resumen || '—'}</td>
                                    <td className="px-4 py-4 text-right">
                                        <button
                                            onClick={() => { setSelected(shift); setView('detail'); }}
                                            className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-xs"
                                        >
                                            <Eye size={14} /> Ver
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="text-sm text-slate-500 pt-2">
                    Mostrando 1 a {Math.min(filteredShifts.length, rowsPerPage)} de {filteredShifts.length} entradas
                </div>
            </div>

            {false && selected && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
                            <Eye size={20} /> Detalle Cambio de Turno
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => window.print()}
                                className="px-3 py-2 bg-slate-700 text-white rounded-md text-sm hover:bg-slate-800"
                            >
                                Imprimir
                            </button>
                            <button
                                onClick={() => setSelected(null)}
                                className="text-slate-500 hover:text-slate-800"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-700">
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                            <p className="text-xs text-slate-500">Fecha</p>
                            <p className="text-base font-bold text-slate-800">{selected.inicio ? new Date(selected.inicio).toLocaleString() : '—'}</p>
                            <p className="text-xs text-slate-500 mt-3">Km de la unidad</p>
                            <p className="text-base font-bold text-slate-800">{(selected.resumen || '').match(/Km:\s*([^|]+)/)?.[1]?.trim() || '—'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                            <p className="text-xs text-slate-500">Nombre y Apellido</p>
                            <p className="text-base font-bold text-slate-800">{selected.entregado_email || formatUserName(selected.entregado_por)}</p>
                            <p className="text-xs text-slate-500 mt-3">Hs. de la unidad</p>
                            <p className="text-base font-bold text-slate-800">{(selected.resumen || '').match(/Hs:\s*([^|]+)/)?.[1]?.trim() || '—'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                            <p className="text-xs text-slate-500">Datos del vehículo</p>
                            <p className="text-base font-bold text-slate-800">{(selected.resumen || '').match(/Vehículo:\s*([^|]+)/)?.[1]?.trim() || selected.resumen || '—'}</p>
                        </div>
                    </div>

                    {selected.novedades?.checklist && Array.isArray(selected.novedades.checklist) && (
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            {selected.novedades.checklist.map((sec: any, idx: number) => (
                                <div key={idx} className="border-b border-slate-200 last:border-b-0">
                                    <div className="bg-slate-900 text-white px-4 py-2 text-sm font-bold">
                                        {sec.title || sec.titulo || 'Sección'}
                                    </div>
                                    <table className="w-full text-sm">
                                        <tbody>
                                            {(sec.items || []).map((it: any) => {
                                                const status = it.status || '';
                                                const bg = status.toLowerCase() === 'malo' || status.toLowerCase() === 'falta' ? 'bg-rose-50' : '';
                                                return (
                                                    <tr key={it.id} className={`border-b border-slate-200 last:border-b-0 ${bg}`}>
                                                        <td className="px-4 py-2 font-semibold text-slate-800">{it.item}</td>
                                                        <td className="px-4 py-2 text-slate-700 w-40">{status}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ShiftChange;
