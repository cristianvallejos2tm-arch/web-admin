import React from 'react';
import { ObservationRow } from '../../services/observaciones';

type Props = {
  observation?: ObservationRow;
  isOpen: boolean;
  onClose: () => void;
};

export default function ObservationDetailModal({ observation, isOpen, onClose }: Props) {
  if (!isOpen || !observation) {
    return null;
  }

  const checklist = observation.observaciones_checklist ?? [];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Detalle de Observación</h3>
          <button onClick={onClose} className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100">
            Cerrar
          </button>
        </div>
        <dl className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-slate-500">Área / sector</dt>
            <dd className="text-sm text-slate-900">{observation.area}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Tarea observada</dt>
            <dd className="text-sm text-slate-900">{observation.tarea_observada}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Tipo</dt>
            <dd className="text-sm text-slate-900">{observation.tipo}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Fecha</dt>
            <dd className="text-sm text-slate-900">{new Date(observation.created_at).toLocaleString()}</dd>
          </div>
        </dl>
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs uppercase text-slate-500">Descripción</p>
            <p className="text-sm text-slate-900">{observation.descripcion}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Acción sugerida</p>
            <p className="text-sm text-slate-900">{observation.accion_sugerida}</p>
          </div>
        </div>
        <div className="mt-6">
          <p className="text-xs uppercase text-slate-500">Checklist</p>
          <div className="mt-2 grid gap-3">
            {checklist.map((item) => (
              <div key={`${item.categoria}-${item.opcion}`} className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <p className="text-slate-500">{item.categoria}</p>
                <p className="text-slate-700">{item.opcion}</p>
              </div>
            ))}
            {checklist.length === 0 && (
              <p className="text-sm text-slate-500">No se registraron ítems seleccionados.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
