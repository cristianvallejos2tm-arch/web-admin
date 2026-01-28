import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Persistimos la sesión para evitar volver al login tras un refresh
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'supabase-web-admin-session',
    },
});

// Catálogos
// Devuelve el listado completo de depósitos ordenado por nombre.
export async function fetchDepositos() {
    return supabase.from('depositos').select('*').order('nombre');
}

// Trae las bases disponibles para los combos de selección.
export async function fetchBases() {
    return supabase.from('bases').select('*').order('nombre');
}

// Lista los paños registrados ordenados por nombre.
export async function fetchPanoles() {
    return supabase.from('panoles').select('*').order('nombre');
}

// Recupera las unidades organizativas ordenadas por nombre.
export async function fetchUnidades() {
    return supabase.from('unidades').select('*').order('nombre');
}

// Regresa id, nombre y flags de proveedores para combos ligeros.
export async function fetchProveedoresLite() {
    // Trae sólo lo necesario para los combos de selección
    return supabase.from('proveedores').select('id,nombre,es_externo,es_local').order('nombre');
}

// Devuelve usuarios básicos con id, nombre y email.
export async function fetchUsuariosLite() {
    return supabase.from('usuarios').select('id,nombre,email').order('nombre');
}

// Lista todas las operadoras disponibles.
export async function fetchOperadoras() {
    return supabase.from('operadoras').select('*').order('nombre');
}

// Inserta una nueva operadora y devuelve la fila creada.
export async function createOperadora(nombre: string) {
    return supabase.from('operadoras').insert([{ nombre }]).select('*').single();
}

// Sincroniza las relaciones usuario-operadora (borra y vuelve a insertar).
export async function syncUserOperadoras(userId: string, operadoraIds: string[]) {
    const { error: deleteError } = await supabase.from('usuarios_operadoras').delete().eq('usuario_id', userId);
    if (deleteError && deleteError.code === '42P01') {
        console.warn('Tabla usuarios_operadoras no existe, ignorando sincronización');
        return { data: [], error: null };
    }
    if (deleteError) throw deleteError;
    if (operadoraIds.length === 0) {
        return { data: [], error: null };
    }
    const { error: insertError, data } = await supabase.from('usuarios_operadoras').insert(
        operadoraIds.map((operadoraId) => ({
            usuario_id: userId,
            operadora_id: operadoraId,
        })),
    );
    if (insertError && insertError.code === '42P01') {
        console.warn('Tabla usuarios_operadoras no existe, ignorando sincronización');
        return { data: [], error: null };
    }
    if (insertError) throw insertError;
    return { data, error: null };
}

// Cubiertas - movimientos (ingresos/salidas)
// Registra un movimiento de cubiertas (ingreso, salida o ajuste).
export async function createCubiertaMovimiento(payload: {
    item_id?: string | null;
    deposito_id?: string | null;
    tipo: 'ingreso' | 'salida' | 'ajuste';
    marca?: string;
    modelo?: string;
    funcion?: string;
    medida?: string;
    estado?: string;
    remito?: string;
    cantidad: number;
    precio_unitario?: number | null;
    observaciones?: string;
}) {
    return supabase.from('cubiertas_movimientos').insert([payload]);
}

// Consulta el stock actual de cubiertas.
export async function fetchCubiertasStock() {
    return supabase.from('cubiertas_stock').select('*');
}

// Agrega un registro de stock de cubiertas.
export async function createCubiertaStock(payload: {
    deposito_id?: string | null;
    marca?: string;
    modelo?: string;
    funcion?: string;
    medida?: string;
    precio?: number | null;
    stock?: number | null;
}) {
    return supabase.from('cubiertas_stock').insert([payload]).select();
}

// Inventario general (para vincular cubiertas a un item de inventario)
// Crea un ítem de inventario y devuelve su id.
export async function createInventarioItem(payload: {
    nombre: string;
    categoria?: string;
    unidad?: string;
    stock?: number;
    stock_minimo?: number;
    activo?: boolean;
    proveedor?: string | null;
    comprobante?: string | null;
    iva?: string | null;
    fecha_ingreso?: string | null;
    deposito?: string | null;
}) {
    return supabase.from('inventario_items').insert([payload]).select('id').single();
}

