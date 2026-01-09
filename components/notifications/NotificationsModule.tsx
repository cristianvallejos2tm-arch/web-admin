import React, { useCallback, useEffect, useState } from 'react';
import { fetchBases, fetchNotifications, fetchUsersByBases, createNotification } from '../../services/notificaciones';
import NotificationDetail from './NotificationDetail';
import NotificationsForm, { NotificationsFormValues } from './NotificationsForm';
import NotificationsList from './NotificationsList';
import { supabase } from '../../services/supabase';

// Obtiene el id del usuario conectado para asociar la notificación a su autor.
const fetchCurrentUserId = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
};

// Módulo que lista notificaciones, abre el formulario y muestra el detalle cuando se selecciona una fila.
export default function NotificationsModule() {
  const [bases, setBases] = useState<{ id: string; nombre: string }[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  const loadBases = useCallback(async () => {
    const { data } = await fetchBases();
    setBases(data ?? []);
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await fetchNotifications();
      setNotifications(data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBases();
    loadNotifications();
  }, [loadBases, loadNotifications]);

  const handleSelectBases = async (baseIds: string[]) => {
    setFetchingUsers(true);
    try {
      const { data } = await fetchUsersByBases(baseIds);
      const normalized = (data ?? []).map((user: any) => ({
        id: `${user.id}-${Math.random().toString(36).slice(2)}`,
        usuario_id: user.id,
        estado: 'pendiente',
        usuarios: { id: user.id, nombre: user.nombre, email: user.email },
      }));
      setUsers(normalized);
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleSave = async (values: NotificationsFormValues) => {
    const userId = await fetchCurrentUserId();
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }
    const payload = {
      titulo: values.titulo,
      mensaje: values.mensaje,
      tipo: values.tipo,
      bases: values.bases,
      destinatarios: users.map((user) => ({
        usuario_id: user.usuario_id,
        email: user.usuarios?.email,
      })),
      creador_id: userId,
    };
    await createNotification(payload);
    await loadNotifications();
    setFormVisible(false);
  };

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-900">Notificaciones</p>
            <p className="text-sm text-slate-500">Solo usuarios habilitados pueden crear y ver.</p>
          </div>
          <button
            type="button"
            className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={() => setFormVisible((prev) => !prev)}
          >
            {formVisible ? 'Cerrar formulario' : 'Nueva notificación'}
          </button>
        </div>
        {formVisible && (
          <div className="mt-4">
            <NotificationsForm
              onSave={handleSave}
              bases={bases}
              onClose={() => setFormVisible(false)}
              fetchingUsers={fetchingUsers}
              users={users}
              onBasesChange={handleSelectBases}
            />
          </div>
        )}
      </div>
      <NotificationsList notifications={notifications} loading={loading} onViewDetail={(notification) => {
        setDetail(notification);
        setDetailOpen(true);
      }} />
      <NotificationDetail notification={detail ?? undefined} isOpen={detailOpen} onClose={() => setDetailOpen(false)} />
    </section>
  );
}
