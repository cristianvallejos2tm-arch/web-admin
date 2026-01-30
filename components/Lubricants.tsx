import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Droplets, Loader2 } from 'lucide-react';
import { createLubricantItem, createLubricantSolicitud, fetchLubricantsStock, fetchLubricantSolicitudes, fetchVehiculos } from '../services/supabase';

interface Solicitud {
    id: string;
    created_at?: string;
    interno?: string | null;
    solicitante?: string | null;
    motivo?: string | null;
    cantidad?: number | null;
    marca?: string | null;
    modelo?: string | null;
    medida?: string | null;
    fecha?: string | null;
    hora?: string | null;
    minuto?: string | null;
}

// Módulo de lubricantes y baterías que monitorea stock, solicitudes y registra ingresos.
const Lubricants: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [showIngresoModal, setShowIngresoModal] = useState(false);
    const [showSolicitudModal, setShowSolicitudModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [stockRowsPerPage, setStockRowsPerPage] = useState(25);
    const [stockSearchTerm, setStockSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        deposito: '',
        marca: '',
        modelo: '',
        medida: '',
        estado: '',
        cantidad: '',
        precio: ''
    });
    const [solicitudData, setSolicitudData] = useState({
        interno: '',
        solicitante: '',
        motivo: '',
        cantidad: '',
        marca: '',
        modelo: '',
        medida: '',
        fecha: '',
        hora: '',
        minuto: ''
    });
    const [vehiculos, setVehiculos] = useState<any[]>([]);
    const [internoSearch, setInternoSearch] = useState('');
    const [stockItems, setStockItems] = useState<any[]>([]);
    const [requests, setRequests] = useState<Solicitud[]>([]);
    const [loadingStock, setLoadingStock] = useState(false);
    const [loadingReq, setLoadingReq] = useState(false);
    const [savingIngreso, setSavingIngreso] = useState(false);
    const [savingSolicitud, setSavingSolicitud] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const depositOptions = ['Lubricantes y Baterias', 'Base CO', 'Pañol Caleta Olivia'];
    const brandOptions = ['YPF', 'Shell', 'Total', 'Gulf'];
    const measureOptions = ['Lts', 'Unidades', 'Tambor', 'Bidon'];

    const loadStock = async () => {
        setLoadingStock(true);
        const { data, error } = await fetchLubricantsStock();
        setLoadingStock(false);
        if (error) {
            console.error('Error cargando stock de lubricantes', error);
            setError('No se pudo cargar el stock. Revisa permisos/RLS en inventario_items.');
            setStockItems([]);
            return;
        }
        setError(null);
        setStockItems(
            (data || []).map((d: any) => ({
                deposito: 'Lubricantes y Baterias',
                medida: d.unidad,
                marca: d.lubricantes_baterias_detalle?.marca || '-',
                modelo: d.lubricantes_baterias_detalle?.especificacion || '-',
                estado: d.activo ? 'Activo' : 'Inactivo',
                precio: 0,
                cantidad: d.stock || 0,
            }))
        );
    };

    const loadRequests = async () => {
        setLoadingReq(true);
        const { data, error } = await fetchLubricantSolicitudes();
        setLoadingReq(false);
        if (error) {
            console.error('Error cargando solicitudes de lubricantes', error);
            setError('No se pudieron cargar las solicitudes. Revisa permisos/RLS en lubricantes_solicitudes.');
            setRequests([]);
            return;
        }
        setError(null);
        setRequests((data as any[]) || []);
    };

    useEffect(() => {
        loadStock();
        loadRequests();
        const loadVehicles = async () => {
            const { data, error } = await fetchVehiculos();
            if (error) {
                console.error('Error cargando vehículos', error);
                return;
            }
            setVehiculos(data || []);
        };
        loadVehicles();
    }, []);

    const filteredRequests = useMemo(() => {
        return requests.filter((r) => {
            const text = `${r.solicitante || ''} ${r.marca || ''} ${r.modelo || ''} ${r.motivo || ''}`.toLowerCase();
            return text.includes(searchTerm.toLowerCase());
        });
    }, [requests, searchTerm]);

    const filteredStock = useMemo(() => {
        return stockItems.filter((s) => {
            const text = `${s.marca || ''} ${s.modelo || ''} ${s.medida || ''}`.toLowerCase();
            return text.includes(stockSearchTerm.toLowerCase());
        });
    }, [stockItems, stockSearchTerm]);

    const filteredInternos = useMemo(() => {
        const term = internoSearch.trim().toLowerCase();
        if (!term) return vehiculos;
        return vehiculos.filter((v) => {
            const numInt = (v.num_int || '').toLowerCase();
            const patente = (v.patente || '').toLowerCase();
            return numInt.includes(term) || patente.includes(term);
        });
    }, [vehiculos, internoSearch]);

    const handleIngreso = async () => {
        if (!formData.marca.trim() || !formData.modelo.trim()) {
            setError('Completa marca y modelo.');
            return;
        }
        setError(null);
        setSavingIngreso(true);
        const { error } = await createLubricantItem({
            nombre: `${formData.marca} ${formData.modelo}`,
            unidad: formData.medida || 'unidad',
            stock: Number(formData.cantidad) || 0,
            stock_minimo: 0,
            subtipo: 'lubricante',
            especificacion: formData.modelo,
            marca: formData.marca,
        });
        setSavingIngreso(false);
        if (error) {
            console.error('Error creando lubricante', error);
            setError(error.message || 'No se pudo guardar el ingreso. Revisa permisos/RLS.');
            return;
        }
        setFormData({ deposito: '', marca: '', modelo: '', medida: '', estado: '', cantidad: '', precio: '' });
        setShowIngresoModal(false);
        loadStock();
    };

    const handleSolicitud = async () => {
        if (!solicitudData.solicitante.trim() || !solicitudData.marca.trim()) {
            setError('Completa solicitante y marca.');
            return;
        }
        setError(null);
        setSavingSolicitud(true);
        const { error } = await createLubricantSolicitud({
            interno: solicitudData.interno || null,
            solicitante: solicitudData.solicitante || null,
            motivo: solicitudData.motivo || null,
            cantidad: solicitudData.cantidad ? Number(solicitudData.cantidad) : null,
            marca: solicitudData.marca || null,
            modelo: solicitudData.modelo || null,
            medida: solicitudData.medida || null,
            fecha: solicitudData.fecha || null,
            hora: solicitudData.hora || null,
            minuto: solicitudData.minuto || null,
        });
        setSavingSolicitud(false);
        if (error) {
            console.error('Error creando solicitud de lubricante', error);
            setError(error.message || 'No se pudo guardar la solicitud. Revisa permisos/RLS.');
            return;
        }
        setSolicitudData({ interno: '', solicitante: '', motivo: '', cantidad: '', marca: '', modelo: '', medida: '', fecha: '', hora: '', minuto: '' });
        setShowSolicitudModal(false);
        loadRequests();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center gap-2">
                    <Droplets className="text-blue-500" />
                    <h1 className="text-2xl font-bold text-blue-600">Lubricantes y Baterias</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowIngresoModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                        <Plus size={18} />
                        Nuevo ingreso
                    </button>
                    <button
                        onClick={() => setShowSolicitudModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
                    >
                        <Plus size={18} />
                        Nueva solicitud
                    </button>
                    <button
                        onClick={() => setShowStockModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
                    >
                        <Search size={18} />
                        Ver stock
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Solicitudes</h2>
                        <p className="text-sm text-slate-500">Últimas solicitudes de lubricantes/baterias</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar..."
                            className="px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                            value={rowsPerPage}
                            onChange={(e) => setRowsPerPage(Number(e.target.value))}
                            className="px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Fecha</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Interno</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Solicitado por</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Cantidad</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Motivo</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Marca</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Modelo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loadingReq ? (
                                <tr><td colSpan={7} className="px-4 py-4 text-sm text-slate-500"><Loader2 className="animate-spin inline mr-2" size={16}/>Cargando...</td></tr>
                            ) : filteredRequests.slice(0, rowsPerPage).map((req) => (
                                <tr key={req.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-sm text-slate-700">{req.fecha || (req.created_at ? new Date(req.created_at).toLocaleDateString() : '-')}</td>
                                    <td className="px-4 py-3 text-sm text-slate-700">{req.interno || '--'}</td>
                                    <td className="px-4 py-3 text-sm text-slate-700">{req.solicitante || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-slate-700">{req.cantidad || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-slate-700">{req.motivo || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-slate-700">{req.marca || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-slate-700">{req.modelo || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showIngresoModal && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-auto p-4">
                    <div className="bg-white w-full max-w-6xl rounded-2xl shadow-xl border border-slate-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-slate-900">Nuevo ingreso de lubricantes</h2>
                            <button
                                onClick={() => setShowIngresoModal(false)}
                                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 text-sm font-medium"
                            >
                                Cerrar
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Depósito</label>
                                    <select
                                        value={formData.deposito}
                                        onChange={(e) => setFormData({ ...formData, deposito: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600"
                                    >
                                        <option value="">Seleccionar</option>
                                        {depositOptions.map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Marca</label>
                                    <select
                                        value={formData.marca}
                                        onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600"
                                    >
                                        <option value="">Seleccionar</option>
                                        {brandOptions.map((b) => (
                                            <option key={b} value={b}>{b}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Modelo</label>
                                    <input
                                        value={formData.modelo}
                                        onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Medida</label>
                                    <select
                                        value={formData.medida}
                                        onChange={(e) => setFormData({ ...formData, medida: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600"
                                    >
                                        <option value="">Seleccionar</option>
                                        {measureOptions.map((m) => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Estado</label>
                                    <select
                                        value={formData.estado}
                                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600"
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="Nuevo">Nuevo</option>
                                        <option value="Usado">Usado</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Cantidad</label>
                                    <input
                                        value={formData.cantidad}
                                        onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                                        type="number"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Precio</label>
                                    <div className="flex">
                                        <span className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-l-lg text-sm text-slate-600">$</span>
                                        <input
                                            value={formData.precio}
                                            onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                                            type="number"
                                            className="w-full px-4 py-2 border border-slate-200 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                                    {error}
                                </div>
                            )}

                            <div className="lg:col-span-4 flex gap-3">
                                <button
                                    onClick={handleIngreso}
                                    disabled={savingIngreso}
                                    className="px-5 py-2.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium text-sm disabled:opacity-70"
                                >
                                    {savingIngreso ? 'Guardando...' : 'Cargar nuevo ingreso'}
                                </button>
                                <button
                                    onClick={() => setShowIngresoModal(false)}
                                    className="px-5 py-2.5 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors font-medium text-sm"
                                >
                                    Volver
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showSolicitudModal && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-auto p-4">
                    <div className="bg-white w-full max-w-6xl rounded-2xl shadow-xl border border-slate-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-slate-900">SOLICITUD DE LUBRICANTES - BATERIAS</h2>
                            <button
                                onClick={() => setShowSolicitudModal(false)}
                                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 text-sm font-medium"
                            >
                                Cerrar
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">¿Para qué interno?</label>
                                    <input
                                        type="text"
                                        value={internoSearch}
                                        onChange={(e) => setInternoSearch(e.target.value)}
                                        placeholder="Buscar interno / patente"
                                        className="w-full mb-2 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600"
                                    />
                                    <select
                                        value={solicitudData.interno}
                                        onChange={(e) => setSolicitudData({ ...solicitudData, interno: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600"
                                    >
                                        <option value="">Sin asignar</option>
                                        {filteredInternos.map((v) => {
                                            const labelPieces = [];
                                            if (v.num_int) labelPieces.push(`Int ${v.num_int}`);
                                            if (v.patente) labelPieces.push(v.patente);
                                            if (v.marca) labelPieces.push(v.marca);
                                            if (v.modelo) labelPieces.push(v.modelo);
                                            const label = labelPieces.join(' | ');
                                            const value = v.num_int || v.patente || v.id;
                                            return (
                                                <option key={v.id} value={value}>
                                                    {label || 'Interno sin datos'}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">¿Quién solicita?</label>
                                    <input
                                        value={solicitudData.solicitante}
                                        onChange={(e) => setSolicitudData({ ...solicitudData, solicitante: e.target.value })}
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Motivo</label>
                                    <input
                                        value={solicitudData.motivo}
                                        onChange={(e) => setSolicitudData({ ...solicitudData, motivo: e.target.value })}
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Cantidad</label>
                                    <input
                                        value={solicitudData.cantidad}
                                        onChange={(e) => setSolicitudData({ ...solicitudData, cantidad: e.target.value })}
                                        type="number"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Marca</label>
                                    <select
                                        value={solicitudData.marca}
                                        onChange={(e) => setSolicitudData({ ...solicitudData, marca: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600"
                                    >
                                        <option value="">Seleccionar</option>
                                        {brandOptions.map((b) => (
                                            <option key={b} value={b}>{b}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Modelo</label>
                                    <input
                                        value={solicitudData.modelo}
                                        onChange={(e) => setSolicitudData({ ...solicitudData, modelo: e.target.value })}
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Medida</label>
                                    <select
                                        value={solicitudData.medida}
                                        onChange={(e) => setSolicitudData({ ...solicitudData, medida: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600"
                                    >
                                        <option value="">Seleccionar</option>
                                        {measureOptions.map((m) => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Fecha Solicitud (fecha/hs/min)</label>
                                    <input
                                        value={solicitudData.fecha}
                                        onChange={(e) => setSolicitudData({ ...solicitudData, fecha: e.target.value })}
                                        type="date"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Hs.</label>
                                    <select
                                        value={solicitudData.hora}
                                        onChange={(e) => setSolicitudData({ ...solicitudData, hora: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Hs.</option>
                                        {Array.from({ length: 24 }, (_, i) => (i < 10 ? `0${i}` : `${i}`)).map((h) => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Min.</label>
                                    <select
                                        value={solicitudData.minuto}
                                        onChange={(e) => setSolicitudData({ ...solicitudData, minuto: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Min.</option>
                                        {['00', '15', '30', '45'].map((m) => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {error && (
                                <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                                    {error}
                                </div>
                            )}

                            <div className="lg:col-span-4 flex gap-3">
                                <button
                                    onClick={handleSolicitud}
                                    disabled={savingSolicitud}
                                    className="px-5 py-2.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium text-sm disabled:opacity-70"
                                >
                                    {savingSolicitud ? 'Guardando...' : 'Cargar nueva solicitud'}
                                </button>
                                <button
                                    onClick={() => setShowSolicitudModal(false)}
                                    className="px-5 py-2.5 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors font-medium text-sm"
                                >
                                    Volver
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showStockModal && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-auto p-4">
                    <div className="bg-white w-full max-w-6xl rounded-2xl shadow-xl border border-slate-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-slate-900">Stock de lubricantes y baterias</h2>
                            <button
                                onClick={() => setShowStockModal(false)}
                                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 text-sm font-medium"
                            >
                                Cerrar
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-700 font-semibold uppercase tracking-wide">Mostrar</span>
                                    <select
                                        value={stockRowsPerPage}
                                        onChange={(e) => setStockRowsPerPage(Number(e.target.value))}
                                        className="px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                    </select>
                                    <span className="text-sm text-slate-600">registros</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="text-sm text-slate-600">Buscar:</label>
                                    <input
                                        type="text"
                                        value={stockSearchTerm}
                                        onChange={(e) => setStockSearchTerm(e.target.value)}
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

                            <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Depósito</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Medida</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Marca</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Modelo</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Estado</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Precio</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Cantidad</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {loadingStock ? (
                                            <tr><td colSpan={7} className="px-4 py-4 text-sm text-slate-500"><Loader2 className="animate-spin inline mr-2" size={16}/>Cargando...</td></tr>
                                        ) : filteredStock.slice(0, stockRowsPerPage).map((item, idx) => (
                                            <tr key={`${item.marca}-${idx}`} className={idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                                                <td className="px-4 py-3 text-sm text-slate-700 font-semibold">{item.deposito}</td>
                                                <td className="px-4 py-3 text-sm text-slate-600 uppercase">{item.medida}</td>
                                                <td className="px-4 py-3 text-sm text-slate-600 uppercase">{item.marca}</td>
                                                <td className="px-4 py-3 text-sm text-slate-600 uppercase">{item.modelo}</td>
                                                <td className="px-4 py-3 text-sm text-slate-600 uppercase">{item.estado}</td>
                                                <td className="px-4 py-3 text-sm text-slate-600">-</td>
                                                <td className="px-4 py-3 text-sm text-slate-600 text-right">{item.cantidad}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex items-center justify-between">
                                <p className="text-xs text-slate-500">
                                    Mostrando registros del 1 al {Math.min(filteredStock.length, stockRowsPerPage)} de un total de {filteredStock.length} registros
                                </p>
                                <div className="flex items-center gap-2">
                                    <button className="text-xs text-slate-500 hover:text-slate-700 px-2">Anterior</button>
                                    <button className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-medium">1</button>
                                    <button className="text-xs text-slate-500 hover:text-slate-700 px-2">Siguiente</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Lubricants;
