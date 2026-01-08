import React, { useMemo, useState } from 'react';
import { NOTIFICATION_TYPES } from './data';
import { NotificationRecipient } from '../../services/notificaciones';

export type NotificationsFormValues = {
  titulo: string;
  mensaje: string;
  tipo: string;
  bases: string[];
  archivos: File[];
  destinatarios: NotificationRecipient[];
};

type Props = {
  onSave: (values: NotificationsFormValues) => Promise<void>;
  bases: { id: string; nombre: string }[];
  onClose?: () => void;
  fetchingUsers: boolean;
  users: NotificationRecipient[];
  onBasesChange: (bases: string[]) => void;
};

export default function NotificationsForm({ onSave, bases, onClose, fetchingUsers, users, onBasesChange }: Props) {
  const [values, setValues] = useState<NotificationsFormValues>({
    titulo: '',
    mensaje: '',
    tipo: '',
    bases: [],
    archivos: [],
    destinatarios: [],
  });
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const selectedUsers = users;

  const isValid = useMemo(
    () => values.titulo.trim() !== '' && values.mensaje.trim() !== '' && values.tipo !== '' && values.bases.length > 0,
    [values],
  );

  const handleChange = (field: keyof NotificationsFormValues, payload: string | string[]) => {
    setValues((prev) => ({ ...prev, [field]: payload }));
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const list = Array.from(files).slice(0, 3);
    setValues((prev) => ({ ...prev, archivos: list }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid) {
      setError('Complete los campos obligatorios.');
      return;
    }
    setStatus('saving');
    setError(null);
    try {
      const payload: NotificationsFormValues = {
        ...values,
        destinatarios: selectedUsers,
      };
      await onSave(payload);
      setStatus('saved');
      setValues({
        titulo: '',
        mensaje: '',
        tipo: '',
        bases: [],
        archivos: [],
        destinatarios: [],
      });
    } catch (err) {
      console.error(err);
      setStatus('error');
      setError('No se pudo guardar la notificación.');
    }
  };

  return (
    <form className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
          Título *
          <input
            type="text"
            value={values.titulo}
            onChange={(event) => handleChange('titulo', event.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
          Tipo *
          <select
            value={values.tipo}
            onChange={(event) => handleChange('tipo', event.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            <option value="">-- Seleccionar --</option>
            {NOTIFICATION_TYPES.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
          Bases destinatarias *
            <div className="max-h-28 overflow-y-auto rounded border border-slate-300 bg-slate-50 px-3 py-2">
              {bases.map((base) => (
                <label key={base.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={values.bases.includes(base.id)}
                  onChange={(event) => {
               const next = event.target.checked
                  ? [...values.bases, base.id]
                  : values.bases.filter((id) => id !== base.id);
                handleChange('bases', next);
                onBasesChange(next);
              }}
            />
                {base.nombre}
              </label>
            ))}
          </div>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
        Mensaje *
        <textarea
          rows={4}
          value={values.mensaje}
          onChange={(event) => handleChange('mensaje', event.target.value)}
          className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
          Adjuntar archivos (máx. 3)
          <input type="file" multiple onChange={(event) => handleFiles(event.target.files)} />
        </label>
        <div>
          <p className="text-sm font-semibold text-slate-600">Usuarios destinatarios</p>
          <p className="text-xs text-slate-500">{fetchingUsers ? 'Cargando usuarios...' : `${selectedUsers.length} usuarios seleccionados`}</p>
          <div className="mt-1 max-h-32 overflow-y-auto rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {fetchingUsers ? (
              <p>Cargando...</p>
            ) : selectedUsers.length ? (
              selectedUsers.map((user) => (
                <div key={user.id} className="flex justify-between">
                  <span>{user.usuarios?.nombre ?? 'Usuario'}</span>
                  <span className="text-xs text-slate-500">{user.usuarios?.email}</span>
                </div>
              ))
            ) : (
              <p>No hay usuarios asignados a las bases seleccionadas.</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
        {status === 'error' && <span className="text-red-600">{error}</span>}
        <div className="flex gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-500 hover:text-slate-900"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            disabled={!isValid || status === 'saving'}
          >
            {status === 'saving' ? 'Guardando...' : 'Guardar Notificación'}
          </button>
        </div>
      </div>
    </form>
  );
}
