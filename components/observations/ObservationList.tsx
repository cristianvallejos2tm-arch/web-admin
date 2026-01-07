import React from 'react';
import { ObservationRow } from '../../services/observaciones';

type Props = {
  observations: ObservationRow[];
  loading: boolean;
  onRefresh: () => void;
  onViewDetail: (observation: ObservationRow) => void;
  onNew?: () => void;
};

export default function ObservationList({
  observations,
  loading,
  onRefresh,
  onViewDetail,
  onNew,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="text-lg font-semibold text-slate-900">Lista de observaciones</p>
          <p className="text-sm text-slate-500">Se muestran los registros propios ordenados por fecha.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onNew && (
            <button
              type="button"
              onClick={onNew}
              className="rounded border border-slate-300 bg-white px-3 py-1 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
            >
              Generar nueva
            </button>
          )}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="rounded bg-slate-900 px-3 py-1 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white">
        <table className="w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Área / Sector</th>
              <th className="px-4 py-2">Tarea observada</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Descripción</th>
              <th className="px-4 py-2">Acción</th>
              <th className="px-4 py-2">Usuario</th>
              <th className="px-4 py-2">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {observations.map((obs) => (
              <tr key={obs.id}>
                <td className="px-4 py-2">{new Date(obs.created_at).toLocaleString()}</td>
                <td className="px-4 py-2">{obs.area}</td>
                <td className="px-4 py-2">{obs.tarea_observada}</td>
                <td className="px-4 py-2 capitalize">{obs.tipo}</td>
                <td className="px-4 py-2">{obs.descripcion}</td>
                <td className="px-4 py-2">{obs.accion_sugerida}</td>
                <td className="px-4 py-2">{obs.usuarios?.nombre ?? '—'}</td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => onViewDetail(obs)}
                    className="rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-500"
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
            {!observations.length && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                  No hay observaciones registradas todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
