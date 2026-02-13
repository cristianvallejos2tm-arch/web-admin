import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, LayoutGrid, Edit2, Wrench, Gauge, Truck } from 'lucide-react';
import { fetchVehicleMaintenanceExecutions, fetchWorkOrders, fetchUsuariosLite } from '../../services/supabase';

interface Vehicle {
    id: string;
    internalNumber: string;
    badge?: string;
    dominio: string;
    modelo: string;
    marca?: string;
    estado: string;
    km: number;
    anio: string;
    vin?: string;
    base: string;
    op: string;
    funcion: string;
    sector: string;
    horometro?: number;
    observaciones?: string;
}

interface VehicleDetailProps {
    vehicle: Vehicle;
    onBack: () => void;
    onEdit?: () => void;
    onWorkOrder?: () => void;
    onMaintenanceAssign?: () => void;
}

type TabKey = 'detalle' | 'ordenes' | 'historial' | 'detalleHistorial';

const statusLabel = (value?: string) => {
    const s = String(value || '').toLowerCase();
    if (s === 'pendiente' || s === 'abierta') return 'Pendiente';
    if (s === 'en_proceso') return 'En proceso';
    if (s === 'completada' || s === 'cerrada') return 'Finalizada';
    if (s === 'cancelada') return 'Cancelada';
    if (s === 'confirmada') return 'Confirmada';
    if (s === 'pausada') return 'Pausada';
    if (s === 'vencido') return 'Vencido';
    return value || 'Pendiente';
};

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString() : '-');
const formatDateOnly = (value?: string | null) => (value ? new Date(value).toLocaleDateString('es-AR') : '-');
const escapeHtml = (value: unknown) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const VehicleDetail: React.FC<VehicleDetailProps> = ({ vehicle, onBack, onEdit, onWorkOrder, onMaintenanceAssign }) => {
    const [activeTab, setActiveTab] = useState<TabKey>('detalle');
    const [orders, setOrders] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoadingOrders(true);
            const [{ data }, { data: users }] = await Promise.all([
                fetchWorkOrders({ page: 1, limit: 100, vehiculoId: vehicle.id }),
                fetchUsuariosLite(),
            ]);
            if (mounted) {
                setOrders(data || []);
                setUsuarios(users || []);
                setLoadingOrders(false);
            }
        };
        load();
        return () => {
            mounted = false;
        };
    }, [vehicle.id]);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoadingHistory(true);
            const { data } = await fetchVehicleMaintenanceExecutions(vehicle.id, 50);
            if (mounted) {
                setHistory(data || []);
                setLoadingHistory(false);
            }
        };
        load();
        return () => {
            mounted = false;
        };
    }, [vehicle.id]);

    const latestWorkOrder = useMemo(() => orders[0] || null, [orders]);
    const latestExecution = useMemo(() => history[0] || null, [history]);

    const responsableLabel = (responsableId?: string | null) => {
        if (!responsableId) return '-';
        const found = usuarios.find((u) => u.id === responsableId);
        return found?.nombre || found?.email || '-';
    };

    const statusBadgeClass = (estado?: string) => {
        const key = String(estado || '').toLowerCase();
        if (key === 'pendiente' || key === 'abierta') return 'bg-amber-400 text-white';
        if (key === 'en_proceso') return 'bg-blue-500 text-white';
        if (key === 'cerrada' || key === 'completada') return 'bg-emerald-500 text-white';
        if (key === 'cancelada') return 'bg-rose-500 text-white';
        return 'bg-slate-300 text-slate-700';
    };

    const handlePrintDetailHistorial = () => {
        const printWindow = window.open('', '_blank', 'width=1100,height=900');
        if (!printWindow) return;

        const blocksHtml = orders
            .map((order) => {
                const prioridad = String(order.prioridad || 'media');
                const prioridadLabel = prioridad.charAt(0).toUpperCase() + prioridad.slice(1);
                return `
                    <div class="card">
                        <h4>Datos del vehiculo</h4>
                        <div class="grid">
                            <div>
                                <p>Interno: <strong>${escapeHtml(vehicle.internalNumber || '-')}</strong></p>
                                <p>Km actual: <strong>${escapeHtml((vehicle.km || 0).toLocaleString('es-AR'))} Km</strong></p>
                            </div>
                            <div>
                                <p>Dominio: <strong>${escapeHtml(vehicle.dominio || '-')}</strong></p>
                                <p>Sector / Funcion: <strong>${escapeHtml(vehicle.sector || '-')} / ${escapeHtml(vehicle.funcion || '-')}</strong></p>
                            </div>
                            <div>
                                <p>Modelo: <strong>${escapeHtml(vehicle.modelo || '-')}</strong></p>
                            </div>
                        </div>
                        <hr class="dashed" />
                        <h4>Datos de la orden</h4>
                        <div class="grid">
                            <div>
                                <p>Nro. de Orden: <strong>#${escapeHtml(order.numero || '-')}</strong></p>
                                <p>Tipo de Orden: <strong>${escapeHtml(order.titulo || '-')}</strong></p>
                            </div>
                            <div>
                                <p>Generado: <strong>${escapeHtml(formatDateOnly(order.created_at))}</strong></p>
                                <p>Prio.: <span class="prio">${escapeHtml(prioridadLabel)}</span></p>
                            </div>
                            <div>
                                <p>Responsable: <strong>${escapeHtml(responsableLabel(order.responsable_id))}</strong></p>
                                <p>Estado: <span class="status">${escapeHtml(statusLabel(order.estado))}</span></p>
                            </div>
                        </div>
                        <div class="grid">
                            <div><p>Ingreso (fecha/hs/min): <strong>${escapeHtml(formatDate(order.fecha_inicio))}</strong></p></div>
                            <div><p>Salida (fecha/hs/min): <strong>${escapeHtml(formatDate(order.fecha_fin))}</strong></p></div>
                            <div><p>Km realizado: <strong>- Km</strong></p></div>
                        </div>
                        <div class="motivo">
                            <p><strong>Motivo</strong></p>
                            <p>${escapeHtml(order.descripcion || '-')}</p>
                        </div>
                        <hr class="dashed" />
                    </div>
                `;
            })
            .join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Detalle Historial OT</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 12px; color: #0f172a; }
                        h3 { color: #2563eb; margin: 0 0 10px 0; }
                        .card { background: #f1f5f9; border: 1px solid #d1d5db; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
                        .card h4 { margin: 0 0 10px 0; font-size: 20px; }
                        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 12px; }
                        .grid p { margin: 4px 0; font-size: 18px; }
                        .dashed { border: 0; border-top: 2px dashed #1f2937; margin: 12px 0; }
                        .prio { background: #e5e7eb; border-radius: 4px; padding: 2px 6px; font-size: 12px; }
                        .status { background: #f59e0b; color: #fff; border-radius: 4px; padding: 2px 6px; font-size: 12px; }
                        .motivo p { margin: 4px 0; font-size: 18px; white-space: pre-wrap; }
                    </style>
                </head>
                <body>
                    <h3>Detalle Historial de OT</h3>
                    ${blocksHtml || '<p>No hay ordenes para imprimir.</p>'}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                    <ArrowLeft size={24} />
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-1">Int. {vehicle.internalNumber}</h1>
                        <p className="text-slate-500 text-sm mb-1">{vehicle.modelo}</p>
                        <p className="text-slate-500 text-sm">
                            Dominio: <span className="font-semibold text-slate-700">{vehicle.dominio}</span> - {vehicle.funcion}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('detalle')}
                            className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                            title="Detalle"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={onEdit}
                            className="p-2 bg-white border border-slate-200 text-slate-500 rounded-md hover:bg-slate-50 transition-colors"
                            title="Editar"
                        >
                            <Edit2 size={18} />
                        </button>
                        <button
                            onClick={onMaintenanceAssign}
                            className="p-2 bg-white border border-slate-200 text-slate-500 rounded-md hover:bg-slate-50 transition-colors"
                            title="Asignar mantenimiento"
                        >
                            <Wrench size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-6 mt-8 border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('detalle')}
                        className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'detalle' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Detalle
                    </button>
                    <button
                        onClick={() => setActiveTab('ordenes')}
                        className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'ordenes' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Orden de trabajo
                    </button>
                    <button
                        onClick={() => setActiveTab('historial')}
                        className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'historial' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Historial
                    </button>
                    <button
                        onClick={() => setActiveTab('detalleHistorial')}
                        className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'detalleHistorial' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Detalle historial
                    </button>
                </div>
            </div>

            {activeTab === 'detalle' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="divide-y divide-slate-100">
                            <div className="flex justify-between py-4 px-6"><span className="text-slate-500 text-sm">Dominio:</span><span className="text-slate-900 font-medium text-sm">{vehicle.dominio || '-'}</span></div>
                            <div className="flex justify-between py-4 px-6"><span className="text-slate-500 text-sm">Interno:</span><span className="text-slate-900 font-medium text-sm">{vehicle.internalNumber || '-'}</span></div>
                            <div className="flex justify-between py-4 px-6"><span className="text-slate-500 text-sm">Modelo:</span><span className="text-slate-900 font-medium text-sm">{vehicle.modelo || '-'}</span></div>
                            <div className="flex justify-between py-4 px-6"><span className="text-slate-500 text-sm">Marca:</span><span className="text-slate-900 font-medium text-sm">{vehicle.marca || '-'}</span></div>
                            <div className="flex justify-between py-4 px-6"><span className="text-slate-500 text-sm">Ano:</span><span className="text-slate-900 font-medium text-sm">{vehicle.anio || '-'}</span></div>
                            <div className="flex justify-between py-4 px-6"><span className="text-slate-500 text-sm">Chasis:</span><span className="text-slate-900 font-medium text-sm">{vehicle.vin || '-'}</span></div>
                            <div className="flex justify-between py-4 px-6"><span className="text-slate-500 text-sm">Funcion:</span><span className="text-slate-900 font-medium text-sm">{vehicle.funcion || '-'}</span></div>
                            <div className="flex justify-between py-4 px-6"><span className="text-slate-500 text-sm">Sector:</span><span className="text-slate-900 font-medium text-sm">{vehicle.sector || '-'}</span></div>
                            <div className="flex justify-between py-4 px-6"><span className="text-slate-500 text-sm">Base:</span><span className="text-slate-900 font-medium text-sm">{vehicle.base || '-'}</span></div>
                            <div className="flex justify-between py-4 px-6"><span className="text-slate-500 text-sm">Operadora:</span><span className="text-slate-900 font-medium text-sm">{vehicle.op || '-'}</span></div>
                            <div className="flex justify-between py-4 px-6"><span className="text-slate-500 text-sm">Observaciones:</span><span className="text-slate-900 font-medium text-sm">{vehicle.observaciones || '-'}</span></div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800 flex items-baseline gap-2">
                                    {(vehicle.km || 0).toLocaleString('es-AR')} <span className="text-base font-normal text-slate-500">Km</span>
                                    <span className="text-slate-300">/</span>
                                    {(vehicle.horometro || 0).toLocaleString('es-AR')} <span className="text-base font-normal text-slate-500">hs</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">Km / Hs actuales</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                <Gauge size={20} />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">{latestWorkOrder?.titulo || '-'}</h3>
                                <p className="text-xs text-slate-500 mt-1">Ultima OT: {formatDate(latestWorkOrder?.created_at)}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <Truck size={20} />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">{latestExecution?.maintenance_plans?.nombre || '-'}</h3>
                                <p className="text-xs text-slate-500 mt-1">Ultimo mantenimiento: {formatDate(latestExecution?.created_at)}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <Wrench size={20} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'ordenes' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-700 uppercase">Ordenes del vehiculo</h3>
                        <button onClick={onWorkOrder} className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">Gestionar OTs</button>
                    </div>
                    {loadingOrders ? (
                        <div className="text-sm text-slate-500">Cargando ordenes...</div>
                    ) : orders.length === 0 ? (
                        <div className="text-sm text-slate-500">No hay ordenes registradas para este vehiculo.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase"># OT</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Tipo</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Estado</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Creado</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Detalle</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {orders.map((order) => (
                                        <tr key={order.id}>
                                            <td className="px-4 py-2">{order.numero || '-'}</td>
                                            <td className="px-4 py-2">{order.titulo || '-'}</td>
                                            <td className="px-4 py-2">{statusLabel(order.estado)}</td>
                                            <td className="px-4 py-2">{formatDate(order.created_at)}</td>
                                            <td className="px-4 py-2">{order.descripcion || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'historial' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-sm font-bold text-slate-700 uppercase mb-4">Historial de mantenimiento</h3>
                    {loadingHistory ? (
                        <div className="text-sm text-slate-500">Cargando historial...</div>
                    ) : history.length === 0 ? (
                        <div className="text-sm text-slate-500">No hay ejecuciones de mantenimiento para este vehiculo.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Plan</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Tipo</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Estado</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Vencimiento</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Creado</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Cerrado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {history.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-4 py-2">{item.maintenance_plans?.nombre || '-'}</td>
                                            <td className="px-4 py-2">{item.maintenance_plans?.tipo || '-'}</td>
                                            <td className="px-4 py-2">{statusLabel(item.status)}</td>
                                            <td className="px-4 py-2">{formatDate(item.due_at)}</td>
                                            <td className="px-4 py-2">{formatDate(item.created_at)}</td>
                                            <td className="px-4 py-2">{formatDate(item.closed_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'detalleHistorial' && (
                <div className="space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-blue-600">Detalle Historial de OT</h3>
                            <button
                                onClick={handlePrintDetailHistorial}
                                className="px-3 py-1.5 bg-slate-700 text-white rounded text-sm hover:bg-slate-800"
                            >
                                Imprimir
                            </button>
                        </div>
                    </div>

                    {loadingOrders ? (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 text-sm text-slate-500">Cargando ordenes...</div>
                    ) : orders.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 text-sm text-slate-500">No hay ordenes para desglosar en este vehiculo.</div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map((order) => (
                                <div key={order.id} className="rounded-lg border border-slate-200 bg-slate-100 p-4 space-y-4">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 mb-2">Datos del vehículo</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                            <div>
                                                <p className="text-slate-700">Interno: <span className="font-bold text-slate-900">{vehicle.internalNumber || '-'}</span></p>
                                                <p className="text-slate-700 mt-1">Km actual: <span className="font-bold text-slate-900">{(vehicle.km || 0).toLocaleString('es-AR')} Km</span></p>
                                            </div>
                                            <div>
                                                <p className="text-slate-700">Dominio: <span className="font-bold text-slate-900">{vehicle.dominio || '-'}</span></p>
                                                <p className="text-slate-700 mt-1">Sector / Función: <span className="font-bold text-slate-900">{vehicle.sector || '-'} / {vehicle.funcion || '-'}</span></p>
                                            </div>
                                            <div>
                                                <p className="text-slate-700">Modelo: <span className="font-bold text-slate-900">{vehicle.modelo || '-'}</span></p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-dashed border-slate-500" />

                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 mb-2">Datos de la orden</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                            <div>
                                                <p className="text-slate-700">Nro. de Orden: <span className="font-bold text-slate-900">#{order.numero || '-'}</span></p>
                                                <p className="text-slate-700 mt-1">Tipo de Orden: <span className="font-bold text-slate-900">{order.titulo || '-'}</span></p>
                                            </div>
                                            <div>
                                                <p className="text-slate-700">Generado: <span className="font-bold text-slate-900">{formatDateOnly(order.created_at)}</span></p>
                                                <p className="text-slate-700 mt-1">
                                                    Prio.:{' '}
                                                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs font-medium rounded">
                                                        {String(order.prioridad || 'media').charAt(0).toUpperCase() + String(order.prioridad || 'media').slice(1)}
                                                    </span>
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-slate-700">Responsable: <span className="font-bold text-slate-900">{responsableLabel(order.responsable_id)}</span></p>
                                                <p className="text-slate-700 mt-1">
                                                    Estado:{' '}
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusBadgeClass(order.estado)}`}>
                                                        {statusLabel(order.estado)}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                        <div>
                                            <p className="text-slate-700">Ingreso (fecha/hs/min): <span className="font-bold text-slate-900">{formatDate(order.fecha_inicio)}</span></p>
                                        </div>
                                        <div>
                                            <p className="text-slate-700">Salida (fecha/hs/min): <span className="font-bold text-slate-900">{formatDate(order.fecha_fin)}</span></p>
                                        </div>
                                        <div>
                                            <p className="text-slate-700">Km realizado: <span className="font-bold text-slate-900">- Km</span></p>
                                        </div>
                                    </div>

                                    <div className="border-t pt-3">
                                        <p className="text-sm font-bold text-slate-800 mb-1">Motivo</p>
                                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{order.descripcion || '-'}</p>
                                    </div>

                                    <div className="border-t border-dashed border-slate-500" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VehicleDetail;
