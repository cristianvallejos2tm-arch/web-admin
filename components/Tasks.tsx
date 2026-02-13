import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Eye, X } from 'lucide-react';
import TaskForm from './TaskForm';
import { fetchTasks, updateTask, fetchVehiculos, fetchUsuariosLite, fetchWorkOrdersLite } from '../services/supabase';

const STATUS_PRIORITY: Record<string, number> = {
    pendiente: 1,
    en_proceso: 2,
    bloqueada: 3,
    completada: 4,
    cancelada: 5,
};

const PRIORITY_CLASS: Record<string, string> = {
    critica: 'bg-rose-600 text-white',
    alta: 'bg-red-500 text-white',
    media: 'bg-amber-500 text-white',
    baja: 'bg-slate-400 text-white',
};

const STATUS_BADGE_CLASS: Record<string, string> = {
    pendiente: 'bg-amber-100 text-amber-800',
    en_proceso: 'bg-blue-100 text-blue-800',
    bloqueada: 'bg-orange-100 text-orange-800',
    completada: 'bg-emerald-100 text-emerald-800',
    cancelada: 'bg-rose-100 text-rose-800',
};

const STATUS_LABEL: Record<string, string> = {
    pendiente: 'Pendiente',
    en_proceso: 'En proceso',
    bloqueada: 'Bloqueada',
    completada: 'Completada',
    cancelada: 'Cancelada',
};

const normalizeStatus = (value?: string | null) => {
    const s = String(value || '').trim().toLowerCase();
    if (s === 'en proceso') return 'en_proceso';
    if (s === 'completa' || s === 'finalizada') return 'completada';
    if (s === 'cancelada') return 'cancelada';
    if (s === 'bloqueada') return 'bloqueada';
    if (s === 'en_proceso') return 'en_proceso';
    return 'pendiente';
};

const formatDate = (value?: string | null) => {
    if (!value) return '—';
    return new Date(value).toLocaleString();
};

const getTaskCompletionDate = (task: any) => task.completed_at || task.updated_at || task.fecha_vencimiento || null;

