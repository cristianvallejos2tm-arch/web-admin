import React from 'react';
import { NotificationRecord } from '../../services/notificaciones';

type Props = {
  notifications: NotificationRecord[];
  loading: boolean;
  onViewDetail: (notification: NotificationRecord) => void;
};

// Lista las notificaciones publicadas mostrando cant. de destinatarios leídos y acciones.
export default function NotificationsList({ notifications, loading, onViewDetail }: Props) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-lg font-semibold text-slate-900">Listado de notificaciones</p>
          <p className="text-sm text-slate-500">Solo los administradores habilitados pueden verlas.</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Título</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Creador</th>
              <th className="px-4 py-2">Destinatarios (leídos)</th>
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                  Cargando notificaciones...
                </td>
              </tr>
            )}
            {!loading &&
              notifications.map((notification) => {
                const total = notification.destinatarios?.length ?? 0;
                const leidos = notification.destinatarios?.filter((item) => item.estado === 'leído').length ?? 0;
                return (
                  <tr key={notification.id}>
                    <td className="px-4 py-3 font-semibold">{notification.id.slice(0, 6)}</td>
                    <td className="px-4 py-3">{notification.titulo}</td>
                    <td className="px-4 py-3">{notification.tipo}</td>
                    <td className="px-4 py-3">{new Date(notification.creado_en).toLocaleString()}</td>
                    <td className="px-4 py-3">{notification.creado?.nombre ?? '—'}</td>
                    <td className="px-4 py-3">
                      {`${leidos ?? 0} (${total ?? 0} lecturas)`}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onViewDetail(notification)}
                        className="rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-500"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                );
              })}
            {!loading && !notifications.length && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                  No se crearon notificaciones todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
