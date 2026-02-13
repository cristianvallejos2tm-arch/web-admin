import React, { useCallback, useEffect, useState } from 'react';
import VehicleDetail from './VehicleDetail';
import VehicleForm from './VehicleForm';
import VehicleEdit from './VehicleEdit';
import VehicleMaintenanceAssign from './VehicleMaintenanceAssign';
import VehicleWorkOrder from './VehicleWorkOrder';
import VehiclesList, { VehicleSummary } from './VehiclesList';
import { fetchVehiculos, updateVehiculo } from '../../services/supabase';
import { fetchPositionsMeters, normalizeVehiclePlate } from '../../services/maxtracker';

type ViewState = 'list' | 'detail' | 'workOrder' | 'maintenanceAssign' | 'new' | 'edit';

const getTodayIso = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().slice(0, 10);
};

const parseOperadoras = (value?: string | null) =>
    String(value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

const VehiclesModule: React.FC = () => {
    const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncingMeters, setSyncingMeters] = useState(false);
    const [syncDate, setSyncDate] = useState(getTodayIso());
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [totalCount, setTotalCount] = useState(0);
    const [view, setView] = useState<ViewState>('list');
    const [selectedVehicle, setSelectedVehicle] = useState<VehicleSummary | null>(null);

    const loadVehicles = useCallback(async () => {
        setLoading(true);
        const { data, count, error } = await fetchVehiculos();
        if (error) {
            console.error('Error al cargar vehiculos', error);
        }
        if (data) {
            const mapped = data.map((v: any): VehicleSummary => ({
                id: v.id,
                internalNumber: v.num_int || '',
                badge: v.activo === false ? 'INACT' : undefined,
                dominio: v.patente || '',
                modelo: v.modelo || v.marca || '',
                marca: v.marca || '',
                estado: v.estado || (v.activo === false ? 'Inactivo' : 'Operativo'),
                km: v.kilometraje_actual || 0,
                anio: v.anio ? String(v.anio) : '',
                vin: v.vin || '',
                base: v.base || '',
                op: v.op || '',
                funcion: v.funcion || '',
                sector: v.sector || '',
                horometro: v.horometro || 0,
                tipoComb: v.tipo_combustible || '',
                consumoKmLt: v.consumo_Km || '',
                consumo100: v.Consumo_100km || '',
                capacidad: v.capacidat_Tanque || '',
                observaciones: v.observaciones || '',
                caracteristicas: v.caracteristicas_equipo || '',
                operadoras: parseOperadoras(v.op),
                foto_url: v.foto_url || null,
            }));
            setVehicles(mapped);
        }
        setTotalCount(count ?? data?.length ?? 0);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadVehicles();
    }, [loadVehicles]);

    const handleSyncMeters = async () => {
        setSyncingMeters(true);
        const { data, error } = await fetchPositionsMeters({ date: syncDate });

        if (error || !data) {
            console.error('Error sincronizando odometro/horometro', error);
            setSyncingMeters(false);
            return;
        }

        const byPlate = new Map(data.map((item) => [item.plate, item]));

        const updated = vehicles.map((vehicle) => {
            const key = normalizeVehiclePlate(vehicle.dominio);
            const meter = byPlate.get(key);
            if (!meter) return vehicle;

            const nextKm = meter.odometer ?? vehicle.km;
            const nextHm = meter.hourmeter ?? vehicle.horometro ?? 0;

            return {
                ...vehicle,
                km: nextKm,
                horometro: nextHm,
            };
        });

        setVehicles(updated);

        const updates = updated.filter((vehicle, index) => {
            const prev = vehicles[index];
            return prev && (prev.km !== vehicle.km || (prev.horometro || 0) !== (vehicle.horometro || 0));
        });

        if (updates.length > 0) {
            await Promise.allSettled(
                updates.map((vehicle) =>
                    updateVehiculo(vehicle.id, {
                        kilometraje_actual: vehicle.km,
                        horometro: vehicle.horometro || 0,
                    }),
                ),
            );
        }

        setSyncingMeters(false);
    };

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

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage);
    }, []);

    const handleRowsPerPageChange = useCallback((limit: number) => {
        setRowsPerPage(limit);
        setPage(1);
    }, []);

    const handleViewNew = () => {
        setSelectedVehicle(null);
        setView('new');
    };

    if (view === 'detail' && selectedVehicle) {
        return (
            <VehicleDetail
                vehicle={selectedVehicle}
                onBack={handleBackToList}
                onEdit={() => handleViewEdit(selectedVehicle)}
                onWorkOrder={() => handleViewWorkOrder(selectedVehicle)}
                onMaintenanceAssign={() => handleViewMaintenanceAssign(selectedVehicle)}
            />
        );
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
            syncingMeters={syncingMeters}
            syncDate={syncDate}
            totalCount={totalCount}
            page={page}
            rowsPerPage={rowsPerPage}
            onNew={handleViewNew}
            onSyncMeters={handleSyncMeters}
            onSyncDateChange={setSyncDate}
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
