import React from 'react';
import { ArrowLeft, Search, Calendar, Clock, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';

interface VehicleWorkOrderProps {
    vehicle: any;
    onBack: () => void;
}

const VehicleWorkOrder: React.FC<VehicleWorkOrderProps> = ({ vehicle, onBack }) => {
    // Dummy data for the list
    const workOrders = [
        {
            id: 106,
            created: '27-06-2023',
            internal: '39',
            badge: 'F/S',
            base: 'LH',
            priority: 'Baja',
            type: 'PREV',
            status: 'Pendiente',
            motive: 'Service 10000km equipo pesado',
            responsible: '',
        }
    ];

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-500" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl font-bold text-slate-900">Int. {vehicle?.internalNumber || '39'}</h1>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="font-medium text-slate-700">{vehicle?.modelo || 'SCANIA P380 A6X4'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>Dominio: <span className="font-medium text-slate-700">{vehicle?.domino || 'JNQ075'}</span></span>
                        <span>- -</span>
                        <span>Base: <span className="font-medium text-slate-700">{vehicle?.base || 'LH'}</span></span>
                        <span>-</span>
                        <span className="bg-rose-500 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                            Fuera de Servicio
                        </span>
                    </div>
                </div>
            </div>

            {/* Form Section */}
            <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Responsable</label>
                        <select className="w-full h-9 text-sm border-slate-200 rounded-md focus:ring-blue-500 focus:border-blue-500 text-slate-500">
                            <option>Seleccionar</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Prioridad</label>
                        <select className="w-full h-9 text-sm border-slate-200 rounded-md focus:ring-blue-500 focus:border-blue-500 text-slate-500">
                            <option>Seleccionar</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Tipo</label>
                        <select className="w-full h-9 text-sm border-slate-200 rounded-md focus:ring-blue-500 focus:border-blue-500 text-slate-500">
                            <option>Seleccionar tipo</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Estado Ord. Trabajo</label>
                        <select className="w-full h-9 text-sm border-slate-200 rounded-md focus:ring-blue-500 focus:border-blue-500 text-slate-500">
                            <option>Seleccionar</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">¿Fecha Vencimiento?</label>
                        <div className="relative">
                            <input type="date" className="w-full h-9 text-sm border-slate-200 rounded-md focus:ring-blue-500 focus:border-blue-500 text-slate-400" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Ingreso (fecha/hs/min)</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input type="date" className="w-full h-9 text-sm border-slate-200 rounded-md focus:ring-blue-500 focus:border-blue-500 text-slate-400" />
                            </div>
                            <select className="w-20 h-9 text-xs border-slate-200 rounded-md text-slate-500">
                                <option>Hs.</option>
                            </select>
                            <select className="w-20 h-9 text-xs border-slate-200 rounded-md text-slate-500">
                                <option>Min.</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Salida (fecha/hs/min)</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input type="date" className="w-full h-9 text-sm border-slate-200 rounded-md focus:ring-blue-500 focus:border-blue-500 text-slate-400" />
                            </div>
                            <select className="w-20 h-9 text-xs border-slate-200 rounded-md text-slate-500">
                                <option>Hs.</option>
                            </select>
                            <select className="w-20 h-9 text-xs border-slate-200 rounded-md text-slate-500">
                                <option>Min.</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="text-xs font-bold text-slate-700 block mb-1">Trabajo a realizar</label>
                    <textarea
                        className="w-full h-32 p-3 text-sm border-slate-200 rounded-md focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400 resize-none"
                        placeholder="Ej.: Se quedo sin embrague, llevar a taller"
                    ></textarea>
                </div>

                <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium transition-colors">
                    Cargar Orden de Trabajo
                </button>
            </div>

            <div className="border-t border-slate-100 my-8"></div>

            {/* List Section */}
            <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">LISTADO DE TRABAJOS</h3>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Mostrar</span>
                        <select className="h-8 text-xs border-slate-200 rounded px-2 text-slate-600 focus:border-blue-500 focus:ring-blue-500">
                            <option>50</option>
                            <option>100</option>
                        </select>
                        <span className="text-xs text-slate-500">registros</span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-xs text-slate-500">Buscar:</span>
                        <div className="relative w-full sm:w-48">
                            <input
                                type="text"
                                className="w-full h-8 pl-8 pr-3 text-xs border-slate-200 rounded focus:ring-blue-500 focus:border-blue-500"
                            />
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-lg">
                    <table className="w-full">
                        <thead className="bg-slate-50 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3 text-left">
                                    <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700">
                                        # OT <span className="text-[10px]">▼</span>
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700">
                                        Creado <span className="text-[10px]">▼</span>
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700">
                                        Int. <span className="text-[10px]">▼</span>
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700">
                                        Base <span className="text-[10px]">▼</span>
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700">
                                        Prior. <span className="text-[10px]">▼</span>
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700">
                                        Tipo <span className="text-[10px]">▼</span>
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700">
                                        Estado <span className="text-[10px]">▼</span>
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700">
                                        Motivo <span className="text-[10px]">▼</span>
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700">
                                        Responsable <span className="text-[10px]">▼</span>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {workOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50 text-xs text-slate-700">
                                    <td className="px-4 py-3 text-blue-600">{order.id}</td>
                                    <td className="px-4 py-3">{order.created}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {order.badge && <span className="bg-rose-600 text-white px-1 py-0.5 rounded text-[9px] font-bold">{order.badge}</span>}
                                            <span className="font-bold">{order.internal}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 bg-slate-50">{order.base}</td>
                                    <td className="px-4 py-3 font-semibold">{order.priority}</td>
                                    <td className="px-4 py-3">{order.type}</td>
                                    <td className="px-4 py-3">
                                        <span className="bg-amber-400 text-amber-900 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase">
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{order.motive}</td>
                                    <td className="px-4 py-3">{order.responsible}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 py-3 text-xs text-slate-500 border-t border-slate-100 flex items-center justify-between">
                    <span>Mostrando registros del 1 al 1 de un total de 1 registros</span>
                    <div className="flex gap-1">
                        <span className="text-slate-400">Anterior</span>
                        <button className="w-5 h-5 flex items-center justify-center bg-blue-600 text-white rounded-full text-[10px] font-bold">1</button>
                        <span className="text-slate-400">Siguiente</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VehicleWorkOrder;
