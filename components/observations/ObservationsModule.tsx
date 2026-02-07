import React, { useCallback, useEffect, useRef, useState } from 'react';
import ObservationDetailModal from './ObservationDetailModal';
import ObservationForm, { ObservationFormValues } from './ObservationForm';
import ObservationList from './ObservationList';
import ObservationsStats, { ObservationsStatsEntry } from './ObservationsStats';
import { OBSERVATION_CHECKLIST } from './data';
import {
  createObservation,
  fetchObservations,
  ObservationChecklistEntry,
  ObservationRow,
} from '../../services/observaciones';
import { fetchObservationChecklistStats } from '../../services/observaciones_stats';
import { supabase } from '../../services/supabase';

interface ObservationsModuleProps {
  userRole?: 'admin' | 'editor' | 'solo_lectura';
}

const getChecklistEntries = (checklist: Record<string, string[]>) => {
  const lookups = OBSERVATION_CHECKLIST.reduce<Record<string, string>>((acc, category) => {
    acc[category.id] = category.label;
    return acc;
  }, {});

  return Object.entries(checklist).flatMap(([categoryId, entries]) =>
    entries.map((option) => ({
      categoria: lookups[categoryId],
      opcion: option,
      seleccionada: true,
    })),
  );
};

// Obtiene el usuario autenticado para asociar cada observación con su autor.
const fetchCurrentUserId = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
};

const formatInputDate = (date: Date) => date.toISOString().split('T')[0];

export default function ObservationsModule({ userRole }: ObservationsModuleProps) {
  const [observations, setObservations] = useState<ObservationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<ObservationRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const [statsLoading, setStatsLoading] = useState(false);
  const [statsEntries, setStatsEntries] = useState<ObservationsStatsEntry[]>([]);
  const [statsDesde, setStatsDesde] = useState(() => {
    const past = new Date();
    past.setDate(past.getDate() - 30);
    return formatInputDate(past);
  });
  const [statsHasta, setStatsHasta] = useState(() => formatInputDate(new Date()));

  const formRef = useRef<HTMLDivElement>(null);

  // Carga la lista completa y la refresca al guardar una observación.
  const canViewList = userRole === 'admin';
  const canViewStats = canViewList;

  const loadObservations = useCallback(async () => {
    if (!canViewList) return;
    setLoading(true);
    try {
      const { data } = await fetchObservations();
      setObservations(data ?? []);
    } catch (error) {
      console.error('No se pudieron cargar las observaciones', error);
    } finally {
      setLoading(false);
    }
  }, [canViewList]);

  useEffect(() => {
    loadObservations();
  }, [loadObservations]);

  // Arma el payload completo incluyendo checklist y manda a crear la observación.
  const handleSave = async (values: ObservationFormValues) => {
    try {
      const userId = await fetchCurrentUserId();
      if (!userId) throw new Error('Usuario no autenticado');

      const payload = {
        usuario_id: userId,
        area: values.area,
        tarea_observada: values.tarea,
        tipo: values.tipo,
        descripcion: values.descripcion,
        accion_sugerida: values.accion,
        checklist: getChecklistEntries(values.checklist) as ObservationChecklistEntry[],
      };

      const { error } = await createObservation(payload);
      if (error) throw error;

      await loadObservations();
      setShowForm(false);
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
    } finally {
      // ObservationForm mantiene su propio estado de carga
    }
  };

  const handleDetail = (entry: ObservationRow) => {
    setDetail(entry);
    setModalOpen(true);
  };

  // ✅ Toggle de formulario (abre/cierra)
  // - Si abre: cierra stats y hace scroll
  // - Si cierra: solo cierra
  // Muestra u oculta el formulario y cierra las estadísticas al abrirlo.
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

  const handleHideForm = () => {
    setShowForm(false);
  };

  // Obtiene las estadísticas filtradas por fechas para el usuario actual.
  const loadStats = useCallback(async (desde?: string, hasta?: string) => {
    setStatsLoading(true);
    try {
      const userId = await fetchCurrentUserId();
      if (!userId) return;

      const { data } = await fetchObservationChecklistStats(userId, desde, hasta);

      if (!data) {
        setStatsEntries([]);
        return;
      }

      const counts = new Map<string, number>();
      data.forEach((row: any) => {
        const key = `${row.categoria}||${row.opcion}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      });

      const aggregated: ObservationsStatsEntry[] = Array.from(counts.entries()).map(([key, cantidad]) => {
        const [categoria, opcion] = key.split('||');
        return { categoria, opcion, cantidad };
      });

      setStatsEntries(aggregated);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const handleStats = () => {
    if (!canViewStats) return;
    setShowStats(true);
    setShowForm(false); // ✅ al abrir stats, cierro el form
    loadStats(statsDesde, statsHasta);
  };

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-900">Observaciones de seguridad</p>
            <p className="text-sm text-slate-500">Los registros que generes aparecerán en esta tabla.</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleToggleForm}
              className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {showForm ? 'Cerrar formulario' : 'Generar nueva'}
            </button>

            {canViewStats && (
              <button
                type="button"
                onClick={handleStats}
                className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-500"
              >
                Estadísticas
              </button>
            )}
          </div>
        </div>

        {showForm && (
          <div ref={formRef} className="mt-5">
            <ObservationForm onSave={handleSave} onCancel={handleHideForm} />
          </div>
        )}
      </div>

      {showStats && canViewStats && (
        <ObservationsStats
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
        <ObservationList
          observations={observations}
          loading={loading}
          onRefresh={loadObservations}
          onViewDetail={handleDetail}
          onNew={handleToggleForm} // ✅ ahora el “Nuevo” también hace toggle
        />
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Listado restringido</p>
          <p className="mt-2">
            Solo los administradores pueden revisar el historial completo de observaciones; aun así puedes
            generar nuevas entradas usando el botón “Generar nueva”.
          </p>
        </div>
      )}

      <ObservationDetailModal
        observation={detail ?? undefined}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}
