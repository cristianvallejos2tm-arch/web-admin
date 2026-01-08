export type NotificationTypeOption = {
  id: string;
  label: string;
  description: string;
};

export const NOTIFICATION_TYPES: NotificationTypeOption[] = [
  { id: 'alerta', label: 'Alerta', description: 'Aviso crítico que requiere acción inmediata' },
  { id: 'aviso', label: 'Aviso', description: 'Información relevante pero no urgente' },
  { id: 'recordatorio', label: 'Recordatorio', description: 'Seguimiento programado para una tarea' },
];

export type NotificationStatusLabel = {
  id: string;
  label: string;
  color: string;
};

export const NOTIFICATION_STATUS: NotificationStatusLabel[] = [
  { id: 'pendiente', label: 'Pendiente', color: 'bg-amber-500/10 text-amber-700' },
  { id: 'leído', label: 'Leído', color: 'bg-emerald-500/10 text-emerald-700' },
];