// Lista los ítems de inventario ordenados por creación.
export async function fetchInventarioItems() {
    return supabase.from('inventario_items').select('*').order('created_at', { ascending: false });
}

// Cubiertas - solicitudes
// Registra una solicitud de cubiertas.
export async function createCubiertaSolicitud(payload: {
    interno?: string;
    solicitante?: string;
    motivo?: string;
    cantidad?: number;
    marca?: string;
    modelo?: string;
    funcion?: string;
    medida?: string;
    fecha_solicitud?: string;
    hora?: string;
    minuto?: string;
    comentarios?: string;
}) {
    return supabase.from('cubiertas_solicitudes').insert([payload]);
}

// Trae las solicitudes de cubiertas más recientes.
export async function fetchCubiertaSolicitudes() {
    return supabase.from('cubiertas_solicitudes').select('*').order('created_at', { ascending: false });
}

// Cubiertas - recapadas
// Guarda una inspección de recapado con cantidades y observaciones.
export async function createRecapInspeccion(payload: {
    bases?: string[];
    tipo_cubierta?: string;
    predio?: string;
    fecha?: string;
    hora?: string;
    minuto?: string;
    responsable?: string;
    cant_inspeccion?: number;
    retira?: string;
    medio_uso?: string;
    vendidas?: number;
    descarte_fab?: number;
    disp_final?: number;
    observaciones?: string;
}) {
    return supabase.from('cubiertas_recap_inspecciones').insert([payload]);
}

// Lista las inspecciones de recapado ordenadas por fecha.
export async function fetchRecapInspecciones() {
    return supabase.from('cubiertas_recap_inspecciones').select('*').order('fecha', { ascending: false });
}

// Pañol - entregas
// Inserta una entrega desde un paño con destinatario y cantidad.
export async function createPanolEntrega(payload: {
    fecha: string;
    panol_id?: string;
    base_id?: string;
    interno?: string;
    recibe?: string;
    lugar_entrega?: string;
    descripcion?: string;
    cantidad?: number;
    unidad_id?: string;
}) {
    return supabase.from('panol_entregas').insert([payload]);
}

// Trae las entregas de paño ordenadas por fecha.
export async function fetchPanolEntregas() {
    // Seleccion simple para evitar errores si no hay FKs definidas
    return supabase.from('panol_entregas').select('*').order('fecha', { ascending: false });
}

// Evaluación de desempeño
// Crea una evaluación de desempeño con competencias y comentarios.
export async function createEvaluacionDesempeno(payload: {
    evaluado_id?: string | null;
    evaluador_id?: string | null;
    periodo?: string;
    puntaje?: number | null;
    comentarios?: string;
    competencias: any;
    puesto_actual?: string | null;
    antiguedad_anios?: number | null;
}) {
    return supabase.from('evaluaciones_desempeno').insert([payload]);
}

// Obtiene evaluaciones ordenadas por fecha de creación.
export async function fetchEvaluacionesDesempeno() {
    return supabase.from('evaluaciones_desempeno').select('*').order('created_at', { ascending: false });
}

// Vehículos
// Lista los vehículos ordenados por patente.
export async function fetchVehiculos({
    page,
    limit,
}: {
    page?: number;
    limit?: number;
} = {}) {
    let builder = supabase.from('vehiculos').select('*', { count: 'exact' }).order('patente');
    if (typeof page === 'number' && typeof limit === 'number') {
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        builder = builder.range(from, to);
    }
    return builder;
}


// Crea un nuevo vehículo con los campos básicos.
export async function createVehiculo(payload: {
    patente: string;
    marca?: string | null;
    modelo?: string | null;
    anio?: number | null;
    vin?: string | null;
    kilometraje_actual?: number | null;
    activo?: boolean;
    foto_url?: string | null;
    base?: string | null;
    sector?: string | null;
    funcion?: string | null;
    estado?: string | null;
    num_int?: string | null;
    op?: string | null;
    horometro?: number | null;
    tipo_combustible?: string | null;
    consumo_Km?: string | null;
    Consumo_100km?: string | null;
    capacidat_Tanque?: string | null;
    observaciones?: string | null;
    caracteristicas_equipo?: string | null;
}) {
    return supabase.from('vehiculos').insert([payload]);
}

