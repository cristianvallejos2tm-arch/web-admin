import React, { useCallback, useEffect, useState } from 'react';
import VehicleDetail from '../VehicleDetail';
import VehicleForm from '../VehicleForm';
import VehicleEdit from '../VehicleEdit';
import VehicleMaintenanceAssign from '../VehicleMaintenanceAssign';
import VehicleWorkOrder from '../VehicleWorkOrder';
import VehiclesList, { VehicleSummary } from './VehiclesList';
import { fetchVehiculos } from '../../services/supabase';

type ViewState = 'list' | 'detail' | 'workOrder' | 'maintenanceAssign' | 'new' | 'edit';

const VehiclesModule: React.FC = () => {
    const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [totalCount, setTotalCount] = useState(0);
    const [view, setView] = useState<ViewState>('list');
    const [selectedVehicle, setSelectedVehicle] = useState<VehicleSummary | null>(null);

    const loadVehicles = useCallback(async () => {
        setLoading(true);
        const { data, count, error } = await fetchVehiculos({
            page,
            limit: rowsPerPage,
        });
        if (error) {
            console.error('Error al cargar vehículos', error);
        }
        if (data) {
            const mapped = data.map((v: any): VehicleSummary => ({
                id: v.id,
                internalNumber: v.num_int || '',
                badge: v.activo === false ? 'INACT' : undefined,
                dominio: v.patente || '',
                modelo: v.modelo || v.marca || '',
                estado: v.estado ? 'Operativo' : 'Inactivo',
                km: v.kilometraje_actual || 0,
                anio: v.anio ? String(v.anio) : '',
                base: v.base || '',
                op: v.op || '',
                funcion: v.funcion || '',
                sector: v.sector || '',
                foto_url: v.foto_url || null,
            }));
            setVehicles(mapped);
        }
        setTotalCount(count ?? 0);
        setLoading(false);
    }, [page, rowsPerPage]);

    useEffect(() => {
        loadVehicles();
    }, [loadVehicles]);

    const handleBackToList = () => {
        setView('list');
        setSelectedVehicle(null);
        loadVehicles();
    };

    const handleViewDetail = (vehicle: VehicleSummary) => {
        setSelectedVehicle(vehicle);
        setView('detail');
    };

    const handleViewWorkOrder = (vehicle: VehicleSummary) => {
        setSelectedVehicle(vehicle);
        setView('workOrder');
    };

    const handleViewMaintenanceAssign = (vehicle: VehicleSummary) => {
        setSelectedVehicle(vehicle);
        setView('maintenanceAssign');
    };

    const handleViewEdit = (vehicle: VehicleSummary) => {
        setSelectedVehicle(vehicle);
        setView('edit');
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (limit: number) => {
        setRowsPerPage(limit);
        setPage(1);
    };

    const handleViewNew = () => {
        setSelectedVehicle(null);
        setView('new');
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
        <VehiclesList
            vehicles={vehicles}
            loading={loading}
            totalCount={totalCount}
            page={page}
            rowsPerPage={rowsPerPage}
            onNew={handleViewNew}
            onViewDetail={handleViewDetail}
            onViewWorkOrder={handleViewWorkOrder}
            onViewMaintenanceAssign={handleViewMaintenanceAssign}
            onViewEdit={handleViewEdit}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
        />
    );
};

export default VehiclesModule;