const Tasks: React.FC = () => {
    const [view, setView] = useState<'list' | 'new'>('list');
    const [pending, setPending] = useState<any[]>([]);
    const [completed, setCompleted] = useState<any[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [selectedTask, setSelectedTask] = useState<any | null>(null);
    const [vehiculos, setVehiculos] = useState<any[]>([]);
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [workOrders, setWorkOrders] = useState<any[]>([]);

    const openWorkOrders = useMemo(
        () => workOrders.filter((ot) => ot.estado !== 'cerrada' && ot.estado !== 'cancelada'),
        [workOrders],
    );

    const loadTasks = async () => {
        const { data, error } = await fetchTasks();
        if (error) {
            console.error('Error cargando tareas', error);
            setErrorMsg('No se pudieron cargar las tareas. Revisa politicas de lectura en "tareas".');
            return;
        }
        setErrorMsg(null);
        const tasks = (data || []).map((t: any) => ({ ...t, estado: normalizeStatus(t.estado) }));
        const pend = tasks
            .filter((t: any) => t.estado !== 'completada' && t.estado !== 'cancelada')
            .sort((a: any, b: any) => (STATUS_PRIORITY[a.estado] || 99) - (STATUS_PRIORITY[b.estado] || 99));
        const done = tasks
            .filter((t: any) => t.estado === 'completada' || t.estado === 'cancelada')
            .sort((a: any, b: any) => {
                const da = new Date(getTaskCompletionDate(a) || 0).getTime();
                const db = new Date(getTaskCompletionDate(b) || 0).getTime();
                return db - da;
            });
        setPending(pend);
        setCompleted(done);
        if (selectedTask) {
            const fresh = tasks.find((t: any) => t.id === selectedTask.id);
            if (fresh) setSelectedTask(fresh);
        }
    };

    const loadCatalogs = async () => {
        const [{ data: vehs }, { data: users }, { data: ots }] = await Promise.all([
            fetchVehiculos(),
            fetchUsuariosLite(),
            fetchWorkOrdersLite(),
        ]);
        setVehiculos(vehs || []);
        setUsuarios(users || []);
        setWorkOrders(ots || []);
    };

    const handleTaskUpdate = async (id: string, payload: { estado?: string; prioridad?: string; asignado_a?: string | null; work_order_id?: string | null }) => {
        setUpdatingId(id);
        const { error } = await updateTask(id, payload);
        setUpdatingId(null);
        if (error) {
            console.error('Error actualizando tarea', error);
            setErrorMsg('No se pudo actualizar la tarea. Revisa politicas de actualizacion en "tareas".');
            return;
        }
        await Promise.all([loadTasks(), loadCatalogs()]);
    };

    useEffect(() => {
        loadTasks();
        loadCatalogs();
    }, []);

    const vehiculoLabel = (id?: string | null) => {
        if (!id) return '—';
        const v = vehiculos.find((x) => x.id === id);
        if (!v) return id;
        return `${v.patente || ''} ${v.num_int ? `| Int. ${v.num_int}` : ''}`.trim();
    };

    const usuarioLabel = (id?: string | null) => {
        if (!id) return '—';
        const u = usuarios.find((x) => x.id === id);
        if (!u) return id;
        return u.nombre || u.email || id;
    };

    const workOrderLabel = (id?: string | null) => {
        if (!id) return '—';
        const ot = workOrders.find((x) => x.id === id);
        if (!ot) return id;
        return `OT ${ot.numero || 's/n'} - ${ot.titulo || 'Sin titulo'}`;
    };

    const StatusSelect = ({ task }: { task: any }) => (
        <select
            value={task.estado || 'pendiente'}
            onChange={(e) => handleTaskUpdate(task.id, { estado: e.target.value })}
            disabled={updatingId === task.id}
            className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
        >
            <option value="pendiente">Pendiente</option>
            <option value="en_proceso">En proceso</option>
            <option value="bloqueada">Bloqueada</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
        </select>
    );

    const ResponsableSelect = ({ task }: { task: any }) => (
        <select
            value={task.asignado_a || ''}
            onChange={(e) => handleTaskUpdate(task.id, { asignado_a: e.target.value || null })}
            disabled={updatingId === task.id}
            className="text-xs border border-slate-200 rounded px-2 py-1 bg-white min-w-[140px]"
        >
            <option value="">Sin responsable</option>
            {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                    {u.nombre || u.email}
                </option>
            ))}
        </select>
    );

    const WorkOrderSelect = ({ task }: { task: any }) => (
        <select
            value={task.work_order_id || ''}
            onChange={(e) => {
                const workOrderId = e.target.value || null;
                const order = workOrders.find((ot) => ot.id === workOrderId);
                handleTaskUpdate(task.id, {
                    work_order_id: workOrderId,
                    asignado_a: order?.responsable_id || task.asignado_a || null,
                });
            }}
            disabled={updatingId === task.id}
            className="text-xs border border-slate-200 rounded px-2 py-1 bg-white min-w-[170px]"
        >
            <option value="">Sin OT</option>
            {openWorkOrders.map((ot) => (
                <option key={ot.id} value={ot.id}>
                    OT {ot.numero || 's/n'} - {ot.titulo || 'Sin titulo'}
                </option>
            ))}
        </select>
    );

    const renderPriorityBadge = (prioridad?: string) => {
        const key = String(prioridad || 'media').toLowerCase();
        const label = key.charAt(0).toUpperCase() + key.slice(1);
        const badgeClass = PRIORITY_CLASS[key] || PRIORITY_CLASS.media;
        return <span className={`px-2 py-1 text-xs font-semibold rounded ${badgeClass}`}>{label}</span>;
    };

    const renderStatusBadge = (estado?: string) => {
        const statusKey = normalizeStatus(estado);
        const badgeClass = STATUS_BADGE_CLASS[statusKey] || STATUS_BADGE_CLASS.pendiente;
        return <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClass}`}>{STATUS_LABEL[statusKey] || statusKey}</span>;
    };

    if (view === 'new') {
        return <TaskForm onBack={() => setView('list')} onSaved={() => { setView('list'); loadTasks(); loadCatalogs(); }} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Tareas</h1>
                </div>
                <div>
                    <button
                        onClick={() => setView('new')}
                        className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                    >
                        <Plus size={16} />
                        Agregar Nueva
                    </button>
                </div>
            </div>

            {errorMsg && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                    {errorMsg}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">LISTADO DE TAREAS PENDIENTES</h3>
                {pending.length === 0 ? (
                    <div className="text-slate-500">No hay items para listar</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Titulo</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Prioridad</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Estado</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Responsable</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">OT</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Vence</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Observaciones</th>
                                    <th className="px-4 py-2 text-right text-xs font-bold text-slate-600 uppercase">Detalle</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pending.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-2 text-slate-900">{t.titulo}</td>
                                        <td className="px-4 py-2">{renderPriorityBadge(t.prioridad)}</td>
                                        <td className="px-4 py-2 text-slate-700 uppercase text-xs">
                                            <StatusSelect task={t} />
                                        </td>
                                        <td className="px-4 py-2"><ResponsableSelect task={t} /></td>
                                        <td className="px-4 py-2"><WorkOrderSelect task={t} /></td>
                                        <td className="px-4 py-2 text-slate-700 text-xs">
                                            {t.fecha_vencimiento ? new Date(t.fecha_vencimiento).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-4 py-2 text-slate-700 text-xs">{t.descripcion || '—'}</td>
                                        <td className="px-4 py-2 text-right">
                                            <button
                                                onClick={() => setSelectedTask(t)}
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
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">LISTADO DE TAREAS FINALIZADAS</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha cierre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Prioridad</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">OT</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Observaciones</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {completed.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No hay tareas finalizadas</td>
                                </tr>
                            ) : (
                                completed.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-900">{formatDate(getTaskCompletionDate(t))}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{renderStatusBadge(t.estado)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{renderPriorityBadge(t.prioridad)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-900 text-xs">{workOrderLabel(t.work_order_id)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-900 text-xs">{t.descripcion || '—'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button
                                                onClick={() => setSelectedTask(t)}
                                                className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-xs justify-end"
                                            >
                                                <Eye size={14} /> Ver
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedTask && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 relative">
                        <button
                            onClick={() => setSelectedTask(null)}
                            className="absolute top-3 right-3 text-slate-400 hover:text-slate-700"
                        >
                            <X size={18} />
                        </button>
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Eye size={18} className="text-slate-500" /> Detalle de tarea
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
                            <div><span className="font-semibold">Titulo:</span> {selectedTask.titulo || '—'}</div>
                            <div><span className="font-semibold">Prioridad:</span> {renderPriorityBadge(selectedTask.prioridad)}</div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">Estado:</span>
                                <StatusSelect task={selectedTask} />
                            </div>
                            <div><span className="font-semibold">Vence:</span> {selectedTask.fecha_vencimiento ? new Date(selectedTask.fecha_vencimiento).toLocaleDateString() : '—'}</div>
                            <div className="md:col-span-2"><span className="font-semibold">Observaciones:</span> {selectedTask.descripcion || '—'}</div>
                            <div><span className="font-semibold">Vehiculo:</span> {vehiculoLabel(selectedTask.vehiculo_id)}</div>
                            <div>
                                <span className="font-semibold">Responsable:</span>{' '}
                                <ResponsableSelect task={selectedTask} />
                            </div>
                            <div className="md:col-span-2">
                                <span className="font-semibold">Orden de trabajo:</span>{' '}
                                <WorkOrderSelect task={selectedTask} />
                            </div>
                            <div className="md:col-span-2 text-xs text-slate-500">
                                {selectedTask.work_order_id ? `Vinculada a ${workOrderLabel(selectedTask.work_order_id)}` : 'Sin OT vinculada'}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasks;
