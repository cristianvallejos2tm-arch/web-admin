import React, { useState } from 'react';
import { IncidentRow } from '../../services/incidentes';
import { downloadIncidentAsExcelTemplate } from './exportIncidentExcel';

type Props = {
  incident?: IncidentRow;
  isOpen: boolean;
  onClose: () => void;
};

export default function IncidentDetailModal({ incident, isOpen, onClose }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (!isOpen || !incident) {
    return null;
  }

  const catalogo = incident.incidentes_catalogo ?? [];
  const fotos = incident.fotos ?? [];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-4xl rounded-lg bg-white p-6 shadow-lg">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Detalle de incidente</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                setDownloading(true);
                setDownloadError(null);
                try {
                  await downloadIncidentAsExcelTemplate(incident);
                } catch (error) {
                  console.error(error);
                  setDownloadError('No se pudo generar el Excel.');
                } finally {
                  setDownloading(false);
                }
              }}
              disabled={downloading}
              className="rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-500 disabled:opacity-60"
            >
              {downloading ? 'Generando...' : 'Descargar Excel'}
            </button>
            <button onClick={onClose} className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100">
              Cerrar
            </button>
          </div>
        </div>
        {downloadError && <p className="mt-2 text-xs text-red-600">{downloadError}</p>}

        <dl className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <dt className="text-xs uppercase text-slate-500">Fecha registro</dt>
            <dd className="text-sm text-slate-900">{new Date(incident.created_at).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Tipo incidente</dt>
            <dd className="text-sm text-slate-900">{incident.tipo_incidente ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Gravedad</dt>
            <dd className="text-sm text-slate-900">{incident.gravedad ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Informante</dt>
            <dd className="text-sm text-slate-900">
              {`${incident.informante_apellido ?? ''} ${incident.informante_nombres ?? ''}`.trim() || '-'}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Accidentado</dt>
            <dd className="text-sm text-slate-900">{incident.accidentado_nombre ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Unidad afectada</dt>
            <dd className="text-sm text-slate-900">{incident.unidad_patente ?? '-'}</dd>
          </div>
        </dl>

        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs uppercase text-slate-500">Descripcion del evento</p>
            <p className="text-sm text-slate-900">{incident.descripcion_evento ?? '-'}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Causas</p>
            <p className="text-sm text-slate-900">{incident.causas_incidente ?? '-'}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Acciones correctivas inmediatas</p>
            <p className="text-sm text-slate-900">{incident.acciones_correctivas ?? '-'}</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs uppercase text-slate-500">Catalogo seleccionado</p>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {catalogo.map((item) => (
              <div key={`${item.categoria}-${item.opcion}`} className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <p className="text-slate-500">{item.categoria}</p>
                <p className="text-slate-700">{item.opcion}</p>
              </div>
            ))}
            {catalogo.length === 0 && (
              <p className="text-sm text-slate-500">No hay catalogo asociado.</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs uppercase text-slate-500">Fotos</p>
          <div className="mt-2 grid gap-2">
            {fotos.map((foto, index) => (
              <a key={`${foto}-${index}`} href={foto} target="_blank" rel="noreferrer" className="text-sm text-blue-700 underline">
                {foto}
              </a>
            ))}
            {fotos.length === 0 && <p className="text-sm text-slate-500">No se cargaron fotos.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