// Actualiza los datos de un vehículo existente.
export async function updateVehiculo(
    id: string,
    payload: {
        patente?: string;
        marca?: string | null;
        modelo?: string | null;
        anio?: number | null;
        vin?: string | null;
        kilometraje_actual?: number | null;
        activo?: boolean;
        foto_url?: string | null;
        base?: string | null;
        sector?: string | null;
        funcion?: string | null;
        estado?: string | null;
        num_int?: string | null;
        op?: string | null;
        horometro?: number | null;
        tipo_combustible?: string | null;
        consumo_Km?: string | null;
        Consumo_100km?: string | null;
        capacidat_Tanque?: string | null;
        observaciones?: string | null;
        caracteristicas_equipo?: string | null;
    }
) {
    return supabase.from('vehiculos').update(payload).eq('id', id);
}

// Storage: subir imagen de vehículo
const VEHICLES_BUCKET = (import.meta as any).env?.VITE_SUPABASE_VEHICLES_BUCKET || 'vehiculos';
const CAPACITACIONES_BUCKET =
    (import.meta as any).env?.VITE_SUPABASE_CAPACITACIONES_BUCKET || 'capacitaciones';

// Sube la foto de un vehículo al bucket y devuelve la URL pública.
export async function uploadVehicleImage(file: File) {
    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from(VEHICLES_BUCKET).upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from(VEHICLES_BUCKET).getPublicUrl(fileName);
    return data.publicUrl;
}

// Sube un archivo de capacitación y devuelve su URL.
export async function uploadCapacitacionMaterial(file: File) {
    const safeName = file.name.replace(/[^\w.-]/g, '_');
    const fileName = `capacitaciones/${Date.now()}_${safeName}`;
    const { error } = await supabase.storage.from(CAPACITACIONES_BUCKET).upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from(CAPACITACIONES_BUCKET).getPublicUrl(fileName);
    return data.publicUrl;
}

// Tareas
// Crea una tarea con estado, prioridad, fecha y asignado.
export async function createTask(payload: {
    titulo: string;
    descripcion?: string | null;
    estado?: string;
    prioridad?: string;
    fecha_vencimiento?: string | null;
    asignado_a?: string | null;
    vehiculo_id?: string | null;
}) {
    return supabase.from('tareas').insert([payload]);
}

// Lista las tareas ordenadas por creación.
export async function fetchTasks() {
    return supabase.from('tareas').select('*').order('created_at', { ascending: false });
}

// Actualiza el estado o prioridad de una tarea existente.
export async function updateTask(id: string, payload: { estado?: string; prioridad?: string }) {
    return supabase.from('tareas').update(payload).eq('id', id);
}

// Ordenes de trabajo
// Trae las órdenes de trabajo ordenadas por creación.
export async function fetchWorkOrders({
    page,
    limit,
    estados,
}: {
    page?: number;
    limit?: number;
    estados?: string[];
} = {}) {
    const defaultEstados = ['abierta', 'en_progreso', 'pausada', 'confirmada', 'cerrada', 'cancelada', 'vencido'];
    let builder = supabase
        .from('ordenes_trabajo')
        .select('*', { count: 'exact' })
        .in('estado', estados && estados.length ? estados : defaultEstados)
        .order('created_at', { ascending: false });
    if (typeof page === 'number' && typeof limit === 'number') {
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        builder = builder.range(from, to);
    }
    return builder;
}

// Resumen de órdenes para dashboard (total + finalizadas).
export async function fetchWorkOrdersTotals() {
    const totalPromise = supabase.from('ordenes_trabajo').select('id', { count: 'exact', head: true });
    const finalizadasPromise = supabase
        .from('ordenes_trabajo')
        .select('id', { count: 'exact', head: true })
        .in('estado', ['cerrada', 'Cerrada']);
    const sinIniciarPromise = supabase
        .from('ordenes_trabajo')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'abierta');
    const enCursoPromise = supabase
        .from('ordenes_trabajo')
        .select('id', { count: 'exact', head: true })
        .in('estado', ['en_progreso', 'pausada', 'confirmada']);
    const vencidasPromise = supabase
        .from('ordenes_trabajo')
        .select('id', { count: 'exact', head: true })
        .in('estado', ['vencido', 'Vencido']);

    const [totalResult, finalResult, sinIniciarResult, enCursoResult, vencidasResult] = await Promise.all([
        totalPromise,
        finalizadasPromise,
        sinIniciarPromise,
        enCursoPromise,
        vencidasPromise,
    ]);
    return {
        total: totalResult.count ?? 0,
        finalizadas: finalResult.count ?? 0,
        sinIniciar: sinIniciarResult.count ?? 0,
        enCurso: enCursoResult.count ?? 0,
        vencidas: vencidasResult.count ?? 0,
    };
}

