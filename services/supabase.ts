import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
const supabaseProjectRef = (() => {
    try {
        const host = new URL(supabaseUrl).hostname;
        return host.split('.')[0] || 'default';
    } catch {
        return 'default';
    }
})();
const storageKey = `supabase-web-admin-session-${supabaseProjectRef}`;

if (typeof window !== 'undefined') {
    const legacyKey = 'supabase-web-admin-session';
    const legacyValue = window.localStorage.getItem(legacyKey);
    const currentValue = window.localStorage.getItem(storageKey);
    if (legacyValue && !currentValue) {
        window.localStorage.setItem(storageKey, legacyValue);
    }
    window.localStorage.removeItem(legacyKey);
}

// Persistimos la sesión para evitar volver al login tras un refresh
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: false,
        storageKey,
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
    // Consulta mínima estable: evita errores 400 cuando columnas opcionales no existen.
    const result = await supabase.from('proveedores').select('id,nombre').order('nombre');
    if (result.error) return result as any;
    const normalized = (result.data || []).map((p: any) => ({
        ...p,
        tipo: null,
        es_externo: false,
        es_local: false,
    }));
    return { data: normalized, error: null } as any;
}

// Devuelve usuarios básicos con id, nombre, email y base para filtros ligeros.
export async function fetchUsuariosLite() {
    return supabase.from('usuarios').select('id,nombre,email,base_id').order('nombre');
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
    sku?: string | null;
    proveedor?: string | null;
    comprobante?: string | null;
    iva?: string | null;
    fecha_ingreso?: string | null;
    deposito?: string | null;
    precio_unidad?: number | null;
}) {
    return supabase.from('inventario_items').insert([payload]).select('id').single();
}

// Lista los ítems de inventario ordenados por creación.
export async function fetchInventarioItems() {
    return supabase.from('inventario_items').select('*').order('created_at', { ascending: false });
}

const isMissingRelation = (error: any) => {
    const message = String(error?.message || '').toLowerCase();
    return (
        error?.code === '42P01' ||
        message.includes('relation') && message.includes('does not exist') ||
        message.includes('no existe la relacion')
    );
};

const isUnknownColumn = (error: any) => {
    const message = String(error?.message || '').toLowerCase();
    return (
        error?.code === '42703' ||
        (message.includes('column') && message.includes('does not exist')) ||
        message.includes('no existe la columna')
    );
};

// Trae salidas de inventario desde la tabla disponible en el proyecto.
export async function fetchInventarioSalidas() {
    const fromSalidas = await supabase
        .from('inventario_salidas')
        .select('*')
        .order('created_at', { ascending: false });
    if (!fromSalidas.error) return fromSalidas;
    if (!isMissingRelation(fromSalidas.error)) return fromSalidas;

    const fromMovimientos = await supabase
        .from('inventario_movimientos')
        .select('*')
        .eq('tipo', 'salida')
        .order('created_at', { ascending: false });
    return fromMovimientos;
}

// Registra una salida en la tabla disponible de inventario.
export async function createInventarioSalida(payload: {
    item_id?: string | number | null;
    producto?: string | null;
    fecha?: string | null;
    interno?: string | null;
    solicitado?: string | null;
    cantidad: number;
    unidad?: string | null;
    observaciones?: string | null;
}) {
    const attempts: Array<{ table: 'inventario_salidas' | 'inventario_movimientos'; row: Record<string, any> }> = [
        {
            table: 'inventario_salidas',
            row: {
                item_id: payload.item_id ?? null,
                producto: payload.producto ?? null,
                fecha: payload.fecha ?? null,
                interno: payload.interno ?? null,
                solicitado: payload.solicitado ?? null,
                cantidad: payload.cantidad,
                unidad: payload.unidad ?? null,
                observaciones: payload.observaciones ?? null,
            },
        },
        {
            table: 'inventario_salidas',
            row: {
                item_id: payload.item_id ?? null,
                producto: payload.producto ?? null,
                fecha: payload.fecha ?? null,
                interno: payload.interno ?? null,
                solicitante: payload.solicitado ?? null,
                cantidad: payload.cantidad,
                unidad: payload.unidad ?? null,
                observaciones: payload.observaciones ?? null,
            },
        },
        {
            table: 'inventario_movimientos',
            row: {
                item_id: payload.item_id ?? null,
                tipo: 'salida',
                fecha: payload.fecha ?? null,
                interno: payload.interno ?? null,
                solicitado: payload.solicitado ?? null,
                cantidad: payload.cantidad,
                unidad: payload.unidad ?? null,
                observaciones: payload.observaciones ?? null,
            },
        },
    ];

    let lastResult: any = null;
    for (const attempt of attempts) {
        const result = await supabase.from(attempt.table).insert([attempt.row]).select('id').single();
        if (!result.error) return result;
        lastResult = result;
        if (!isMissingRelation(result.error) && !isUnknownColumn(result.error)) return result;
    }
    return lastResult;
}

