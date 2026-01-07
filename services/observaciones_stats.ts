import { supabase } from './supabase';

export type ObservationChecklistStatRow = {
  categoria: string;
  opcion: string;
  observacion?: {
    created_at?: string;
  };
};

export async function fetchObservationChecklistStats(
  usuarioId: string,
  desde?: string,
  hasta?: string,
) {
  let query = supabase
    .from('observaciones_checklist')
    .select('categoria, opcion, observacion:observaciones_seguridad(created_at, usuario_id)')
    .eq('observacion.usuario_id', usuarioId);

  if (desde) {
    query = query.gte('observacion.created_at', desde);
  }
  if (hasta) {
    query = query.lte('observacion.created_at', hasta);
  }

  return query;
}
