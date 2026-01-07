import { supabase } from './supabase';

export type ObservationChecklistEntry = {
  categoria: string;
  opcion: string;
  seleccionada: boolean;
};

export type ObservationPayload = {
  usuario_id: string;
  area: string;
  tarea_observada: string;
  tipo: 'acto inseguro' | 'condición insegura' | string;
  descripcion: string;
  accion_sugerida: string;
  checklist: ObservationChecklistEntry[];
};

export type ObservationRow = {
  id: string;
  area: string;
  tarea_observada: string;
  tipo: string;
  descripcion: string;
  accion_sugerida: string;
  created_at: string;
  updated_at: string;
  observaciones_checklist?: ObservationChecklistEntry[];
  usuarios?: {
    id: string;
    nombre: string;
    email?: string;
  };
};

export async function fetchObservations() {
  return supabase
    .from('observaciones_seguridad')
    .select('*, usuarios(id, nombre, email), observaciones_checklist(id, categoria, opcion, seleccionada)')
    .order('created_at', { ascending: false });
}

export async function createObservation(payload: ObservationPayload) {
  const { data, error } = await supabase
    .from('observaciones_seguridad')
    .insert([
      {
        usuario_id: payload.usuario_id,
        area: payload.area,
        tarea_observada: payload.tarea_observada,
        tipo: payload.tipo,
        descripcion: payload.descripcion,
        accion_sugerida: payload.accion_sugerida,
      },
    ])
    .select('*')
    .single();

  if (error) {
    return { data: null, error };
  }

  if (payload.checklist.length > 0) {
    const checklistInsert = payload.checklist.map((entry) => ({
      observacion_id: data?.id,
      categoria: entry.categoria,
      opcion: entry.opcion,
      seleccionada: entry.seleccionada,
    }));
    const { error: checklistError } = await supabase
      .from('observaciones_checklist')
      .insert(checklistInsert);
    if (checklistError) {
      return { data, error: checklistError };
    }
  }

  return { data, error: null };
}
