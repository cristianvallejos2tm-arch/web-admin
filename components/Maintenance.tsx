import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock3, Trash2, Edit2, RefreshCw, Link2 } from 'lucide-react';
import {
    assignMaintenancePlanVehicles,
    createMaintenancePlan,
    createMaintenancePlanRules,
    createMaintenancePlanTasks,
    deleteMaintenancePlan,
    fetchMaintenancePlanAssignments,
    fetchMaintenancePlanRules,
    fetchMaintenancePlansV2,
    fetchVehiculos,
    updateMaintenancePlan,
} from '../services/supabase';

interface VehiculoLite {
    id: string;
    patente?: string | null;
    marca?: string | null;
    modelo?: string | null;
    num_int?: string | null;
}

interface PlanRow {
    id: string;
    nombre: string;
    tipo: string;
    estado: string;
    auto_generate_work_order: boolean;
    auto_generate_tasks: boolean;
    created_at?: string;
}

interface AssignmentRow {
    plan_id: string;
    vehiculo_id: string;
}

interface RuleRow {
    id: string;
    plan_id: string;
    rule_type: 'date_exact' | 'date_periodic' | 'hours' | 'km';
    frequency_mode?: 'exacta' | 'periodica';
    schedule_date?: string | null;
    period_value?: number | null;
    period_unit?: 'dias' | 'meses' | 'anios' | null;
    trigger_value?: number | null;
}

interface GroupedPlan {
    id: string;
    nombre: string;
    tipo: string;
    estado: string;
    assignmentsCount: number;
}

const toPositiveNumber = (value: string): number | null => {
    if (!value.trim()) return null;
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed <= 0) return null;
    return parsed;
};

const estadoBadgeClass = (estado?: string | null) => {
    const value = (estado || 'activo').toLowerCase();
    if (value === 'archivado') return 'bg-slate-500 text-white';
    if (value === 'inactivo') return 'bg-amber-500 text-white';
    return 'bg-green-500 text-white';
};

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
}) => (
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
                        placeholder={`Ej. ${unit === 'Dias' ? '90' : unit === 'Horas' ? '500' : '5000'}`}
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
                        placeholder={`Ej. ${unit === 'Dias' ? '7' : unit === 'Horas' ? '50' : '300'}`}
                        className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="p-2 bg-slate-100 border border-slate-200 rounded text-xs px-3 font-medium text-slate-600 min-w-[60px] text-center">{unit}</span>
                </div>
            </div>
        </div>
    </div>
);

