import { supabase } from './supabase';

export type NotificationRecord = {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  archivos: { name: string; url: string }[];
  creado_por: string;
  creado_en: string;
  destinatarios?: NotificationRecipient[];
  bases?: { base_id: string }[];
};

export type NotificationRecipient = {
  id: string;
  usuario_id: string;
  notificacion_id: string;
  estado: string;
  fecha_leido?: string;
  usuarios?: {
    id: string;
    nombre: string;
    email: string;
  };
};

// Trae todas las notificaciones recientes junto con sus relaciones para poblar el listado.
export async function fetchNotifications() {
  return supabase
    .from('notificaciones')
    .select(`
      *,
      creado:creado_por (id, nombre, email),
      destinatarios: notificaciones_destinatarios (*, usuarios (id, nombre, email)),
      bases: notificaciones_bases (base_id)
    `)
    .order('creado_en', { ascending: false });
}

// Recupera una sola notificación con sus destinatarios para mostrar el detalle completo.
export async function fetchNotificationDetail(id: string) {
  return supabase
    .from('notificaciones')
    .select(`
      *,
      creado:creado_por (id, nombre, email),
      destinatarios: notificaciones_destinatarios (*, usuarios (id, nombre, email)),
      bases: notificaciones_bases (base_id)
    `)
    .eq('id', id)
    .single();
}

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL ?? 'https://yzawzrmzqmwhauvonjpb.supabase.co';

// Compone el cuerpo HTML que se enviará por correo para notificar al destinatario.
const buildEmailBody = (options: {
  nombre: string;
  mensaje: string;
  tipo: string;
  fecha: string;
  notificacionId?: string;
  destinatarioId?: string;
}) => {
  const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
const baseUrl = supabaseUrl.replace(/\/$/, '');
const link = `${baseUrl}/functions/v1/markNotificationRead?notificacion=${options.notificacionId}&destinatario=${options.destinatarioId}&apikey=${anonKey}`;
  return `
<!doctype html>
<html lang="es">
<head><meta charset="utf-8" /></head>
<body style="font-family: Arial, sans-serif; color:#1f2937; margin:0;">
  <div style="max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;padding:24px;">
    <h2 style="color:#111827;margin-bottom:8px;">CAM - Nueva notificación</h2>
    <p style="font-size:14px;line-height:1.6;">Hola ${options.nombre},</p>
    <p style="font-size:14px;line-height:1.6;">${options.mensaje}</p>
    <p style="font-size:14px;line-height:1.6;">
      Tipo: <strong>${options.tipo}</strong><br/>
      Fecha: ${options.fecha}
    </p>
    <div style="margin:24px 0;">
      <a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;">
        Marcar como leído
      </a>
    </div>
    <p style="font-size:12px;color:#6b7280;">Si ya lo leíste, podés ignorar este mensaje.</p>
  </div>
</body>
</html>
`;
};

// Crea la notificación, guarda destinatarios/bases y dispara el envío de correos pendientes.
export async function createNotification(payload: {
  titulo: string;
  mensaje: string;
  tipo: string;
  archivos?: { name: string; url: string }[];
  bases: string[];
  destinatarios: Array<{ usuario_id: string; email?: string; nombre?: string }>;
  creador_id: string;
}) {
  const { data, error } = await supabase
    .from('notificaciones')
    .insert([
      {
        titulo: payload.titulo,
        mensaje: payload.mensaje,
        tipo: payload.tipo,
        archivos: payload.archivos ?? [],
        creado_por: payload.creador_id,
      },
    ])
    .select('id')
    .single();

  if (error) {
    return { data: null, error };
  }

  const notificationId = data?.id;
  if (!notificationId) {
    return { data: null, error: new Error('Notificación creada sin id') };
  }

  await supabase.from('notificaciones_bases').insert(
    payload.bases.map((baseId) => ({
      notificacion_id: notificationId,
      base_id: baseId,
    })),
  );

  await supabase.from('notificaciones_destinatarios').insert(
    payload.destinatarios.map((usuario) => ({
      notificacion_id: notificationId,
      usuario_id: usuario.usuario_id,
      estado: 'pendiente',
    })),
  );

  const { data: recipients } = await supabase
    .from('notificaciones_destinatarios')
    .select('id, usuario_id')
    .eq('notificacion_id', notificationId);

  const now = new Date().toISOString();
  const recipientMap = new Map<string, string>();
  (recipients ?? []).forEach((row: any) => {
    if (row?.usuario_id && row?.id) {
      recipientMap.set(row.usuario_id, row.id);
    }
  });

  const emails = payload.destinatarios
    .filter((usuario) => Boolean(usuario.email) && recipientMap.has(usuario.usuario_id))
    .map((usuario) => ({
      to_email: usuario.email ?? '',
      subject: payload.titulo,
      body: buildEmailBody({
        nombre: usuario.nombre ?? 'colaborador',
        mensaje: payload.mensaje,
        tipo: payload.tipo,
        fecha: now,
        notificacionId: notificationId,
        destinatarioId: recipientMap.get(usuario.usuario_id),
      }),
      status: 'PENDING',
    }));

  await supabase.from('email_outbox').insert(emails);
  await supabase.functions.invoke('processEmailQueue');

  return { data: { notificationId, recipients: recipients ?? [] }, error: null };
}

// Actualiza la lectura de la notificación para que el contador de pendientes se refresque.
export async function markNotificationRead(recipientId: string) {
  return supabase
    .from('notificaciones_destinatarios')
    .update({ estado: 'leído', fecha_leido: new Date().toISOString() })
    .eq('id', recipientId);
}

// Trae las bases disponibles para que la interfaz permita seleccionar el ámbito de la notificación.
export async function fetchBases() {
  return supabase.from('bases').select('*').order('nombre');
}

// Obtiene los usuarios vinculados a las bases seleccionadas para poblar destinatarios.
export async function fetchUsersByBases(baseIds: string[]) {
  if (baseIds.length === 0) {
    return { data: [], error: null };
  }
  return supabase
    .from('usuarios')
    .select('id, nombre, email, base_id')
    .in('base_id', baseIds)
    .order('nombre');
}
