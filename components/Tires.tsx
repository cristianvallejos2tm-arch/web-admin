import React, { useEffect, useState } from 'react';
import { Plus, Search, ChevronRight, Layers, BarChart2, RefreshCcw } from 'lucide-react';
import {
    createCubiertaMovimiento,
    createInventarioItem,
    createCubiertaSolicitud,
    createRecapInspeccion,
    fetchCubiertasStock,
    fetchDepositos,
    fetchCubiertaSolicitudes,
    fetchRecapInspecciones,
} from '../services/supabase';

interface TireRequest {
    id: number;
    fecha: string;
    estado: 'PEN.' | 'FIN.';
    interno: string;
    base: string;
    solicitante: string;
    sol: number;
    ent: number;
    rec: number;
    motivo: string;
    marca: string;
    modelo: string;
    medida: string;
    funcion: string;
}

const Tires: React.FC = () => {
    const [searchTermPending, setSearchTermPending] = useState('');
    const [searchTermFinalized, setSearchTermFinalized] = useState('');
    const [showIngreso, setShowIngreso] = useState(false);
    const [showSolicitud, setShowSolicitud] = useState(false);
    const [showStock, setShowStock] = useState(false);
    const [showRecap, setShowRecap] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [stockSearch, setStockSearch] = useState('');
    const [stockRows, setStockRows] = useState(25);
    const [stockData, setStockData] = useState<any[]>([]);
    const [solicitudes, setSolicitudes] = useState<TireRequest[]>([]);
    const [form, setForm] = useState({
        deposito: '',
        marca: '',
        modelo: '',
        funcion: '',
        medida: '',
        estado: '',
        remito: '',
        cantidad: '',
        precio: '',
    });
    const [solicitudForm, setSolicitudForm] = useState({
        interno: 'SIN INTERNO',
        solicitante: '',
        motivo: '',
        cantidad: '',
        marca: '',
        modelo: '',
        funcion: '',
        medida: '',
        fecha: '',
        hora: '',
        minuto: '',
        comentarios: '',
    });
    const [recapForm, setRecapForm] = useState({
        bases: [] as string[],
        tipoCubierta: '',
        predio: '',
        fecha: '',
        hora: '',
        minuto: '',
        responsable: '',
        cantInspeccion: '',
        retira: '',
        medioUso: '',
        vendidas: '',
        descarteFab: '',
        dispFinal: '',
        observaciones: '',
    });

    const depositoOptions = [
        'Galpon 1',
        'Galpon Seave',
        'Galpon 3 / Abajo',
        'Galpon 3 / Arriba',
        'Lubricantes y Baterías',
        'Pañol Caleta Olivia',
        'Pañol Las Heras',
        'Depósito Base Añelo',
    ];
    const funcionOptions = [
        'Direccionales',
        'Llantas',
        'Auxilios nuevos',
        'camioneta',
        'Con clavos',
        'Traccion',
    ];
    const estadoOptions = ['Descarte', 'Nuevas', 'Recapadas', 'Usadas'];
    const medidaOptions = [
        '1000 X 20',
        '900 X 20',
        '11 R/80 X22.5',
        '12 R/80 X22.5',
        '12.00 R20',
        '195/75/16',
        '215/80/16',
        '245/70/16',
        '245/65/17',
        '247/70/17',
        '265/65/17',
        '265/70/16',
        '265/60/18',
        '275/80R X22.5',
        '295/80R X22.5',
        '315/80 X22.5',
        '385/65 X22.5',
        '215/75/17',
        '225/70/17',
    ];
    const brandModels: Record<string, string[]> = {
        Fate: ['DO 820', 'SC 240', 'SR 200'],
        Firestone: ['T 831', 'FS 400'],
        Goodyear: [
            'G 677',
            'G 686',
            'ARMOR TRAC',
            'WRANGLER RT',
            'WORKHORSE AT',
            'ARMOR MAX MSD',
            'ADVENTURE',
            'ARMOR MAX MSA GEN-2',
        ],
        Michelin: ['X Multi'],
        Pirelli: ['TR88'],
        Kumho: ['KMD 41', 'KMA 03', 'AT51'],
        Bridgestone: ['R 268', 'R 269'],
        Triangle: ['TR697'],
    };
    const marcaOptions = Object.keys(brandModels);
    const horaOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutoOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
    const basesOptions = [
        'Sin Asignar',
        'Caleta Olivia',
        'Las Heras',
        'Koluel Kayke',
        'Administracion',
        'Vallejos',
        'Hermoso',
        'Escalante',
        'Cuadrado',
        'Cerro Dragon',
        'Añelo',
        'Nequen',
        'Todas',
    ];
    const tipoCubiertaOptions = ['Camiones', 'Camionetas'];
    const statsDeposito = [
        { label: 'Galpon 1', value: 560, color: 'bg-rose-200 border border-rose-300' },
        { label: 'Galpon Seave', value: 0, color: 'bg-slate-100 border border-slate-200' },
        { label: 'Galpon 3 / Abajo', value: 310, color: 'bg-amber-100 border border-amber-200' },
        { label: 'Galpon 3 / Arriba', value: 5, color: 'bg-emerald-100 border border-emerald-200' },
    ];
    const statsFuncion = [
        { label: 'Direccionales', value: 460, color: 'bg-rose-200 border border-rose-300' },
        { label: 'Traccion', value: 415, color: 'bg-amber-100 border border-amber-200' },
        { label: 'Auxilios nuevos', value: 0, color: 'bg-slate-100 border border-slate-200' },
        { label: 'Con clavos', value: 0, color: 'bg-slate-100 border border-slate-200' },
    ];
    const [savingIngreso, setSavingIngreso] = useState(false);
    const [savingSolicitud, setSavingSolicitud] = useState(false);
    const [savingRecap, setSavingRecap] = useState(false);
    const [ingresoError, setIngresoError] = useState('');
    const [depositosCatalog, setDepositosCatalog] = useState<any[]>([]);
    const [recapList, setRecapList] = useState<any[]>([]);

    const mapSolicitudToRequest = (item: any): TireRequest => {
        const estadoRaw = (item?.estado || 'PEN.').toString().toUpperCase();
        const estado = estadoRaw.startsWith('FIN') ? 'FIN.' : 'PEN.';
        return {
            id: item?.id || Math.random(),
            fecha: item?.fecha_solicitud || (item?.created_at ? String(item.created_at).slice(0, 10) : '-'),
            estado,
            interno: item?.interno || '',
            base: item?.base || item?.base_id || '',
            solicitante: item?.solicitante || '',
            sol: item?.cantidad ?? 0,
            ent: item?.ent || item?.entregadas || 0,
            rec: item?.rec || item?.recapadas || 0,
            motivo: item?.motivo || '',
            marca: item?.marca || '',
            modelo: item?.modelo || '',
            medida: item?.medida || '',
            funcion: item?.funcion || '',
        };
    };

    const loadStock = async () => {
        const { data } = await fetchCubiertasStock();
        setStockData(data || []);
        return data || [];
    };

    const loadSolicitudes = async () => {
        const { data } = await fetchCubiertaSolicitudes();
        setSolicitudes((data || []).map(mapSolicitudToRequest));
    };

    const loadRecapList = async () => {
        const { data } = await fetchRecapInspecciones();
        setRecapList(data || []);
    };

    useEffect(() => {
        fetchDepositos().then(({ data }) => setDepositosCatalog(data || []));
    }, []);

    useEffect(() => {
        if (showStock) {
            loadStock();
        }
    }, [showStock]);

    useEffect(() => {
        // Precargar stock para mostrar sin esperar a abrir el modal
        loadStock();
    }, []);

    useEffect(() => {
        if (showRecap) {
            loadRecapList();
        }
    }, [showRecap]);

    useEffect(() => {
        loadSolicitudes();
    }, []);

    const handleSaveIngreso = async () => {
        setSavingIngreso(true);
        setIngresoError('');
        const depositoId =
            depositosCatalog.find(
                (d: any) => d.id === form.deposito || (d.nombre && d.nombre === form.deposito)
            )?.id || null;

        const stockList = stockData && stockData.length ? stockData : await loadStock();
        const match = (stockList || []).find((item: any) => {
            const eq = (a: string, b: string) => (a || '').toLowerCase() === (b || '').toLowerCase();
            return (
                eq(item.marca, form.marca) &&
                eq(item.modelo, form.modelo) &&
                eq(item.funcion, form.funcion) &&
                eq(item.medida, form.medida)
            );
        });
        let itemId = match?.item_id || match?.id || null;

        if (!itemId) {
            const nombre = [form.marca, form.modelo, form.medida, form.funcion].filter(Boolean).join(' ');
            const { data, error: invError } = await createInventarioItem({
                nombre: nombre || 'Cubierta',
                categoria: 'cubiertas',
                unidad: 'unidad',
                stock: 0,
                stock_minimo: 0,
                activo: true,
            });
            if (invError || !data?.id) {
                setIngresoError(invError?.message || 'No se pudo crear el item de inventario.');
                setSavingIngreso(false);
                return;
            }
            itemId = data.id;
        }

        const { error } = await createCubiertaMovimiento({
            tipo: 'ingreso',
            item_id: itemId,
            deposito_id: depositoId,
            marca: form.marca,
            modelo: form.modelo,
            funcion: form.funcion,
            medida: form.medida,
            estado: form.estado,
            remito: form.remito,
            cantidad: form.cantidad ? Number(form.cantidad) : 0,
            precio_unitario: form.precio ? Number(form.precio) : null,
        });
        if (error) {
            setIngresoError(error.message || 'No se pudo guardar el movimiento.');
            setSavingIngreso(false);
            return;
        }

        await loadStock();
        setSavingIngreso(false);
        setShowIngreso(false);
    };

    const handleSaveSolicitud = async () => {
        setSavingSolicitud(true);
        await createCubiertaSolicitud({
            interno: solicitudForm.interno,
            solicitante: solicitudForm.solicitante,
            motivo: solicitudForm.motivo,
            cantidad: solicitudForm.cantidad ? Number(solicitudForm.cantidad) : undefined,
            marca: solicitudForm.marca,
            modelo: solicitudForm.modelo,
            funcion: solicitudForm.funcion,
            medida: solicitudForm.medida,
            fecha_solicitud: solicitudForm.fecha,
            hora: solicitudForm.hora,
            minuto: solicitudForm.minuto,
            comentarios: solicitudForm.comentarios,
        });
        await loadSolicitudes();
        setSavingSolicitud(false);
        setShowSolicitud(false);
    };

    const handleSaveRecap = async () => {
        setSavingRecap(true);
        const sanitizedBases = (recapForm.bases || []).filter((b) => b && b !== 'Sin Asignar');
        await createRecapInspeccion({
            bases: sanitizedBases.length ? sanitizedBases : null,
            tipo_cubierta: recapForm.tipoCubierta,
            predio: recapForm.predio,
            fecha: recapForm.fecha,
            hora: recapForm.hora,
            minuto: recapForm.minuto,
            responsable: recapForm.responsable,
            cant_inspeccion: recapForm.cantInspeccion ? Number(recapForm.cantInspeccion) : undefined,
            retira: recapForm.retira,
            medio_uso: recapForm.medioUso,
            vendidas: recapForm.vendidas ? Number(recapForm.vendidas) : undefined,
            descarte_fab: recapForm.descarteFab ? Number(recapForm.descarteFab) : undefined,
            disp_final: recapForm.dispFinal ? Number(recapForm.dispFinal) : undefined,
            observaciones: recapForm.observaciones,
        });
        await loadRecapList();
        setSavingRecap(false);
        setShowRecap(false);
    };

    const pendingRequests = solicitudes.filter((req) => !req.estado || !req.estado.startsWith('FIN'));
    const finalizedRequests = solicitudes.filter((req) => req.estado && req.estado.startsWith('FIN'));
    const depositoOptionList = depositosCatalog && depositosCatalog.length
        ? depositosCatalog.map((item: any) => ({
            value: item.id || item.nombre,
            label: item.nombre || item.id,
        }))
        : depositoOptions.map((opt) => ({ value: opt, label: opt }));

    const RequestTable = ({ title, data, searchTerm, setSearchTerm, isPending }: any) => {
        const filteredData = (data || []).filter((req: TireRequest) => {
            const term = (searchTerm || '').toLowerCase();
            return (
                (req.interno || '').toLowerCase().includes(term) ||
                (req.solicitante || '').toLowerCase().includes(term) ||
                (req.marca || '').toLowerCase().includes(term) ||
                (req.modelo || '').toLowerCase().includes(term) ||
                (req.medida || '').toLowerCase().includes(term) ||
                (req.funcion || '').toLowerCase().includes(term) ||
                (req.motivo || '').toLowerCase().includes(term)
            );
        });

        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h2>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-600">Mostrar</label>
                    <select className="px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value={25}>25</option>
                        <option value={50}>50</option>
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
                    <button className="px-3 py-1.5 bg-cyan-500 text-white text-sm font-medium rounded hover:bg-cyan-600 transition-colors">Excel</button>
                    <button className="px-3 py-1.5 bg-cyan-500 text-white text-sm font-medium rounded hover:bg-cyan-600 transition-colors">Pdf</button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="border-b border-slate-200 bg-slate-50/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Fecha Sol.</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Estado</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase"># Int.</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Base</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Solicitante</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Sol.</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Ent.</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Rec.</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Motivo</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Marca</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Modelo</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Medida</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Función</th>
                            <th className="px-4 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredData.map((req: TireRequest, idx: number) => (
                            <tr key={req.id} className={`hover:bg-slate-50 ${idx % 2 === 0 ? 'bg-slate-50/30' : 'bg-white'}`}>
                                <td className="px-4 py-3 text-xs font-medium text-slate-600">{req.fecha}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${req.estado === 'PEN.' ? 'bg-amber-400 text-slate-900' : 'bg-emerald-500 text-white'
                                        }`}>
                                        {req.estado}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-500">{req.interno}</td>
                                <td className="px-4 py-3 text-xs text-slate-500">{req.base}</td>
                                <td className="px-4 py-3 text-xs text-slate-600">{req.solicitante}</td>
                                <td className="px-4 py-3 text-xs text-center text-slate-600">{req.sol}</td>
                                <td className="px-4 py-3 text-xs text-center text-slate-600">{req.ent}</td>
                                <td className="px-4 py-3 text-xs text-center text-slate-600">{req.rec}</td>
                                <td className="px-4 py-3 text-xs text-slate-600 uppercase">{req.motivo}</td>
                                <td className="px-4 py-3 text-xs text-slate-600">{req.marca}</td>
                                <td className="px-4 py-3 text-xs text-slate-600">{req.modelo}</td>
                                <td className="px-4 py-3 text-xs text-slate-600">{req.medida}</td>
                                <td className="px-4 py-3 text-xs text-slate-600">{req.funcion}</td>
                                <td className="px-4 py-3 text-right">
                                    <button className="text-slate-400 hover:text-slate-600">
                                        <ChevronRight size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-500">Mostrando registros del 1 al {filteredData.length} de un total de {filteredData.length} registros</p>
                <div className="flex items-center gap-2">
                    <button className="text-xs text-slate-500 hover:text-slate-700 px-2">Anterior</button>
                    <button className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-medium">1</button>
                    <button className="text-xs text-slate-500 hover:text-slate-700 px-2">Siguiente</button>
                </div>
            </div>
        </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-blue-600">Cubiertas</h1>

                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    {/* Left Group */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowIngreso(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium text-sm"
                        >
                            <Plus size={16} />
                            Ingreso
                        </button>
                        <button
                            onClick={() => setShowSolicitud(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-400 text-slate-900 rounded-md hover:bg-amber-500 transition-colors font-medium text-sm"
                        >
                            <Plus size={16} />
                            Solicitud
                        </button>
                        <button
                            onClick={() => setShowStock(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-900 transition-colors font-medium text-sm"
                        >
                            <Layers size={16} />
                            Stock
                        </button>
                    </div>

                    {/* Right Group */}
                    <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                        <button
                            onClick={() => setShowRecap(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-green-600 border border-green-600 rounded-md hover:bg-green-50 transition-colors font-medium text-sm"
                        >
                            <RefreshCcw size={16} />
                            Recapadas
                        </button>
                        <button
                            onClick={() => setShowStats(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors font-medium text-sm"
                        >
                            <BarChart2 size={16} />
                            Estadisticas
                        </button>
                    </div>
                </div>
            </div>

            {/* Tables */}
            <RequestTable
                title="SOLICITUDES PENDIENTES"
                data={pendingRequests}
                searchTerm={searchTermPending}
                setSearchTerm={setSearchTermPending}
                isPending={true}
            />

            <RequestTable
                title="SOLICITUDES FINALIZADAS"
                data={finalizedRequests}
                searchTerm={searchTermFinalized}
                setSearchTerm={setSearchTermFinalized}
                isPending={false}
            />

            {showIngreso && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-auto p-4">
                    <div className="bg-white w-full max-w-6xl rounded-2xl shadow-xl border border-slate-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-slate-900">Nuevo ingreso de cubiertas</h2>
                            <button
                                onClick={() => setShowIngreso(false)}
                                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 text-sm font-medium"
                            >
                                Cerrar
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-5">
                            <div className="border border-slate-200 rounded-lg">
                                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                                    <span className="text-sm font-semibold text-slate-800">Nuevo ingreso de cubiertas</span>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Deposito</label>
                                            <select
                                                value={form.deposito}
                                                onChange={(e) => setForm({ ...form, deposito: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Seleccionar</option>
                                                {depositoOptionList.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Marca</label>
                                            <select
                                                value={form.marca}
                                                onChange={(e) => setForm({ ...form, marca: e.target.value, modelo: '' })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Seleccionar</option>
                                                {marcaOptions.map((opt) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Modelo</label>
                                            <select
                                                value={form.modelo}
                                                onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Seleccionar</option>
                                                {(brandModels[form.marca] || []).map((opt) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Funcion</label>
                                            <select
                                                value={form.funcion}
                                                onChange={(e) => setForm({ ...form, funcion: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Seleccionar</option>
                                                {funcionOptions.map((opt) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Medida</label>
                                            <select
                                                value={form.medida}
                                                onChange={(e) => setForm({ ...form, medida: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Seleccionar</option>
                                                {medidaOptions.map((opt) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Estado</label>
                                            <select
                                                value={form.estado}
                                                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Seleccionar</option>
                                                {estadoOptions.map((opt) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Nro. remito</label>
                                            <input
                                                value={form.remito}
                                                onChange={(e) => setForm({ ...form, remito: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Ej: 0001-000123"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Cantidad</label>
                                            <input
                                                type="number"
                                                value={form.cantidad}
                                                onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Precio (por unidad)</label>
                                            <div className="flex">
                                                <span className="inline-flex items-center px-3 border border-r-0 border-slate-200 rounded-l bg-slate-50 text-slate-600">$</span>
                                                <input
                                                    type="number"
                                                    value={form.precio}
                                                    onChange={(e) => setForm({ ...form, precio: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-r focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                            <div className="flex flex-wrap items-center gap-2 pt-2">
                                                <button
                                                    onClick={handleSaveIngreso}
                                                    disabled={savingIngreso}
                                                    className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 text-sm font-medium disabled:opacity-60"
                                        >
                                            {savingIngreso ? 'Guardando...' : 'Cargar nuevo ingreso'}
                                        </button>
                                                <button
                                                    onClick={() => setShowIngreso(false)}
                                                    className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 text-sm font-medium"
                                                >
                                                    Cancelar
                                                </button>
                                                {ingresoError && (
                                                    <p className="text-sm text-red-600 mt-2">{ingresoError}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                </div>
            )}

            {showSolicitud && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-auto p-4">
                    <div className="bg-white w-full max-w-6xl rounded-2xl shadow-xl border border-slate-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-slate-900">Solicitud de cubiertas</h2>
                            <button
                                onClick={() => setShowSolicitud(false)}
                                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 text-sm font-medium"
                            >
                                Cerrar
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-5">
                            <div className="border border-slate-200 rounded-lg">
                                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                                    <span className="text-sm font-semibold text-slate-800">Solicitud de cubiertas</span>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Para que interno?</label>
                                            <input
                                                type="text"
                                                value={solicitudForm.interno}
                                                onChange={(e) => setSolicitudForm({ ...solicitudForm, interno: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Ingresar interno"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Quien solicita?</label>
                                            <input
                                                value={solicitudForm.solicitante}
                                                onChange={(e) => setSolicitudForm({ ...solicitudForm, solicitante: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Nombre del solicitante"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Motivo</label>
                                            <input
                                                value={solicitudForm.motivo}
                                                onChange={(e) => setSolicitudForm({ ...solicitudForm, motivo: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Ej: Desgaste"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Cantidad</label>
                                            <input
                                                type="number"
                                                value={solicitudForm.cantidad}
                                                onChange={(e) => setSolicitudForm({ ...solicitudForm, cantidad: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Marca</label>
                                            <select
                                                value={solicitudForm.marca}
                                                onChange={(e) => setSolicitudForm({ ...solicitudForm, marca: e.target.value, modelo: '' })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Seleccionar</option>
                                                {marcaOptions.map((opt) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Modelo</label>
                                            <select
                                                value={solicitudForm.modelo}
                                                onChange={(e) => setSolicitudForm({ ...solicitudForm, modelo: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Seleccionar</option>
                                                {(brandModels[solicitudForm.marca] || []).map((opt) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Función</label>
                                            <select
                                                value={solicitudForm.funcion}
                                                onChange={(e) => setSolicitudForm({ ...solicitudForm, funcion: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Seleccionar</option>
                                                {funcionOptions.map((opt) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Medida</label>
                                            <select
                                                value={solicitudForm.medida}
                                                onChange={(e) => setSolicitudForm({ ...solicitudForm, medida: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Seleccionar</option>
                                                {medidaOptions.map((opt) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Fecha Solicitud (fecha/hs/min)</label>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                <input
                                                    type="date"
                                                    value={solicitudForm.fecha}
                                                    onChange={(e) => setSolicitudForm({ ...solicitudForm, fecha: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <select
                                                    value={solicitudForm.hora}
                                                    onChange={(e) => setSolicitudForm({ ...solicitudForm, hora: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Hs.</option>
                                                    {horaOptions.map((opt) => (
                                                        <option key={opt} value={opt}>
                                                            {opt}
                                                        </option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={solicitudForm.minuto}
                                                    onChange={(e) => setSolicitudForm({ ...solicitudForm, minuto: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Min.</option>
                                                    {minutoOptions.map((opt) => (
                                                        <option key={opt} value={opt}>
                                                            {opt}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-800 mb-1">Comentarios</label>
                                        <textarea
                                            value={solicitudForm.comentarios}
                                            onChange={(e) => setSolicitudForm({ ...solicitudForm, comentarios: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                                            placeholder="Ingrese comentario"
                                        />
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 pt-2">
                                        <button
                                            onClick={handleSaveSolicitud}
                                            disabled={savingSolicitud}
                                            className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 text-sm font-medium disabled:opacity-60"
                                        >
                                            {savingSolicitud ? 'Guardando...' : 'Cargar nueva solicitud'}
                                        </button>
                                        <button
                                            onClick={() => setShowSolicitud(false)}
                                            className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 text-sm font-medium"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showStock && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-auto p-4">
                    <div className="bg-white w-full max-w-6xl rounded-2xl shadow-xl border border-slate-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-slate-900">Stock de cubiertas</h2>
                            <button
                                onClick={() => setShowStock(false)}
                                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 text-sm font-medium"
                            >
                                Cerrar
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-5">
                            <div className="border border-slate-200 rounded-lg">
                                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                                    <span className="text-sm font-semibold text-slate-800">Stock de cubiertas</span>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm text-slate-600">Mostrar</label>
                                            <select
                                                value={stockRows}
                                                onChange={(e) => setStockRows(Number(e.target.value))}
                                                className="px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value={25}>25</option>
                                                <option value={50}>50</option>
                                            </select>
                                            <span className="text-sm text-slate-600">registros</span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <label className="text-sm text-slate-600">Buscar:</label>
                                            <input
                                                type="text"
                                                value={stockSearch}
                                                onChange={(e) => setStockSearch(e.target.value)}
                                                className="px-3 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                                            />
                                            <button className="px-3 py-1.5 bg-cyan-500 text-white text-sm font-medium rounded hover:bg-cyan-600 transition-colors">Excel</button>
                                            <button className="px-3 py-1.5 bg-cyan-500 text-white text-sm font-medium rounded hover:bg-cyan-600 transition-colors">Pdf</button>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="border-b border-slate-200 bg-slate-50/50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Deposito</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Medida</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Funcion</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Marca</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Modelo</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Estado</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Precio</th>
                                                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase">Cantidad</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {(stockData || [])
                                                    .map((item: any) => {
                                                        const depoName =
                                                            item.deposito ||
                                                            depositosCatalog.find((d) => d.id === item.deposito_id)?.nombre ||
                                                            item.deposito_nombre ||
                                                            '';
                                                        const cantidad = item.stock ?? item.cantidad ?? 0;
                                                        const precio = item.precio ?? item.precio_unitario ?? item.costo ?? '';
                                                        return {
                                                            ...item,
                                                            _depoName: depoName,
                                                            _cantidad: cantidad,
                                                            _precio: precio,
                                                        };
                                                    })
                                                    .filter((item: any) => {
                                                        const term = stockSearch.toLowerCase();
                                                        return (
                                                            (item._depoName || '').toLowerCase().includes(term) ||
                                                            (item.medida || '').toLowerCase().includes(term) ||
                                                            (item.funcion || '').toLowerCase().includes(term) ||
                                                            (item.marca || '').toLowerCase().includes(term) ||
                                                            (item.modelo || '').toLowerCase().includes(term) ||
                                                            (item.estado || '').toLowerCase().includes(term)
                                                        );
                                                    })
                                                    .slice(0, stockRows)
                                                    .map((item: any, idx: number) => (
                                                        <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-50/40' : 'bg-white'}>
                                                            <td className="px-4 py-3 text-xs text-slate-600 uppercase">{item._depoName}</td>
                                                            <td className="px-4 py-3 text-xs text-slate-600">{item.medida || ''}</td>
                                                            <td className="px-4 py-3 text-xs text-slate-600 uppercase">{item.funcion || ''}</td>
                                                            <td className="px-4 py-3 text-xs text-slate-600">{item.marca || ''}</td>
                                                            <td className="px-4 py-3 text-xs text-slate-600">{item.modelo || ''}</td>
                                                            <td className="px-4 py-3 text-xs text-slate-600 uppercase">{item.estado || ''}</td>
                                                            <td className="px-4 py-3 text-xs text-slate-600">{item._precio}</td>
                                                            <td className="px-4 py-3 text-xs text-right text-slate-800">{item._cantidad}</td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showRecap && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-auto p-4">
                    <div className="bg-white w-full max-w-6xl rounded-2xl shadow-xl border border-slate-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-slate-900">Cubiertas Recapadas</h2>
                            <button
                                onClick={() => setShowRecap(false)}
                                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 text-sm font-medium"
                            >
                                Cerrar
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-5">
                            <div className="border border-slate-200 rounded-lg">
                                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                                    <span className="text-sm font-semibold text-slate-800">Nueva inspeccion</span>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">
                                                Bases <span className="text-xs font-normal text-slate-500">(Permite opcion multiple)</span>
                                            </label>
                                            <select
                                                multiple
                                                value={recapForm.bases}
                                                onChange={(e) =>
                                                    setRecapForm({
                                                        ...recapForm,
                                                        bases: Array.from(e.target.selectedOptions, (o) => o.value),
                                                    })
                                                }
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-28"
                                            >
                                                <option value="">Seleccionar</option>
                                                {basesOptions.map((opt) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Tipo de cubierta</label>
                                            <select
                                                value={recapForm.tipoCubierta}
                                                onChange={(e) => setRecapForm({ ...recapForm, tipoCubierta: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Seleccionar</option>
                                                {tipoCubiertaOptions.map((opt) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Predio</label>
                                            <input
                                                type="text"
                                                value={recapForm.predio}
                                                onChange={(e) => setRecapForm({ ...recapForm, predio: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Ingresar predio"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Fecha Inspeccion (fecha/hs/min)</label>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                <input
                                                    type="date"
                                                    value={recapForm.fecha}
                                                    onChange={(e) => setRecapForm({ ...recapForm, fecha: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <select
                                                    value={recapForm.hora}
                                                    onChange={(e) => setRecapForm({ ...recapForm, hora: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Hs.</option>
                                                    {horaOptions.map((opt) => (
                                                        <option key={opt} value={opt}>
                                                            {opt}
                                                        </option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={recapForm.minuto}
                                                    onChange={(e) => setRecapForm({ ...recapForm, minuto: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Min.</option>
                                                    {minutoOptions.map((opt) => (
                                                        <option key={opt} value={opt}>
                                                            {opt}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Responsable inspeccion</label>
                                            <input
                                                value={recapForm.responsable}
                                                onChange={(e) => setRecapForm({ ...recapForm, responsable: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Nombre"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Cant. inspeccion</label>
                                            <input
                                                type="number"
                                                value={recapForm.cantInspeccion}
                                                onChange={(e) => setRecapForm({ ...recapForm, cantInspeccion: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Retira</label>
                                            <input
                                                value={recapForm.retira}
                                                onChange={(e) => setRecapForm({ ...recapForm, retira: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Medio Uso</label>
                                            <input
                                                value={recapForm.medioUso}
                                                onChange={(e) => setRecapForm({ ...recapForm, medioUso: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Vendidas</label>
                                            <input
                                                value={recapForm.vendidas}
                                                onChange={(e) => setRecapForm({ ...recapForm, vendidas: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Descarte en fab.</label>
                                            <input
                                                value={recapForm.descarteFab}
                                                onChange={(e) => setRecapForm({ ...recapForm, descarteFab: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Disp. final</label>
                                            <input
                                                value={recapForm.dispFinal}
                                                onChange={(e) => setRecapForm({ ...recapForm, dispFinal: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-800 mb-1">Observaciones</label>
                                        <textarea
                                            value={recapForm.observaciones}
                                            onChange={(e) => setRecapForm({ ...recapForm, observaciones: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                                            placeholder="Ingrese comentario"
                                        />
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 pt-2">
                                        <button
                                            onClick={handleSaveRecap}
                                            disabled={savingRecap}
                                            className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 text-sm font-medium disabled:opacity-60"
                                        >
                                            {savingRecap ? 'Guardando...' : 'Cargar'}
                                        </button>
                                        <button
                                            onClick={() => setShowRecap(false)}
                                            className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 text-sm font-medium"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-slate-200 rounded-lg">
                                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                                    <span className="text-sm font-semibold text-slate-800">Listado recapadas</span>
                                </div>
                                <div className="p-4 text-sm text-slate-700 space-y-3">
                                    {recapList.length === 0 && (
                                        <p className="text-slate-500">No hay items para listar</p>
                                    )}
                                    {recapList.length > 0 && (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead className="border-b border-slate-200 bg-slate-50">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left font-semibold text-slate-600 uppercase">Fecha</th>
                                                        <th className="px-3 py-2 text-left font-semibold text-slate-600 uppercase">Bases</th>
                                                        <th className="px-3 py-2 text-left font-semibold text-slate-600 uppercase">Tipo</th>
                                                        <th className="px-3 py-2 text-left font-semibold text-slate-600 uppercase">Predio</th>
                                                        <th className="px-3 py-2 text-left font-semibold text-slate-600 uppercase">Cant.</th>
                                                        <th className="px-3 py-2 text-left font-semibold text-slate-600 uppercase">Responsable</th>
                                                        <th className="px-3 py-2 text-left font-semibold text-slate-600 uppercase">Observaciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {recapList.map((item: any, idx: number) => (
                                                        <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-slate-50/40' : 'bg-white'}>
                                                            <td className="px-3 py-2 text-slate-700">{item.fecha || ''}</td>
                                                            <td className="px-3 py-2 text-slate-700">{Array.isArray(item.bases) ? item.bases.join(', ') : ''}</td>
                                                            <td className="px-3 py-2 text-slate-700">{item.tipo_cubierta || ''}</td>
                                                            <td className="px-3 py-2 text-slate-700">{item.predio || ''}</td>
                                                            <td className="px-3 py-2 text-slate-700">{item.cant_inspeccion || 0}</td>
                                                            <td className="px-3 py-2 text-slate-700">{item.responsable || ''}</td>
                                                            <td className="px-3 py-2 text-slate-700">{item.observaciones || ''}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showStats && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-auto p-4">
                    <div className="bg-white w-full max-w-6xl rounded-2xl shadow-xl border border-slate-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-slate-900">Estadisticas de Cubiertas</h2>
                            <button
                                onClick={() => setShowStats(false)}
                                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 text-sm font-medium"
                            >
                                Cerrar
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="border border-slate-200 rounded-lg">
                                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                                        <span className="text-sm font-semibold text-slate-800">Stock de cubiertas por deposito</span>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="w-4 h-4 bg-rose-200 border border-rose-300 rounded-sm"></span>
                                            <span className="text-xs text-slate-700">Cubiertas</span>
                                        </div>
                                        <div className="flex items-end gap-4 h-64">
                                            {statsDeposito.map((item) => (
                                                <div key={item.label} className="flex flex-col items-center flex-1 min-w-[80px]">
                                                    <div
                                                        className={`${item.color} w-full rounded-t transition-all`}
                                                        style={{ height: `${(item.value / 600) * 100}%` }}
                                                    ></div>
                                                    <span className="mt-2 text-[11px] text-slate-600 text-center">{item.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="border border-slate-200 rounded-lg">
                                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                                        <span className="text-sm font-semibold text-slate-800">Stock de cubiertas por funcion</span>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="w-4 h-4 bg-rose-200 border border-rose-300 rounded-sm"></span>
                                            <span className="text-xs text-slate-700">Cubiertas</span>
                                        </div>
                                        <div className="flex items-end gap-4 h-64">
                                            {statsFuncion.map((item) => (
                                                <div key={item.label} className="flex flex-col items-center flex-1 min-w-[80px]">
                                                    <div
                                                        className={`${item.color} w-full rounded-t transition-all`}
                                                        style={{ height: `${(item.value / 500) * 100}%` }}
                                                    ></div>
                                                    <span className="mt-2 text-[11px] text-slate-600 text-center">{item.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tires;
