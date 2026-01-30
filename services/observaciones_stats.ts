import { supabase } from './supabase';

export type ObservationChecklistStatRow = {
  categoria: string;
  opcion: string;
  observacion?: {
    created_at?: string;
  };
};

// Recupera estadísticas de checklist agrupadas por categoría/opción para un colaborador y rango dado.
export async function fetchObservationChecklistStats(
  usuarioId: string,
  desde?: string,
  hasta?: string,
) {
  let  query = supabase
  .from('observaciones_checklist')
  .select(`
    categoria,
    opcion,
    observacion:observaciones_seguridad(created_at)
  `)
  .not('categoria', 'ilike', '%estado de la tarea%')
  .not('opcion', 'ilike', '%situacion corregida%')
  .not('categoria', 'is', null)
  .not('opcion', 'is', null);
  // Aplica filtros de fecha si el cliente los pasó para acotar el periodo analizado.
  if (desde) {
    query = query.gte('observacion.created_at', desde);
  }
  if (hasta) {
    query = query.lte('observacion.created_at', hasta);
  }

  return query;
}
