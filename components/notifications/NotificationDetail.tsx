import React from 'react';
import { NotificationRecord } from '../../services/notificaciones';
import { NOTIFICATION_STATUS } from './data';

type Props = {
  notification?: NotificationRecord;
  isOpen: boolean;
  onClose: () => void;
};

// Modal que muestra el detalle completo de una notificación y sus destinatarios.
export default function NotificationDetail({ notification, onClose, isOpen }: Props) {
  if (!notification || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Detalle de notificación</h3>
          <button onClick={onClose} className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100">
            Cerrar
          </button>
        </div>
        <div className="mt-3 space-y-2 border-b border-slate-100 pb-3">
          <p className="text-sm text-slate-500 uppercase">{notification.tipo}</p>
          <h4 className="text-xl font-semibold text-slate-900">{notification.titulo}</h4>
          <p className="text-sm text-slate-500">Creado por {notification.creado?.nombre}</p>
          <p className="text-sm italic text-slate-500">{new Date(notification.creado_en).toLocaleString()}</p>
        </div>
        <p className="mt-3 text-sm text-slate-700">{notification.mensaje}</p>
        {notification.archivos?.length ? (
          <div className="mt-4">
            <p className="text-sm font-semibold text-slate-600">Archivos adjuntos</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {notification.archivos.map((file) => (
                <li key={file.url}>
                  <a className="underline" href={file.url} target="_blank" rel="noreferrer">
                    {file.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="mt-4 grid gap-3">
          <div className="text-sm font-semibold text-slate-600">Destinatarios</div>
          <div className="space-y-2">
            {notification.destinatarios?.map((recipient) => {
              const status = NOTIFICATION_STATUS.find((status) => status.id === recipient.estado);
              return (
                <div key={recipient.id} className="flex items-center justify-between rounded border border-slate-200 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{recipient.usuarios?.nombre}</p>
                    <p className="text-xs text-slate-500">{recipient.usuarios?.email}</p>
                  </div>
                  <div className="flex flex-col items-end text-xs">
                    <span className={`rounded-full px-2 py-1 ${status?.color ?? 'bg-slate-200 text-slate-700'}`}>
                      {status?.label ?? recipient.estado}
                    </span>
                    <span className="text-slate-400">{recipient.fecha_leido ? new Date(recipient.fecha_leido).toLocaleString() : 'Pendiente'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
