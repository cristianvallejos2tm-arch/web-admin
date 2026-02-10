import { supabase } from './supabase';

export interface PositionMeters {
    plate: string;
    odometer: number | null;
    hourmeter: number | null;
    date?: string;
}

const normalizePlate = (value: string | null | undefined): string =>
    (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const toNullableNumber = (value: unknown): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
};

export async function fetchPositionsMeters(params: { date?: string; plate?: string } = {}) {
    const { data, error } = await supabase.functions.invoke('maxtracker-positions-meters', {
        body: params,
    });

    if (error) {
        return { data: null as PositionMeters[] | null, error };
    }

    const rows = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.positions)
          ? (data as any).positions
          : [];

    const normalized: PositionMeters[] = rows
        .map((row: any) => ({
            plate: normalizePlate(row?.plate || row?.patente),
            odometer: toNullableNumber(row?.odometer),
            hourmeter: toNullableNumber(row?.hourmeter),
            date: row?.date || row?.timestamp || undefined,
        }))
        .filter((row) => !!row.plate);

    return { data: normalized, error: null };
}

export function normalizeVehiclePlate(value: string | null | undefined) {
    return normalizePlate(value);
}