// Crea una orden de trabajo y devuelve su id.
export async function createWorkOrder(payload: {
    numero?: string | null;
    titulo: string;
    descripcion?: string | null;
    estado?: string;
    prioridad?: string;
    vehiculo_id?: string | null;
    proveedor_id?: string | null;
    fecha_inicio?: string | null;
    fecha_fin?: string | null;
    responsable_id?: string | null;
    presupuesto_url?: string | null;
    external_amount?: number | null;
}) {
    return supabase.from('ordenes_trabajo').insert([payload]).select('id').single();
}

// Modifica los campos editables de una orden de trabajo.
export async function updateWorkOrder(id: string, payload: Partial<{
    numero: string | null;
    titulo: string;
    descripcion: string | null;
    estado: string;
    prioridad: string;
    vehiculo_id: string | null;
    proveedor_id: string | null;
    fecha_inicio: string | null;
    fecha_fin: string | null;
    responsable_id: string | null;
    presupuesto_url: string | null;
    external_amount: number | null;
}> ) {
    return supabase.from('ordenes_trabajo').update(payload).eq('id', id);
}

// Invoca la RPC que genera una compra externa desde una OT.
export async function createExternalPurchaseFromWorkOrder(wo_id: string) {
    return supabase.rpc('create_external_purchase_from_work_order', { wo_id });
}

// Autoriza, rechaza o deriva compras externas mediante RPC.
export async function authorizePurchase(purchase_id: string, action: 'APPROVE' | 'REJECT' | 'DERIVE', notes?: string) {
    return supabase.rpc('authorize_purchase', { purchase_id, action, notes: notes || null });
}

const WORKORDER_BUCKET = (import.meta as any).env?.VITE_SUPABASE_WORKORDER_BUCKET || 'ot-presupuestos';

// Sube un presupuesto de una OT al bucket y retorna su URL.
export async function uploadWorkOrderBudget(file: File) {
    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from(WORKORDER_BUCKET).upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from(WORKORDER_BUCKET).getPublicUrl(fileName);
    return data.publicUrl;
}

// Cambios de turno
// Lista los cambios de turno ordenados por fecha de inicio.
export async function fetchShiftChanges() {
    return supabase.from('cambios_turno').select('*').order('inicio', { ascending: false });
}

// Registra un cambio de turno con turno, responsables y novedades.
export async function createShiftChange(payload: {
    turno: 'manana' | 'tarde' | 'noche' | 'otro';
    inicio: string;
    fin?: string | null;
    entregado_por?: string | null;
    recibido_por?: string | null;
    entregado_email?: string | null;
    recibido_email?: string | null;
    resumen?: string | null;
    novedades?: any;
}) {
    return supabase.from('cambios_turno').insert([payload]);
}

// Lubricantes y baterías
// Crea un ítem de lubricante o batería con subtipo y detalle.
export async function createLubricantItem(payload: {
    nombre: string;
    unidad?: string;
    stock?: number;
    stock_minimo?: number;
    subtipo?: 'lubricante' | 'bateria';
    especificacion?: string | null;
    marca?: string | null;
}) {
    const { data, error } = await supabase.from('inventario_items').insert([{
        nombre: payload.nombre,
        categoria: 'lubricantes',
        unidad: payload.unidad || 'unidad',
        stock: payload.stock ?? 0,
        stock_minimo: payload.stock_minimo ?? 0,
        activo: true,
    }]).select('id').single();
    if (error) return { error };
    const itemId = data?.id;
    if (!itemId) return { error: { message: 'No se pudo obtener el id del item creado' } };
    const detailError = await supabase.from('lubricantes_baterias_detalle').insert([{
        item_id: itemId,
        subtipo: payload.subtipo || 'lubricante',
        especificacion: payload.especificacion || null,
        marca: payload.marca || null,
    }]);
    if (detailError.error) return { error: detailError.error };
    return { data: { id: itemId }, error: null };
}

