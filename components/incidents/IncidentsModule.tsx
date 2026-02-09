import React, { useCallback, useEffect, useRef, useState } from 'react';
import IncidentsForm, { IncidentFormValues } from './IncidentsForm';
import IncidentsList from './IncidentsList';
import IncidentDetailModal from './IncidentDetailModal';
import IncidentsStats, { IncidentsStatsEntry } from './IncidentsStats';
import { createIncident, fetchIncidents, IncidentCatalogEntry, IncidentRow } from '../../services/incidentes';
import { fetchIncidentCatalogStats } from '../../services/incidentes_stats';
import { supabase, uploadIncidentImage } from '../../services/supabase';

interface IncidentsModuleProps {
  userRole?: 'admin' | 'editor' | 'solo_lectura';
}

const formatInputDate = (date: Date) => date.toISOString().split('T')[0];

const fetchCurrentUserId = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
};

const buildCatalogEntries = (catalog: Record<string, string>): IncidentCatalogEntry[] => {
  return Object.entries(catalog)
    .filter(([, option]) => Boolean(option))
    .map(([category, option]) => ({
      categoria: category,
      opcion: option,
      seleccionada: true,
    }));
};

const toNumber = (value: string): number | null => {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function IncidentsModule({ userRole }: IncidentsModuleProps) {
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<IncidentRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsEntries, setStatsEntries] = useState<IncidentsStatsEntry[]>([]);
  const [statsDesde, setStatsDesde] = useState(() => {
    const past = new Date();
    past.setDate(past.getDate() - 30);
    return formatInputDate(past);
  });
  const [statsHasta, setStatsHasta] = useState(() => formatInputDate(new Date()));
  const formRef = useRef<HTMLDivElement>(null);

  const canViewList = userRole === 'admin';
  const canViewStats = canViewList;

  const loadIncidents = useCallback(async () => {
    if (!canViewList) return;
    setLoading(true);
    try {
      const { data } = await fetchIncidents();
      setIncidents(data ?? []);
    } catch (error) {
      console.error('No se pudieron cargar los incidentes', error);
    } finally {
      setLoading(false);
    }
  }, [canViewList]);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  const handleSave = async (values: IncidentFormValues) => {
    const userId = await fetchCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');
    const uploadedPhotos = await Promise.all(
      (values.fotosFiles ?? []).slice(0, 3).map((file) => uploadIncidentImage(file, userId)),
    );

    const payload = {
      usuario_id: userId,
      informante_apellido: values.informanteApellido,
      informante_nombres: values.informanteNombres,
      fecha_reporte: values.fechaReporte || null,
      tipo_incidente: values.tipoIncidente,
      gravedad: values.gravedad,
      clasificacion: values.clasificacion,
      hubo_lesionados: values.huboLesionados,
      cantidad_lesionados: toNumber(values.cantidadLesionados),
      fecha_incidente: values.fechaIncidente || null,
      hora_incidente: values.horaIncidente || null,
      accidentado_nombre: values.accidentadoNombre,
      accidentado_dni: values.accidentadoDni,
      accidentado_edad: toNumber(values.accidentadoEdad),
      accidentado_estado_civil: values.accidentadoEstadoCivil,
      accidentado_fecha_ingreso: values.accidentadoFechaIngreso || null,
      accidentado_cargo: values.accidentadoCargo || values.catalogo.cargo || '',
      accidentado_otros: values.accidentadoOtros,
      unidad_interna: values.unidadInterna,
      unidad_marca_modelo: values.unidadMarcaModelo,
      unidad_patente: values.unidadPatente,
      conductor_nombre: values.conductorNombre,
      conductor_telefono: values.conductorTelefono,
      tipo_servicio: values.catalogo.tipo_servicio || '',
      condicion_climatica: values.catalogo.condicion_climatica || '',
      condicion_luz: values.catalogo.condicion_luz || '',
      tipo_terreno: values.catalogo.tipo_terreno || '',
      condicion_ruta_terreno: values.catalogo.condicion_ruta_terreno || '',
      temperatura_ambiente: toNumber(values.temperaturaAmbiente),
      velocidad_viento: toNumber(values.velocidadViento),
      incidente_ambiental_locacion: values.incidenteAmbientalLocacion,
      incidente_ambiental_volumen: toNumber(values.incidenteAmbientalVolumen),
      incidente_ambiental_area_m2: toNumber(values.incidenteAmbientalAreaM2),
      descripcion_evento: values.descripcionEvento,
      causas_incidente: values.causasIncidente,
      testigos: values.testigos,
      acciones_correctivas: values.accionesCorrectivas,
      nombre_supervisor: values.nombreSupervisor,
      presente_en_lugar: values.presenteEnLugar,
      fotos: uploadedPhotos,
      catalogo: buildCatalogEntries(values.catalogo),
    };

    const { error } = await createIncident(payload);
    if (error) throw error;

    await loadIncidents();
    setShowForm(false);
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadStats = useCallback(async (desde?: string, hasta?: string) => {
    setStatsLoading(true);
    try {
      const userId = await fetchCurrentUserId();
      if (!userId) return;
      const { data } = await fetchIncidentCatalogStats(userId, desde, hasta);
      if (!data) {
        setStatsEntries([]);
        return;
      }

      const counts = new Map<string, number>();
      data.forEach((row: any) => {
        const key = `${row.categoria}||${row.opcion}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      });

      const aggregated: IncidentsStatsEntry[] = Array.from(counts.entries()).map(([key, cantidad]) => {
        const [categoria, opcion] = key.split('||');
        return { categoria, opcion, cantidad };
      });
      setStatsEntries(aggregated);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const handleToggleForm = () => {
    setShowForm((prev) => {
      const next = !prev;
      if (next) {
        setShowStats(false);
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
      }
      return next;
    });
  };

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-900">Reporte de incidentes</p>
            <p className="text-sm text-slate-500">Registra incidentes y accidentes usando el formulario estandar.</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleToggleForm}
              className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {showForm ? 'Cerrar formulario' : 'Generar nuevo'}
            </button>

            {canViewStats && (
              <button
                type="button"
                onClick={() => {
                  setShowStats(true);
                  setShowForm(false);
                  loadStats(statsDesde, statsHasta);
                }}
                className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-500"
              >
                Estadisticas
              </button>
            )}
          </div>
        </div>

        {showForm && (
          <div ref={formRef} className="mt-5">
            <IncidentsForm onSave={handleSave} onCancel={() => setShowForm(false)} />
          </div>
        )}
      </div>

      {showStats && canViewStats && (
        <IncidentsStats
          entries={statsEntries}
          loading={statsLoading}
          desde={statsDesde}
          hasta={statsHasta}
          onFilter={(desde, hasta) => {
            setStatsDesde(desde);
            setStatsHasta(hasta);
            loadStats(desde, hasta);
          }}
          onBack={() => setShowStats(false)}
        />
      )}

      {canViewList ? (
        <IncidentsList
          incidents={incidents}
          loading={loading}
          onRefresh={loadIncidents}
          onViewDetail={(entry) => {
            setDetail(entry);
            setModalOpen(true);
          }}
          onNew={handleToggleForm}
        />
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Listado restringido</p>
          <p className="mt-2">
            Solo administradores pueden ver el historial completo. Puedes generar nuevos reportes desde el formulario.
          </p>
        </div>
      )}

      <IncidentDetailModal incident={detail ?? undefined} isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
}
