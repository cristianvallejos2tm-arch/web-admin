import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { createWorkOrder, fetchUsuariosLite, fetchWorkOrders, updateWorkOrder } from '../../services/supabase';
import type { VehicleSummary } from './VehiclesList';

interface VehicleWorkOrderProps {
    vehicle: VehicleSummary;
    onBack: () => void;
}

const ESTADOS = ['abierta', 'en_progreso', 'pausada', 'confirmada', 'cerrada', 'cancelada', 'vencido'];
const PRIORIDADES = ['alta', 'media', 'baja', 'critica'];

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : '-');

const estadoLabel = (estado?: string) => {
    if (!estado) return 'Pendiente';
    if (estado === 'en_progreso') return 'En proceso';
    if (estado === 'cerrada') return 'Finalizada';
    if (estado === 'cancelada') return 'Cancelada';
    return estado.replace('_', ' ');
};

const VehicleWorkOrder: React.FC<VehicleWorkOrderProps> = ({ vehicle, onBack }) => {
    const [orders, setOrders] = useState<any[]>([]);
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        tipo: '',
        prioridad: 'media',
        estado: 'abierta',
        responsableId: '',
        fechaInicio: '',
        fechaFin: '',
        trabajo: '',
    });

    const loadData = async (nextPage = page, nextLimit = rowsPerPage) => {
        setLoading(true);
        const [{ data: dataOrders, count, error }, { data: users }] = await Promise.all([
            fetchWorkOrders({
                page: nextPage,
                limit: nextLimit,
                estados: ESTADOS,
                vehiculoId: vehicle.id,
            }),
            fetchUsuariosLite(),
        ]);
        setLoading(false);
        if (error) {
            console.error('Error cargando ordenes del vehiculo', error);
            setErrorMsg('No se pudieron cargar las ordenes de trabajo del vehiculo.');
            return;
        }
        setOrders(dataOrders || []);
        setTotalCount(count ?? 0);
        setUsuarios(users || []);
        setErrorMsg(null);
    };

    useEffect(() => {
        loadData(1, rowsPerPage);
        setPage(1);
    }, [vehicle.id]);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return orders;
        return orders.filter((o) =>
            `${o.numero || ''} ${o.titulo || ''} ${o.descripcion || ''} ${o.estado || ''} ${vehicle.internalNumber || ''} ${vehicle.base || ''}`.toLowerCase().includes(term),
        );
    }, [orders, search, vehicle.base, vehicle.internalNumber]);

    const totalPages = Math.max(1, Math.ceil(totalCount / rowsPerPage));

    const responsableLabel = (id?: string | null) => {
        if (!id) return '-';
        const user = usuarios.find((u) => u.id === id);
        return user?.nombre || user?.email || id;
    };

    const handlePageChange = (nextPage: number) => {
        const safePage = Math.max(1, Math.min(totalPages, nextPage));
        setPage(safePage);
        loadData(safePage, rowsPerPage);
    };

    const handleRowsChange = (nextLimit: number) => {
        setRowsPerPage(nextLimit);
        setPage(1);
        loadData(1, nextLimit);
    };

    const handleInlineUpdate = async (id: string, payload: { estado?: string; prioridad?: string }) => {
        setUpdatingId(id);
        const { error } = await updateWorkOrder(id, payload);
        setUpdatingId(null);
        if (error) {
            console.error('Error actualizando OT desde vista vehiculo', error);
            setErrorMsg('No se pudo actualizar la OT.');
            return;
        }
        setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, ...payload } : order)));
        setErrorMsg(null);
    };

    const handleCreate = async () => {
        if (!form.tipo || !form.trabajo.trim()) {
            alert('Completa tipo y trabajo a realizar.');
            return;
        }
        setSaving(true);
        const { error } = await createWorkOrder({
            numero: null,
            titulo: form.tipo,
            descripcion: form.trabajo.trim(),
            estado: form.estado,
            prioridad: form.prioridad,
            vehiculo_id: vehicle.id,
            responsable_id: form.responsableId || null,
            fecha_inicio: form.fechaInicio ? `${form.fechaInicio}T00:00:00` : null,
            fecha_fin: form.fechaFin ? `${form.fechaFin}T00:00:00` : null,
        });
        setSaving(false);
        if (error) {
            console.error('Error creando OT desde vehiculo', error);
            alert('No se pudo crear la orden de trabajo.');
            return;
        }
        setForm({
            tipo: '',
            prioridad: 'media',
            estado: 'abierta',
            responsableId: '',
            fechaInicio: '',
            fechaFin: '',
            trabajo: '',
        });
        await loadData(1, rowsPerPage);
        setPage(1);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-slate-500" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Ordenes de Trabajo por Vehiculo</h1>
                        <p className="text-sm text-slate-500">
                            Int. {vehicle.internalNumber || '-'} | Dominio: {vehicle.dominio || '-'} | Base: {vehicle.base || '-'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Tipo</label>
                        <select
                            value={form.tipo}
                            onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value }))}
                            className="w-full h-10 px-3 border border-slate-200 rounded-md text-sm"
                        >
                            <option value="">Seleccionar</option>
                            <option value="Correctivo">Correctivo</option>
                            <option value="Preventivo">Preventivo</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Prioridad</label>
                        <select
                            value={form.prioridad}
                            onChange={(e) => setForm((prev) => ({ ...prev, prioridad: e.target.value }))}
                            className="w-full h-10 px-3 border border-slate-200 rounded-md text-sm"
                        >
                            <option value="alta">Alta</option>
                            <option value="media">Media</option>
                            <option value="baja">Baja</option>
                            <option value="critica">Critica</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Estado</label>
                        <select
                            value={form.estado}
                            onChange={(e) => setForm((prev) => ({ ...prev, estado: e.target.value }))}
                            className="w-full h-10 px-3 border border-slate-200 rounded-md text-sm"
                        >
                            {ESTADOS.map((estado) => (
                                <option key={estado} value={estado}>
                                    {estadoLabel(estado)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Responsable</label>
                        <select
                            value={form.responsableId}
                            onChange={(e) => setForm((prev) => ({ ...prev, responsableId: e.target.value }))}
                            className="w-full h-10 px-3 border border-slate-200 rounded-md text-sm"
                        >
                            <option value="">Sin asignar</option>
                            {usuarios.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.nombre || u.email}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Fecha inicio</label>
                        <input
                            type="date"
                            value={form.fechaInicio}
                            onChange={(e) => setForm((prev) => ({ ...prev, fechaInicio: e.target.value }))}
                            className="w-full h-10 px-3 border border-slate-200 rounded-md text-sm"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Fecha fin</label>
                        <input
                            type="date"
                            value={form.fechaFin}
                            onChange={(e) => setForm((prev) => ({ ...prev, fechaFin: e.target.value }))}
                            className="w-full h-10 px-3 border border-slate-200 rounded-md text-sm"
                        />
                    </div>
                </div>

                <div className="space-y-1 mb-4">
                    <label className="text-xs font-bold text-slate-700">Trabajo a realizar</label>
                    <textarea
                        value={form.trabajo}
                        onChange={(e) => setForm((prev) => ({ ...prev, trabajo: e.target.value }))}
                        className="w-full h-24 p-3 border border-slate-200 rounded-md text-sm resize-none"
                        placeholder="Detalle del trabajo"
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleCreate}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-60"
                    >
                        {saving ? 'Guardando...' : 'Cargar Orden de Trabajo'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Listado de trabajos</h2>
                    <div className="flex items-center gap-3">
                        <label className="text-sm text-slate-600">Mostrar</label>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => handleRowsChange(Number(e.target.value))}
                            className="px-2 py-1 border border-slate-300 rounded text-sm"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar..."
                            className="px-3 py-1 border border-slate-300 rounded text-sm"
                        />
                    </div>
                </div>

                {errorMsg && (
                    <div className="mb-4 text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 text-sm">{errorMsg}</div>
                )}

                {loading ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Loader2 size={16} className="animate-spin" />
                        Cargando ordenes...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-sm text-slate-500">No hay ordenes para este vehiculo.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase"># OT</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Creado</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Int.</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Base</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Tipo</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Prioridad</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Estado</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Responsable</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Trabajo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-2">{order.numero || '-'}</td>
                                        <td className="px-4 py-2">{formatDate(order.created_at)}</td>
                                        <td className="px-4 py-2">{vehicle.internalNumber || '-'}</td>
                                        <td className="px-4 py-2">{vehicle.base || '-'}</td>
                                        <td className="px-4 py-2">{order.titulo || '-'}</td>
                                        <td className="px-4 py-2">
                                            <select
                                                value={order.prioridad || 'media'}
                                                onChange={(e) => handleInlineUpdate(order.id, { prioridad: e.target.value })}
                                                disabled={updatingId === order.id}
                                                className="w-full min-w-[110px] border border-slate-200 rounded px-2 py-1 text-xs bg-white"
                                            >
                                                {PRIORIDADES.map((prioridad) => (
                                                    <option key={prioridad} value={prioridad}>
                                                        {prioridad}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-2">
                                            <select
                                                value={order.estado || 'abierta'}
                                                onChange={(e) => handleInlineUpdate(order.id, { estado: e.target.value })}
                                                disabled={updatingId === order.id}
                                                className="w-full min-w-[130px] border border-slate-200 rounded px-2 py-1 text-xs bg-white"
                                            >
                                                {ESTADOS.map((estado) => (
                                                    <option key={estado} value={estado}>
                                                        {estadoLabel(estado)}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-2">{responsableLabel(order.responsable_id)}</td>
                                        <td className="px-4 py-2">{order.descripcion || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs text-slate-500">
                    <span>
                        Pagina {page} de {totalPages} ({totalCount} registros)
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page <= 1}
                            className="px-3 py-1 border rounded"
                        >
                            Anterior
                        </button>
                        {[...Array(totalPages).keys()].map((i) => (
                            <button
                                key={i}
                                onClick={() => handlePageChange(i + 1)}
                                className={`px-3 py-1 border rounded ${page === i + 1 ? 'bg-slate-900 text-white' : 'border-slate-200 text-slate-600'}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page >= totalPages}
                            className="px-3 py-1 border rounded"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VehicleWorkOrder;