// Actualiza stock de un item de inventario.
export async function updateInventarioItemStock(itemId: string | number, stock: number) {
    return supabase
        .from('inventario_items')
        .update({ stock })
        .eq('id', itemId);
}

// Actualiza un ítem de inventario por id.
export async function updateInventarioItem(
    itemId: string | number,
    payload: Partial<{
        nombre: string;
        categoria: string | null;
        unidad: string;
        stock: number;
        stock_minimo: number;
        activo: boolean;
        sku: string | null;
        proveedor: string | null;
        comprobante: string | null;
        iva: string | null;
        fecha_ingreso: string | null;
        deposito: string | null;
        precio_unidad: number | null;
    }>,
) {
    return supabase
        .from('inventario_items')
        .update(payload)
        .eq('id', itemId);
}

// Elimina un ítem de inventario por id.
export async function deleteInventarioItem(itemId: string | number) {
    return supabase
        .from('inventario_items')
        .delete()
        .eq('id', itemId);
}

// Cubiertas - solicitudes
// Registra una solicitud de cubiertas.
export async function createCubiertaSolicitud(payload: {
    interno?: string;
    estado?: string;
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

// Finaliza una solicitud de cubiertas registrando cantidades y auditoría.
export async function finalizeCubiertaSolicitud(
    id: number | string,
    payload: { entregadas: number; recapadas: number; auditComment: string },
) {
    const attempts = [
        {
            estado: 'FIN.',
            ent: payload.entregadas,
            rec: payload.recapadas,
            comentarios: payload.auditComment,
        },
        {
            estado: 'FIN.',
            entregadas: payload.entregadas,
            recapadas: payload.recapadas,
            comentarios: payload.auditComment,
        },
        {
            estado: 'FIN.',
            comentarios: payload.auditComment,
        },
    ];

    let lastError: any = null;
    for (const updatePayload of attempts) {
        const result = await supabase.from('cubiertas_solicitudes').update(updatePayload).eq('id', id);
        if (!result.error) return result;
        lastError = result.error;

        const message = String(result.error?.message || '').toLowerCase();
        const isUnknownColumn =
            result.error?.code === '42703' ||
            (message.includes('column') && message.includes('does not exist')) ||
            message.includes('no existe la columna');

        if (!isUnknownColumn) return result;
    }

    return { data: null, error: lastError };
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
export async function fetchVehiculos({ page, limit }: { page?: number; limit?: number } = {}) {
  let builder = supabase
    .from('vehiculos')
    .select(
      'id, patente, num_int, marca, modelo, anio, vin, kilometraje_actual, activo, foto_url, base, sector, funcion, estado, op, horometro, tipo_combustible, consumo_Km, Consumo_100km, capacidat_Tanque, observaciones, caracteristicas_equipo, drag',
      {
      count: 'exact',
      },
    )
    .order('patente');

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
const INCIDENTS_BUCKET = (import.meta as any).env?.VITE_SUPABASE_INCIDENTS_BUCKET || 'incidentes';

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

// Sube una imagen de incidente al bucket y devuelve la URL pÃºblica.
export async function uploadIncidentImage(file: File, userId?: string) {
    const safeName = file.name.replace(/[^\w.-]/g, '_');
    const filePath = `${userId ?? 'anonimo'}/${Date.now()}_${safeName}`;
    const { error } = await supabase.storage.from(INCIDENTS_BUCKET).upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from(INCIDENTS_BUCKET).getPublicUrl(filePath);
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
    work_order_id?: string | null;
}) {
    return supabase.from('tareas').insert([payload]);
}

// Lista las tareas ordenadas por creación.
export async function fetchTasks() {
    return supabase.from('tareas').select('*').order('created_at', { ascending: false });
}

// Actualiza el estado o prioridad de una tarea existente.
export async function updateTask(
    id: string,
    payload: {
        estado?: string;
        prioridad?: string;
        asignado_a?: string | null;
        work_order_id?: string | null;
    },
) {
    return supabase.from('tareas').update(payload).eq('id', id);
}

// Lista ligera de OTs para combos y vinculación desde tareas.
export async function fetchWorkOrdersLite() {
    return supabase
        .from('ordenes_trabajo')
        .select('id,numero,titulo,estado,responsable_id,vehiculo_id')
        .order('created_at', { ascending: false })
        .limit(500);
}

// Ordenes de trabajo
// Trae las órdenes de trabajo ordenadas por creación.
export async function fetchWorkOrders({
    page,
    limit,
    estados,
    vehiculoId,
    search,
}: {
    page?: number;
    limit?: number;
    estados?: string[];
    vehiculoId?: string;
    search?: string;
} = {}) {
    const defaultEstados = ['abierta', 'en_progreso', 'pausada', 'confirmada', 'cerrada', 'cancelada', 'vencido'];
    let builder = supabase
        .from('ordenes_trabajo')
        .select('*', { count: 'exact' })
        .in('estado', estados && estados.length ? estados : defaultEstados)
        .order('created_at', { ascending: false });
    if (vehiculoId) {
        builder = builder.eq('vehiculo_id', vehiculoId);
    }
    const rawTerm = (search || '').trim();
    if (rawTerm) {
        const sanitized = rawTerm.replace(/[(),]/g, ' ').trim();
        if (sanitized) {
            const like = `%${sanitized}%`;
            const ownFilters = [
                `titulo.ilike.${like}`,
                `descripcion.ilike.${like}`,
            ];
            const numericTerm = Number(sanitized);
            if (!Number.isNaN(numericTerm) && /^\d+$/.test(sanitized)) {
                ownFilters.push(`numero.eq.${sanitized}`);
            }
            // Evita URLs gigantes en PostgREST cuando el termino es muy amplio (ej: "5")
            const shouldSearchVehicles = sanitized.length >= 2;
            let vehiculoIds: string[] = [];
            if (shouldSearchVehicles) {
                const { data: vehiculosMatch } = await supabase
                    .from('vehiculos')
                    .select('id')
                    .or(`num_int.ilike.${like},base.ilike.${like}`)
                    .limit(60);
                vehiculoIds = (vehiculosMatch || []).map((v: any) => v.id).filter(Boolean);
            }
            if (vehiculoIds.length > 0 && vehiculoIds.length <= 60) {
                ownFilters.push(`vehiculo_id.in.(${vehiculoIds.join(',')})`);
            }
            builder = builder.or(ownFilters.join(','));
        }
    }
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
        .in('estado', ['cerrada', 'cancelada']);
    const sinIniciarPromise = supabase
        .from('ordenes_trabajo')
        .select('id', { count: 'exact', head: true })
        .in('estado', ['pausada', 'abierta']);
    const enCursoPromise = supabase
        .from('ordenes_trabajo')
        .select('id', { count: 'exact', head: true })
        .in('estado', ['en_progreso', 'confirmada']);
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
    km_realizado?: number | null;
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
    km_realizado: number | null;
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
    vehiculo_id?: string | null;
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

// Mantenimientos v2 (planes + reglas + asignaciones + tareas)
export interface MaintenancePlanCreatePayload {
    nombre: string;
    tipo: 'preventivo' | 'correctivo' | 'predictivo' | 'otro';
    estado?: 'activo' | 'inactivo' | 'archivado';
    auto_generate_work_order?: boolean;
    auto_generate_tasks?: boolean;
}

export interface MaintenancePlanRulePayload {
    rule_type: 'date_exact' | 'date_periodic' | 'hours' | 'km';
    frequency_mode?: 'exacta' | 'periodica';
    is_active?: boolean;
    schedule_date?: string | null;
    period_value?: number | null;
    period_unit?: 'dias' | 'meses' | 'anios' | null;
    trigger_value?: number | null;
    warn_before_value?: number | null;
    warn_before_unit?: 'dias' | 'horas' | 'km' | null;
    next_due_at?: string | null;
}

export interface MaintenancePlanTaskPayload {
    titulo: string;
    descripcion?: string | null;
    orden?: number;
    requerido?: boolean;
    estimated_minutes?: number | null;
    activo?: boolean;
}

export async function fetchMaintenancePlanAssignments() {
    return supabase
        .from('v_maintenance_plan_assignments')
        .select('*')
        .order('plan_created_at', { ascending: false });
}

export async function fetchMaintenancePlansV2() {
    return supabase
        .from('maintenance_plans')
        .select('*')
        .order('created_at', { ascending: false });
}

export async function createMaintenancePlan(payload: MaintenancePlanCreatePayload) {
    return supabase.from('maintenance_plans').insert([payload]).select('id').single();
}

export async function createMaintenancePlanRules(planId: string, rules: MaintenancePlanRulePayload[]) {
    if (!rules.length) return { data: [], error: null };
    return supabase.from('maintenance_plan_rules').insert(
        rules.map((rule) => ({
            ...rule,
            plan_id: planId,
        })),
    );
}

export async function fetchMaintenancePlanRules() {
    return supabase
        .from('maintenance_plan_rules')
        .select('*')
        .order('created_at', { ascending: false });
}

export async function runDueMaintenanceProcessing() {
    return supabase.rpc('process_due_maintenance');
}

export async function createMaintenancePlanTasks(planId: string, tasks: MaintenancePlanTaskPayload[]) {
    if (!tasks.length) return { data: [], error: null };
    return supabase.from('maintenance_plan_tasks').insert(
        tasks.map((task, index) => ({
            ...task,
            plan_id: planId,
            orden: typeof task.orden === 'number' ? task.orden : index + 1,
        })),
    );
}

export async function assignMaintenancePlanVehicles(planId: string, vehiculoIds: string[]) {
    const uniqueVehiculoIds = [...new Set(vehiculoIds.filter(Boolean))];
    if (!uniqueVehiculoIds.length) return { data: [], error: null };
    return supabase.from('maintenance_plan_vehicles').upsert(
        uniqueVehiculoIds.map((vehiculoId) => ({
            plan_id: planId,
            vehiculo_id: vehiculoId,
            activo: true,
        })),
        {
            onConflict: 'plan_id,vehiculo_id',
            ignoreDuplicates: false,
        },
    );
}

export async function fetchVehicleMaintenanceAssignments(vehiculoId: string) {
    return supabase
        .from('maintenance_plan_vehicles')
        .select('plan_id, activo')
        .eq('vehiculo_id', vehiculoId);
}

export async function syncVehicleMaintenanceAssignments(vehiculoId: string, planIds: string[]) {
    const uniquePlanIds = [...new Set(planIds.filter(Boolean))];

    if (uniquePlanIds.length > 0) {
        const { error: activateError } = await supabase
            .from('maintenance_plan_vehicles')
            .upsert(
                uniquePlanIds.map((planId) => ({
                    plan_id: planId,
                    vehiculo_id: vehiculoId,
                    activo: true,
                })),
                {
                    onConflict: 'plan_id,vehiculo_id',
                    ignoreDuplicates: false,
                },
            );
        if (activateError) return { data: null, error: activateError };
    }

    const allResult = await supabase
        .from('maintenance_plan_vehicles')
        .select('plan_id')
        .eq('vehiculo_id', vehiculoId);
    if (allResult.error) return { data: null, error: allResult.error };

    const allPlanIds = (allResult.data || []).map((row: any) => row.plan_id).filter(Boolean);
    const toDeactivate = allPlanIds.filter((id: string) => !uniquePlanIds.includes(id));

    if (toDeactivate.length > 0) {
        const { error: deactivateError } = await supabase
            .from('maintenance_plan_vehicles')
            .update({ activo: false })
            .eq('vehiculo_id', vehiculoId)
            .in('plan_id', toDeactivate);
        if (deactivateError) return { data: null, error: deactivateError };
    }

    return { data: { assigned: uniquePlanIds.length, deactivated: toDeactivate.length }, error: null };
}

export async function fetchVehicleMaintenanceExecutions(vehiculoId: string, limit = 50) {
    return supabase
        .from('maintenance_executions')
        .select('id, status, due_at, created_at, closed_at, maintenance_plans(nombre, tipo), work_order_id')
        .eq('vehiculo_id', vehiculoId)
        .order('created_at', { ascending: false })
        .limit(limit);
}

export async function updateMaintenancePlan(
    id: string,
    payload: Partial<{
        nombre: string;
        tipo: 'preventivo' | 'correctivo' | 'predictivo' | 'otro';
        estado: 'activo' | 'inactivo' | 'archivado';
        auto_generate_work_order: boolean;
        auto_generate_tasks: boolean;
    }>,
) {
    return supabase.from('maintenance_plans').update(payload).eq('id', id);
}

export async function deleteMaintenancePlan(id: string) {
    return supabase.from('maintenance_plans').delete().eq('id', id);
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
    const uniqueUsuarioIds = [...new Set(usuarioIds.filter(Boolean))];
    if (uniqueUsuarioIds.length === 0) {
        return { data: [], error: null };
    }
    return supabase
        .from('capacitaciones_inscripciones')
        .upsert(
            uniqueUsuarioIds.map((usuarioId) => ({
                capacitacion_id: capacitacionId,
                usuario_id: usuarioId,
            })),
            { onConflict: 'capacitacion_id,usuario_id', ignoreDuplicates: true },
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

// Envía respuestas y registra el intento con validaciones de negocio en backend.
export async function submitCapacitacionAttempt(payload: {
    capacitacion_id: string;
    responses: Array<{
        pregunta_id: string;
        respuesta?: string;
        respuesta_json?: string | null;
    }>;
}) {
    return supabase.rpc('submit_capacitacion_attempt', {
        p_capacitacion_id: payload.capacitacion_id,
        p_respuestas: payload.responses,
    });
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

