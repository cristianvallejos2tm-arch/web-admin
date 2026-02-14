import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, LogOut, Trash2, Edit2, ExternalLink } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import {
    createInventarioItem,
    createInventarioSalida,
    deleteInventarioItem,
    fetchInventarioItems,
    fetchInventarioSalidas,
    fetchDepositos,
    fetchProveedoresLite,
    updateInventarioItem,
    updateInventarioItemStock,
} from '../services/supabase';

interface InventoryItem {
    id: string | number;
    fecha: string;
    deposito: string;
    categoria: string;
    proveedor: string;
    nombre: string;
    sku: string;
    comprobante: string;
    precioUnidad: number;
    cantidad: number;
    unidad: string;
    rowColor?: string;
}

interface InventorySalida {
    id: string | number;
    fecha: string;
    producto: string;
    interno: string;
    solicitado: string;
    cantidad: number;
    unidad: string;
}

// Administra inventario: listados, filtros y formularios de ingreso/salida.
const Inventory: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [page, setPage] = useState(1);
    const [showNewItem, setShowNewItem] = useState(false);
    const [showSalidas, setShowSalidas] = useState(false);
    const [salidasRows, setSalidasRows] = useState(25);
    const [salidasSearch, setSalidasSearch] = useState('');
    const [salidasPage, setSalidasPage] = useState(1);
    const [salidas, setSalidas] = useState<InventorySalida[]>([]);
    const [loadingSalidas, setLoadingSalidas] = useState(false);
    const [showNewSalida, setShowNewSalida] = useState(false);
    const [savingSalida, setSavingSalida] = useState(false);
    const categoriaOptions = ['Mercadería de reventa', 'Lubricantes', 'Repuestos', 'Accesorios'];
    const ivaOptions = ['S/IVA', 'IVA 10.5%', 'IVA 21%'];
    const [salidaForm, setSalidaForm] = useState({
        itemId: '',
        fecha: '',
        interno: '',
        solicitado: '',
        cantidad: '',
        observaciones: '',
    });
    const [form, setForm] = useState({
        codigo: '',
        descripcion: '',
        cantidad: '',
        unidad: '',
        marca: '',
        rubro: '',
        codigoBarras: '',
        sku: '',
        precioUnidad: '',
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
    const [rawItems, setRawItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [savingEdit, setSavingEdit] = useState(false);
    const [deletingItemId, setDeletingItemId] = useState<string | number | null>(null);
    const [showEditItem, setShowEditItem] = useState(false);
    const [editForm, setEditForm] = useState({
        id: '',
        nombre: '',
        categoria: '',
        unidad: '',
        stock: '',
        stockMinimo: '',
        sku: '',
        precioUnidad: '',
        proveedor: '',
        comprobante: '',
        iva: 'S/IVA',
        fechaIngreso: '',
        deposito: '',
        activo: true,
    });
    const [catalogError, setCatalogError] = useState('');
    const [depositosCatalog, setDepositosCatalog] = useState<any[]>([]);
    const [proveedoresCatalog, setProveedoresCatalog] = useState<any[]>([]);

    const depositosById = useMemo(
        () => new Map((depositosCatalog || []).map((d) => [String(d.id), d.nombre || String(d.id)])),
        [depositosCatalog],
    );
    const proveedoresById = useMemo(
        () => new Map((proveedoresCatalog || []).map((p) => [String(p.id), p.nombre || String(p.id)])),
        [proveedoresCatalog],
    );

    const mapItem = (item: any): InventoryItem => {
        const cantidad = item.stock ?? item.cantidad ?? 0;
        const fecha = item.fecha || item.created_at || '';
        const depositoRaw = item.deposito_nombre || item.deposito || item.deposito_id || '';
        const proveedorRaw = item.proveedor || item.proveedor_id || '';
        return {
            id: item.id,
            fecha: fecha ? String(fecha).slice(0, 10) : '',
            deposito: depositoRaw,
            categoria: item.categoria || '',
            proveedor: proveedorRaw,
            nombre: item.nombre || '',
            sku: item.sku || '',
            comprobante: item.comprobante || '',
            precioUnidad: Number(item.precio_unidad ?? 0),
            cantidad,
            unidad: item.unidad || '',
            rowColor: undefined,
        };
    };

    const mapSalida = (item: any): InventorySalida => {
        const fecha = item.fecha || item.created_at || '';
        return {
            id: item.id,
            fecha: fecha ? String(fecha).slice(0, 10) : '',
            producto: item.producto || item.nombre || item.item_nombre || '',
            interno: item.interno || '',
            solicitado: item.solicitado || item.solicitante || '',
            cantidad: Number(item.cantidad ?? 0),
            unidad: item.unidad || '',
        };
    };

    const loadItems = async () => {
        setLoading(true);
        setError('');
        const { data, error } = await fetchInventarioItems();
        if (error) {
            setError(error.message || 'No se pudo cargar el inventario.');
        } else {
            setRawItems(data || []);
            setItems((data || []).map(mapItem));
        }
        setLoading(false);
    };

    const loadSalidas = async () => {
        setLoadingSalidas(true);
        const { data, error } = await fetchInventarioSalidas();
        if (error) {
            setError(error.message || 'No se pudieron cargar las salidas de inventario.');
            setSalidas([]);
            setLoadingSalidas(false);
            return;
        }
        setSalidas((data || []).map(mapSalida));
        setLoadingSalidas(false);
    };

    useEffect(() => {
        loadItems();
    }, []);

    useEffect(() => {
        if (!showSalidas) return;
        loadSalidas();
    }, [showSalidas]);

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
        const nombre = form.descripcion.trim() || form.codigo.trim();
        const unidad = form.unidad.trim();
        const cantidad = Number(form.cantidad);
        if (!nombre || !unidad || !Number.isFinite(cantidad) || cantidad <= 0) {
            setError('Completa descripcion/codigo, unidad y cantidad mayor a 0.');
            return;
        }

        setSaving(true);
        setError('');
        const depositoId = form.deposito ? String(form.deposito) : null;
        const proveedorId = form.proveedor ? String(form.proveedor) : null;
        const depositoNombre = depositoId ? (depositosById.get(depositoId) || null) : null;
        const proveedorNombre = proveedorId ? (proveedoresById.get(proveedorId) || null) : null;

        const payload = {
            nombre,
            categoria: form.categoria || 'inventario',
            unidad,
            stock: cantidad,
            stock_minimo: 0,
            activo: true,
            sku: form.sku || null,
            precio_unidad: form.precioUnidad ? Number(form.precioUnidad) : null,
            proveedor: proveedorNombre,
            comprobante: form.comprobante || null,
            iva: form.iva || null,
            fecha_ingreso: form.fechaIngreso || null,
            deposito: depositoNombre,
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
            cantidad: '',
            unidad: '',
            marca: '',
            rubro: '',
            codigoBarras: '',
            sku: '',
            precioUnidad: '',
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

    const handleSaveSalida = async () => {
        const selectedItem = items.find((it) => String(it.id) === String(salidaForm.itemId));
        const cantidadSalida = Number(salidaForm.cantidad);
        if (!selectedItem) {
            setError('Selecciona un item para registrar la salida.');
            return;
        }
        if (!Number.isFinite(cantidadSalida) || cantidadSalida <= 0) {
            setError('La cantidad de salida debe ser mayor a 0.');
            return;
        }
        if (cantidadSalida > selectedItem.cantidad) {
            setError('La cantidad supera el stock disponible.');
            return;
        }

        setSavingSalida(true);
        setError('');
        const salidaPayload = {
            item_id: selectedItem.id,
            producto: selectedItem.nombre,
            fecha: salidaForm.fecha || new Date().toISOString().slice(0, 10),
            interno: salidaForm.interno || null,
            solicitado: salidaForm.solicitado || null,
            cantidad: cantidadSalida,
            unidad: selectedItem.unidad || null,
            observaciones: salidaForm.observaciones || null,
        };
        const salidaResult = await createInventarioSalida(salidaPayload);
        if (salidaResult.error) {
            setError(salidaResult.error.message || 'No se pudo registrar la salida.');
            setSavingSalida(false);
            return;
        }

        const nuevoStock = Number((selectedItem.cantidad - cantidadSalida).toFixed(2));
        const stockResult = await updateInventarioItemStock(selectedItem.id, nuevoStock);
        if (stockResult.error) {
            setError(stockResult.error.message || 'Se registró la salida, pero falló la actualización de stock.');
            setSavingSalida(false);
            return;
        }

        await Promise.all([loadItems(), loadSalidas()]);
        setSavingSalida(false);
        setShowNewSalida(false);
        setSalidaForm({
            itemId: '',
            fecha: '',
            interno: '',
            solicitado: '',
            cantidad: '',
            observaciones: '',
        });
    };

    const handleOpenEdit = (itemId: string | number) => {
        const item = rawItems.find((it: any) => String(it.id) === String(itemId));
        if (!item) {
            setError('No se pudo abrir el item para edicion.');
            return;
        }
        setEditForm({
            id: String(item.id),
            nombre: item.nombre || '',
            categoria: item.categoria || '',
            unidad: item.unidad || '',
            stock: String(item.stock ?? 0),
            stockMinimo: String(item.stock_minimo ?? 0),
            sku: item.sku || '',
            precioUnidad: String(item.precio_unidad ?? ''),
            proveedor: item.proveedor || '',
            comprobante: item.comprobante || '',
            iva: item.iva || 'S/IVA',
            fechaIngreso: item.fecha_ingreso || '',
            deposito: item.deposito || '',
            activo: item.activo !== false,
        });
        setShowEditItem(true);
    };

    const handleSaveEdit = async () => {
        const nombre = editForm.nombre.trim();
        const unidad = editForm.unidad.trim();
        const stock = Number(editForm.stock);
        const stockMinimo = Number(editForm.stockMinimo);
        const precioUnidad =
            String(editForm.precioUnidad).trim() === '' ? null : Number(editForm.precioUnidad);
        if (!nombre || !unidad || !Number.isFinite(stock) || stock < 0) {
            setError('Completa nombre, unidad y stock valido.');
            return;
        }
        if (!Number.isFinite(stockMinimo) || stockMinimo < 0) {
            setError('Stock minimo invalido.');
            return;
        }
        if (precioUnidad !== null && (!Number.isFinite(precioUnidad) || precioUnidad < 0)) {
            setError('Precio unidad invalido.');
            return;
        }

        setSavingEdit(true);
        setError('');
        const payload = {
            nombre,
            categoria: editForm.categoria || null,
            unidad,
            stock,
            stock_minimo: stockMinimo,
            precio_unidad: precioUnidad,
            activo: editForm.activo,
            sku: editForm.sku || null,
            proveedor: editForm.proveedor || null,
            comprobante: editForm.comprobante || null,
            iva: editForm.iva || null,
            fecha_ingreso: editForm.fechaIngreso || null,
            deposito: editForm.deposito || null,
        };
        const { error } = await updateInventarioItem(editForm.id, payload);
        if (error) {
            setError(error.message || 'No se pudo actualizar el item.');
            setSavingEdit(false);
            return;
        }
        await loadItems();
        setSavingEdit(false);
        setShowEditItem(false);
    };

    const handleDeleteItem = async (itemId: string | number) => {
        const ok = window.confirm('¿Eliminar este item de inventario? Esta accion no se puede deshacer.');
        if (!ok) return;
        setDeletingItemId(itemId);
        setError('');
        const { error } = await deleteInventarioItem(itemId);
        if (error) {
            setError(error.message || 'No se pudo eliminar el item.');
            setDeletingItemId(null);
            return;
        }
        await loadItems();
        setDeletingItemId(null);
    };

    const handleQuickSalida = (itemId: string | number) => {
        setSalidaForm({
            itemId: String(itemId),
            fecha: new Date().toISOString().slice(0, 10),
            interno: '',
            solicitado: '',
            cantidad: '',
            observaciones: '',
        });
        setShowSalidas(true);
        setShowNewSalida(true);
    };

    const filteredItemsAll = items
        .filter((item) => {
            const term = searchTerm.toLowerCase();
            return (
                item.nombre.toLowerCase().includes(term) ||
                item.categoria.toLowerCase().includes(term) ||
                item.deposito.toLowerCase().includes(term) ||
                item.sku.toLowerCase().includes(term) ||
                item.comprobante.toLowerCase().includes(term)
            );
        });

    const itemsTotal = filteredItemsAll.length;
    const itemsTotalPages = Math.max(1, Math.ceil(itemsTotal / rowsPerPage));
    const safePage = Math.min(page, itemsTotalPages);
    const itemsStart = itemsTotal === 0 ? 0 : (safePage - 1) * rowsPerPage;
    const itemsEnd = itemsStart + rowsPerPage;
    const filteredItems = filteredItemsAll.slice(itemsStart, itemsEnd);

    const filteredSalidasAll = salidas
        .filter((item) => {
            const term = salidasSearch.toLowerCase();
            const cantidadText = `${item.cantidad.toFixed(2)} ${item.unidad || ''}`.toLowerCase();
            return (
                item.fecha.toLowerCase().includes(term) ||
                item.producto.toLowerCase().includes(term) ||
                item.interno.toLowerCase().includes(term) ||
                item.solicitado.toLowerCase().includes(term) ||
                cantidadText.includes(term)
            );
        });

    const salidasTotal = filteredSalidasAll.length;
    const salidasTotalPages = Math.max(1, Math.ceil(salidasTotal / salidasRows));
    const safeSalidasPage = Math.min(salidasPage, salidasTotalPages);
    const salidasStart = salidasTotal === 0 ? 0 : (safeSalidasPage - 1) * salidasRows;
    const salidasEnd = salidasStart + salidasRows;
    const filteredSalidas = filteredSalidasAll.slice(salidasStart, salidasEnd);

    const salidaSelectedItem = items.find((it) => String(it.id) === String(salidaForm.itemId));

    const exportJsonToExcel = (rows: Record<string, any>[], fileName: string, sheetName: string) => {
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        XLSX.writeFile(workbook, fileName);
    };

    const exportTableToPdf = (title: string, headers: string[], rows: string[][], fileName: string) => {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
        const margin = 28;
        const top = 40;
        const lineHeight = 16;
        const contentWidth = doc.internal.pageSize.getWidth() - margin * 2;
        const colWidth = contentWidth / headers.length;
        const maxRowsPerPage = Math.max(1, Math.floor((doc.internal.pageSize.getHeight() - top - 60) / lineHeight) - 2);

        const sanitize = (value: string) => (value || '').replace(/\s+/g, ' ').trim();
        const fit = (value: string, maxLen = 16) => {
            const cleaned = sanitize(value);
            return cleaned.length > maxLen ? `${cleaned.slice(0, maxLen - 1)}...` : cleaned;
        };

        let rowIndex = 0;
        let page = 1;
        while (rowIndex < rows.length || page === 1) {
            if (page > 1) doc.addPage();
            doc.setFontSize(12);
            doc.text(title, margin, top);

            let y = top + lineHeight * 1.5;
            doc.setFontSize(9);
            headers.forEach((h, idx) => doc.text(fit(h, 20), margin + idx * colWidth, y));
            y += lineHeight;
            doc.line(margin, y - 8, margin + contentWidth, y - 8);

            for (let i = 0; i < maxRowsPerPage && rowIndex < rows.length; i += 1) {
                const row = rows[rowIndex];
                headers.forEach((_, idx) => {
                    doc.text(fit(String(row[idx] ?? ''), 20), margin + idx * colWidth, y);
                });
                y += lineHeight;
                rowIndex += 1;
            }
            page += 1;
        }

        doc.save(fileName);
    };

    const exportInventoryExcel = () => {
        const rows = filteredItems.map((item) => ({
            Fecha: item.fecha,
            Deposito: depositosById.get(String(item.deposito)) || item.deposito || '',
            Categoria: item.categoria || '',
            Proveedor: proveedoresById.get(String(item.proveedor)) || item.proveedor || '',
            Nombre: item.nombre || '',
            SKU: item.sku || '',
            PrecioUnidad: item.precioUnidad ?? 0,
            Cantidad: item.cantidad ?? 0,
            Unidad: item.unidad || '',
        }));
        exportJsonToExcel(rows, `inventario_${Date.now()}.xlsx`, 'Inventario');
    };

    const exportInventoryPdf = () => {
        const headers = ['Fecha', 'Deposito', 'Categoria', 'Proveedor', 'Nombre', 'SKU', 'Precio U.', 'Cantidad', 'Un.'];
        const rows = filteredItems.map((item) => [
            String(item.fecha || ''),
            String(depositosById.get(String(item.deposito)) || item.deposito || ''),
            String(item.categoria || ''),
            String(proveedoresById.get(String(item.proveedor)) || item.proveedor || ''),
            String(item.nombre || ''),
            String(item.sku || ''),
            String(item.precioUnidad ?? 0),
            String(item.cantidad ?? 0),
            String(item.unidad || ''),
        ]);
        exportTableToPdf('Inventario', headers, rows, `inventario_${Date.now()}.pdf`);
    };

    const exportSalidasExcel = () => {
        const rows = filteredSalidas.map((item) => ({
            Fecha: item.fecha,
            Producto: item.producto,
            Interno: item.interno,
            SolicitadoPor: item.solicitado,
            Cantidad: item.cantidad,
            Unidad: item.unidad,
        }));
        exportJsonToExcel(rows, `inventario_salidas_${Date.now()}.xlsx`, 'Salidas');
    };

    const exportSalidasPdf = () => {
        const headers = ['Fecha', 'Producto', 'Interno', 'Solicitado por', 'Cantidad', 'Un.'];
        const rows = filteredSalidas.map((item) => [
            String(item.fecha || ''),
            String(item.producto || ''),
            String(item.interno || ''),
            String(item.solicitado || ''),
            String(item.cantidad ?? 0),
            String(item.unidad || ''),
        ]);
        exportTableToPdf('Salidas de Inventario', headers, rows, `inventario_salidas_${Date.now()}.pdf`);
    };

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
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setPage(1);
                            }}
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
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                            className="px-3 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                        />
                        <button
                            onClick={exportInventoryExcel}
                            className="px-3 py-1.5 bg-cyan-500 text-white text-sm font-medium rounded hover:bg-cyan-600 transition-colors"
                        >
                            Excel
                        </button>
                        <button
                            onClick={exportInventoryPdf}
                            className="px-3 py-1.5 bg-cyan-500 text-white text-sm font-medium rounded hover:bg-cyan-600 transition-colors"
                        >
                            Pdf
                        </button>
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
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600/80 uppercase">SKU</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-slate-600/80 uppercase">Precio U.</th>
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
                                        <td className="px-4 py-4 text-xs text-slate-600">{depositosById.get(String(item.deposito)) || item.deposito}</td>
                                        <td className="px-4 py-4 text-xs text-slate-600">{item.categoria}</td>
                                        <td className="px-4 py-4 text-xs text-slate-600">{proveedoresById.get(String(item.proveedor)) || item.proveedor}</td>
                                        <td className="px-4 py-4 text-xs text-slate-600 uppercase">{item.nombre}</td>
                                        <td className="px-4 py-4 text-xs text-slate-600">{item.sku}</td>
                                        <td className="px-4 py-4 text-xs text-right text-slate-600">{item.precioUnidad.toFixed(2)}</td>
                                        <td className="px-4 py-4 text-xs text-right text-slate-600">{item.cantidad.toFixed(2)}</td>
                                        <td className="px-4 py-4 text-xs text-slate-600">{item.unidad}</td>
                                        <td className="px-4 py-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    disabled={deletingItemId === item.id}
                                                    className="text-red-400 hover:text-red-600 p-1 disabled:opacity-50"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEdit(item.id)}
                                                    className="text-blue-400 hover:text-blue-600 p-1"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleQuickSalida(item.id)}
                                                    className="text-slate-400 hover:text-slate-600 p-1"
                                                    title="Registrar salida de este item"
                                                >
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
                <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>
                        Mostrando registros del {itemsTotal === 0 ? 0 : itemsStart + 1} al {Math.min(itemsEnd, itemsTotal)} de un total de {itemsTotal} registros
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(Math.max(1, safePage - 1))}
                            disabled={safePage <= 1}
                            className="px-3 py-1 border border-slate-300 rounded disabled:opacity-50"
                        >
                            Anterior
                        </button>
                        <span>{safePage}/{itemsTotalPages}</span>
                        <button
                            onClick={() => setPage(Math.min(itemsTotalPages, safePage + 1))}
                            disabled={safePage >= itemsTotalPages}
                            className="px-3 py-1 border border-slate-300 rounded disabled:opacity-50"
                        >
                            Siguiente
                        </button>
                    </div>
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
                                                    <option key={d.id} value={String(d.id)}>
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
                                                    <option key={p.id} value={String(p.id)}>
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
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad *</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={form.cantidad}
                                                onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
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
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Precio unidad</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={form.precioUnidad}
                                            onChange={(e) => setForm({ ...form, precioUnidad: e.target.value })}
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
            {showEditItem && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-auto p-4">
                    <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-slate-900">Editar item</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowEditItem(false)}
                                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 text-sm font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={savingEdit}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-60"
                                >
                                    {savingEdit ? 'Guardando...' : 'Guardar cambios'}
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                                <input
                                    value={editForm.nombre}
                                    onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                                <select
                                    value={editForm.categoria}
                                    onChange={(e) => setEditForm({ ...editForm, categoria: e.target.value })}
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
                                <label className="block text-sm font-medium text-slate-700 mb-1">Unidad *</label>
                                <input
                                    value={editForm.unidad}
                                    onChange={(e) => setEditForm({ ...editForm, unidad: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Stock *</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editForm.stock}
                                    onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Stock minimo</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editForm.stockMinimo}
                                    onChange={(e) => setEditForm({ ...editForm, stockMinimo: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Precio unidad</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editForm.precioUnidad}
                                    onChange={(e) => setEditForm({ ...editForm, precioUnidad: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                                <input
                                    value={editForm.sku}
                                    onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor</label>
                                <input
                                    value={editForm.proveedor}
                                    onChange={(e) => setEditForm({ ...editForm, proveedor: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Deposito</label>
                                <input
                                    value={editForm.deposito}
                                    onChange={(e) => setEditForm({ ...editForm, deposito: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Comprobante</label>
                                <input
                                    value={editForm.comprobante}
                                    onChange={(e) => setEditForm({ ...editForm, comprobante: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">IVA</label>
                                <select
                                    value={editForm.iva}
                                    onChange={(e) => setEditForm({ ...editForm, iva: e.target.value })}
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
                                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha ingreso</label>
                                <input
                                    type="date"
                                    value={editForm.fechaIngreso}
                                    onChange={(e) => setEditForm({ ...editForm, fechaIngreso: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex items-center gap-2 mt-6">
                                <input
                                    id="edit-activo"
                                    type="checkbox"
                                    checked={editForm.activo}
                                    onChange={(e) => setEditForm({ ...editForm, activo: e.target.checked })}
                                    className="h-4 w-4 text-blue-600 border-slate-300 rounded"
                                />
                                <label htmlFor="edit-activo" className="text-sm text-slate-700">Activo</label>
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
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowNewSalida((prev) => !prev)}
                                    className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 text-sm font-medium"
                                >
                                    {showNewSalida ? 'Cancelar salida' : 'Nueva salida'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowSalidas(false);
                                        setShowNewSalida(false);
                                    }}
                                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 text-sm font-medium"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-5 space-y-5">
                            {showNewSalida && (
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                                    <h3 className="text-sm font-bold text-slate-700 uppercase">Registrar salida</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Item *</label>
                                            <select
                                                value={salidaForm.itemId}
                                                onChange={(e) => setSalidaForm({ ...salidaForm, itemId: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Seleccionar item</option>
                                                {items.map((it) => (
                                                    <option key={it.id} value={String(it.id)}>
                                                        {it.nombre} - Stock: {it.cantidad.toFixed(2)} {it.unidad}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                                            <input
                                                type="date"
                                                value={salidaForm.fecha}
                                                onChange={(e) => setSalidaForm({ ...salidaForm, fecha: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1"># Interno</label>
                                            <input
                                                value={salidaForm.interno}
                                                onChange={(e) => setSalidaForm({ ...salidaForm, interno: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Solicitado por</label>
                                            <input
                                                value={salidaForm.solicitado}
                                                onChange={(e) => setSalidaForm({ ...salidaForm, solicitado: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad *</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={salidaForm.cantidad}
                                                onChange={(e) => setSalidaForm({ ...salidaForm, cantidad: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            {salidaSelectedItem && (
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Disponible: {salidaSelectedItem.cantidad.toFixed(2)} {salidaSelectedItem.unidad}
                                                </p>
                                            )}
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
                                            <input
                                                value={salidaForm.observaciones}
                                                onChange={(e) => setSalidaForm({ ...salidaForm, observaciones: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleSaveSalida}
                                            disabled={savingSalida}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-60"
                                        >
                                            {savingSalida ? 'Guardando...' : 'Guardar salida'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
                                <h3 className="text-sm font-bold text-slate-700 uppercase">Salidas inventario</h3>

                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-slate-600">Mostrar</label>
                                        <select
                                            value={salidasRows}
                                            onChange={(e) => {
                                                setSalidasRows(Number(e.target.value));
                                                setSalidasPage(1);
                                            }}
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
                                            onChange={(e) => {
                                                setSalidasSearch(e.target.value);
                                                setSalidasPage(1);
                                            }}
                                            className="px-3 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                                        />
                                        <button
                                            onClick={exportSalidasExcel}
                                            className="px-3 py-1.5 bg-cyan-500 text-white text-sm font-medium rounded hover:bg-cyan-600 transition-colors"
                                        >
                                            Excel
                                        </button>
                                        <button
                                            onClick={exportSalidasPdf}
                                            className="px-3 py-1.5 bg-cyan-500 text-white text-sm font-medium rounded hover:bg-cyan-600 transition-colors"
                                        >
                                            Pdf
                                        </button>
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
                                            {loadingSalidas && (
                                                <tr>
                                                    <td className="px-4 py-3 text-sm text-slate-500" colSpan={5}>Cargando salidas...</td>
                                                </tr>
                                            )}
                                            {!loadingSalidas && filteredSalidas.length === 0 && (
                                                <tr>
                                                    <td className="px-4 py-3 text-sm text-slate-500" colSpan={5}>No hay salidas para mostrar</td>
                                                </tr>
                                            )}
                                            {!loadingSalidas && filteredSalidas.map((item, idx) => (
                                                <tr key={`${item.id}-${idx}`} className={idx % 2 === 0 ? 'bg-slate-50/60' : 'bg-white'}>
                                                    <td className="px-4 py-3 text-xs text-slate-600">{item.fecha}</td>
                                                    <td className="px-4 py-3 text-xs text-slate-700 uppercase">{item.producto}</td>
                                                    <td className="px-4 py-3 text-xs text-slate-600">{item.interno}</td>
                                                    <td className="px-4 py-3 text-xs text-slate-600">{item.solicitado}</td>
                                                    <td className="px-4 py-3 text-xs text-right text-slate-700">
                                                        {item.cantidad.toFixed(2)} {item.unidad}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex items-center justify-between text-sm text-slate-600">
                                    <span>
                                        Mostrando registros del {salidasTotal === 0 ? 0 : salidasStart + 1} al {Math.min(salidasEnd, salidasTotal)} de un total de {salidasTotal} registros
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setSalidasPage(Math.max(1, safeSalidasPage - 1))}
                                            disabled={safeSalidasPage <= 1}
                                            className="px-3 py-1 border border-slate-300 rounded disabled:opacity-50"
                                        >
                                            Anterior
                                        </button>
                                        <span>{safeSalidasPage}/{salidasTotalPages}</span>
                                        <button
                                            onClick={() => setSalidasPage(Math.min(salidasTotalPages, safeSalidasPage + 1))}
                                            disabled={safeSalidasPage >= salidasTotalPages}
                                            className="px-3 py-1 border border-slate-300 rounded disabled:opacity-50"
                                        >
                                            Siguiente
                                        </button>
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

export default Inventory;
