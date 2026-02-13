import React, { useEffect, useMemo, useRef, useState } from 'react';
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
    const [internalFilter, setInternalFilter] = useState('');
    const [domainFilter, setDomainFilter] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('');
    const [baseFilter, setBaseFilter] = useState('');
    const [sectorFilter, setSectorFilter] = useState('');
    const [funcionFilter, setFuncionFilter] = useState('');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const baseOptions = useMemo(
        () => Array.from(new Set(vehicles.map((v) => v.base).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
        [vehicles],
    );
    const estadoOptions = useMemo(
        () => Array.from(new Set(vehicles.map((v) => v.estado).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
        [vehicles],
    );
    const sectorOptions = useMemo(
        () => Array.from(new Set(vehicles.map((v) => v.sector).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
        [vehicles],
    );
    const funcionOptions = useMemo(
        () => Array.from(new Set(vehicles.map((v) => v.funcion).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
        [vehicles],
    );

    const filteredVehicles = useMemo(() => {
        return vehicles.filter((vehicle) => {
            const internalOk = !internalFilter.trim()
                || vehicle.internalNumber.toLowerCase().includes(internalFilter.trim().toLowerCase());
            const domainOk = !domainFilter.trim()
                || vehicle.dominio.toLowerCase().includes(domainFilter.trim().toLowerCase());
            const estadoOk = !estadoFilter || vehicle.estado === estadoFilter;
            const baseOk = !baseFilter || vehicle.base === baseFilter;
            const sectorOk = !sectorFilter || vehicle.sector === sectorFilter;
            const funcionOk = !funcionFilter || vehicle.funcion === funcionFilter;
            return internalOk && domainOk && estadoOk && baseOk && sectorOk && funcionOk;
        });
    }, [vehicles, internalFilter, domainFilter, estadoFilter, baseFilter, sectorFilter, funcionFilter]);

    useEffect(() => {
        onPageChange(1);
    }, [internalFilter, domainFilter, estadoFilter, baseFilter, sectorFilter, funcionFilter, onPageChange]);

    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / rowsPerPage));
        if (page > totalPages) onPageChange(totalPages);
    }, [filteredVehicles.length, rowsPerPage, page, onPageChange]);

    const paginatedVehicles = useMemo(() => {
        const from = (page - 1) * rowsPerPage;
        const to = from + rowsPerPage;
        return filteredVehicles.slice(from, to);
    }, [filteredVehicles, page, rowsPerPage]);

    const exportToCsv = () => {
        const headers = ['Interno', 'Dominio', 'Estado', 'Kilometraje', 'Horometro', 'Ano', 'Base', 'Sector', 'Funcion'];
        const rows = filteredVehicles.map((vehicle) => [
            vehicle.internalNumber || '',
            vehicle.dominio || '',
            vehicle.estado || '',
            String(vehicle.km || 0),
            String(vehicle.horometro || 0),
            vehicle.anio || '',
            vehicle.base || '',
            vehicle.sector || '',
            vehicle.funcion || '',
        ]);
        const csv = [headers, ...rows]
            .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `vehiculos_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const exportToPdf = () => {
        const rowsHtml = filteredVehicles
            .map(
                (vehicle) => `
                <tr>
                    <td>${vehicle.internalNumber || '-'}</td>
                    <td>${vehicle.dominio || '-'}</td>
                    <td>${vehicle.estado || '-'}</td>
                    <td>${(vehicle.km || 0).toLocaleString()}</td>
                    <td>${(vehicle.horometro || 0).toLocaleString()}</td>
                    <td>${vehicle.anio || '-'}</td>
                    <td>${vehicle.base || '-'}</td>
                    <td>${vehicle.sector || '-'}</td>
                    <td>${vehicle.funcion || '-'}</td>
                </tr>
            `,
            )
            .join('');
        const printWindow = window.open('', '_blank', 'width=1100,height=800');
        if (!printWindow) return;
        printWindow.document.write(`
            <html>
                <head>
                    <title>Listado de Vehiculos</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 16px; }
                        h1 { font-size: 18px; margin-bottom: 12px; }
                        table { width: 100%; border-collapse: collapse; font-size: 12px; }
                        th, td { border: 1px solid #d1d5db; padding: 6px; text-align: left; }
                        th { background: #f3f4f6; }
                    </style>
                </head>
                <body>
                    <h1>Listado de Vehiculos</h1>
                    <table>
                        <thead>
                            <tr>
                                <th>Interno</th><th>Dominio</th><th>Estado</th><th>Kilometraje</th><th>Horometro</th><th>Ano</th><th>Base</th><th>Sector</th><th>Funcion</th>
                            </tr>
                        </thead>
                        <tbody>${rowsHtml}</tbody>
                    </table>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

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

                    <div className="flex flex-wrap items-end gap-2">
                        <button
                            onClick={() => setFiltersOpen((prev) => !prev)}
                            className="px-3 py-1.5 bg-slate-200 text-slate-700 text-sm font-medium rounded hover:bg-slate-300 transition-colors"
                        >
                            {filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
                        </button>
                        <button
                            onClick={exportToCsv}
                            className="px-3 py-1.5 bg-cyan-500 text-white text-sm font-medium rounded hover:bg-cyan-600 transition-colors"
                        >
                            Excel
                        </button>
                        <button
                            onClick={exportToPdf}
                            className="px-3 py-1.5 bg-cyan-500 text-white text-sm font-medium rounded hover:bg-cyan-600 transition-colors"
                        >
                            Pdf
                        </button>
                    </div>
                </div>

                {filtersOpen && (
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs text-slate-600">Interno</label>
                            <input
                                type="text"
                                value={internalFilter}
                                onChange={(e) => setInternalFilter(e.target.value)}
                                placeholder="Ej: 39"
                                className="px-3 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-600">Dominio</label>
                            <input
                                type="text"
                                value={domainFilter}
                                onChange={(e) => setDomainFilter(e.target.value)}
                                placeholder="Ej: AA123BB"
                                className="px-3 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-600">Estado</label>
                            <select
                                value={estadoFilter}
                                onChange={(e) => setEstadoFilter(e.target.value)}
                                className="px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                            >
                                <option value="">Todos</option>
                                {estadoOptions.map((estado) => (
                                    <option key={estado} value={estado}>
                                        {estado}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-600">Base</label>
                            <select
                                value={baseFilter}
                                onChange={(e) => setBaseFilter(e.target.value)}
                                className="px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                            >
                                <option value="">Todas</option>
                                {baseOptions.map((base) => (
                                    <option key={base} value={base}>
                                        {base}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-600">Sector</label>
                            <select
                                value={sectorFilter}
                                onChange={(e) => setSectorFilter(e.target.value)}
                                className="px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                            >
                                <option value="">Todas</option>
                                {sectorOptions.map((sector) => (
                                    <option key={sector} value={sector}>
                                        {sector}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-600">Funcion</label>
                            <select
                                value={funcionFilter}
                                onChange={(e) => setFuncionFilter(e.target.value)}
                                className="px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                            >
                                <option value="">Todas</option>
                                {funcionOptions.map((funcion) => (
                                    <option key={funcion} value={funcion}>
                                        {funcion}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-600">&nbsp;</label>
                            <button
                                onClick={() => {
                                    setInternalFilter('');
                                    setDomainFilter('');
                                    setEstadoFilter('');
                                    setBaseFilter('');
                                    setSectorFilter('');
                                    setFuncionFilter('');
                                }}
                                className="w-full px-3 py-1.5 bg-slate-200 text-slate-700 text-sm font-medium rounded hover:bg-slate-300 transition-colors"
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    </div>
                )}

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
                                ) : paginatedVehicles.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-4 py-6 text-center text-sm text-slate-500">
                                            No hay vehiculos registrados.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedVehicles.map((vehicle) => (
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
                            total={filteredVehicles.length}
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
