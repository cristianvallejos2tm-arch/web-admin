import React, { useEffect, useMemo, useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { createPanolEntrega, fetchPanolEntregas, fetchPanoles, fetchBases, fetchUnidades } from '../services/supabase';

// Área de paños: lista entregas recientes, filtra y registra nuevas salidas hacia base/paño.
const Panol: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [showEntrega, setShowEntrega] = useState(false);
    const [loading, setLoading] = useState(false);
    const [listError, setListError] = useState('');
    const [saveError, setSaveError] = useState('');
    const [entregas, setEntregas] = useState<any[]>([]);
    const [panolOptions, setPanolOptions] = useState<any[]>([]);
    const [baseOptions, setBaseOptions] = useState<any[]>([]);
    const [unidadOptions, setUnidadOptions] = useState<any[]>([]);
    const panolFallback = useMemo(
        () => [
            { id: 'panol-caleta-olivia', nombre: 'Pañol Caleta Olivia' },
            { id: 'panol-las-heras', nombre: 'Pañol Las Heras' },
        ],
        []
    );
    const baseFallback = useMemo(
        () => [
            { id: 'Caleta Olivia', nombre: 'Caleta Olivia' },
            { id: 'Las Heras', nombre: 'Las Heras' },
            { id: 'Koluel Kayke', nombre: 'Koluel Kayke' },
            { id: 'Administracion', nombre: 'Administracion' },
            { id: 'Valle Hermoso', nombre: 'Valle Hermoso' },
            { id: 'Escalante', nombre: 'Escalante' },
            { id: 'Cuadrado', nombre: 'Cuadrado' },
            { id: 'Cerro Dragon', nombre: 'Cerro Dragon' },
            { id: 'Añelo', nombre: 'Añelo' },
            { id: 'Nequen', nombre: 'Nequen' },
            { id: 'Todas', nombre: 'Todas' },
        ],
        []
    );
    const panolDisplay = panolOptions.length ? panolOptions : panolFallback;
    const baseDisplay = baseOptions.length ? baseOptions : baseFallback;
    const [form, setForm] = useState({
        fecha: '',
        panol: '',
        base: '',
        interno: '',
        recibe: '',
        lugar: '',
        descripcion: '',
        cantidad: '',
        unidad: '',
    });
    const [saving, setSaving] = useState(false);

    const loadCatalogs = async () => {
        const [{ data: panoles }, { data: bases }, { data: unidades }] = await Promise.all([
            fetchPanoles(),
            fetchBases(),
            fetchUnidades(),
        ]);
        setPanolOptions(panoles || []);
        setBaseOptions(bases || []);
        setUnidadOptions(unidades || []);
    };

    const loadEntregas = async () => {
        setLoading(true);
        setListError('');
        const { data, error } = await fetchPanolEntregas();
        if (error) {
            setListError(error.message || 'No se pudieron cargar las entregas.');
        } else {
            setEntregas(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadCatalogs();
        loadEntregas();
    }, []);

    const isUuid = (v: string) => /^[0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{12}$/.test(v);
    const findByIdOrName = (collection: any[], value: string, requireUuid = false) => {
        if (!value) return null;
        const hit = collection.find((c) => c.id === value || c.nombre === value);
        const id = hit?.id || null;
        if (requireUuid && id && !isUuid(id)) return null;
        return id;
    };

    const labelFrom = (collection: any[], id: string, fallbackValue?: string) => {
        const hit = collection.find((c) => c.id === id || c.nombre === id);
        return hit?.nombre || fallbackValue || id || '';
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveError('');
        const payload = {
            fecha: form.fecha,
            panol_id: findByIdOrName(panolDisplay, form.panol, true),
            base_id: findByIdOrName(baseDisplay, form.base, true),
            interno: form.interno,
            recibe: form.recibe,
            lugar_entrega: form.lugar,
            descripcion: form.descripcion,
            cantidad: form.cantidad ? Number(form.cantidad) : null,
            unidad_id: findByIdOrName(unidadOptions, form.unidad, true),
        };
        const { error } = await createPanolEntrega(payload);
        if (error) {
            setSaveError(error.message || 'No se pudo guardar la entrega.');
            setSaving(false);
            return;
        }
        await loadEntregas();
        setSaving(false);
        setShowEntrega(false);
        setForm({
            fecha: '',
            panol: '',
            base: '',
            interno: '',
            recibe: '',
            lugar: '',
            descripcion: '',
            cantidad: '',
            unidad: '',
        });
    };

    const filteredEntregas = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return (entregas || [])
            .filter((e) =>
                [e.fecha, e.recibe, e.lugar_entrega, e.descripcion, e.interno]
                    .map((v) => (v || '').toString().toLowerCase())
                    .some((v) => v.includes(term))
            )
            .slice(0, rowsPerPage);
    }, [entregas, searchTerm, rowsPerPage]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-blue-600">Panol</h1>
                <button
                    onClick={() => setShowEntrega(true)}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium text-sm"
                >
                    <ChevronRight size={16} />
                    Entregar
                </button>
            </div>

            {/* List Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">ENTREGA DE MATERIALES</h2>

                {listError && <div className="text-sm text-red-600">{listError}</div>}
                {!loading && !listError && entregas.length === 0 && (
                    <p className="text-slate-500 text-sm">No hay items para listar</p>
                )}

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
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase flex items-center gap-1">Fecha</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Base</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Pañol</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase"># Int.</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Recibe</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Lugar Entrega</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Descripcion</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Cant.</th>
                                <th className="px-4 py-3 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && (
                                <tr>
                                    <td colSpan={9} className="px-6 py-4 text-center text-sm text-slate-500 border-b border-slate-200">
                                        Cargando...
                                    </td>
                                </tr>
                            )}
                            {!loading && filteredEntregas.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-6 py-4 text-center text-sm text-slate-500 border-b border-slate-200">
                                        Ningun dato disponible en esta tabla
                                    </td>
                                </tr>
                            )}
                            {!loading &&
                                filteredEntregas.map((item) => (
                                    <tr key={item.id} className="bg-white">
                                        <td className="px-4 py-3 text-xs font-medium text-slate-700">{item.fecha || ''}</td>
                                        <td className="px-4 py-3 text-xs text-slate-600">
                                            {labelFrom(
                                                baseDisplay,
                                                item.base_id,
                                                item.base_nombre || item.base
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600">
                                            {labelFrom(
                                                panolDisplay,
                                                item.panol_id,
                                                item.panol_nombre || item.panol
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600">{item.interno}</td>
                                        <td className="px-4 py-3 text-xs text-slate-600">{item.recibe}</td>
                                        <td className="px-4 py-3 text-xs text-slate-600">{item.lugar_entrega}</td>
                                        <td className="px-4 py-3 text-xs text-slate-600">{item.descripcion}</td>
                                        <td className="px-4 py-3 text-xs text-slate-600">
                                            {item.cantidad} {labelFrom(unidadOptions, item.unidad_id)}
                                        </td>
                                        <td></td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <p className="text-xs text-slate-500">
                        Mostrando registros del 1 al {filteredEntregas.length} de un total de {entregas.length} registros
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="text-xs text-slate-500 hover:text-slate-700 px-2">Anterior</button>
                        <button className="text-xs text-slate-500 hover:text-slate-700 px-2">Siguiente</button>
                    </div>
                </div>
            </div>

            {showEntrega && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-auto p-4">
                    <div className="bg-white w-full max-w-6xl rounded-2xl shadow-xl border border-slate-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-slate-900">Nueva entrega de materiales</h2>
                            <button
                                onClick={() => setShowEntrega(false)}
                                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 text-sm font-medium"
                            >
                                Cerrar
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-5">
                            <div className="border border-slate-200 rounded-lg">
                                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                                    <span className="text-sm font-semibold text-slate-800">Nueva entrega de materiales</span>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Fecha Entrega</label>
                                            <input
                                                type="date"
                                                value={form.fecha}
                                                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Pañol</label>
                                            <select
                                                value={form.panol}
                                                onChange={(e) => setForm({ ...form, panol: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Seleccionar</option>
                                                {panolDisplay.map((opt) => (
                                                    <option key={opt.id} value={opt.id}>
                                                        {opt.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Base</label>
                                            <select
                                                value={form.base}
                                                onChange={(e) => setForm({ ...form, base: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Seleccionar</option>
                                                {baseDisplay.map((opt) => (
                                                    <option key={opt.id} value={opt.id}>
                                                        {opt.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1"># Int.</label>
                                            <input
                                                value={form.interno}
                                                onChange={(e) => setForm({ ...form, interno: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Ej: INT-001"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Quien recibe?</label>
                                            <input
                                                value={form.recibe}
                                                onChange={(e) => setForm({ ...form, recibe: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Campo obligatorio"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Lugar de entrega</label>
                                            <input
                                                value={form.lugar}
                                                onChange={(e) => setForm({ ...form, lugar: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Lugar"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-3">
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">Descripcion del material, herramienta y/o equipo</label>
                                            <textarea
                                                value={form.descripcion}
                                                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                                            />
                                        </div>
                                        <div className="space-y-4">
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
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-800 mb-1">Unidad</label>
                                                <select
                                                    value={form.unidad}
                                                    onChange={(e) => setForm({ ...form, unidad: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Seleccionar</option>
                                                    {unidadOptions.map((opt) => (
                                                        <option key={opt.id} value={opt.id}>
                                                            {opt.nombre}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 pt-2">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 text-sm font-medium disabled:opacity-60"
                                        >
                                            {saving ? 'Guardando...' : 'Cargar nuevo egreso'}
                                        </button>
                                        {saveError && <span className="text-sm text-red-600">{saveError}</span>}
                                        <button
                                            onClick={() => setShowEntrega(false)}
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
        </div>
    );
};

export default Panol;
