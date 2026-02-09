import React from 'react';
import { IncidentRow } from '../../services/incidentes';

type Props = {
  incidents: IncidentRow[];
  loading: boolean;
  onRefresh: () => void;
  onViewDetail: (incident: IncidentRow) => void;
  onNew?: () => void;
};

export default function IncidentsList({ incidents, loading, onRefresh, onViewDetail, onNew }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="text-lg font-semibold text-slate-900">Lista de incidentes</p>
          <p className="text-sm text-slate-500">Se muestran los incidentes registrados por fecha.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onNew && (
            <button
              type="button"
              onClick={onNew}
              className="rounded border border-slate-300 bg-white px-3 py-1 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
            >
              Generar nuevo
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
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Gravedad</th>
              <th className="px-4 py-2">Informante</th>
              <th className="px-4 py-2">Descripcion</th>
              <th className="px-4 py-2">Usuario</th>
              <th className="px-4 py-2">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {incidents.map((entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-2">{new Date(entry.created_at).toLocaleString()}</td>
                <td className="px-4 py-2">{entry.tipo_incidente ?? '-'}</td>
                <td className="px-4 py-2">{entry.gravedad ?? '-'}</td>
                <td className="px-4 py-2">{`${entry.informante_apellido ?? ''} ${entry.informante_nombres ?? ''}`.trim() || '-'}</td>
                <td className="px-4 py-2">{entry.descripcion_evento ?? '-'}</td>
                <td className="px-4 py-2">{entry.usuarios?.nombre ?? '-'}</td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => onViewDetail(entry)}
                    className="rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-500"
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
            {!incidents.length && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                  No hay incidentes registrados todavia.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
