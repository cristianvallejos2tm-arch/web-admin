import { supabase } from './supabase';

export async function fetchIncidentCatalogStats(usuarioId: string, desde?: string, hasta?: string) {
  let query = supabase
    .from('incidentes_catalogo')
    .select(`
      categoria,
      opcion,
      incidente:incidentes(created_at, usuario_id)
    `)
    .not('categoria', 'is', null)
    .not('opcion', 'is', null);

  query = query.eq('incidente.usuario_id', usuarioId);

  if (desde) {
    query = query.gte('incidente.created_at', desde);
  }
  if (hasta) {
    query = query.lte('incidente.created_at', hasta);
  }

  return query;
}
