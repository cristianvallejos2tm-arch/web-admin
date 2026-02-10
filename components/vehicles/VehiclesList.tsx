import React, { useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface VehicleSummary {
    id: string;
    internalNumber: string;
    badge?: string;
    dominio: string;
    modelo: string;
    marca?: string;
    estado: string;
    km: number;
    anio: string;
    vin?: string;
    base: string;
    op: string;
    funcion: string;
    sector: string;
    horometro?: number;
    tipoComb?: string;
    consumoKmLt?: string;
    consumo100?: string;
    capacidad?: string;
    observaciones?: string;
    caracteristicas?: string;
    operadoras?: string[];
    foto_url?: string | null;
}

interface VehiclesListProps {
    vehicles: VehicleSummary[];
    loading: boolean;
    syncingMeters: boolean;
    syncDate: string;
    totalCount: number;
    page: number;
    rowsPerPage: number;
    onNew: () => void;
    onSyncMeters: () => void;
    onSyncDateChange: (value: string) => void;
    onViewDetail: (vehicle: VehicleSummary) => void;
    onViewWorkOrder: (vehicle: VehicleSummary) => void;
    onViewMaintenanceAssign: (vehicle: VehicleSummary) => void;
    onViewEdit: (vehicle: VehicleSummary) => void;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (limit: number) => void;
}

const PaginationControls: React.FC<{
    total: number;
    page: number;
    rowsPerPage: number;
    onPageChange: (page: number) => void;
}> = ({ total, page, rowsPerPage, onPageChange }) => {
    const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
    const windowSize = 5;
    const startPage = Math.max(1, Math.min(page - Math.floor(windowSize / 2), totalPages - windowSize + 1));
    const endPage = Math.min(totalPages, startPage + windowSize - 1);
    const visiblePages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
    return (
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>
                Mostrando pagina {page} de {totalPages} ({total} registros)
            </span>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1 border border-slate-200 rounded"
                >
                    Anterior
                </button>
                {visiblePages.map((pageNumber) => (
                    <button
                        key={pageNumber}
                        onClick={() => onPageChange(pageNumber)}
                        className={`px-3 py-1 border rounded ${
                            pageNumber === page ? 'bg-slate-900 text-white' : 'border-slate-200 text-slate-600'
                        }`}
                    >
                        {pageNumber}
                    </button>
                ))}
                <button
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1 border border-slate-200 rounded"
                >
                    Siguiente
                </button>
            </div>
        </div>
    );
};

const VehiclesList: React.FC<VehiclesListProps> = ({
    vehicles,
    loading,
    syncingMeters,
    syncDate,
    totalCount,
    page,
    rowsPerPage,
    onNew,
    onSyncMeters,
    onSyncDateChange,
    onViewDetail,
    onViewWorkOrder,
    onViewMaintenanceAssign,
    onViewEdit,
    onPageChange,
    onRowsPerPageChange,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredVehicles = useMemo(() => {
        if (!searchTerm.trim()) return vehicles;
        const term = searchTerm.trim().toLowerCase();
        return vehicles.filter((vehicle) =>
            `${vehicle.internalNumber} ${vehicle.dominio} ${vehicle.modelo} ${vehicle.base}`.toLowerCase().includes(term)
        );
    }, [vehicles, searchTerm]);

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-blue-600">Vehiculos</h1>
                <div className="flex flex-wrap items-center gap-2">
                    <input
                        type="date"
                        value={syncDate}
                        onChange={(e) => onSyncDateChange(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <button
                        onClick={onSyncMeters}
                        disabled={syncingMeters}
                        className="px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors font-medium text-sm disabled:opacity-60"
                    >
                        {syncingMeters ? 'Sincronizando...' : 'Sync Odo/Hm'}
                    </button>
                    <button
                        onClick={onNew}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium text-sm"
                    >
                        <ChevronDown size={16} />
                        Nuevo
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">LISTADO DE VEHICULOS</h2>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-600">Mostrar</label>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
                            className="px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {[25, 50, 100].map((value) => (
                                <option key={value} value={value}>
                                    {value}
                                </option>
                            ))}
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

                <div className="overflow-x-auto min-h-[400px]">
                    <div className="relative">
                        <table className="w-full">
                            <thead className="border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">#Int.</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Dominio</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Estado</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Kilometraje</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Horometro</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Año</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Base</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Sector</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Funcion</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={10} className="px-4 py-6 text-center text-sm text-slate-500">
                                            Cargando vehiculos...
                                        </td>
                                    </tr>
                                ) : filteredVehicles.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-4 py-6 text-center text-sm text-slate-500">
                                            No hay vehiculos registrados.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredVehicles.map((vehicle) => (
                                        <tr key={vehicle.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                            <td className="px-4 py-3 text-sm font-semibold text-slate-900">{vehicle.internalNumber}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{vehicle.dominio}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{vehicle.estado}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{vehicle.km.toLocaleString()} km</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{(vehicle.horometro || 0).toLocaleString()} hs</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{vehicle.anio}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{vehicle.base}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{vehicle.sector}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{vehicle.funcion}</td>
                                            <td className="px-4 py-3 relative" ref={dropdownRef}>
                                                <button
                                                    onClick={() => setActiveDropdown((prev) => (prev === vehicle.id ? null : vehicle.id))}
                                                    className="px-3 py-1 border border-slate-300 rounded text-xs font-semibold text-slate-600 hover:bg-slate-100"
                                                >
                                                    Acciones
                                                </button>
                                                {activeDropdown === vehicle.id && (
                                                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-lg z-10">
                                                        <button
                                                            onClick={() => onViewDetail(vehicle)}
                                                            className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                                                        >
                                                            Ver detalle
                                                        </button>
                                                        <button
                                                            onClick={() => onViewWorkOrder(vehicle)}
                                                            className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                                                        >
                                                            Orden de trabajo
                                                        </button>
                                                        <button
                                                            onClick={() => onViewMaintenanceAssign(vehicle)}
                                                            className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                                                        >
                                                            Asignar mantenimiento
                                                        </button>
                                                        <button
                                                            onClick={() => onViewEdit(vehicle)}
                                                            className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                                                        >
                                                            Editar
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
                    <div className="p-2">
                        <PaginationControls
                            total={totalCount}
                            page={page}
                            rowsPerPage={rowsPerPage}
                            onPageChange={onPageChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VehiclesList;
