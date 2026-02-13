import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
    fetchMaintenancePlansV2,
    fetchMaintenancePlanRules,
    fetchVehicleMaintenanceAssignments,
    syncVehicleMaintenanceAssignments,
} from '../../services/supabase';

interface VehicleMaintenanceAssignProps {
    vehicle: any;
    onBack: () => void;
}

const formatRuleDetail = (rule: any) => {
    if (!rule) return 'Sin regla definida';
    if (rule.rule_type === 'date_exact') return `Fecha exacta: ${rule.schedule_date || '-'}`;
    if (rule.rule_type === 'date_periodic') return `Cada ${rule.period_value || '-'} ${rule.period_unit || 'dias'}`;
    if (rule.rule_type === 'hours') {
        return rule.frequency_mode === 'exacta'
            ? `A las ${rule.trigger_value || '-'} horas`
            : `Cada ${rule.trigger_value || '-'} horas`;
    }
    if (rule.rule_type === 'km') {
        return rule.frequency_mode === 'exacta'
            ? `A los ${rule.trigger_value || '-'} km`
            : `Cada ${rule.trigger_value || '-'} km`;
    }
    return 'Regla activa';
};

const VehicleMaintenanceAssign: React.FC<VehicleMaintenanceAssignProps> = ({ vehicle, onBack }) => {
    const [plans, setPlans] = useState<any[]>([]);
    const [rules, setRules] = useState<any[]>([]);
    const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        const [{ data: plansData, error: plansError }, { data: rulesData, error: rulesError }, { data: assignments, error: assignmentError }] =
            await Promise.all([
                fetchMaintenancePlansV2(),
                fetchMaintenancePlanRules(),
                fetchVehicleMaintenanceAssignments(vehicle.id),
            ]);

        if (plansError || rulesError || assignmentError) {
            setErrorMsg('No se pudieron cargar los planes de mantenimiento.');
            setLoading(false);
            return;
        }

        const activeAssignments = (assignments || []).filter((row: any) => row.activo).map((row: any) => row.plan_id);
        setSelectedPlans(activeAssignments);
        setPlans((plansData || []).filter((p: any) => p.estado === 'activo'));
        setRules((rulesData || []).filter((r: any) => r.is_active));
        setErrorMsg(null);
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, [vehicle.id]);

    const rulesByPlan = useMemo(() => {
        const map = new Map<string, any[]>();
        for (const rule of rules) {
            const arr = map.get(rule.plan_id) || [];
            arr.push(rule);
            map.set(rule.plan_id, arr);
        }
        return map;
    }, [rules]);

    const togglePlan = (id: string) => {
        setSelectedPlans((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
    };

    const handleSave = async () => {
        setSaving(true);
        const { error } = await syncVehicleMaintenanceAssignments(vehicle.id, selectedPlans);
        setSaving(false);
        if (error) {
            setErrorMsg('No se pudieron guardar las asignaciones de mantenimiento.');
            return;
        }
        onBack();
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 min-h-screen flex flex-col">
            <div className="bg-white border-b border-slate-100 px-6 py-4">
                <h1 className="text-lg font-bold text-blue-600">Asignar Planes de Mantenimiento</h1>
            </div>

            <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-slate-500" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Int. {vehicle?.internalNumber || '-'}</h2>
                        <div className="text-sm text-slate-500">
                            <p className="font-medium text-slate-800">{vehicle?.modelo || '-'}</p>
                            <p>
                                Dominio: <span className="font-bold text-slate-800">{vehicle?.dominio || '-'}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 px-6 py-3 bg-white border-b border-slate-100 text-xs font-bold text-slate-800 uppercase tracking-wide">
                <div className="col-span-1 text-center">Sel.</div>
                <div className="col-span-5">Nombre</div>
                <div className="col-span-4">Detalle</div>
                <div className="col-span-2 text-center">Estado</div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="px-6 py-6 text-sm text-slate-500">Cargando planes...</div>
                ) : plans.length === 0 ? (
                    <div className="px-6 py-6 text-sm text-slate-500">No hay planes activos para asignar.</div>
                ) : (
                    plans.map((plan) => {
                        const planRules = rulesByPlan.get(plan.id) || [];
                        const mainRule = planRules[0];
                        return (
                            <div
                                key={plan.id}
                                className="grid grid-cols-12 px-6 py-4 border-b border-slate-50 hover:bg-slate-50 transition-colors items-center text-xs text-slate-600"
                            >
                                <div className="col-span-1 flex justify-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedPlans.includes(plan.id)}
                                        onChange={() => togglePlan(plan.id)}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                </div>
                                <div className="col-span-5 font-medium text-slate-700">{plan.nombre}</div>
                                <div className="col-span-4">{formatRuleDetail(mainRule)}</div>
                                <div className="col-span-2 flex justify-center">
                                    <span className="bg-green-500 text-white px-3 py-1 rounded text-[10px] font-medium">Activo</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {errorMsg && <div className="px-6 py-3 text-sm text-rose-700 bg-rose-50 border-t border-rose-200">{errorMsg}</div>}

            <div className="p-6 border-t border-slate-100 flex gap-4">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded transition-colors shadow-sm disabled:opacity-60"
                >
                    {saving ? 'Guardando...' : 'Asignar Planes a esta unidad'}
                </button>
                <button
                    onClick={onBack}
                    className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded transition-colors shadow-sm"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
};

export default VehicleMaintenanceAssign;
