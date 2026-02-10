import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Car, User, AlertCircle, Bookmark, FileText, Calendar, Clock, Save, X } from 'lucide-react';
import { createExternalPurchaseFromWorkOrder, createWorkOrder, fetchVehiculos, fetchUsuariosLite, fetchProveedoresLite, supabase, updateWorkOrder, uploadWorkOrderBudget } from '../services/supabase';

interface WorkOrderFormProps {
    onBack: () => void;
}

// Formulario complejo para crear/confirmar órdenes de trabajo, subir presupuesto y vincular compras.
const WorkOrderForm: React.FC<WorkOrderFormProps> = ({ onBack }) => {
    const [form, setForm] = useState({
        vehiculoId: '',
        fueraServicio: 'no',
        responsableId: '',
        prioridad: '',
        tipo: '',
        estado: 'abierta',
        fechaVto: '',
        ingresoFecha: '',
        ingresoHora: '',
        ingresoMin: '',
        salidaFecha: '',
        salidaHora: '',
        salidaMin: '',
        trabajo: '',
        proveedorId: '',
        proveedorOrigen: '',
        externalAmount: '',
    });
    const [vehiculos, setVehiculos] = useState<any[]>([]);
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [proveedores, setProveedores] = useState<any[]>([]);
    const [budgetFile, setBudgetFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        const load = async () => {
            const [{ data: vehs }, { data: users }, { data: provs }] = await Promise.all([
                fetchVehiculos(),
                fetchUsuariosLite(),
                fetchProveedoresLite(),
            ]);
            setVehiculos(vehs || []);
            setUsuarios(users || []);
            setProveedores(provs || []);
        };
        load();
    }, []);

    const buildDateTime = (date?: string, hour?: string, min?: string) => {
        if (!date) return null;
        const h = hour ? String(hour).padStart(2, '0') : '00';
        const m = min ? String(min).padStart(2, '0') : '00';
        return `${date}T${h}:${m}:00`;
    };

    const filteredProveedores = proveedores.filter((p) => {
        if (!form.proveedorOrigen) return true;
        const origen = form.proveedorOrigen.toLowerCase();
        if (origen === 'externo') return !!p.es_externo || (p.tipo || '').toLowerCase().includes('externo');
        if (origen === 'local') return !!p.es_local || (p.tipo || '').toLowerCase().includes('local');
        return true;
    });

    const [vehiculoInternoSearch, setVehiculoInternoSearch] = useState('');
    const [responsableSearch, setResponsableSearch] = useState('');
    const filteredVehiculos = useMemo(() => {
        const term = vehiculoInternoSearch.trim();
        if (!term) return vehiculos;
        return vehiculos.filter((v) => (v.num_int || '').toLowerCase().includes(term.toLowerCase()));
    }, [vehiculos, vehiculoInternoSearch]);

    const filteredResponsables = useMemo(() => {
        const term = responsableSearch.trim().toLowerCase();
        if (!term) return usuarios;
        return usuarios.filter((u) => `${u.nombre || ''}`.toLowerCase().includes(term));
    }, [usuarios, responsableSearch]);

    useEffect(() => {
        const term = vehiculoInternoSearch.trim();
        if (!term) return;
        const match = vehiculos.find((v) => (v.num_int || '').toLowerCase() === term.toLowerCase());
        if (match && form.vehiculoId !== match.id) {
            setForm((prev) => ({ ...prev, vehiculoId: match.id }));
        }
    }, [vehiculoInternoSearch, vehiculos, form.vehiculoId]);

    useEffect(() => {
        const term = responsableSearch.trim().toLowerCase();
        if (!term) return;
        const match = usuarios.find((u) => (u.nombre || '').toLowerCase().includes(term));
        if (match && form.responsableId !== match.id) {
            setForm((prev) => ({ ...prev, responsableId: match.id }));
        }
    }, [responsableSearch, usuarios, form.responsableId]);

    const selectedProveedor = proveedores.find((p) => p.id === form.proveedorId);
    const isExternal = !!selectedProveedor?.es_externo;

    const handleSave = async (mode: 'save' | 'confirm') => {
        if (!form.tipo || !form.trabajo.trim()) {
            alert('Completa el tipo y el trabajo a realizar antes de continuar.');
            return;
        }
        if (isExternal && (!form.externalAmount || Number(form.externalAmount) <= 0)) {
            alert('Debe ingresar un monto externo mayor a 0.');
            return;
        }
        if (mode === 'confirm') {
            setConfirming(true);
        } else {
            setSaving(true);
        }
        let presupuesto_url: string | null = null;
        try {
            if (budgetFile) {
                const isPdf = budgetFile.type === 'application/pdf' || budgetFile.name.toLowerCase().endsWith('.pdf');
                if (!isPdf) {
                    alert('El archivo de presupuesto debe ser PDF.');
                    setSaving(false);
                    setConfirming(false);
                    return;
                }
                if (budgetFile.size > 10 * 1024 * 1024) {
                    alert('El PDF supera el maximo permitido (10MB).');
                    setSaving(false);
                    setConfirming(false);
                    return;
                }
                presupuesto_url = await uploadWorkOrderBudget(budgetFile);
            }
        } catch (err) {
            console.error('Error subiendo presupuesto', err);
            alert('No se pudo subir el PDF de presupuesto. Verifica el bucket y permisos.');
            setSaving(false);
            setConfirming(false);
            return;
        }

        const fecha_inicio = buildDateTime(form.ingresoFecha, form.ingresoHora, form.ingresoMin);
        const fecha_fin = buildDateTime(form.salidaFecha || form.fechaVto, form.salidaHora, form.salidaMin);
        const prioridadValue = (form.prioridad || 'media').toLowerCase();
        const estadoValue = mode === 'confirm' ? 'abierta' : (form.estado || 'abierta');
        const { data, error } = await createWorkOrder({
            numero: null,
            titulo: form.tipo,
            descripcion: `${form.trabajo}${form.fueraServicio === 'si' ? ' | Fuera de servicio' : ''}`,
            estado: estadoValue,
            prioridad: prioridadValue,
            vehiculo_id: form.vehiculoId || null,
            fecha_inicio,
            fecha_fin,
            responsable_id: form.responsableId || null,
            proveedor_id: form.proveedorId || null,
            presupuesto_url,
            external_amount: isExternal ? Number(form.externalAmount) : null,
        });
        setSaving(false);
        setConfirming(false);
        if (error) {
            console.error('Error guardando OT', error);
            alert('No se pudo guardar la orden de trabajo. Revisa politicas de insercion en "ordenes_trabajo" y la columna presupuesto_url.');
            return;
        }
        if (mode === 'confirm' && data?.id) {
            const { error: rpcError } = await createExternalPurchaseFromWorkOrder(data.id);
            if (rpcError) {
                console.error('Error creando compra externa', rpcError);
                alert('La OT se guardo en estado Pendiente, pero no se pudo generar la compra externa. Revisar permisos y RPC.');
                return;
            }
            const { error: statusError } = await updateWorkOrder(data.id, { estado: 'confirmada' });
            if (statusError) {
                console.error('Error actualizando estado a confirmada', statusError);
                alert('Se genero la compra externa, pero no se pudo actualizar el estado de la OT a Confirmada.');
                return;
            }
            const { error: emailError } = await supabase.functions.invoke('send-email-outbox');
            if (emailError) {
                console.warn('No se pudo enviar email de autorizacion', emailError);
            }
        }
        onBack();
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <ClipboardList className="text-blue-500" size={24} />
                        NUEVA ORDEN DE TRABAJO
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Cree una nueva orden de trabajo para mantenimiento o reparaci�n.</p>
                </div>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">

                {/* Row 1: Veh�culo & Fuera de Servicio */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-3 space-y-1.5">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                            <Car size={14} className="text-slate-400" />
                            Seleccione el vehiculo
                    </label>
                    <input
                        type="text"
                        value={vehiculoInternoSearch}
                        onChange={(e) => setVehiculoInternoSearch(e.target.value)}
                        placeholder="Filtrar por número interno"
                        className="w-full h-9 px-3 mb-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <select
                        value={form.vehiculoId}
                            onChange={(e) => setForm({ ...form, vehiculoId: e.target.value })}
                            className="w-full h-11 px-4 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 transition-all"
                        >
                            <option value="">No corresponde</option>
                            {filteredVehiculos.map((v) => (
                            <option key={v.id} value={v.id}>
                                {v.patente} {v.marca ? `- ${v.marca}` : ''} {v.modelo ? `(${v.modelo})` : ''}{' '}
                                {v.num_int ? `| Interno ${v.num_int}` : ''}
                            </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-xs font-bold text-rose-500 uppercase tracking-wide">
                            <AlertCircle size={14} className="text-rose-400" />
                            Fuera de servicio?
                        </label>
                        <select
                            value={form.fueraServicio}
                            onChange={(e) => setForm({ ...form, fueraServicio: e.target.value })}
                            className="w-full h-11 px-4 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-700 transition-all"
                        >
                            <option value="no">No</option>
                            <option value="si">Si</option>
                        </select>
                    </div>
                </div>

                {/* Row 2: Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                            <User size={14} className="text-slate-400" />
                            Responsable
                        </label>
                        <input
                            type="text"
                            value={responsableSearch}
                            onChange={(e) => setResponsableSearch(e.target.value)}
                            placeholder="Filtrar por nombre/apellido"
                            className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        <select
                            value={form.responsableId}
                            onChange={(e) => setForm({ ...form, responsableId: e.target.value })}
                            className="w-full h-11 px-4 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 transition-all"
                        >
                            <option value="">Seleccionar</option>
                            {filteredResponsables.map((u) => (
                                <option key={u.id} value={u.id}>{u.nombre || u.email}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                            <AlertCircle size={14} className="text-slate-400" />
                            Prioridad
                        </label>
                        <select
                            value={form.prioridad}
                            onChange={(e) => setForm({ ...form, prioridad: e.target.value })}
                            className="w-full h-11 px-4 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 transition-all"
                        >
                            <option value="">Seleccionar</option>
                            <option value="alta">Alta</option>
                            <option value="media">Media</option>
                            <option value="baja">Baja</option>
                            <option value="critica">Critica</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                            <Bookmark size={14} className="text-slate-400" />
                            Tipo
                        </label>
                        <select
                            value={form.tipo}
                            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                            className="w-full h-11 px-4 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 transition-all"
                        >
                            <option value="">Seleccionar tipo</option>
                            <option value="Correctivo">Correctivo</option>
                            <option value="Preventivo">Preventivo</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                            <ClipboardList size={14} className="text-slate-400" />
                            Estado Ord. Trabajo
                        </label>
                        <select
                            value={form.estado}
                            onChange={(e) => setForm({ ...form, estado: e.target.value })}
                            className="w-full h-11 px-4 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 transition-all"
                        >
                            <option value="abierta">Pendiente</option>
                            <option value="en_progreso">En Proceso</option>
                            <option value="pausada">Pausada</option>
                            <option value="cerrada">Finalizada</option>
                        </select>
                    </div>
                </div>

                {/* Row 3: Fechas y Horarios */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                            <Calendar size={14} className="text-slate-400" />
                            Fecha Vencimiento
                        </label>
                        <input
                            type="date"
                            value={form.fechaVto}
                            onChange={(e) => setForm({ ...form, fechaVto: e.target.value })}
                            className="w-full h-11 px-4 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-500 transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                            <Clock size={14} className="text-slate-400" />
                            Ingreso (fecha/hs/min)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={form.ingresoFecha}
                                onChange={(e) => setForm({ ...form, ingresoFecha: e.target.value })}
                                className="flex-1 h-11 px-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-600 transition-all"
                            />
                            <select
                                value={form.ingresoHora}
                                onChange={(e) => setForm({ ...form, ingresoHora: e.target.value })}
                                className="w-20 h-11 px-2 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-600"
                            >
                                <option value="">Hs.</option>
                                {Array.from({ length: 24 }, (_, i) => <option key={i} value={String(i).padStart(2, '0')}>{String(i).padStart(2, '0')}</option>)}
                            </select>
                            <select
                                value={form.ingresoMin}
                                onChange={(e) => setForm({ ...form, ingresoMin: e.target.value })}
                                className="w-20 h-11 px-2 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-600"
                            >
                                <option value="">Min.</option>
                                {Array.from({ length: 60 }, (_, i) => <option key={i} value={String(i).padStart(2, '0')}>{String(i).padStart(2, '0')}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                            <Clock size={14} className="text-slate-400" />
                            Salida (fecha/hs/min)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={form.salidaFecha}
                                onChange={(e) => setForm({ ...form, salidaFecha: e.target.value })}
                                className="flex-1 h-11 px-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-600 transition-all"
                            />
                            <select
                                value={form.salidaHora}
                                onChange={(e) => setForm({ ...form, salidaHora: e.target.value })}
                                className="w-20 h-11 px-2 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-600"
                            >
                                <option value="">Hs.</option>
                                {Array.from({ length: 24 }, (_, i) => <option key={i} value={String(i).padStart(2, '0')}>{String(i).padStart(2, '0')}</option>)}
                            </select>
                            <select
                                value={form.salidaMin}
                                onChange={(e) => setForm({ ...form, salidaMin: e.target.value })}
                                className="w-20 h-11 px-2 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-600"
                            >
                                <option value="">Min.</option>
                                {Array.from({ length: 60 }, (_, i) => <option key={i} value={String(i).padStart(2, '0')}>{String(i).padStart(2, '0')}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Row 4: Trabajo a realizar */}
                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                        <FileText size={14} className="text-slate-400" />
                        Trabajo a realizar
                    </label>
                    <textarea
                        value={form.trabajo}
                        onChange={(e) => setForm({ ...form, trabajo: e.target.value })}
                        className="w-full h-40 p-4 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400 resize-none transition-all"
                        placeholder="Ej.: Se quedo sin embrague, llevar a taller"
                    ></textarea>
                </div>

                {/* Row 5: Presupuesto PDF */}
                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                        <FileText size={14} className="text-slate-400" />
                        Cargar Presupuesto (PDF)
                    </label>
                    <div className="relative">
                        <input
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={(e) => setBudgetFile(e.target.files?.[0] || null)}
                            className="w-full h-11 px-4 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-600 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Formato permitido: PDF (máx. 10MB). Se subirá al guardar.</p>
                </div>

                {/* Row 6: Proveedores */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                        <Bookmark size={14} className="text-slate-400" />
                        Proveedor
                    </label>
                    <div className="flex gap-4 items-center text-sm text-slate-700">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={form.proveedorOrigen === 'externo'}
                                onChange={(e) => setForm({ ...form, proveedorOrigen: e.target.checked ? 'externo' : '' })}
                                className="h-4 w-4"
                            />
                            Externo
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={form.proveedorOrigen === 'local'}
                                onChange={(e) => setForm({ ...form, proveedorOrigen: e.target.checked ? 'local' : '' })}
                                className="h-4 w-4"
                            />
                            Local
                        </label>
                    </div>
                    <select
                        value={form.proveedorId}
                        onChange={(e) => {
                            const proveedorId = e.target.value;
                            const proveedor = proveedores.find((p) => p.id === proveedorId);
                            setForm((prev) => ({
                                ...prev,
                                proveedorId,
                                externalAmount: proveedor?.es_externo ? prev.externalAmount : '',
                            }));
                        }}
                        className="w-full h-11 px-4 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 transition-all"
                    >
                        <option value="">Seleccionar proveedor</option>
                        {filteredProveedores.map((p) => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                    </select>
                    <p className="text-xs text-slate-500">Si no se filtra, se muestran todos. El filtro usa el campo "tipo" o "es_externo" del proveedor.</p>
                </div>

                {isExternal && (
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                            <Bookmark size={14} className="text-slate-400" />
                            Monto externo
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.externalAmount}
                            onChange={(e) => setForm({ ...form, externalAmount: e.target.value })}
                            className="w-full h-11 px-4 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 transition-all"
                            placeholder="0.00"
                        />
                    </div>
                )}

                {/* Footer Buttons */}
                <div className="pt-6 border-t border-slate-100 flex gap-4">
                    {!isExternal && (
                        <button
                            onClick={() => handleSave('save')}
                            disabled={saving || confirming}
                            className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 transform active:scale-95"
                        >
                            <Save size={18} />
                            {saving ? 'Guardando...' : 'Cargar Orden de Trabajo'}
                        </button>
                    )}
                    {isExternal && (
                        <button
                            onClick={() => handleSave('confirm')}
                            disabled={saving || confirming}
                            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 transform active:scale-95"
                        >
                            <Save size={18} />
                            {confirming ? 'Confirmando...' : 'Confirmar OT'}
                        </button>
                    )}
                    <button
                        onClick={onBack}
                        className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 transform active:scale-95"
                    >
                        <X size={18} />
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkOrderForm;
