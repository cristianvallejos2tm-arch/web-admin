import React, { useMemo } from 'react';

export type IncidentsStatsEntry = {
  categoria: string;
  opcion: string;
  cantidad: number;
};

type Props = {
  entries: IncidentsStatsEntry[];
  loading: boolean;
  desde: string;
  hasta: string;
  onFilter: (desde: string, hasta: string) => void;
  onBack: () => void;
};

export default function IncidentsStats({ entries, loading, desde, hasta, onFilter, onBack }: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, IncidentsStatsEntry[]>();
    entries.forEach((entry) => {
      const list = map.get(entry.categoria) ?? [];
      list.push(entry);
      map.set(entry.categoria, list);
    });
    return Array.from(map.entries());
  }, [entries]);

  const maxCount = useMemo(() => entries.reduce((max, entry) => Math.max(max, entry.cantidad), 0), [entries]);

  return (
    <div className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-slate-900">Estadisticas de incidentes</p>
          <p className="text-sm text-slate-500">Analiza la cantidad por categoria / item.</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
        >
          Volver
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Desde
          <input
            type="date"
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={desde}
            onChange={(event) => onFilter(event.target.value, hasta)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Hasta
          <input
            type="date"
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={hasta}
            onChange={(event) => onFilter(desde, event.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={() => onFilter(desde, hasta)}
          disabled={loading}
          className="h-10 self-end rounded bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? 'Filtrando...' : 'Filtrar'}
        </button>
      </div>

      {loading && <p className="text-sm text-slate-500">Cargando estadisticas...</p>}

      <div className="space-y-4">
        {grouped.map(([categoria, items]) => (
          <div key={categoria} className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
            <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-700">{categoria}</div>
            <div className="space-y-1 text-sm">
              {items.map((item) => (
                <div key={`${categoria}-${item.opcion}`} className="flex items-center justify-between">
                  <span>{item.opcion}</span>
                  <span className="font-semibold text-slate-900">{item.cantidad}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-500">Total por categoria</p>
        <div className="mt-3 space-y-3">
          {grouped.map(([categoria, items]) => {
            const total = items.reduce((acc, item) => acc + item.cantidad, 0);
            const width = maxCount ? Math.round((total / maxCount) * 50) : 0;
            return (
              <div key={`summary-${categoria}`} className="space-y-1">
                <div className="flex items-center justify-between text-xs uppercase text-slate-500">
                  <span>{categoria}</span>
                  <span>{total}</span>
                </div>
                <div className="h-2 w-full rounded bg-slate-200">
                  <div className="h-full rounded bg-slate-900" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
