import React, { useEffect, useState } from 'react';
import { Plus, Eye, X } from 'lucide-react';
import TaskForm from './TaskForm';
import { fetchTasks, updateTask, fetchVehiculos, fetchUsuariosLite } from '../services/supabase';

const Tasks: React.FC = () => {
    const [view, setView] = useState<'list' | 'new'>('list');
    const [pending, setPending] = useState<any[]>([]);
    const [completed, setCompleted] = useState<any[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [selectedTask, setSelectedTask] = useState<any | null>(null);
    const [vehiculos, setVehiculos] = useState<any[]>([]);
    const [usuarios, setUsuarios] = useState<any[]>([]);

    const loadTasks = async () => {
        const { data, error } = await fetchTasks();
        if (error) {
            console.error('Error cargando tareas', error);
            setErrorMsg('No se pudieron cargar las tareas. Revisa politicas de lectura en "tareas".');
            return;
        }
        setErrorMsg(null);
        const tasks = data || [];
        const pend = tasks.filter((t) => t.estado !== 'completada' && t.estado !== 'cancelada');
        const done = tasks.filter((t) => t.estado === 'completada' || t.estado === 'cancelada');
        setPending(pend);
        setCompleted(done);
    };

    const loadCatalogs = async () => {
        const [{ data: vehs }, { data: users }] = await Promise.all([fetchVehiculos(), fetchUsuariosLite()]);
        setVehiculos(vehs || []);
        setUsuarios(users || []);
    };

    const handleStatusChange = async (id: string, estado: string) => {
        setUpdatingId(id);
        const { error } = await updateTask(id, { estado });
        setUpdatingId(null);
        if (error) {
            console.error('Error actualizando estado', error);
            setErrorMsg('No se pudo actualizar el estado. Revisa politicas de actualizacion en "tareas".');
            return;
        }
        loadTasks();
        if (selectedTask && selectedTask.id === id) {
            setSelectedTask({ ...selectedTask, estado });
        }
    };

    useEffect(() => {
        loadTasks();
        loadCatalogs();
    }, []);

    const StatusSelect = ({ task }: { task: any }) => (
        <select
            value={task.estado || 'pendiente'}
            onChange={(e) => handleStatusChange(task.id, e.target.value)}
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

    const vehiculoLabel = (id?: string | null) => {
        if (!id) return '—';
        const v = vehiculos.find((x) => x.id === id);
        if (!v) return id;
        return `${v.patente || ''} ${v.marca ? `- ${v.marca}` : ''} ${v.modelo ? `(${v.modelo})` : ''}`.trim();
    };

    const usuarioLabel = (id?: string | null) => {
        if (!id) return '—';
        const u = usuarios.find((x) => x.id === id);
        if (!u) return id;
        return u.nombre || u.email || id;
    };

    if (view === 'new') {
        return <TaskForm onBack={() => setView('list')} onSaved={() => { setView('list'); loadTasks(); }} />;
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
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Vence</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Observaciones</th>
                                    <th className="px-4 py-2 text-right text-xs font-bold text-slate-600 uppercase">Detalle</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pending.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-2 text-slate-900">{t.titulo}</td>
                                        <td className="px-4 py-2">
                                            <span className="px-2 py-1 text-xs font-semibold rounded text-white bg-red-500">
                                                {(t.prioridad || '').charAt(0).toUpperCase() + (t.prioridad || '').slice(1) || '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-slate-700 uppercase text-xs">
                                            <StatusSelect task={t} />
                                        </td>
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Prioridad</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Observaciones</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {completed.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No hay tareas finalizadas</td>
                                </tr>
                            ) : (
                                completed.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-900">
                                            {t.fecha_vencimiento ? new Date(t.fecha_vencimiento).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                {t.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-semibold rounded text-white bg-red-500">
                                                {(t.prioridad || '').charAt(0).toUpperCase() + (t.prioridad || '').slice(1) || '—'}
                                            </span>
                                        </td>
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
                            <div><span className="font-semibold">Prioridad:</span> {(selectedTask.prioridad || '').charAt(0).toUpperCase() + (selectedTask.prioridad || '').slice(1) || '—'}</div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">Estado:</span>
                                <StatusSelect task={selectedTask} />
                            </div>
                            <div><span className="font-semibold">Vence:</span> {selectedTask.fecha_vencimiento ? new Date(selectedTask.fecha_vencimiento).toLocaleDateString() : '—'}</div>
                            <div className="md:col-span-2"><span className="font-semibold">Observaciones:</span> {selectedTask.descripcion || '—'}</div>
                            <div><span className="font-semibold">Vehiculo:</span> {vehiculoLabel(selectedTask.vehiculo_id)}</div>
                            <div><span className="font-semibold">Responsable:</span> {usuarioLabel(selectedTask.asignado_a)}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasks;
