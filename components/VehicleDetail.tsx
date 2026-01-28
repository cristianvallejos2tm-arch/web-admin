import React, { useState } from 'react';
import { ArrowLeft, LayoutGrid, Edit2, Wrench, Gauge, Truck, Plus, Printer } from 'lucide-react';

interface Vehicle {
    id: number;
    internalNumber: string;
    badge?: string;
    domino: string;
    modelo: string;
    estado: string;
    km: number;
    anio: string;
    base: string;
    op: string;
    funcion: string;
    sector: string;
}

interface VehicleDetailProps {
    vehicle: Vehicle;
    onBack: () => void;
}

// Detalla un vehículo con pestañas para su ficha, ordenes e historial.
const VehicleDetail: React.FC<VehicleDetailProps> = ({ vehicle, onBack }) => {
    const [activeTab, setActiveTab] = useState('detalle');

    return (
        <div className="space-y-6">
            {/* Top Bar with Back Button */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
            </div>

            {/* Header Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-1">Int. {vehicle.internalNumber}</h1>
                        <p className="text-slate-500 text-sm mb-1">{vehicle.modelo}</p>
                        <p className="text-slate-500 text-sm">Dominio: <span className="font-semibold text-slate-700">{vehicle.domino}</span> - {vehicle.funcion}</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                            <LayoutGrid size={18} />
                        </button>
                        <button className="p-2 bg-white border border-slate-200 text-slate-500 rounded-md hover:bg-slate-50 transition-colors">
                            <Edit2 size={18} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 mt-8 border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('detalle')}
                        className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'detalle' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Detalle
                        {activeTab === 'detalle' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('ordenes')}
                        className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'ordenes' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Orden de trabajo
                        {activeTab === 'ordenes' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('historial')}
                        className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'historial' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Historial
                        {activeTab === 'historial' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('detalle-historial')}
                        className={`pb-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${activeTab === 'detalle-historial' ? 'text-white bg-cyan-500 px-4 rounded-t-md border-b-0 -mb-[1px]' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Detalle Historial
                        <Wrench size={14} />
                    </button>
                </div>
            </div>

            {/* Content per Tab */}
            {activeTab === 'detalle' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Panel - Info List */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="divide-y divide-slate-100">
                            <div className="flex justify-between py-4 px-6 hover:bg-slate-50/50">
                                <span className="text-slate-500 text-sm">Dominio:</span>
                                <span className="text-slate-900 font-medium text-sm">{vehicle.domino}</span>
                            </div>
                            <div className="flex justify-between py-4 px-6 hover:bg-slate-50/50">
                                <span className="text-slate-500 text-sm">Interno:</span>
                                <span className="text-slate-900 font-medium text-sm">{vehicle.internalNumber}</span>
                            </div>
                            <div className="flex justify-between py-4 px-6 hover:bg-slate-50/50">
                                <span className="text-slate-500 text-sm">Modelo:</span>
                                <span className="text-slate-900 font-medium text-sm">{vehicle.modelo}</span>
                            </div>
                            <div className="flex justify-between py-4 px-6 hover:bg-slate-50/50">
                                <span className="text-slate-500 text-sm">Año:</span>
                                <span className="text-slate-900 font-medium text-sm">{vehicle.anio}</span>
                            </div>
                            <div className="flex justify-between py-4 px-6 hover:bg-slate-50/50">
                                <span className="text-slate-500 text-sm">Chasis:</span>
                                <span className="text-slate-900 font-medium text-sm"></span>
                            </div>
                            <div className="flex justify-between py-4 px-6 hover:bg-slate-50/50">
                                <span className="text-slate-500 text-sm">Función:</span>
                                <span className="text-slate-900 font-medium text-sm uppercase">{vehicle.funcion}</span>
                            </div>
                            <div className="flex justify-between py-4 px-6 hover:bg-slate-50/50">
                                <span className="text-slate-500 text-sm">Sector:</span>
                                <span className="text-slate-900 font-medium text-sm uppercase">{vehicle.sector}</span>
                            </div>
                            <div className="flex justify-between py-4 px-6 hover:bg-slate-50/50">
                                <span className="text-slate-500 text-sm">Base:</span>
                                <span className="text-slate-900 font-medium text-sm">{vehicle.base}</span>
                            </div>
                            <div className="flex justify-between py-4 px-6 hover:bg-slate-50/50">
                                <span className="text-slate-500 text-sm">Operadora:</span>
                                <span className="text-slate-900 font-medium text-sm">{vehicle.op}</span>
                            </div>
                            <div className="flex justify-between py-4 px-6 hover:bg-slate-50/50">
                                <span className="text-slate-500 text-sm">Observaciones:</span>
                                <span className="text-slate-900 font-medium text-sm">Mayo 2025 vendido tractor solo</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Status Cards */}
                    <div className="space-y-4">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800 flex items-baseline gap-2">
                                    {vehicle.km.toLocaleString('es-AR')} <span className="text-base font-normal text-slate-500">Km</span>
                                    <span className="text-slate-300">/</span>
                                    5.424 <span className="text-base font-normal text-slate-500">hs</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">Km / Hs actuales</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                <Gauge size={20} />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800 flex items-baseline gap-2">
                                    - <span className="text-base font-normal text-slate-500">Km</span>
                                    <span className="text-slate-300">/</span>
                                    - <span className="text-base font-normal text-slate-500">Hs</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">Ultimo Service Programado</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                <Wrench size={20} />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800">
                                    - - -
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">Ultimo cambio de cubiertas</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                <Truck size={20} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'ordenes' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100">
                    {/* Table Controls */}
                    <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">Mostrar</label>
                            <select className="px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <span className="text-sm text-slate-600">registros</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">Buscar:</label>
                            <input
                                type="text"
                                className="px-3 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                                        <div className="flex items-center gap-1"># OT <span className="text-[10px] text-slate-300">▼</span></div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                                        <div className="flex items-center gap-1">Creado <span className="text-[10px] text-slate-300">▼</span></div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                                        <div className="flex items-center gap-1">Int. <span className="text-[10px] text-slate-300">▼</span></div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                                        <div className="flex items-center gap-1">Base <span className="text-[10px] text-slate-300">▼</span></div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                                        <div className="flex items-center gap-1">Prior. <span className="text-[10px] text-slate-300">▼</span></div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                                        <div className="flex items-center gap-1">Tipo <span className="text-[10px] text-slate-300">▼</span></div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                                        <div className="flex items-center gap-1">Estado <span className="text-[10px] text-slate-300">▼</span></div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                                        <div className="flex items-center gap-1">Motivo <span className="text-[10px] text-slate-300">▼</span></div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                                        <div className="flex items-center gap-1">Responsable <span className="text-[10px] text-slate-300">▼</span></div>
                                    </th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {/* Dummy Data Row */}
                                <tr className="hover:bg-slate-50 text-sm text-slate-700">
                                    <td className="px-4 py-3">106</td>
                                    <td className="px-4 py-3">27-06-2023</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded">F/S</span>
                                            <span className="font-medium">39</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">LH</td>
                                    <td className="px-4 py-3 font-bold">Baja</td>
                                    <td className="px-4 py-3">PREV</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 bg-amber-400 text-amber-900 text-xs font-medium rounded-md">Pendiente</span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500">Service 10000km equipo pesado</td>
                                    <td className="px-4 py-3"></td>
                                    <td className="px-4 py-3 text-right">
                                        <button className="text-slate-400 hover:text-slate-600">
                                            <ArrowLeft size={16} className="rotate-180" />
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
                        <p>Mostrando registros del 1 al 1 de un total de 1 registros</p>
                        <div className="flex items-center gap-2">
                            <span className="cursor-pointer hover:text-slate-700">Anterior</span>
                            <button className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full font-medium">1</button>
                            <span className="cursor-pointer hover:text-slate-700">Siguiente</span>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'historial' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100">
                    {/* Table Controls */}
                    <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">Mostrar</label>
                            <select className="px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <span className="text-sm text-slate-600">registros</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">Buscar:</label>
                            <input
                                type="text"
                                className="px-3 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left w-12"></th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                                        <div className="flex items-center gap-1">Base <span className="text-[10px] text-slate-300">▼</span></div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                                        <div className="flex items-center gap-1">Nombre <span className="text-[10px] text-slate-300">▼</span></div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                                        <div className="flex items-center gap-1">Responsable <span className="text-[10px] text-slate-300">▼</span></div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                                        <div className="flex items-center gap-1">Realizado <span className="text-[10px] text-slate-300">▼</span></div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                                        <div className="flex items-center gap-1">Tiempo <span className="text-[10px] text-slate-300">▼</span></div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                                        <div className="flex items-center gap-1">Kms <span className="text-[10px] text-slate-300">▼</span></div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                                        <div className="flex items-center gap-1">Estado <span className="text-[10px] text-slate-300">▼</span></div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {/* Dummy Data Row */}
                                <tr className="hover:bg-slate-50 text-sm text-slate-700">
                                    <td className="px-4 py-3">
                                        <button className="w-6 h-6 bg-blue-500 text-white rounded flex items-center justify-center hover:bg-blue-600 transition-colors">
                                            <Plus size={14} />
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">LH</td>
                                    <td className="px-4 py-3 text-slate-500">Service 10000km equipo pesado</td>
                                    <td className="px-4 py-3"></td>
                                    <td className="px-4 py-3">-</td>
                                    <td className="px-4 py-3">-</td>
                                    <td className="px-4 py-3">-</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 bg-amber-400 text-amber-900 text-xs font-medium rounded-md">Pendiente</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
                        <p>Mostrando registros del 1 al 1 de un total de 1 registros</p>
                        <div className="flex items-center gap-2">
                            <span className="cursor-pointer hover:text-slate-700">Anterior</span>
                            <button className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full font-medium">1</button>
                            <span className="cursor-pointer hover:text-slate-700">Siguiente</span>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'detalle-historial' && (
                <div className="space-y-6">
                    {/* Header Bar */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <ArrowLeft size={20} className="text-slate-500 cursor-pointer hover:text-slate-700" onClick={() => setActiveTab('historial')} />
                            <h2 className="text-lg font-bold text-blue-600">Historial Ordenes de trabajo</h2>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white text-sm font-medium rounded hover:bg-slate-700 transition-colors">
                            <Printer size={16} />
                            Imprimir
                        </button>
                    </div>

                    {/* Content */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 space-y-8">
                        {/* Vehicle Data Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-800">Datos del vehículo</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <p className="text-sm text-slate-500">Interno: <span className="font-bold text-slate-800">{vehicle.internalNumber}</span></p>
                                    <p className="text-sm text-slate-500 mt-1">Km actual: <span className="font-bold text-slate-800">{vehicle.km.toLocaleString('es-AR')} Km</span></p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Dominio: <span className="font-bold text-slate-800">{vehicle.domino}</span></p>
                                    <p className="text-sm text-slate-500 mt-1">Sector / Función: <span className="font-bold text-slate-800">{vehicle.sector} / {vehicle.funcion}</span></p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Modelo: <span className="font-bold text-slate-800">{vehicle.modelo}</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-dashed border-slate-300"></div>

                        {/* Order Data Section */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-800">Datos de la orden</h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <p className="text-sm text-slate-500">Nro. de Orden: <span className="font-bold text-slate-800">#106</span></p>
                                    <p className="text-sm text-slate-500 mt-1">Tipo de Orden: <span className="font-bold text-slate-800">Preventivo</span></p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Generado: <span className="font-bold text-slate-800">27-06-2023</span></p>
                                    <p className="text-sm text-slate-500 mt-1">Prio.: <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded">Baja</span></p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Responsable:</p>
                                    <p className="text-sm text-slate-500 mt-1">Estado: <span className="px-2 py-0.5 bg-amber-400 text-amber-900 text-xs font-medium rounded">Pendiente</span></p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <p className="text-sm text-slate-500">Ingreso (fecha/hs/min): <span className="font-bold text-slate-800">- :</span></p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Salida (fecha/hs/min): <span className="font-bold text-slate-800">- :</span></p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Km realizado: <span className="font-bold text-slate-800">- Km</span></p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-slate-800 mb-1">Motivo</h4>
                                <p className="text-sm text-slate-600">Service 10000km equipo pesado</p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-dashed border-slate-300"></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VehicleDetail;
