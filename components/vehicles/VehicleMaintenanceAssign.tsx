import React, { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';

interface VehicleMaintenanceAssignProps {
    vehicle: any;
    onBack: () => void;
}

const VehicleMaintenanceAssign: React.FC<VehicleMaintenanceAssignProps> = ({ vehicle, onBack }) => {
    // Dummy data based on the screenshot
    const plans = [
        { id: 1, name: 'CONTROL DE PINOS PORTA CONTENEDORES', detail: 'Se realiza cada 15 días', status: 'Activo' },
        { id: 2, name: 'CONTROL PREVENTIVO', detail: 'Se realiza cada 30 días', status: 'Activo' },
        { id: 3, name: 'CONTROL PREVENTIVO BOMBA DE VACIO', detail: 'Se realiza cada 500 horas', status: 'Activo' },
        { id: 4, name: 'CONTROL PREVENTIVO CARGAS PELIGROSAS VERANO 2025/2026', detail: 'Se realiza cada 15 días', status: 'Activo' },
        { id: 5, name: 'CONTROL PREVENTIVO DE CISTERNAS CARGAS PELIGROSAS', detail: 'Se realiza cada 90 días', status: 'Activo' },
        { id: 6, name: 'ENGRASE COMPLETO', detail: 'Se realiza cada 20 días', status: 'Activo' },
        { id: 7, name: 'MANTENIMIENTO PREVENTIVO BOMBA A EXPLOSION', detail: 'Se realiza cada 7 días', status: 'Activo' },
        { id: 8, name: 'Service 10000km equipo pesado', detail: 'Se realiza cada 10000 kms.', status: 'Activo' },
        { id: 9, name: 'SERVICE BOMBAS SIAM ANUAL', detail: 'Se realiza cada 365 días', status: 'Activo' },
        { id: 10, name: 'SERVICE PESADO AÑELO 400 HS', detail: 'Se realiza cada 400 horas', status: 'Activo' },
        { id: 11, name: 'SERVICE PESADO SCANIA C.O.-L.H.-ESC.-V.H.-K.K.', detail: 'Se realiza cada 400 horas', status: 'Activo' },
        { id: 12, name: 'SERVICIO DE HIDROGRUAS', detail: 'Se realiza cada 600 horas', status: 'Activo' },
        { id: 13, name: 'Servicio Motor 10.000 KM Vehículos livianos', detail: 'Se realiza cada 10000 kms.', status: 'Activo' },
    ];

    const [selectedPlans, setSelectedPlans] = useState<number[]>([]);

    const togglePlan = (id: number) => {
        setSelectedPlans(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 min-h-screen flex flex-col">
            {/* Top Breadcrumb Header */}
            <div className="bg-white border-b border-slate-100 px-6 py-4">
                <h1 className="text-lg font-bold text-blue-600">Asignar Planes de Mantenimiento</h1>
            </div>

            {/* Vehicle Header */}
            <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} className="text-slate-500" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-slate-900">Int. {vehicle?.internalNumber || '39'}</h2>
                        </div>
                        <div className="text-sm text-slate-500">
                            <p className="font-medium text-slate-800">{vehicle?.modelo || 'SCANIA P380 A6X4'}</p>
                            <p>Dominio: <span className="font-bold text-slate-800">{vehicle?.dominio || 'JNQ075'}</span> - </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 px-6 py-3 bg-white border-b border-slate-100 text-xs font-bold text-slate-800 uppercase tracking-wide">
                <div className="col-span-1 flex justify-center">
                    <ArrowLeft size={14} className="rotate-[-90deg] text-slate-400" />
                </div>
                <div className="col-span-6">Nombre</div>
                <div className="col-span-4">Detalle</div>
                <div className="col-span-1 text-center">Estado</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto">
                {plans.map((plan) => (
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
                        <div className="col-span-6 font-medium text-slate-700">
                            {plan.name}
                        </div>
                        <div className="col-span-4">
                            {plan.detail}
                        </div>
                        <div className="col-span-1 flex justify-center">
                            <span className="bg-green-500 text-white px-3 py-1 rounded text-[10px] font-medium">
                                {plan.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-100 flex gap-4">
                <button
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded transition-colors shadow-sm"
                >
                    Asignar Planes a esta unidad
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
