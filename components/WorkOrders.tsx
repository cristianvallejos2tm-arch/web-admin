import React, { useEffect, useMemo, useState } from "react";
import { Plus, ArrowRight, BarChart2, Loader2, Eye, X } from "lucide-react";
import WorkOrderForm from "./WorkOrderForm";
import WorkOrderStats from "./WorkOrderStats";
import { fetchWorkOrders, fetchVehiculos, fetchUsuariosLite, updateWorkOrder } from "../services/supabase";

const WorkOrders: React.FC = () => {
    const [view, setView] = useState<'list' | 'new' | 'finalized' | 'stats'>('list');
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [selected, setSelected] = useState<any | null>(null);
    const [vehiculos, setVehiculos] = useState<any[]>([]);
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const loadOrders = async () => {
        setLoading(true);
        const { data, error } = await fetchWorkOrders();
        setLoading(false);
        if (error) {
            console.error('Error cargando OTs', error);
            setErrorMsg('No se pudieron cargar las �rdenes. Revisa pol�ticas de lectura/actualizaci�n en "ordenes_trabajo".');
            return;
        }
        setErrorMsg(null);
        setOrders(data || []);
    };

    const loadCatalogs = async () => {
        const [{ data: vehs }, { data: users }] = await Promise.all([fetchVehiculos(), fetchUsuariosLite()]);
        setVehiculos(vehs || []);
        setUsuarios(users || []);
    };

    useEffect(() => {
        loadOrders();
        loadCatalogs();
    }, []);

    const filtered = useMemo(() => {
        const term = search.toLowerCase();
        return orders.filter((o) => {
            if (!term) return true;
            return (
                (o.numero || '').toLowerCase().includes(term) ||
                (o.titulo || '').toLowerCase().includes(term) ||
                (o.descripcion || '').toLowerCase().includes(term)
            );
        });
    }, [orders, search]);

    const pendientes = filtered.filter((o) => o.estado !== 'cerrada' && o.estado !== 'cancelada');
    const finalizadas = filtered.filter((o) => o.estado === 'cerrada' || o.estado === 'cancelada');

    const vehiculoLabel = (id?: string | null) => {
        if (!id) return '�';
        const v = vehiculos.find((x) => x.id === id);
        if (!v) return id;
        return `${v.patente || ''} ${v.marca ? `- ${v.marca}` : ''} ${v.modelo ? `(${v.modelo})` : ''}`.trim();
    };

    const usuarioLabel = (id?: string | null) => {
        if (!id) return '�';
        const u = usuarios.find((x) => x.id === id);
        if (!u) return id;
        return u.nombre || u.email || id;
    };

    const handleStatusChange = async (id: string, estado: string) => {
        setUpdatingId(id);
        const { error } = await updateWorkOrder(id, { estado });
        setUpdatingId(null);
        if (error) {
            console.error('Error actualizando estado OT', error);
            setErrorMsg('No se pudo actualizar el estado. Revisa pol�ticas de actualizaci�n en "ordenes_trabajo".');
            return;
        }
        loadOrders();
        if (selected && selected.id === id) {
            setSelected({ ...selected, estado });
        }
    };

    const StatusSelect = ({ order }: { order: any }) => (
        <select
            value={order.estado || 'abierta'}
            onChange={(e) => handleStatusChange(order.id, e.target.value)}
            disabled={updatingId === order.id}
            className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
        >
            <option value="abierta">Pendiente</option>
            <option value="en_progreso">En Proceso</option>
            <option value="pausada">Pausada</option>
            <option value="confirmada">Confirmada</option>
            <option value="cerrada">Finalizada</option>
            <option value="cancelada">Cancelada</option>
        </select>
    );

    if (view === 'new') {
        return <WorkOrderForm onBack={() => { setView('list'); loadOrders(); }} />;
    }

    if (view === 'stats') {
        return <WorkOrderStats onBack={() => setView('list')} orders={orders} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Orden de trabajo</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setView('new')}
                        className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                    >
                        <Plus size={16} />
                        Agregar Nueva
                    </button>
                    <button
                        onClick={() => setView('finalized')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                        <ArrowRight size={16} />
                        Ver finalizadas
                    </button>
                    <button
                        onClick={() => setView('stats')}
                        className="flex items-center gap-2 px-3 py-2 border rounded text-slate-700 hover:bg-slate-50"
                    >
                        <BarChart2 size={14} />
                        Estadisticas
                    </button>
                </div>
            </div>

            {view === 'finalized' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-700 uppercase tracking-wide">LISTADO FINALIZADOS</h2>
                        <button
                            onClick={() => setView('list')}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-400 text-white rounded-lg hover:bg-amber-500 transition-colors text-sm font-bold"
                        >
                            <ArrowRight size={16} />
                            Ver pendientes
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider"># OT</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Inicio</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Prior.</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Motivo</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Responsable</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Detalle</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {finalizadas.map((f: any, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="px-6 py-3 whitespace-nowrap text-xs text-slate-500">{f.numero || ''}</td>
                                        <td className="px-6 py-3 whitespace-nowrap text-xs text-slate-500">{f.fecha_inicio ? new Date(f.fecha_inicio).toLocaleDateString() : '�'}</td>
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <span className="px-2 py-0.5 text-xs font-bold rounded text-slate-800 bg-amber-400">
                                                {(f.prioridad || '').charAt(0).toUpperCase() + (f.prioridad || '').slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-xs text-slate-500 font-medium">{f.titulo || '�'}</td>
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <StatusSelect order={f} />
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-xs text-slate-500">{f.descripcion || ''}</td>
                                        <td className="px-6 py-3 whitespace-nowrap text-xs text-slate-500">{usuarioLabel(f.responsable_id)}</td>
                                        <td className="px-6 py-3 whitespace-nowrap text-right text-sm">
                                            <button
                                                onClick={() => setSelected(f)}
                                                className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-xs justify-end"
                                            >
                                                <Eye size={14} /> Ver
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">LISTADO PENDIENTES</h3>
                        <div className="flex items-center justify-between mb-4">
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
                                <input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-3 pr-3 py-2 border rounded" />
                                <button className="px-3 py-2 bg-cyan-500 text-white rounded">Excel</button>
                                <button className="px-3 py-2 bg-cyan-400 text-white rounded">Pdf</button>
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 mb-3 text-sm">{errorMsg}</div>
                        )}
                        {loading ? (
                            <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="animate-spin" size={16} /> Cargando...</div>
                        ) : pendientes.length === 0 ? (
                            <div className="text-slate-500">No hay items para listar</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase"># OT</th>
                                            <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Inicio</th>
                                            <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Prioridad</th>
                                            <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Estado</th>
                                            <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Tipo</th>
                                            <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Observaciones</th>
                                            <th className="px-4 py-2 text-right text-xs font-bold text-slate-600 uppercase">Detalle</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {pendientes.slice(0, rowsPerPage).map((t) => (
                                            <tr key={t.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-2 text-slate-900">{t.numero || '�'}</td>
                                                <td className="px-4 py-2 text-slate-700 text-xs">
                                                    {t.fecha_inicio ? new Date(t.fecha_inicio).toLocaleDateString() : '�'}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className="px-2 py-1 text-xs font-semibold rounded text-white bg-red-500">
                                                        {(t.prioridad || '').charAt(0).toUpperCase() + (t.prioridad || '').slice(1) || '�'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-slate-700 uppercase text-xs">
                                                    <StatusSelect order={t} />
                                                </td>
                                                <td className="px-4 py-2 text-slate-700 text-xs">{t.titulo || '�'}</td>
                                                <td className="px-4 py-2 text-slate-700 text-xs">{t.descripcion || '�'}</td>
                                                <td className="px-4 py-2 text-right">
                                                    <button
                                                        onClick={() => setSelected(t)}
                                                        className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-xs justify-end"
                                                    >
                                                        <Eye size={14} /> Ver
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                </>
            )}

            {selected && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 relative">
                        <button
                            onClick={() => setSelected(null)}
                            className="absolute top-3 right-3 text-slate-400 hover:text-slate-700"
                        >
                            <X size={18} />
                        </button>
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Eye size={18} className="text-slate-500" /> Detalle OT
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
                            <div><span className="font-semibold"># OT:</span> {selected.numero || '�'}</div>
                            <div><span className="font-semibold">Prioridad:</span> {(selected.prioridad || '').charAt(0).toUpperCase() + (selected.prioridad || '').slice(1) || '�'}</div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">Estado:</span>
                                <StatusSelect order={selected} />
                            </div>
                            <div><span className="font-semibold">Tipo:</span> {selected.titulo || '�'}</div>
                            <div><span className="font-semibold">Inicio:</span> {selected.fecha_inicio ? new Date(selected.fecha_inicio).toLocaleString() : '�'}</div>
                            <div><span className="font-semibold">Fin:</span> {selected.fecha_fin ? new Date(selected.fecha_fin).toLocaleString() : '�'}</div>
                            <div className="md:col-span-2"><span className="font-semibold">Observaciones:</span> {selected.descripcion || '�'}</div>
                            <div><span className="font-semibold">Vehiculo:</span> {vehiculoLabel(selected.vehiculo_id)}</div>
                            <div><span className="font-semibold">Responsable:</span> {usuarioLabel(selected.responsable_id)}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkOrders;
