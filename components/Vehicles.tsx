import React, { useState, useRef, useEffect } from 'react';
import { Settings, Plus, Search, ChevronDown } from 'lucide-react';
import VehicleDetail from './VehicleDetail';
import VehicleWorkOrder from './VehicleWorkOrder';
import VehicleMaintenanceAssign from './VehicleMaintenanceAssign';
import VehicleForm from './VehicleForm';
import VehicleEdit from './VehicleEdit';
import { fetchVehiculos } from '../services/supabase';

interface Vehicle {
    id: string;
    internalNumber: string;
    badge?: string; // e.g., 'VEN'
    domino: string;
    modelo: string;
    estado: string; // 'Vendido', 'Operativo', 'Back Up'
    km: number;
    anio: string;
    base: string;
    op: string; // e.g., 'CGC', 'YPF'
    funcion: string;
    sector: string;
    foto_url?: string | null;
}

const Vehicles: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [view, setView] = useState<'list' | 'detail' | 'workOrder' | 'maintenanceAssign' | 'new' | 'edit'>('list');
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Dummy data based on screenshot
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(false);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        loadVehicles();
    }, []);

    const loadVehicles = async () => {
        setLoading(true);
        const { data, error } = await fetchVehiculos();
        if (!error && data) {
            const mapped = data.map((v: any) => ({
                id: v.id,
                internalNumber: v.patente || '',
                badge: v.activo === false ? 'INACT' : undefined,
                domino: v.patente || '',
                modelo: v.modelo || v.marca || '',
                estado: v.activo ? 'Operativo' : 'Inactivo',
                km: v.kilometraje_actual || 0,
                anio: v.anio ? String(v.anio) : '',
                base: '—',
                op: '',
                funcion: '',
                sector: '',
                foto_url: v.foto_url || null,
            }));
            setVehicles(mapped);
        }
        setLoading(false);
    };

    const toggleDropdown = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveDropdown(activeDropdown === id ? null : id);
    };

    const handleViewDetail = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setView('detail');
        setActiveDropdown(null);
    };

    const handleViewWorkOrder = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setView('workOrder');
        setActiveDropdown(null);
    };

    const handleViewMaintenanceAssign = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setView('maintenanceAssign');
        setActiveDropdown(null);
    };

    const handleBackToList = () => {
        setView('list');
        setSelectedVehicle(null);
        loadVehicles();
    };

    const handleViewNew = () => {
        setView('new');
        setSelectedVehicle(null);
    };

    const handleViewEdit = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setView('edit');
        setActiveDropdown(null);
    };

    if (view === 'detail' && selectedVehicle) {
        return <VehicleDetail vehicle={selectedVehicle} onBack={handleBackToList} />;
    }

    if (view === 'workOrder' && selectedVehicle) {
        return <VehicleWorkOrder vehicle={selectedVehicle} onBack={handleBackToList} />;
    }

    if (view === 'maintenanceAssign' && selectedVehicle) {
        return <VehicleMaintenanceAssign vehicle={selectedVehicle} onBack={handleBackToList} />;
    }

    if (view === 'new') {
        return <VehicleForm onBack={handleBackToList} />;
    }

    if (view === 'edit' && selectedVehicle) {
        return <VehicleEdit vehicle={selectedVehicle} onBack={handleBackToList} />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-blue-600">Vehiculos</h1>
                <button
                    onClick={handleViewNew}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium text-sm"
                >
                    <Plus size={16} />
                    Nuevo
                </button>
            </div>

            {/* List Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">LISTADO DE VEHÍCULOS</h2>

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
                            <option value={100}>100</option>
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
                <div className="overflow-x-auto min-h-[400px]">
                    <div className="relative">
                        <table className="w-full">
                            <thead className="border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left w-12"></th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                                        <div className="flex items-center gap-1">
                                            # Int. <span className="text-[10px] text-slate-300">▼</span>
                                        </div>
                                    </th>
                                    <th className="px-2 py-3"></th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Domino</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Modelo</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Foto</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                                        <div className="flex items-center gap-1">
                                            Estado <span className="text-[10px] text-slate-300">▼</span>
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                                        <div className="flex items-center gap-1">
                                            Km <span className="text-[10px] text-slate-300">▼</span>
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                                        <div className="flex items-center gap-1">
                                            Año <span className="text-[10px] text-slate-300">▼</span>
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                                        <div className="flex items-center gap-1">
                                            Base <span className="text-[10px] text-slate-300">▼</span>
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Op.</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                                        <div className="flex items-center gap-1">
                                            Función <span className="text-[10px] text-slate-300">▼</span>
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                                        <div className="flex items-center gap-1">
                                            Sector <span className="text-[10px] text-slate-300">▼</span>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {(vehicles || []).map((vehicle) => (
                                    <tr key={vehicle.id} className="hover:bg-slate-50/80 group text-sm text-slate-600">
                                        <td className="px-4 py-3 relative">
                                            <button
                                                onClick={(e) => toggleDropdown(vehicle.id, e)}
                                                className={`p-1 rounded border transition-colors ${activeDropdown === vehicle.id ? 'bg-blue-500 text-white border-blue-500' : 'text-blue-500 border-blue-400 hover:bg-blue-50'}`}
                                            >
                                                <Settings size={14} />
                                            </button>

                                            {/* Dropdown Menu */}
                                            {activeDropdown === vehicle.id && (
                                                <div
                                                    ref={dropdownRef}
                                                    className="absolute left-10 top-0 z-50 w-48 bg-white rounded-md shadow-lg border border-slate-100 py-1"
                                                >
                                                    <button
                                                        onClick={() => handleViewDetail(vehicle)}
                                                        className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                                                    >
                                                        Ver ficha
                                                    </button>
                                                    <button
                                                        onClick={() => handleViewWorkOrder(vehicle)}
                                                        className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                                                    >
                                                        Orden de Trabajo
                                                    </button>
                                                    <button
                                                        onClick={() => handleViewMaintenanceAssign(vehicle)}
                                                        className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                                                    >
                                                        Asignar Plan Mant.
                                                    </button>
                                                    <div className="border-t border-slate-100 my-1"></div>
                                                    <button
                                                        onClick={() => handleViewEdit(vehicle)}
                                                        className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                                                    >
                                                        Editar
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-bold text-slate-900">{vehicle.internalNumber}</td>
                                        <td className="px-2 py-3">
                                            {vehicle.badge && (
                                                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400 text-amber-900 rounded-sm">
                                                    {vehicle.badge}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">{vehicle.domino}</td>
                                        <td className="px-4 py-3 text-xs">{vehicle.modelo}</td>
                                        <td className="px-4 py-3">
                                            {vehicle.foto_url ? (
                                                <button
                                                    onClick={() => setSelectedImage(vehicle.foto_url || null)}
                                                    className="text-xs text-blue-600 underline"
                                                >
                                                    Ver
                                                </button>
                                            ) : (
                                                <span className="text-xs text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">{vehicle.estado}</td>
                                        <td className="px-4 py-3 font-mono">{vehicle.km}</td>
                                        <td className="px-4 py-3">{vehicle.anio}</td>
                                        <td className="px-4 py-3">{vehicle.base}</td>
                                        <td className="px-4 py-3">{vehicle.op}</td>
                                        <td className="px-4 py-3 text-xs">{vehicle.funcion}</td>
                                        <td className="px-4 py-3 text-xs">{vehicle.sector}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {selectedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-white rounded-lg shadow-xl p-4 max-w-3xl w-full mx-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-semibold text-slate-800">Foto del vehículo</h3>
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="text-sm text-slate-500 hover:text-slate-700"
                            >
                                Cerrar
                            </button>
                        </div>
                        <div className="w-full">
                            <img src={selectedImage} alt="Vehículo" className="w-full h-auto rounded" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Vehicles;