const Maintenance: React.FC = () => {
    const [triggers, setTriggers] = useState({ date: true, hours: false, km: false });
    const [triggerValues, setTriggerValues] = useState({
        date: { main: '90', warn: '7' },
        hours: { main: '', warn: '' },
        km: { main: '', warn: '' },
    });
    const [form, setForm] = useState({
        nombre: '',
        tipo: 'preventivo',
        vehiculoId: '',
        fechaProgramada: '',
    });

    const [vehicles, setVehicles] = useState<VehiculoLite[]>([]);
    const [planRows, setPlanRows] = useState<PlanRow[]>([]);
    const [assignmentRows, setAssignmentRows] = useState<AssignmentRow[]>([]);
    const [ruleRows, setRuleRows] = useState<RuleRow[]>([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingEstado, setEditingEstado] = useState<'activo' | 'inactivo' | 'archivado'>('activo');
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [assignModalPlanId, setAssignModalPlanId] = useState<string | null>(null);
    const [assignSelectedVehicleIds, setAssignSelectedVehicleIds] = useState<string[]>([]);

    const loadData = async () => {
        setLoading(true);
        const [{ data: plans, error: plansError }, { data: assignments }, { data: rules }, { data: vehs }] = await Promise.all([
            fetchMaintenancePlansV2(),
            fetchMaintenancePlanAssignments(),
            fetchMaintenancePlanRules(),
            fetchVehiculos(),
        ]);
        setLoading(false);
        setVehicles((vehs as VehiculoLite[]) || []);
        if (plansError) {
            setError(plansError.message || 'No se pudieron cargar planes.');
            return;
        }
        setError(null);
        setPlanRows((plans as PlanRow[]) || []);
        setAssignmentRows((assignments as AssignmentRow[]) || []);
        setRuleRows((rules as RuleRow[]) || []);
    };

    useEffect(() => {
        loadData();
    }, []);

    const groupedPlans = useMemo<GroupedPlan[]>(() => {
        const assignmentsCount = assignmentRows.reduce<Record<string, number>>((acc, row) => {
            acc[row.plan_id] = (acc[row.plan_id] || 0) + 1;
            return acc;
        }, {});
        return planRows
            .map((p) => ({
                id: p.id,
                nombre: p.nombre,
                tipo: p.tipo,
                estado: p.estado,
                assignmentsCount: assignmentsCount[p.id] || 0,
            }))
            .sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [planRows, assignmentRows]);

    const ruleByPlan = useMemo(() => {
        return ruleRows.reduce<Record<string, RuleRow>>((acc, rule) => {
            if (!acc[rule.plan_id]) acc[rule.plan_id] = rule;
            return acc;
        }, {});
    }, [ruleRows]);

    const getDetail = (planId: string) => {
        const rule = ruleByPlan[planId];
        if (!rule) return 'Sin regla configurada';
        if (rule.rule_type === 'date_exact' && rule.schedule_date) return `Programado para ${rule.schedule_date}`;
        if (rule.rule_type === 'date_periodic' && rule.period_value) return `Se realiza cada ${rule.period_value} ${rule.period_unit || 'dias'}`;
        if (rule.rule_type === 'hours' && rule.trigger_value) return `Se realiza cada ${rule.trigger_value} horas`;
        if (rule.rule_type === 'km' && rule.trigger_value) return `Se realiza cada ${rule.trigger_value} km`;
        return 'Sin regla configurada';
    };

    const makeActiveTrigger = (key: 'date' | 'hours' | 'km') => {
        setTriggers({
            date: key === 'date',
            hours: key === 'hours',
            km: key === 'km',
        });
    };

    const buildSingleRule = () => {
        if (triggers.date) {
            if (form.fechaProgramada) {
                return {
                    rule_type: 'date_exact' as const,
                    frequency_mode: 'exacta' as const,
                    schedule_date: form.fechaProgramada,
                    warn_before_value: toPositiveNumber(triggerValues.date.warn),
                    warn_before_unit: toPositiveNumber(triggerValues.date.warn) ? 'dias' : null,
                    is_active: true,
                };
            }
            const periodic = toPositiveNumber(triggerValues.date.main);
            if (!periodic) return null;
            return {
                rule_type: 'date_periodic' as const,
                frequency_mode: 'periodica' as const,
                period_value: periodic,
                period_unit: 'dias' as const,
                warn_before_value: toPositiveNumber(triggerValues.date.warn),
                warn_before_unit: toPositiveNumber(triggerValues.date.warn) ? 'dias' : null,
                is_active: true,
            };
        }
        if (triggers.hours) {
            const value = toPositiveNumber(triggerValues.hours.main);
            if (!value) return null;
            return {
                rule_type: 'hours' as const,
                frequency_mode: 'periodica' as const,
                trigger_value: value,
                warn_before_value: toPositiveNumber(triggerValues.hours.warn),
                warn_before_unit: toPositiveNumber(triggerValues.hours.warn) ? 'horas' : null,
                is_active: true,
            };
        }
        const value = toPositiveNumber(triggerValues.km.main);
        if (!value) return null;
        return {
            rule_type: 'km' as const,
            frequency_mode: 'periodica' as const,
            trigger_value: value,
            warn_before_value: toPositiveNumber(triggerValues.km.warn),
            warn_before_unit: toPositiveNumber(triggerValues.km.warn) ? 'km' : null,
            is_active: true,
        };
    };

    const handleSave = async () => {
        if (!form.nombre.trim()) return setError('Ingresa un nombre para el plan.');
        const rule = buildSingleRule();
        if (!rule) return setError('Completa correctamente el criterio seleccionado.');

        setSaving(true);
        setError(null);

        const { data: plan, error: planError } = await createMaintenancePlan({
            nombre: form.nombre.trim(),
            tipo: form.tipo as any,
            estado: 'activo',
            auto_generate_work_order: true,
            auto_generate_tasks: true,
        });
        if (planError || !plan?.id) {
            setSaving(false);
            return setError(planError?.message || 'No se pudo guardar el plan.');
        }

        const { error: ruleError } = await createMaintenancePlanRules(plan.id, [rule]);
        if (ruleError) {
            setSaving(false);
            return setError(ruleError.message || 'No se pudo guardar la regla.');
        }

        const tasks = ['Revision general'];
        const { error: taskError } = await createMaintenancePlanTasks(plan.id, tasks.map((t, i) => ({ titulo: t, orden: i + 1, activo: true })));
        if (taskError) {
            setSaving(false);
            return setError(taskError.message || 'No se pudieron guardar tareas.');
        }

        if (form.vehiculoId) {
            const { error: assignError } = await assignMaintenancePlanVehicles(plan.id, [form.vehiculoId]);
            if (assignError) {
                setSaving(false);
                return setError(assignError.message || 'Se creo el plan, pero fallo la asignacion del vehiculo.');
            }
        }

        setSaving(false);
        setForm({ nombre: '', tipo: 'preventivo', vehiculoId: '', fechaProgramada: '' });
        setTriggers({ date: true, hours: false, km: false });
        setTriggerValues({ date: { main: '90', warn: '7' }, hours: { main: '', warn: '' }, km: { main: '', warn: '' } });
        await loadData();
    };

    const handleEditEstado = async (planId: string) => {
        const { error } = await updateMaintenancePlan(planId, { estado: editingEstado });
        if (error) return setError(error.message || 'No se pudo actualizar estado.');
        setEditingId(null);
        await loadData();
    };

    const handleDelete = async (planId: string) => {
        const { error } = await deleteMaintenancePlan(planId);
        if (error) return setError(error.message || 'No se pudo eliminar plan.');
        setConfirmDeleteId(null);
        await loadData();
    };

    const handleDuplicate = async (plan: GroupedPlan) => {
        const { data: copy, error } = await createMaintenancePlan({
            nombre: `${plan.nombre} (copia)`,
            tipo: plan.tipo as any,
            estado: 'activo',
            auto_generate_work_order: true,
            auto_generate_tasks: true,
        });
        if (error || !copy?.id) return setError(error?.message || 'No se pudo duplicar.');
        const originalRule = ruleByPlan[plan.id];
        if (originalRule) {
            const { error: ruleError } = await createMaintenancePlanRules(copy.id, [{
                rule_type: originalRule.rule_type,
                frequency_mode: originalRule.frequency_mode || 'periodica',
                schedule_date: originalRule.schedule_date || null,
                period_value: originalRule.period_value || null,
                period_unit: originalRule.period_unit || null,
                trigger_value: originalRule.trigger_value || null,
                is_active: true,
            } as any]);
            if (ruleError) return setError(ruleError.message || 'No se pudo duplicar regla.');
        }
        await loadData();
    };

    const handleAssignVehicles = async () => {
        if (!assignModalPlanId || !assignSelectedVehicleIds.length) return;
        setAssigning(true);
        const { error } = await assignMaintenancePlanVehicles(assignModalPlanId, assignSelectedVehicleIds);
        setAssigning(false);
        if (error) return setError(error.message || 'No se pudo asignar vehiculos.');
        setAssignModalPlanId(null);
        setAssignSelectedVehicleIds([]);
        await loadData();
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-blue-600">Mantenimiento</h1>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 mb-6">Programar nuevo plan</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Nombre</label>
                        <input
                            type="text"
                            value={form.nombre}
                            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                            placeholder="Ej. CONTROL PREVENTIVO"
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
                            <option value="predictivo">Predictivo</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Vehiculo (opcional)</label>
                        <select
                            value={form.vehiculoId}
                            onChange={(e) => setForm({ ...form, vehiculoId: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600"
                        >
                            <option value="">Seleccionar</option>
                            {vehicles.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.patente || '-'} {v.marca ? `- ${v.marca}` : ''} {v.modelo ? ` ${v.modelo}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Fecha programada (si criterio fecha exacta)</label>
                        <input
                            type="date"
                            value={form.fechaProgramada}
                            onChange={(e) => setForm({ ...form, fechaProgramada: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <TriggerCard
                        title="PROGRAMAR POR FECHA"
                        unit="Dias"
                        isActive={triggers.date}
                        toggleActive={() => makeActiveTrigger('date')}
                        valueMain={triggerValues.date.main}
                        valueWarn={triggerValues.date.warn}
                        onChangeMain={(v) => setTriggerValues({ ...triggerValues, date: { ...triggerValues.date, main: v } })}
                        onChangeWarn={(v) => setTriggerValues({ ...triggerValues, date: { ...triggerValues.date, warn: v } })}
                    />
                    <TriggerCard
                        title="PROGRAMAR POR HORAS"
                        unit="Horas"
                        isActive={triggers.hours}
                        toggleActive={() => makeActiveTrigger('hours')}
                        valueMain={triggerValues.hours.main}
                        valueWarn={triggerValues.hours.warn}
                        onChangeMain={(v) => setTriggerValues({ ...triggerValues, hours: { ...triggerValues.hours, main: v } })}
                        onChangeWarn={(v) => setTriggerValues({ ...triggerValues, hours: { ...triggerValues.hours, warn: v } })}
                    />
                    <TriggerCard
                        title="PROGRAMAR POR KM"
                        unit="Kms"
                        isActive={triggers.km}
                        toggleActive={() => makeActiveTrigger('km')}
                        valueMain={triggerValues.km.main}
                        valueWarn={triggerValues.km.warn}
                        onChangeMain={(v) => setTriggerValues({ ...triggerValues, km: { ...triggerValues.km, main: v } })}
                        onChangeWarn={(v) => setTriggerValues({ ...triggerValues, km: { ...triggerValues.km, warn: v } })}
                    />
                </div>

                {error && <div className="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">{error}</div>}

                <div className="flex justify-start">
                    <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-70">
                        {saving ? 'Guardando...' : 'Continuar y Cargar tareas'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">MANTENIMIENTOS PROGRAMADOS</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-8"></th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Detalle</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="px-4 py-3 text-sm text-slate-500">Cargando...</td></tr>
                            ) : groupedPlans.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-3 text-sm text-slate-500">No hay mantenimientos programados.</td></tr>
                            ) : groupedPlans.map((plan) => (
                                <tr key={plan.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">{getDetail(plan.id).includes('horas') || getDetail(plan.id).includes('km') ? <Clock3 size={14} className="text-slate-500" /> : <Calendar size={14} className="text-slate-500" />}</td>
                                    <td className="px-4 py-3 text-xs font-semibold text-slate-700 uppercase">{plan.nombre}</td>
                                    <td className="px-4 py-3 text-xs text-slate-600">{getDetail(plan.id)}</td>
                                    <td className="px-4 py-3"><span className={`px-2 py-0.5 text-[10px] font-bold rounded ${estadoBadgeClass(plan.estado)}`}>{plan.estado}</span></td>
                                    <td className="px-4 py-3 text-right">
                                        {editingId === plan.id ? (
                                            <div className="inline-flex items-center gap-2">
                                                <select value={editingEstado} onChange={(e) => setEditingEstado(e.target.value as any)} className="px-2 py-1 border border-slate-300 rounded text-xs">
                                                    <option value="activo">Activo</option>
                                                    <option value="inactivo">Inactivo</option>
                                                    <option value="archivado">Archivado</option>
                                                </select>
                                                <button onClick={() => handleEditEstado(plan.id)} className="px-2 py-1 bg-blue-500 text-white text-xs rounded">Guardar</button>
                                                <button onClick={() => setEditingId(null)} className="px-2 py-1 text-xs text-slate-600">Cancelar</button>
                                            </div>
                                        ) : confirmDeleteId === plan.id ? (
                                            <div className="inline-flex items-center gap-2">
                                                <span className="text-xs text-slate-600">Eliminar?</span>
                                                <button onClick={() => handleDelete(plan.id)} className="px-2 py-1 bg-red-500 text-white text-xs rounded">Si</button>
                                                <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 text-xs text-slate-600">No</button>
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-1">
                                                <button onClick={() => setConfirmDeleteId(plan.id)} className="w-5 h-5 rounded-sm bg-rose-500 text-white inline-flex items-center justify-center" title="Eliminar"><Trash2 size={11} /></button>
                                                <button onClick={() => { setEditingId(plan.id); setEditingEstado((plan.estado as any) || 'activo'); }} className="w-5 h-5 rounded-sm bg-sky-500 text-white inline-flex items-center justify-center" title="Editar estado"><Edit2 size={11} /></button>
                                                <button onClick={() => setAssignModalPlanId(plan.id)} className="w-5 h-5 rounded-sm bg-cyan-500 text-white inline-flex items-center justify-center" title="Asignar vehiculos"><Link2 size={11} /></button>
                                                <button onClick={() => handleDuplicate(plan)} className="w-5 h-5 rounded-sm bg-emerald-500 text-white inline-flex items-center justify-center" title="Duplicar"><RefreshCw size={11} /></button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {assignModalPlanId && (
                <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl border border-slate-200 p-5 space-y-4">
                        <h3 className="text-lg font-bold text-slate-800">Asignar vehiculos al plan</h3>
                        <select
                            multiple
                            size={10}
                            className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                            value={assignSelectedVehicleIds}
                            onChange={(e) => setAssignSelectedVehicleIds(Array.from(e.target.selectedOptions).map((opt) => opt.value))}
                        >
                            {vehicles.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.patente || '-'} {v.num_int ? `| Int ${v.num_int}` : ''} {v.base ? `| ${v.base}` : ''}
                                </option>
                            ))}
                        </select>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setAssignModalPlanId(null)} className="px-3 py-2 text-sm text-slate-600">Cancelar</button>
                            <button onClick={handleAssignVehicles} disabled={assigning} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-70">
                                {assigning ? 'Asignando...' : 'Asignar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Maintenance;
