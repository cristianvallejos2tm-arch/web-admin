import React, { useEffect, useState } from 'react';
import { Plus, Search, LogOut, Trash2, Edit2, ExternalLink } from 'lucide-react';
import { createInventarioItem, fetchInventarioItems, fetchDepositos, fetchProveedoresLite } from '../services/supabase';

interface InventoryItem {
    id: string | number;
    fecha: string;
    deposito: string;
    categoria: string;
    proveedor: string;
    nombre: string;
    marca: string;
    modelo: string;
    cantidad: number;
    unidad: string;
    rowColor?: string;
}

// Administra inventario: listados, filtros y formularios de ingreso/salida.
const Inventory: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [showNewItem, setShowNewItem] = useState(false);
    const [showSalidas, setShowSalidas] = useState(false);
    const [salidasRows, setSalidasRows] = useState(25);
    const [salidasSearch, setSalidasSearch] = useState('');
    const categoriaOptions = ['Mercadería de reventa', 'Lubricantes', 'Repuestos', 'Accesorios'];
    const ivaOptions = ['S/IVA', 'IVA 10.5%', 'IVA 21%'];
    const salidas = [
        { fecha: '12-12-2025', producto: 'REPUESTO DE CINTA GANCH0 100MM X 9MT', interno: 'CS06', solicitado: 'LEANDRO AGUILA - BASE ESCALANTE', cantidad: '3.00 un' },
        { fecha: '12-12-2025', producto: 'REPUESTO DE CINTA GANCH0 100MM X 9MT', interno: 'CS05', solicitado: 'LEANDRO AGUILA - BASE ESCALANTE', cantidad: '2.00 un' },
        { fecha: '09-12-2025', producto: 'ACEITE 15W40 R4 GRANEL', interno: '143', solicitado: 'ALEXIS ROBINO BASE K.K.', cantidad: '40.00 lts' },
    ];
    const [form, setForm] = useState({
        codigo: '',
        descripcion: '',
        unidad: '',
        marca: '',
        rubro: '',
        codigoBarras: '',
        sku: '',
        observaciones: '',
        deposito: '',
        proveedor: '',
        categoria: '',
        comprobante: '',
        iva: 'S/IVA',
        fechaIngreso: '',
        circuitos: {
            stock: false,
            compras: false,
            ventas: false,
        },
    });

    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [catalogError, setCatalogError] = useState('');
    const [depositosCatalog, setDepositosCatalog] = useState<any[]>([]);
    const [proveedoresCatalog, setProveedoresCatalog] = useState<any[]>([]);

    const formatCurrency = (value: number | null | undefined) => {
        const num = typeof value === 'number' ? value : 0;
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(num);
    };
    const mapItem = (item: any): InventoryItem => {
        const precioUnitario = item.precio_unitario ?? item.precio ?? 0;
        const cantidad = item.stock ?? item.cantidad ?? 0;
        const fecha = item.fecha || item.created_at || '';
        return {
            id: item.id,
            fecha: fecha ? String(fecha).slice(0, 10) : '',
            deposito: item.deposito_nombre || item.deposito || '',
            categoria: item.categoria || '',
            proveedor: item.proveedor || '',
            nombre: item.nombre || '',
            marca: item.marca || '',
            modelo: item.modelo || '',
            cantidad,
            unidad: item.unidad || '',
            rowColor: undefined,
        };
    };

    const loadItems = async () => {
        setLoading(true);
        setError('');
        const { data, error } = await fetchInventarioItems();
        if (error) {
            setError(error.message || 'No se pudo cargar el inventario.');
        } else {
            setItems((data || []).map(mapItem));
        }
        setLoading(false);
    };

    useEffect(() => {
        loadItems();
    }, []);

    useEffect(() => {
        (async () => {
            const { data: depData, error: depErr } = await fetchDepositos();
            if (depErr) {
                setCatalogError(depErr.message || 'No se pudieron cargar los depósitos');
            } else {
                setDepositosCatalog(depData || []);
            }

            const { data: provData, error: provErr } = await fetchProveedoresLite();
            if (provErr) {
                setCatalogError((prev) => prev || provErr.message || 'No se pudieron cargar los proveedores');
            } else {
                setProveedoresCatalog(provData || []);
            }
        })();
    }, []);

    const handleSaveNewItem = async () => {
        setSaving(true);
        setError('');
        const payload = {
            nombre: form.descripcion || form.codigo || 'Item',
            categoria: form.categoria || 'inventario',
            unidad: form.unidad || 'unidad',
            stock: 0,
            stock_minimo: 0,
            activo: true,
            proveedor: form.proveedor || null,
            comprobante: form.comprobante || null,
            iva: form.iva || null,
            fecha_ingreso: form.fechaIngreso || null,
            deposito: form.deposito || null,
        };
        const { error } = await createInventarioItem(payload);
        if (error) {
            setError(error.message || 'No se pudo crear el item.');
            setSaving(false);
            return;
        }
        await loadItems();
        setSaving(false);
        setShowNewItem(false);
        setForm({
            codigo: '',
            descripcion: '',
            unidad: '',
            marca: '',
            rubro: '',
            codigoBarras: '',
            sku: '',
            observaciones: '',
            deposito: '',
            proveedor: '',
            categoria: '',
            comprobante: '',
            iva: 'S/IVA',
            fechaIngreso: '',
            circuitos: { stock: false, compras: false, ventas: false },
        });
    };

    const filteredItems = items
        .filter((item) => {
            const term = searchTerm.toLowerCase();
            return (
                item.nombre.toLowerCase().includes(term) ||
                item.categoria.toLowerCase().includes(term) ||
                item.deposito.toLowerCase().includes(term) ||
                item.marca.toLowerCase().includes(term) ||
                item.modelo.toLowerCase().includes(term)
            );
        })
        .slice(0, rowsPerPage);
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-blue-600">Inventario</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowNewItem(true)}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium text-sm"
                    >
                        <Plus size={16} />
                        Nuevo ingreso
                    </button>
                    <button
                        onClick={() => setShowSalidas(true)}
                        className="flex items-center gap-2 px-6 py-2 bg-amber-400 text-slate-900 rounded-md hover:bg-amber-500 transition-colors font-medium text-sm"
                    >
                        <LogOut size={16} />
                        Salidas
                    </button>
                </div>
            </div>

            {/* List Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">INVENTARIO</h2>
                {error && <div className="text-sm text-red-600">{error}</div>}
                {catalogError && <div className="text-sm text-amber-600">{catalogError}</div>}

                {/* Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-600">Mostrar</label>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => setRowsPerPage(Number(e.target.value))}
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
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-3 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                        />
                        <button className="px-3 py-1.5 bg-cyan-500 text-white text-sm font-medium rounded hover:bg-cyan-600 transition-colors">Excel</button>
                        <button className="px-3 py-1.5 bg-cyan-500 text-white text-sm font-medium rounded hover:bg-cyan-600 transition-colors">Pdf</button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600/80 uppercase">Fecha</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600/80 uppercase">Deposito</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600/80 uppercase">Categoria</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600/80 uppercase">Proveedor</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600/80 uppercase">Nombre</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600/80 uppercase">Marca</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600/80 uppercase">Modelo</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-slate-600/80 uppercase">Cantidad</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600/80 uppercase">Un.</th>
                                <th className="px-4 py-3 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && (
                                <tr>
                                    <td className="px-4 py-3 text-sm text-slate-500" colSpan={12}>Cargando...</td>
                                </tr>
                            )}
                            {!loading && filteredItems.length === 0 && (
                                <tr>
                                    <td className="px-4 py-3 text-sm text-slate-500" colSpan={12}>No hay items para mostrar</td>
                                </tr>
                            )}
                            {!loading && filteredItems.map((item) => {
                                let rowClass = 'bg-white';
                                if (item.rowColor === 'yellow') rowClass = 'bg-amber-50';
                                if (item.rowColor === 'red') rowClass = 'bg-rose-50/50';

                                return (
                                    <tr key={item.id} className={`hover:bg-slate-50 border-b border-white ${rowClass}`}>
                                        <td className="px-4 py-4 text-xs font-medium text-slate-600 max-w-[80px]">{item.fecha}</td>
                                        <td className="px-4 py-4 text-xs text-slate-600">{item.deposito}</td>
                                        <td className="px-4 py-4 text-xs text-slate-600">{item.categoria}</td>
                                        <td className="px-4 py-4 text-xs text-slate-600">{item.proveedor}</td>
                                        <td className="px-4 py-4 text-xs text-slate-600 uppercase">{item.nombre}</td>
                                        <td className="px-4 py-4 text-xs text-slate-600">{item.marca}</td>
                                        <td className="px-4 py-4 text-xs text-slate-600">{item.modelo}</td>
                                        <td className="px-4 py-4 text-xs text-right text-slate-600">{item.cantidad.toFixed(2)}</td>
                                        <td className="px-4 py-4 text-xs text-slate-600">{item.unidad}</td>
                                        <td className="px-4 py-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1">
                                                <button className="text-red-400 hover:text-red-600 p-1">
                                                    <Trash2 size={14} />
                                                </button>
                                                <button className="text-blue-400 hover:text-blue-600 p-1">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button className="text-slate-400 hover:text-slate-600 p-1">
                                                    <ExternalLink size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            {showNewItem && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-auto p-4">
                    <div className="bg-white w-full max-w-5xl rounded-2xl shadow-xl border border-slate-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-slate-900">Articulo - Nuevo ingreso</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowNewItem(false)}
                                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 text-sm font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveNewItem}
                                    disabled={saving}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-60"
                                >
                                    {saving ? 'Guardando...' : 'Aceptar'}
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-5 space-y-5">
                            <div className="border border-slate-200 rounded-lg">
                                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                                    <span className="text-sm font-semibold text-slate-800">General</span>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Deposito</label>
                                            <select
                                                value={form.deposito}
                                                onChange={(e) => setForm({ ...form, deposito: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Seleccionar</option>
                                                {depositosCatalog.map((d) => (
                                                    <option key={d.id} value={d.nombre || d.id}>
                                                        {d.nombre || d.id}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor</label>
                                            <select
                                                value={form.proveedor}
                                                onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Seleccionar</option>
                                                {proveedoresCatalog.map((p) => (
                                                    <option key={p.id} value={p.nombre}>
                                                        {p.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                                            <select
                                                value={form.categoria}
                                                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Seleccionar</option>
                                                {categoriaOptions.map((opt) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Nro. Comprobante</label>
                                            <input
                                                value={form.comprobante}
                                                onChange={(e) => setForm({ ...form, comprobante: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">IVA</label>
                                            <select
                                                value={form.iva}
                                                onChange={(e) => setForm({ ...form, iva: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {ivaOptions.map((opt) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de ingreso</label>
                                            <input
                                                type="date"
                                                value={form.fechaIngreso}
                                                onChange={(e) => setForm({ ...form, fechaIngreso: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Codigo *</label>
                                            <input
                                                value={form.codigo}
                                                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Unidad de Medida *</label>
                                            <div className="flex gap-2">
                                                <input
                                                    value={form.unidad}
                                                    onChange={(e) => setForm({ ...form, unidad: e.target.value })}
                                                    className="flex-1 px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Buscar y seleccionar"
                                                />
                                                <button className="px-3 py-2 border border-slate-200 rounded bg-slate-50 hover:bg-slate-100 text-slate-600">
                                                    <Search size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                    	<label className="block text-sm font-medium text-slate-700 mb-1">Descripcion *</label>
                                        <input
                                            value={form.descripcion}
                                            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Marca *</label>
                                            <div className="flex gap-2">
                                                <input
                                                    value={form.marca}
                                                    onChange={(e) => setForm({ ...form, marca: e.target.value })}
                                                    className="flex-1 px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Seleccionar"
                                                />
                                                <button className="px-3 py-2 border border-slate-200 rounded bg-slate-50 hover:bg-slate-100 text-slate-600">
                                                    <Search size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Rubro *</label>
                                            <div className="flex gap-2">
                                                <input
                                                    value={form.rubro}
                                                    onChange={(e) => setForm({ ...form, rubro: e.target.value })}
                                                    className="flex-1 px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Seleccionar"
                                                />
                                                <button className="px-3 py-2 border border-slate-200 rounded bg-slate-50 hover:bg-slate-100 text-slate-600">
                                                    <Search size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-slate-200 rounded-lg">
                                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                                    <span className="text-sm font-semibold text-slate-800">Datos Generales</span>
                                </div>
                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Codigo de Barras</label>
                                        <input
                                            value={form.codigoBarras}
                                            onChange={(e) => setForm({ ...form, codigoBarras: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                                        <input
                                            value={form.sku}
                                            onChange={(e) => setForm({ ...form, sku: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
                                        <input
                                            value={form.observaciones}
                                            onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border border-slate-200 rounded-lg">
                                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                                    <span className="text-sm font-semibold text-slate-800">Circuitos</span>
                                </div>
                                <div className="p-4 flex flex-wrap gap-6 text-sm text-slate-700">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={form.circuitos.stock}
                                            onChange={(e) => setForm({
                                                ...form,
                                                circuitos: { ...form.circuitos, stock: e.target.checked },
                                            })}
                                            className="h-4 w-4 text-blue-600 border-slate-300 rounded"
                                        />
                                        Stock
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={form.circuitos.compras}
                                            onChange={(e) => setForm({
                                                ...form,
                                                circuitos: { ...form.circuitos, compras: e.target.checked },
                                            })}
                                            className="h-4 w-4 text-blue-600 border-slate-300 rounded"
                                        />
                                        Compras
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={form.circuitos.ventas}
                                            onChange={(e) => setForm({
                                                ...form,
                                                circuitos: { ...form.circuitos, ventas: e.target.checked },
                                            })}
                                            className="h-4 w-4 text-blue-600 border-slate-300 rounded"
                                        />
                                        Ventas
                                    </label>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
            {showSalidas && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-auto p-4">
                    <div className="bg-white w-full max-w-6xl rounded-2xl shadow-xl border border-slate-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-slate-900">Salidas inventario</h2>
                            <button
                                onClick={() => setShowSalidas(false)}
                                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 text-sm font-medium"
                            >
                                Cerrar
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-5">
                            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
                                <h3 className="text-sm font-bold text-slate-700 uppercase">Salidas inventario</h3>

                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-slate-600">Mostrar</label>
                                        <select
                                            value={salidasRows}
                                            onChange={(e) => setSalidasRows(Number(e.target.value))}
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
                                            value={salidasSearch}
                                            onChange={(e) => setSalidasSearch(e.target.value)}
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
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Fecha</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Producto</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase"># Interno</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Solicitado por</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase">Cantidad</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {salidas
                                                .filter((item) => {
                                                    const term = salidasSearch.toLowerCase();
                                                    return (
                                                        item.fecha.toLowerCase().includes(term) ||
                                                        item.producto.toLowerCase().includes(term) ||
                                                        item.interno.toLowerCase().includes(term) ||
                                                        item.solicitado.toLowerCase().includes(term) ||
                                                        item.cantidad.toLowerCase().includes(term)
                                                    );
                                                })
                                                .slice(0, salidasRows)
                                                .map((item, idx) => (
                                                    <tr key={`${item.fecha}-${idx}`} className={idx % 2 === 0 ? 'bg-slate-50/60' : 'bg-white'}>
                                                        <td className="px-4 py-3 text-xs text-slate-600">{item.fecha}</td>
                                                        <td className="px-4 py-3 text-xs text-slate-700 uppercase">{item.producto}</td>
                                                        <td className="px-4 py-3 text-xs text-slate-600">{item.interno}</td>
                                                        <td className="px-4 py-3 text-xs text-slate-600">{item.solicitado}</td>
                                                        <td className="px-4 py-3 text-xs text-right text-slate-700">{item.cantidad}</td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