// Consulta el stock detallado de lubricantes.
export async function fetchLubricantsStock() {
    return supabase.from('inventario_items')
        .select('id,nombre,unidad,stock,stock_minimo,activo,created_at,lubricantes_baterias_detalle(subtipo,especificacion,marca)')
        .eq('categoria', 'lubricantes')
        .order('created_at', { ascending: false });
}

// Registra una solicitud de lubricantes con cantidades y fechas.
export async function createLubricantSolicitud(payload: {
    interno?: string;
    solicitante?: string;
    motivo?: string;
    cantidad?: number;
    marca?: string;
    modelo?: string;
    medida?: string;
    fecha?: string;
    hora?: string;
    minuto?: string;
}) {
    return supabase.from('lubricantes_solicitudes').insert([payload]);
}

// Lista las solicitudes de lubricantes ordenadas por fecha.
export async function fetchLubricantSolicitudes() {
    return supabase.from('lubricantes_solicitudes').select('*').order('created_at', { ascending: false });
}

// Mantenimientos
// Trae los planes de mantenimiento con datos del vehículo.
export async function fetchMaintenances() {
    return supabase
        .from('mantenimientos')
        .select('*, vehiculos(id, patente, marca, modelo)')
        .order('created_at', { ascending: false });
}

// Crea una orden de mantenimiento programada.
export async function createMaintenance(payload: {
    vehiculo_id: string;
    tipo: string;
    descripcion?: string | null;
    estado?: string;
    fecha_programada?: string | null;
    kilometraje_objetivo?: number | null;
}) {
    return supabase.from('mantenimientos').insert([payload]);
}

// Actualiza un mantenimiento existente.
export async function updateMaintenance(id: string, payload: Partial<{
    vehiculo_id: string;
    tipo: string;
    descripcion: string | null;
    estado: string;
    fecha_programada: string | null;
    kilometraje_objetivo: number | null;
}>) {
    return supabase.from('mantenimientos').update(payload).eq('id', id);
}

// Elimina un mantenimiento (uso lógico según reglas).
export async function deleteMaintenance(id: string) {
    return supabase.from('mantenimientos').delete().eq('id', id);
}

// Capacitaciones
// Lista capacitaciones con metadatos para el listado.
export async function fetchCapacitaciones() {
    return supabase
        .from('capacitaciones')
        .select(
            'id, titulo, introduccion, descripcion, tipo, instructor, ubicacion, fecha, estado, capacidad, inscriptos, cuestionario_nombre, video_url, archivos, created_at',
        )
        .order('created_at', { ascending: false });
}

// Devuelve el detalle completo de una capacitación por id.
export async function fetchCapacitacionDetail(id: string) {
    return supabase
        .from('capacitaciones')
        .select('*, creador:created_by (id, nombre, email)')
        .eq('id', id)
        .single();
}

// Recupera los participantes y su estado.
export async function fetchCapacitacionParticipants(capacitacionId: string) {
    return supabase
        .from('capacitaciones_inscripciones')
        .select('id, estado, created_at, usuarios(id, nombre, email)')
        .eq('capacitacion_id', capacitacionId)
        .order('created_at', { ascending: true });
}

// Lista las preguntas y opciones del cuestionario.
export async function fetchCapacitacionPreguntas(capacitacionId: string) {
    return supabase
        .from('capacitaciones_preguntas')
        .select('id, pregunta, respuesta, orden, tipo, opciones, opciones_correctas')
        .eq('capacitacion_id', capacitacionId)
        .order('orden', { ascending: true });
}

// Trae los intentos que hizo un usuario sobre esa capacitación.
export async function fetchCapacitacionIntentos(capacitacionId: string, usuarioId: string) {
    return supabase
        .from('capacitaciones_intentos')
        .select('*')
        .eq('capacitacion_id', capacitacionId)
        .eq('usuario_id', usuarioId)
        .order('intento', { ascending: true });
}

// Obtiene resultados y puntajes de participantes.
export async function fetchCapacitacionResultados(capacitacionId: string) {
    return supabase
        .from('capacitaciones_resultados')
        .select('usuario_id, total_questions, correct_answers, score, aprobado, usuarios(id, nombre, email)')
        .eq('capacitacion_id', capacitacionId)
        .order('score', { ascending: false });
}

