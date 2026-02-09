import { supabase } from './supabase';

export type IncidentCatalogEntry = {
  categoria: string;
  opcion: string;
  seleccionada: boolean;
};

export type IncidentPayload = {
  usuario_id: string;
  informante_apellido: string;
  informante_nombres: string;
  fecha_reporte: string | null;
  tipo_incidente: string;
  gravedad: string;
  clasificacion: string;
  hubo_lesionados: string;
  cantidad_lesionados: number | null;
  fecha_incidente: string | null;
  hora_incidente: string | null;
  accidentado_nombre: string;
  accidentado_dni: string;
  accidentado_edad: number | null;
  accidentado_estado_civil: string;
  accidentado_fecha_ingreso: string | null;
  accidentado_cargo: string;
  accidentado_otros: string;
  unidad_interna: string;
  unidad_marca_modelo: string;
  unidad_patente: string;
  conductor_nombre: string;
  conductor_telefono: string;
  tipo_servicio: string;
  condicion_climatica: string;
  condicion_luz: string;
  tipo_terreno: string;
  condicion_ruta_terreno: string;
  temperatura_ambiente: number | null;
  velocidad_viento: number | null;
  incidente_ambiental_locacion: string;
  incidente_ambiental_volumen: number | null;
  incidente_ambiental_area_m2: number | null;
  descripcion_evento: string;
  causas_incidente: string;
  testigos: string;
  acciones_correctivas: string;
  nombre_supervisor: string;
  presente_en_lugar: boolean;
  fotos: string[];
  catalogo: IncidentCatalogEntry[];
};

export type IncidentRow = {
  id: string;
  created_at: string;
  updated_at: string;
  informante_apellido: string | null;
  informante_nombres: string | null;
  fecha_reporte: string | null;
  tipo_incidente: string | null;
  gravedad: string | null;
  clasificacion: string | null;
  hubo_lesionados: string | null;
  cantidad_lesionados: number | null;
  fecha_incidente: string | null;
  hora_incidente: string | null;
  accidentado_nombre: string | null;
  accidentado_dni: string | null;
  accidentado_edad: number | null;
  accidentado_estado_civil: string | null;
  accidentado_fecha_ingreso: string | null;
  accidentado_cargo: string | null;
  accidentado_otros: string | null;
  unidad_interna: string | null;
  unidad_marca_modelo: string | null;
  unidad_patente: string | null;
  conductor_nombre: string | null;
  conductor_telefono: string | null;
  tipo_servicio: string | null;
  condicion_climatica: string | null;
  condicion_luz: string | null;
  tipo_terreno: string | null;
  condicion_ruta_terreno: string | null;
  temperatura_ambiente: number | null;
  velocidad_viento: number | null;
  incidente_ambiental_locacion: string | null;
  incidente_ambiental_volumen: number | null;
  incidente_ambiental_area_m2: number | null;
  descripcion_evento: string | null;
  causas_incidente: string | null;
  testigos: string | null;
  acciones_correctivas: string | null;
  nombre_supervisor: string | null;
  presente_en_lugar: boolean | null;
  fotos: string[] | null;
  incidentes_catalogo?: IncidentCatalogEntry[];
  usuarios?: {
    id: string;
    nombre: string;
    email?: string;
  };
};

export async function fetchIncidents() {
  return supabase
    .from('incidentes')
    .select('*, usuarios(id, nombre, email), incidentes_catalogo(id, categoria, opcion, seleccionada)')
    .order('created_at', { ascending: false });
}

export async function createIncident(payload: IncidentPayload) {
  const { data, error } = await supabase
    .from('incidentes')
    .insert([
      {
        usuario_id: payload.usuario_id,
        informante_apellido: payload.informante_apellido,
        informante_nombres: payload.informante_nombres,
        fecha_reporte: payload.fecha_reporte,
        tipo_incidente: payload.tipo_incidente,
        gravedad: payload.gravedad,
        clasificacion: payload.clasificacion,
        hubo_lesionados: payload.hubo_lesionados,
        cantidad_lesionados: payload.cantidad_lesionados,
        fecha_incidente: payload.fecha_incidente,
        hora_incidente: payload.hora_incidente,
        accidentado_nombre: payload.accidentado_nombre,
        accidentado_dni: payload.accidentado_dni,
        accidentado_edad: payload.accidentado_edad,
        accidentado_estado_civil: payload.accidentado_estado_civil,
        accidentado_fecha_ingreso: payload.accidentado_fecha_ingreso,
        accidentado_cargo: payload.accidentado_cargo,
        accidentado_otros: payload.accidentado_otros,
        unidad_interna: payload.unidad_interna,
        unidad_marca_modelo: payload.unidad_marca_modelo,
        unidad_patente: payload.unidad_patente,
        conductor_nombre: payload.conductor_nombre,
        conductor_telefono: payload.conductor_telefono,
        tipo_servicio: payload.tipo_servicio,
        condicion_climatica: payload.condicion_climatica,
        condicion_luz: payload.condicion_luz,
        tipo_terreno: payload.tipo_terreno,
        condicion_ruta_terreno: payload.condicion_ruta_terreno,
        temperatura_ambiente: payload.temperatura_ambiente,
        velocidad_viento: payload.velocidad_viento,
        incidente_ambiental_locacion: payload.incidente_ambiental_locacion,
        incidente_ambiental_volumen: payload.incidente_ambiental_volumen,
        incidente_ambiental_area_m2: payload.incidente_ambiental_area_m2,
        descripcion_evento: payload.descripcion_evento,
        causas_incidente: payload.causas_incidente,
        testigos: payload.testigos,
        acciones_correctivas: payload.acciones_correctivas,
        nombre_supervisor: payload.nombre_supervisor,
        presente_en_lugar: payload.presente_en_lugar,
        fotos: payload.fotos,
      },
    ])
    .select('id')
    .single();

  if (error) {
    return { data: null, error };
  }

  if (payload.catalogo.length > 0) {
    const catalogInsert = payload.catalogo.map((entry) => ({
      incidente_id: data?.id,
      categoria: entry.categoria,
      opcion: entry.opcion,
      seleccionada: entry.seleccionada,
    }));
    const { error: catalogError } = await supabase.from('incidentes_catalogo').insert(catalogInsert);
    if (catalogError) {
      return { data, error: catalogError };
    }
  }

  return { data, error: null };
}
