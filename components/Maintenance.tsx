import React, { useEffect, useState } from 'react';
import { Calendar, Trash2, Edit2, RefreshCw } from 'lucide-react';
import { createMaintenance, fetchMaintenances, fetchVehiculos, updateMaintenance, deleteMaintenance } from '../services/supabase';

interface MaintenancePlan {
    id: string;
    descripcion: string | null;
    tipo: string | null;
    estado: string | null;
    fecha_programada?: string | null;
    vehiculos?: {
        id: string;
        patente: string;
        marca?: string | null;
        modelo?: string | null;
    } | null;
}

const TriggerCard = ({
    title,
    unit,
    isActive,
    toggleActive,
    valueMain,
    valueWarn,
    onChangeMain,
    onChangeWarn,
}: {
    title: string;
    unit: string;
    isActive: boolean;
    toggleActive: () => void;
    valueMain: string;
    valueWarn: string;
    onChangeMain: (v: string) => void;
    onChangeWarn: (v: string) => void;
}) => {
    return (
        <div className={`p-4 border rounded-xl transition-all ${isActive ? 'bg-white border-blue-200 shadow-md ring-1 ring-blue-100' : 'bg-slate-50 border-slate-200 opacity-80'}`}>
            <div className="flex items-center gap-2 mb-4">
                <input
                    type="checkbox"
                    checked={isActive}
                    onChange={toggleActive}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</span>
            </div>

            <div className={`space-y-4 ${!isActive && 'opacity-50 pointer-events-none'}`}>
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Esta tarea se realiza cada</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={valueMain}
                            onChange={(e) => onChangeMain(e.target.value)}
                            placeholder={`Ej. ${unit === 'Días' ? '90' : unit === 'Horas' ? '500' : '5000'}`}
                            className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="p-2 bg-slate-100 border border-slate-200 rounded text-xs px-3 font-medium text-slate-600 min-w-[60px] text-center">{unit}</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Preaviso a los</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={valueWarn}
                            onChange={(e) => onChangeWarn(e.target.value)}
                            placeholder={`Ej. ${unit === 'Días' ? '7' : unit === 'Horas' ? '50' : '300'}`}
                            className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="p-2 bg-slate-100 border border-slate-200 rounded text-xs px-3 font-medium text-slate-600 min-w-[60px] text-center">{unit}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Maintenance: React.FC = () => {
    const [triggers, setTriggers] = useState({ date: true, hours: false, km: false });
    const [triggerValues, setTriggerValues] = useState({
        date: { main: '', warn: '' },
        hours: { main: '', warn: '' },
        km: { main: '', warn: '' },
    });
    const [form, setForm] = useState({
        nombre: '',
        tipo: 'preventivo',
        vehiculoId: '',
        fechaProgramada: '',
    });
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [plans, setPlans] = useState<MaintenancePlan[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingEstado, setEditingEstado] = useState<string>('programado');
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        const [{ data: vehs }, { data: mts, error: mErr }] = await Promise.all([fetchVehiculos(), fetchMaintenances()]);
        setLoading(false);
        setVehicles(vehs || []);
        if (mErr) {
            console.error('Error cargando mantenimientos', mErr);
            setError('No se pudieron cargar los mantenimientos programados. Revisa permisos/RLS en "mantenimientos".');
            setPlans([]);
        } else {
            setError(null);
            setPlans((mts as any[]) || []);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const buildDescripcion = () => {
        const parts: string[] = [];
        if (triggers.date && triggerValues.date.main) parts.push(`Fecha cada ${triggerValues.date.main} días (aviso ${triggerValues.date.warn || '-'} d)`);
        if (triggers.hours && triggerValues.hours.main) parts.push(`Horas cada ${triggerValues.hours.main} (aviso ${triggerValues.hours.warn || '-'} h)`);
        if (triggers.km && triggerValues.km.main) parts.push(`KM cada ${triggerValues.km.main} (aviso ${triggerValues.km.warn || '-'} km)`);
        const base = form.nombre || 'Plan de mantenimiento';
        return parts.length ? `${base} | ${parts.join(' | ')}` : base;
    };

    const handleSave = async () => {
        if (!form.nombre.trim()) {
            setError('Ingresa un nombre para el plan.');
            return;
        }
        if (!form.vehiculoId) {
            setError('Selecciona un vehículo.');
            return;
        }
        setError(null);
        setSaving(true);
        const payload = {
            vehiculo_id: form.vehiculoId,
            tipo: form.tipo,
            descripcion: buildDescripcion(),
            estado: 'programado',
            fecha_programada: form.fechaProgramada || null,
            kilometraje_objetivo: triggers.km && triggerValues.km.main ? Number(triggerValues.km.main) || null : null,
        };
        const { error: insertError } = await createMaintenance(payload);
        setSaving(false);
        if (insertError) {
            console.error('Error guardando mantenimiento', insertError);
            setError(insertError.message || 'No se pudo guardar el plan. Revisa permisos/RLS en "mantenimientos".');
            return;
        }
        setForm({ nombre: '', tipo: 'preventivo', vehiculoId: '', fechaProgramada: '' });
        setTriggerValues({ date: { main: '', warn: '' }, hours: { main: '', warn: '' }, km: { main: '', warn: '' } });
        setTriggers({ date: true, hours: false, km: false });
        loadData();
    };

    const handleEditEstado = async (plan: MaintenancePlan) => {
        const estado = editingEstado || plan.estado || 'programado';
        const { error: updError } = await updateMaintenance(plan.id, { estado });
        if (updError) {
            console.error('Error actualizando mantenimiento', updError);
            setError(updError.message || 'No se pudo actualizar el estado. Revisa permisos/RLS en "mantenimientos".');
            return;
        }
        setError(null);
        setEditingId(null);
        loadData();
    };

    const handleDelete = async (plan: MaintenancePlan) => {
        const { error: delError } = await deleteMaintenance(plan.id);
        if (delError) {
            console.error('Error eliminando mantenimiento', delError);
            setError(delError.message || 'No se pudo eliminar. Revisa permisos/RLS en "mantenimientos".');
            return;
        }
        setError(null);
        setConfirmDeleteId(null);
        loadData();
    };

    const handleDuplicate = async (plan: MaintenancePlan) => {
        const { error: dupError } = await createMaintenance({
            vehiculo_id: plan.vehiculos?.id || '',
            tipo: plan.tipo || 'preventivo',
            descripcion: plan.descripcion ? `${plan.descripcion} (copia)` : 'Plan de mantenimiento (copia)',
            estado: 'programado',
            fecha_programada: plan.fecha_programada || null,
            kilometraje_objetivo: null,
        });
        if (dupError) {
            console.error('Error duplicando mantenimiento', dupError);
            setError(dupError.message || 'No se pudo duplicar. Revisa permisos/RLS en "mantenimientos".');
            return;
        }
        setError(null);
        loadData();
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-blue-600">Mantenimiento</h1>
            </div>

            {/* Form Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 mb-6">Programar nuevo plan</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Nombre</label>
                        <input
                            type="text"
                            value={form.nombre}
                            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                            placeholder="Ej. Service 10.000km"
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Mantenimiento</label>
                        <select
                            value={form.tipo}
                            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600"
                        >
                            <option value="preventivo">Preventivo</option>
                            <option value="correctivo">Correctivo</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Vehículo</label>
                        <select
                            value={form.vehiculoId}
                            onChange={(e) => setForm({ ...form, vehiculoId: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600"
                        >
                            <option value="">Seleccionar</option>
                            {vehicles.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.patente} {v.marca ? `- ${v.marca}` : ''} {v.modelo ? ` ${v.modelo}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Fecha programada (opcional)</label>
                        <input
                            type="date"
                            value={form.fechaProgramada}
                            onChange={(e) => setForm({ ...form, fechaProgramada: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Triggers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <TriggerCard
                        title="PROGRAMAR POR FECHA"
                        unit="Días"
                        isActive={triggers.date}
                        toggleActive={() => setTriggers({ ...triggers, date: !triggers.date })}
                        valueMain={triggerValues.date.main}
                        valueWarn={triggerValues.date.warn}
                        onChangeMain={(v) => setTriggerValues({ ...triggerValues, date: { ...triggerValues.date, main: v } })}
                        onChangeWarn={(v) => setTriggerValues({ ...triggerValues, date: { ...triggerValues.date, warn: v } })}
                    />
                    <TriggerCard
                        title="PROGRAMAR POR HORAS"
                        unit="Horas"
                        isActive={triggers.hours}
                        toggleActive={() => setTriggers({ ...triggers, hours: !triggers.hours })}
                        valueMain={triggerValues.hours.main}
                        valueWarn={triggerValues.hours.warn}
                        onChangeMain={(v) => setTriggerValues({ ...triggerValues, hours: { ...triggerValues.hours, main: v } })}
                        onChangeWarn={(v) => setTriggerValues({ ...triggerValues, hours: { ...triggerValues.hours, warn: v } })}
                    />
                    <TriggerCard
                        title="PROGRAMAR POR KM"
                        unit="Kms"
                        isActive={triggers.km}
                        toggleActive={() => setTriggers({ ...triggers, km: !triggers.km })}
                        valueMain={triggerValues.km.main}
                        valueWarn={triggerValues.km.warn}
                        onChangeMain={(v) => setTriggerValues({ ...triggerValues, km: { ...triggerValues.km, main: v } })}
                        onChangeWarn={(v) => setTriggerValues({ ...triggerValues, km: { ...triggerValues.km, warn: v } })}
                    />
                </div>

                {error && (
                    <div className="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                        {error}
                    </div>
                )}

                <div className="flex justify-start">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-sm shadow-blue-500/20 disabled:opacity-70"
                    >
                        {saving ? 'Guardando...' : 'Continuar y Cargar tareas'}
                    </button>
                </div>
            </div>

            {/* List Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">MANTENIMIENTOS PROGRAMADOS</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-16"></th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Detalle</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Vehículo</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-4 text-sm text-slate-500">Cargando...</td></tr>
                            ) : plans.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-4 text-sm text-slate-500">No hay mantenimientos programados.</td></tr>
                            ) : (
                                plans.map((plan) => (
                                    <tr key={plan.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <Calendar size={18} className="text-slate-400" />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-700">{plan.descripcion || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {plan.vehiculos ? `${plan.vehiculos.patente} ${plan.vehiculos.marca || ''} ${plan.vehiculos.modelo || ''}`.trim() : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-3 py-1 bg-green-500 text-white text-[10px] uppercase font-bold rounded-sm">
                                                {plan.estado || 'Programado'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {editingId === plan.id ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <select
                                                        value={editingEstado}
                                                        onChange={(e) => setEditingEstado(e.target.value)}
                                                        className="px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="programado">Programado</option>
                                                        <option value="en_proceso">En proceso</option>
                                                        <option value="completado">Completado</option>
                                                        <option value="cancelado">Cancelado</option>
                                                    </select>
                                                    <button
                                                        onClick={() => handleEditEstado(plan)}
                                                        className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                                    >
                                                        Guardar
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            ) : confirmDeleteId === plan.id ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="text-xs text-slate-600">¿Eliminar?</span>
                                                    <button
                                                        onClick={() => handleDelete(plan)}
                                                        className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                                                    >
                                                        Sí
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDeleteId(null)}
                                                        className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900"
                                                    >
                                                        No
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setConfirmDeleteId(plan.id)}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition-all"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => { setEditingId(plan.id); setEditingEstado(plan.estado || 'programado'); setConfirmDeleteId(null); }}
                                                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded border border-transparent hover:border-blue-200 transition-all"
                                                        title="Editar estado"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDuplicate(plan)}
                                                        className="p-1.5 text-green-500 hover:bg-green-50 rounded border border-transparent hover:border-green-200 transition-all"
                                                        title="Duplicar"
                                                    >
                                                        <RefreshCw size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Maintenance;
