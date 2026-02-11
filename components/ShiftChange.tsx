import React, { useEffect, useState } from 'react';
import { Plus, Loader2, Eye } from 'lucide-react';
import ShiftChangeForm from './ShiftChangeForm';
import { fetchShiftChanges, fetchUsuariosLite, supabase } from '../services/supabase';

interface ShiftChangeData {
  id: string;
  inicio: string;
  fin?: string | null;
  entregado_por?: string | null;
  recibido_por?: string | null;
  entregado_email?: string | null;
  recibido_email?: string | null;
  resumen?: string | null;
  novedades?: any;
}

interface ShiftChangeProps {
  userName?: string;
}

const parseNovedades = (raw: any) => {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw;
};

const parseIfJsonString = (raw: any) => {
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

const normalizeChecklistItems = (rawItems: any) => {
  const parsedItems = parseIfJsonString(rawItems);
  if (!Array.isArray(parsedItems)) return [];

  return parsedItems
    .map((it: any, idx: number) => {
      const parsedItem = parseIfJsonString(it);
      if (parsedItem && typeof parsedItem === 'object' && !Array.isArray(parsedItem)) {
        return {
          id: parsedItem.id ?? `legacy-${idx}`,
          item: parsedItem.item ?? parsedItem.nombre ?? parsedItem.descripcion ?? parsedItem.label ?? `Ítem ${idx + 1}`,
          status: parsedItem.status ?? parsedItem.estado ?? parsedItem.value ?? '—',
        };
      }
      if (typeof it === 'string') {
        return { id: `legacy-${idx}`, item: it, status: '—' };
      }
      if (!it || typeof it !== 'object') return null;
      return {
        id: it.id ?? `legacy-${idx}`,
        item: it.item ?? it.nombre ?? it.descripcion ?? it.label ?? `Ítem ${idx + 1}`,
        status: it.status ?? it.estado ?? it.value ?? '—',
      };
    })
    .filter(Boolean);
};

const normalizeChecklistSections = (rawSections: any) => {
  const parsedSections = parseIfJsonString(rawSections);

  if (Array.isArray(parsedSections)) {
    return parsedSections
      .map((sec: any, idx: number) => {
        const parsedSec = parseIfJsonString(sec);
        if (!parsedSec || typeof parsedSec !== 'object') return null;
        return {
          title: parsedSec.title ?? parsedSec.titulo ?? parsedSec.nombre ?? `Sección ${idx + 1}`,
          items: normalizeChecklistItems(parsedSec.items ?? parsedSec.detalles ?? parsedSec.checks ?? []),
        };
      })
      .filter((sec: any) => sec && Array.isArray(sec.items) && sec.items.length > 0);
  }

  if (parsedSections && typeof parsedSections === 'object') {
    return Object.entries(parsedSections)
      .map(([key, value], idx) => {
        const parsedValue = parseIfJsonString(value);

        if (Array.isArray(parsedValue)) {
          return {
            title: key,
            items: normalizeChecklistItems(parsedValue),
          };
        }

        if (parsedValue && typeof parsedValue === 'object') {
          const obj: any = parsedValue;
          return {
            title: obj.title ?? obj.titulo ?? obj.nombre ?? key ?? `Sección ${idx + 1}`,
            items: normalizeChecklistItems(obj.items ?? obj.detalles ?? obj.checks ?? []),
          };
        }

        if (parsedValue !== null && parsedValue !== undefined && parsedValue !== '') {
          return {
            title: 'Checklist',
            items: [{ id: `legacy-flat-${idx}`, item: key, status: String(parsedValue) }],
          };
        }

        return null;
      })
      .filter((sec: any) => sec && Array.isArray(sec.items) && sec.items.length > 0);
  }

  return [];
};

const extractChecklist = (novedades: any) => {
  const candidates = [
    novedades?.checklist_visible,
    novedades?.checklist_full,
    novedades?.checklist,
    novedades?.secciones,
    novedades?.sections,
    novedades?.datos?.checklist,
    novedades?.data?.checklist,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeChecklistSections(candidate);
    if (normalized.length > 0) return normalized;
  }

  return null;
};

const extractObservations = (novedades: any, resumen?: string | null) => {
  const structuredCandidates = [
    novedades?.datos_operativos?.observaciones,
    novedades?.observaciones,
    novedades?.obs,
    novedades?.detalle_observaciones,
  ];
  const structured = structuredCandidates.find((value) => typeof value === 'string' && value.trim().length > 0);
  if (structured) return String(structured).trim();

  const summaryText = String(resumen || '');
  const obsMatch = summaryText.match(/Obs:\s*([\s\S]*)$/i);
  if (obsMatch?.[1]?.trim()) return obsMatch[1].trim();

  return '—';
};

// Lista cambios de turno, refresca en tiempo real y permite generar/reportar cada turno.
const ShiftChange: React.FC<ShiftChangeProps> = ({ userName }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [view, setView] = useState<'list' | 'new' | 'detail'>('list');
  const [shifts, setShifts] = useState<ShiftChangeData[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selected, setSelected] = useState<ShiftChangeData | null>(null);
  const refreshTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedRef = React.useRef(false);

  const loadData = async (opts?: { silent?: boolean }) => {
    const shouldShowLoading = !opts?.silent && !hasLoadedRef.current;
    if (shouldShowLoading) setLoading(true);

    const [{ data, error }, { data: users }] = await Promise.all([fetchShiftChanges(), fetchUsuariosLite()]);

    if (shouldShowLoading) setLoading(false);

    if (error) {
      console.error('Error cargando cambios de turno', error);
      setErrorMsg('No se pudieron cargar los cambios de turno. Revisa políticas de lectura en "cambios_turno".');
      return;
    }

    setErrorMsg(null);
    setShifts(data || []);
    setUsuarios(users || []);
    hasLoadedRef.current = true;
  };

  useEffect(() => {
    if (view !== 'list') return;

    loadData();

    const pollId = setInterval(() => {
      loadData({ silent: true });
    }, 10000);

    const channel = supabase
      .channel('cambios_turno-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cambios_turno' }, () => {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = setTimeout(() => {
          loadData({ silent: true });
        }, 400);
      })
      .subscribe();

    return () => {
      clearInterval(pollId);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [view]);

  const formatUserName = (id?: string | null) => {
    if (!id) return '-';
    const u = usuarios.find((x) => x.id === id);
    return u?.nombre || u?.email || id;
  };

  const filteredShifts = shifts.filter((shift) => {
    const text = `${shift.resumen || ''} ${shift.entregado_email || ''} ${shift.recibido_email || ''}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  if (view === 'new') {
    return (
      <ShiftChangeForm
        userName={userName}
        onBack={() => {
          setView('list');
          loadData();
        }}
      />
    );
  }

  if (view === 'detail' && selected) {
    const novedades = parseNovedades(selected.novedades);
    const remolqueSnapshot = novedades?.trailer_snapshot;
    const legacyRemolque = novedades?.remolque;
    const operationalData = novedades?.datos_operativos;
    const vehicleSnapshot = novedades?.vehiculo_snapshot;

    const remolqueSnapshotLabel = remolqueSnapshot
      ? [remolqueSnapshot.patente, remolqueSnapshot.num_int ? `Interno ${remolqueSnapshot.num_int}` : null, remolqueSnapshot.modelo]
          .filter(Boolean)
          .join(' | ')
      : null;

    const remolqueLegacyLabel = legacyRemolque
      ? legacyRemolque.enabled
        ? `${legacyRemolque.equipo || 'Remolque'}${legacyRemolque.descripcion ? `: ${legacyRemolque.descripcion}` : ''}${
            legacyRemolque.identificacion ? ` - ID ${legacyRemolque.identificacion}` : ''
          }`
        : 'No remolca'
      : null;

    const remolqueLabel = remolqueSnapshotLabel || remolqueLegacyLabel;

    const checklistArray = extractChecklist(novedades);

    const kmLabel = (operationalData?.km ?? (selected.resumen || '').match(/Km:\s*([^|]+)/i)?.[1]?.trim()) || '—';
    const hsLabel = (operationalData?.hs ?? (selected.resumen || '').match(/Hs:\s*([^|]+)/i)?.[1]?.trim()) || '—';
    const observationsLabel = extractObservations(novedades, selected.resumen);

    const vehicleLabel =
      vehicleSnapshot?.patente ||
      operationalData?.vehiculo ||
      (selected.resumen || '').match(/Vehículo:\s*([^|]+)/i)?.[1]?.trim() ||
      selected.resumen ||
      '—';

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            <Eye size={20} /> Detalle Cambio de Turno
          </h1>
          <div className="flex gap-3">
            <button onClick={() => window.print()} className="px-3 py-2 bg-slate-700 text-white rounded-md text-sm hover:bg-slate-800">
              Imprimir
            </button>
            <button onClick={() => { setSelected(null); setView('list'); }} className="px-3 py-2 bg-slate-200 text-slate-700 rounded-md text-sm hover:bg-slate-300">
              Volver
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-700">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <p className="text-xs text-slate-500">Fecha</p>
              <p className="text-base font-bold text-slate-800">{selected.inicio ? new Date(selected.inicio).toLocaleString() : '—'}</p>
              <p className="text-xs text-slate-500 mt-3">Km de la unidad</p>
              <p className="text-base font-bold text-slate-800">{kmLabel}</p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <p className="text-xs text-slate-500">Nombre y Apellido</p>
              <p className="text-base font-bold text-slate-800">{selected.entregado_email || formatUserName(selected.entregado_por)}</p>
              <p className="text-xs text-slate-500 mt-3">Hs. de la unidad</p>
              <p className="text-base font-bold text-slate-800">{hsLabel}</p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <p className="text-xs text-slate-500">Vehículo</p>
              <p className="text-base font-bold text-slate-800">{vehicleLabel}</p>
            </div>
          </div>

          {remolqueLabel && (
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-800">Remolque</p>
              <p>{remolqueLabel}</p>
            </div>
          )}

          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-800">Observaciones</p>
            <p className="whitespace-pre-wrap">{observationsLabel}</p>
          </div>

          {!checklistArray ? (
            <div className="bg-white rounded-lg border border-slate-200 p-4 text-sm text-slate-600">Sin checklist disponible.</div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              {checklistArray.map((sec: any, idx: number) => (
                <div key={idx} className="border-b border-slate-200 last:border-b-0">
                  <div className="bg-slate-900 text-white px-4 py-2 text-sm font-bold">{sec.title || sec.titulo || 'Sección'}</div>
                  <table className="w-full text-sm">
                    <tbody>
                      {(sec.items || []).map((it: any) => {
                        const status = (it.status || '').toLowerCase();
                        const bg = status === 'malo' || status === 'falta' ? 'bg-rose-50' : '';
                        return (
                          <tr key={it.id} className={`border-b border-slate-200 last:border-b-0 ${bg}`}>
                            <td className="px-4 py-2 font-semibold text-slate-800">{it.item}</td>
                            <td className="px-4 py-2 text-slate-700 w-40">{it.status || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
              
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-600">Cambio de Turnos</h1>
        <button
          onClick={() => setView('new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          <Plus size={18} />
          Generar nuevo
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">LISTADO CAMBIOS DE TURNO</h2>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Mostrar</label>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-slate-600">registros</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-600">Buscar:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">{errorMsg}</div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-600">#</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-600">Inicio</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-600">Chofer</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-600">Resumen</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-600">Detalles</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-sm text-slate-500">
                    <Loader2 className="animate-spin inline mr-2" size={16} />
                    Cargando...
                  </td>
                </tr>
              ) : (
                filteredShifts.slice(0, rowsPerPage).map((shift) => (
                  <tr key={shift.id} className="hover:bg-slate-50 bg-rose-50/30 transition-colors">
                    <td className="px-4 py-4 text-sm text-slate-600 font-medium">{shift.id.slice(0, 8)}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{shift.inicio ? new Date(shift.inicio).toLocaleString() : '—'}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{shift.entregado_email || formatUserName(shift.entregado_por)}</td>
                    <td className="px-4 py-4 text-sm text-slate-600 whitespace-pre-line">{shift.resumen || '—'}</td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => { setSelected(shift); setView('detail'); }}
                        className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-xs"
                      >
                        <Eye size={14} /> Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="text-sm text-slate-500 pt-2">
          Mostrando 1 a {Math.min(filteredShifts.length, rowsPerPage)} de {filteredShifts.length} entradas
        </div>
      </div>
    </div>
  );
};

export default ShiftChange;