// Lista las respuestas enviadas por un usuario.
export async function fetchCapacitacionUsuarioRespuestas(capacitacionId: string, usuarioId: string) {
    return supabase
        .from('capacitaciones_preguntas')
        .select('id, pregunta, tipo, opciones, capacitaciones_respuestas(respuesta, respuesta_json, created_at)')
        .eq('capacitacion_id', capacitacionId)
        .eq('capacitaciones_respuestas.usuario_id', usuarioId)
        .order('orden', { ascending: true });
}

// Crea una capacitación nueva y devuelve su id.
export async function createCapacitacion(payload: {
    titulo: string;
    introduccion?: string;
    descripcion?: string;
    tipo?: string;
    instructor?: string;
    ubicacion?: string;
    fecha?: string;
    estado?: string;
    capacidad?: number;
    inscriptos?: number;
    cuestionario_nombre?: string;
    video_url?: string;
    archivos?: { name?: string; url?: string }[];
    created_by?: string | null;
}) {
    return supabase.from('capacitaciones').insert([payload]).select('id').single();
}

// Actualiza los campos de una capacitación.
export async function updateCapacitacion(id: string, payload: Partial<{
    titulo: string;
    introduccion: string;
    descripcion: string;
    tipo: string;
    instructor: string;
    ubicacion: string;
    fecha: string;
    estado: string;
    capacidad: number;
    inscriptos: number;
    cuestionario_nombre: string;
    video_url: string;
    archivos: { name?: string; url?: string }[];
}>) {
    return supabase.from('capacitaciones').update(payload).eq('id', id);
}

// Reemplaza las preguntas de una capacitación por las nuevas.
export async function upsertCapacitacionPreguntas(
    capacitacionId: string,
    preguntas: Array<{ question: string; answer: string }>,
) {
    await supabase.from('capacitaciones_preguntas').delete().eq('capacitacion_id', capacitacionId);
    if (preguntas.length === 0) {
        return { data: [], error: null };
    }
    return supabase.from('capacitaciones_preguntas').insert(
        preguntas.map((pregunta, index) => ({
            capacitacion_id: capacitacionId,
            orden: index,
            pregunta: pregunta.question,
            respuesta: pregunta.answer,
            tipo: pregunta.tipo || 'texto',
            opciones: pregunta.opciones ? pregunta.opciones : [],
            opciones_correctas: pregunta.opciones_correctas ? pregunta.opciones_correctas : [],
        })),
    );
}

// Guarda o actualiza las respuestas de un usuario.
export async function submitCapacitacionRespuestas(
    responses: Array<{
        pregunta_id: string;
        usuario_id: string;
        respuesta?: string;
        respuesta_json?: string | null;
    }>,
) {
    if (responses.length === 0) {
        return { data: [], error: null };
    }
    return supabase
        .from('capacitaciones_respuestas')
        .upsert(responses, { onConflict: 'pregunta_id,usuario_id', ignoreDuplicates: false });
}

// Inserta múltiples inscripciones a una capacitación.
export async function insertCapacitacionInscripciones(capacitacionId: string, usuarioIds: string[]) {
    if (usuarioIds.length === 0) {
        return { data: [], error: null };
    }
    return supabase
        .from('capacitaciones_inscripciones')
        .insert(
            usuarioIds.map((usuarioId) => ({
                capacitacion_id: capacitacionId,
                usuario_id: usuarioId,
            })),
        );
}

// Registra un intento con score y estado de aprobado.
export async function createCapacitacionIntento(payload: {
    capacitacion_id: string;
    usuario_id: string;
    intento: number;
    score: number;
    aprobado: boolean;
}) {
    return supabase.from('capacitaciones_intentos').insert([payload]);
}

// Encola notificaciones en email_outbox para envío posterior.
export async function queueCapacitacionNotifications(
    entries: Array<{ to_email: string; subject: string; body: string }>,
) {
    if (entries.length === 0) {
        return { data: [], error: null };
    }
    return supabase
        .from('email_outbox')
        .insert(entries.map((entry) => ({ ...entry, status: 'PENDING' })));
}
