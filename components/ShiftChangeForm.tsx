// ShiftChangeForm.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { createShiftChange, fetchVehiculos, supabase } from '../services/supabase';

interface ShiftChangeFormProps {
  onBack: () => void;
  userName?: string;
}

interface ChecklistItem {
  id: number;
  item: string;
  status: string;
}

interface ChecklistSection {
  title: string;
  items: ChecklistItem[];
}

const GENERAL_TITLES = [
  'Sistema Eléctrico',
  'Carrocería y chasis',
  'Interior',
  'Elementos de seguridad',
  'Accesorios',
  'Tren Rodante',
  'Equipo de radio',
  'Control y estados de elementos y niveles',
];

const normalizeText = (value: string = '') =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const keywords = {
  generalLivianos: ['flota liviana', 'camioneta', 'sprinter', 'tpt personal'],
  generalAgua: ['agua dulce', 'potable', 'agua purga', 'agua potable'],
  vacuum: [
    'vactor',
    'vacio',
    'equipo de vacio',
    'chupas',
    'chupa de',
    'aguas grises',
    'tractor con vacio',
    'vacio de 25',
    '30m3',
  ],
  vactor: ['vactor'],
  porta: ['porta simple', 'porta doble', 'portacontenedores'],
  hidro: ['hidro c/caja', 'tractor con hidro', 'hidro'],
  motobomba: ['produccion', 'control de pozos', 'motobomba', 'hotoil', 'mmbb'],
  cargasSolidas: ['cargas solidas'],
};

const has = (text: string, list: string[]) => list.some((k) => text.includes(k));

const computeChecklistRules = (selectedVehicle: any) => {
  const sector = normalizeText(selectedVehicle?.sector || '');
  const funcion = normalizeText(selectedVehicle?.funcion || '');
  const meta = normalizeText(`${sector} ${funcion} ${selectedVehicle?.caracteristicas_equipo || ''}`);

  const generalOnly =
    has(sector, keywords.generalLivianos) ||
    has(funcion, keywords.generalLivianos) ||
    has(sector, keywords.generalAgua) ||
    has(funcion, keywords.generalAgua);

  const showVacuumPump = has(meta, keywords.vacuum);
  const showVactor = has(meta, keywords.vactor);
  const showPortaContenedores = has(meta, keywords.porta);
  const showHidrogrua = has(funcion, keywords.hidro);
  const showMotobombaPozoHO = has(meta, keywords.motobomba);
  const showCargasSolidas = has(sector, keywords.cargasSolidas);

  // Regla de arrastre: hidro o vactor (como venías)
  const allowArrastre = has(meta, keywords.hidro) || has(funcion, keywords.vactor);

  return {
    generalOnly,
    showVacuumPump,
    showVactor,
    showPortaContenedores,
    showHidrogrua,
    showMotobombaPozoHO,
    showCargasSolidas,
    allowArrastre,
  };
};

// Remolque (solo si allowArrastre)
const REMOLQUE_OPCIONES = [
  { value: '', label: 'No remolca' },
  { value: 'Semiplayo (CS)', label: 'Semiplayo (CS)' },
  { value: 'Trailer', label: 'Trailer' },
  { value: 'Carretón', label: 'Carretón' },
  { value: 'Compresor', label: 'Compresor' },
  { value: 'Generador', label: 'Generador' },
  { value: 'Bomba / Skid', label: 'Bomba / Skid' },
  { value: 'Otro', label: 'Otro' },
];

const ShiftChangeForm: React.FC<ShiftChangeFormProps> = ({ onBack, userName }) => {
  // Form State
  const [date, setDate] = useState('2025-12-12');
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [driver, setDriver] = useState(userName || '');
  const [driverEmail, setDriverEmail] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [km, setKm] = useState('');
  const [hs, setHs] = useState('');
  const [observations, setObservations] = useState('');
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [errorVehiculos, setErrorVehiculos] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState('');

  // Remolque State
  const [remolqueEquipo, setRemolqueEquipo] = useState<string>('');
  const [remolqueDesc, setRemolqueDesc] = useState<string>('');
  const [remolqueId, setRemolqueId] = useState<string>('');

  // Checklist State
  const [sections, setSections] = useState<ChecklistSection[]>([
    {
      title: 'Sistema Eléctrico',
      items: [
        { id: 1, item: 'Alarma acústica de retroceso.', status: 'Bueno' },
        { id: 2, item: 'Balizas Intermitentes.', status: 'Bueno' },
        { id: 3, item: 'Bocina.', status: 'Bueno' },
        { id: 4, item: 'Estado de Reflector/es.', status: 'Bueno' },
        { id: 5, item: 'Funcionamiento de Luces (baja, alta, posición, de giros, freno, etc.)', status: 'Bueno' },
        { id: 6, item: 'Otros.', status: 'Bueno' },
      ],
    },
    {
      title: 'Carrocería y chasis',
      items: [
        { id: 7, item: 'Encastre de la tijera/colocación de la traba de seguridad.', status: 'Bueno' },
        { id: 8, item: 'Espejos retrovisores.', status: 'Bueno' },
        { id: 9, item: 'Estado de Chapa.', status: 'Bueno' },
        { id: 10, item: 'Estado de Puertas.', status: 'Bueno' },
        { id: 11, item: 'Parabrisas y lavaparabrisas.', status: 'Bueno' },
        { id: 12, item: 'Paragolpe trasero / delantero.', status: 'Bueno' },
      ],
    },
    {
      title: 'Interior',
      items: [
        { id: 13, item: 'Alfombras.', status: 'Bueno' },
        { id: 14, item: 'Apoya cabeza.', status: 'Bueno' },
        { id: 15, item: 'Calefacción/ Desempañador y aire acondicionado.', status: 'Bueno' },
        { id: 16, item: 'Funcionamiento de Instrumentos.', status: 'Bueno' },
        { id: 17, item: 'Levantavidrios.', status: 'Bueno' },
        { id: 18, item: 'Orden y Limpieza General.', status: 'Bueno' },
        { id: 19, item: 'Parasoles.', status: 'Bueno' },
        { id: 20, item: 'Tapizado.', status: 'Bueno' },
      ],
    },
    {
      title: 'Elementos de seguridad',
      items: [
        { id: 21, item: 'Arnes de Seguridad.', status: 'Bueno' },
        { id: 22, item: 'Arrestallamas.', status: 'Bueno' },
        { id: 23, item: 'Balizas triángulo y Barra de remolque.', status: 'Bueno' },
        { id: 24, item: 'Barandas rebatibles.', status: 'Bueno' },
        { id: 25, item: 'Botiquin y Linterna.', status: 'Bueno' },
        { id: 26, item: 'Chaleco Reflectivo.', status: 'Bueno' },
        { id: 27, item: 'Cinturones de seguridad.', status: 'Bueno' },
        { id: 28, item: 'Conos de Seguridad.', status: 'Bueno' },
        { id: 29, item: 'Extintores.', status: 'Bueno' },
        { id: 30, item: 'Linea de Vida Horizontal.', status: 'Bueno' },
        { id: 31, item: 'Linea de Vida Vertical.', status: 'Bueno' },
      ],
    },
    {
      title: 'Accesorios',
      items: [
        { id: 32, item: 'Cajón y Kit de herramientas.', status: 'Bueno' },
        { id: 33, item: 'Estado de válvulas y conexiones.', status: 'Bueno' },
        { id: 34, item: 'Funcionamiento de bomba.', status: 'Bueno' },
        { id: 35, item: 'Gato Hidráulico/Mecánico.', status: 'Bueno' },
        { id: 36, item: 'Llave de ruedas.', status: 'Bueno' },
        { id: 37, item: 'Manguerotes.', status: 'Bueno' },
        { id: 38, item: 'Palas.', status: 'Bueno' },
      ],
    },
    {
      title: 'Tren Rodante',
      items: [
        { id: 39, item: 'Estado de Cubiertas.', status: 'Bueno' },
        { id: 40, item: 'Rueda/s de auxilio.', status: 'Bueno' },
      ],
    },
    { title: 'Equipo de radio', items: [{ id: 41, item: 'Funcionamiento.', status: 'Bueno' }] },
    {
      title: 'Control y estados de elementos y niveles',
      items: [
        { id: 42, item: 'Aceite de Motor.', status: 'Bueno' },
        { id: 43, item: 'Aceite sistema Hidraulico.', status: 'Bueno' },
        { id: 44, item: 'Agua Radiador.', status: 'Bueno' },
        { id: 45, item: 'Agua Sorrino.', status: 'Bueno' },
        { id: 46, item: 'Estado de filtros.', status: 'Bueno' },
        { id: 47, item: 'Sistema Hidraulico, Mangueras, conexiones, etc.', status: 'Bueno' },
      ],
    },
    {
      title: 'Control Bomba Vacio',
      items: [
        { id: 48, item: 'Correas.', status: 'Bueno' },
        { id: 49, item: 'Perdidas.', status: 'Bueno' },
        { id: 50, item: 'Ruidos.', status: 'Bueno' },
      ],
    },
    {
      title: 'Hidrogrúa',
      items: [
        { id: 51, item: 'Estado de Comandos/Señalética', status: 'No Aplica' },
        { id: 52, item: 'Estado de Mangueras y Estabilizadores', status: 'No Aplica' },
        { id: 53, item: 'Funcionamiento general de la Hidrogrúa', status: 'No Aplica' },
        { id: 54, item: 'Niveles de Aceites', status: 'No Aplica' },
        { id: 55, item: 'Pérdidas', status: 'No Aplica' },
      ],
    },
    {
      title: 'Cargas Generales',
      items: [
        { id: 56, item: 'Cable de corte Hidráulico', status: 'Bueno' },
        { id: 57, item: 'Estado de la carga', status: 'Bueno' },
        { id: 58, item: 'Estado de lona', status: 'Bueno' },
        { id: 59, item: 'Pernos de anclaje de vuelco', status: 'Bueno' },
        { id: 60, item: 'Pinos de aseguramiento de la carga', status: 'Bueno' },
        { id: 61, item: 'Trabas u Manija de compuerta', status: 'Bueno' },
      ],
    },
    {
      title: 'Motobomba y control de pozo',
      items: [
        { id: 62, item: 'Bomba centrifuga', status: 'Bueno' },
        { id: 63, item: 'Bomba Triplex', status: 'Bueno' },
        { id: 64, item: 'Estado de eslingas y grampa omega', status: 'Bueno' },
        { id: 65, item: 'Estado de Manguerotes /lineas de acople/Bowen, NPT y JIP', status: 'Bueno' },
        { id: 66, item: 'Estado de manómetro rango adecuado de operación', status: 'Bueno' },
        { id: 67, item: 'Limpieza y funcionamiento de la Válvula reguladora de presión', status: 'Bueno' },
        { id: 68, item: 'Válvula de Alivio', status: 'Bueno' },
      ],
    },
    {
      title: 'Porta Contenedores',
      items: [
        { id: 69, item: 'Cilindro y Pistón Hidráulicos', status: 'Bueno' },
        { id: 70, item: 'Estabilizadores', status: 'Bueno' },
        {
          id: 71,
          item: 'Estado de sistema de Izaje (Cadenas, placas, grampas, hammerlock y arco.)',
          status: 'Bueno',
        },
        { id: 72, item: 'Estado Parapeto', status: 'Bueno' },
        { id: 73, item: 'Sistema Hidráulico (Bomba, tacho y circuito)', status: 'Bueno' },
      ],
    },
    {
      title: 'Vactor',
      items: [
        { id: 74, item: 'Condiciones de la trampa del soplador', status: 'Bueno' },
        { id: 75, item: 'Estado de control', status: 'Bueno' },
        { id: 76, item: 'Estado de mangueras y circuitos hidráulicos', status: 'Bueno' },
        { id: 77, item: 'Estado del flotante y si el camión está vacio / descargado', status: 'Bueno' },
        { id: 78, item: 'Qué la bomba no esté pasada.', status: 'Bueno' },
      ],
    },
  ]);

  useEffect(() => {
    const loadUser = async () => {
      const { data: authData } = await supabase.auth.getUser();
      let u = authData?.user || null;

      if (!u) {
        const { data: sessionData } = await supabase.auth.getSession();
        u = sessionData.session?.user || null;
      }

      let emailLS = '';
      if (typeof window !== 'undefined') {
        emailLS = localStorage.getItem('user_email') || localStorage.getItem('email') || '';
        const authKey = Object.keys(localStorage).find((k) => k.includes('auth-token')) || '';
        if (authKey) {
          try {
            const stored = JSON.parse(localStorage.getItem(authKey) || 'null');
            const sess = Array.isArray(stored) ? stored[0]?.currentSession : stored?.currentSession || stored?.session;
            const emailFromToken = sess?.user?.email;
            if (emailFromToken) emailLS = emailFromToken;
          } catch {
            // ignore
          }
        }
      }

      if (u) {
        const nombre = (u as any)?.user_metadata?.nombre;
        const email = (u as any)?.email;
        setDriver(nombre || email || emailLS);
        setDriverEmail(email || emailLS || nombre || '');
      } else if (emailLS) {
        setDriver(emailLS);
        setDriverEmail(emailLS);
      }
    };

    const loadVehicles = async () => {
      const { data, error } = await fetchVehiculos();
      if (error) {
        console.error('Error cargando vehículos', error);
        setErrorVehiculos('No se pudieron cargar los vehículos');
        setVehiculos([]);
        return;
      }
      setErrorVehiculos(null);
      setVehiculos(data || []);
    };

    if (!driver) loadUser();
    loadVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (userName) setDriver(userName);
  }, [userName]);

  const selectedVehicle = useMemo(() => {
    if (!vehicle) return null;
    return vehiculos.find((v) => v.patente === vehicle || v.id === vehicle) || null;
  }, [vehicle, vehiculos]);

  const checklistRules = useMemo(() => computeChecklistRules(selectedVehicle), [selectedVehicle]);

  // Reset remolque si el vehículo no permite arrastre
  useEffect(() => {
    if (!checklistRules?.allowArrastre) {
      setRemolqueEquipo('');
      setRemolqueDesc('');
      setRemolqueId('');
    }
  }, [checklistRules?.allowArrastre, selectedVehicle?.id]);

  const filteredVehicles = useMemo(() => {
    const term = vehicleSearch.trim();
    if (!term) return vehiculos;
    return vehiculos.filter((v) => (v.num_int || '').toLowerCase().includes(term.toLowerCase()));
  }, [vehiculos, vehicleSearch]);

  useEffect(() => {
    const term = vehicleSearch.trim().toLowerCase();
    if (!term) return;
    const match = vehiculos.find((v) => (v.num_int || '').toLowerCase() === term);
    if (match && vehicle !== match.patente && vehicle !== match.id) {
      setVehicle(match.patente || match.id);
    }
  }, [vehicleSearch, vehiculos, vehicle]);

  const visibleSections = useMemo(() => {
    if (!selectedVehicle) return sections;

    if (checklistRules.generalOnly) {
      return sections.filter((section) => GENERAL_TITLES.includes(section.title));
    }

    return sections.filter((section) => {
      if (!checklistRules.showVacuumPump && section.title === 'Control Bomba Vacio') return false;
      if (!checklistRules.showHidrogrua && section.title === 'Hidrogrúa') return false;
      if (!checklistRules.showMotobombaPozoHO && section.title === 'Motobomba y control de pozo') return false;
      if (!checklistRules.showPortaContenedores && section.title === 'Porta Contenedores') return false;
      if (!checklistRules.showVactor && section.title === 'Vactor') return false;
      return true;
    });
  }, [sections, checklistRules, selectedVehicle]);

  const handleChecklistChange = (sectionIndex: number, itemId: number, newStatus: string) => {
    setSections((prevSections) => {
      const next = [...prevSections];
      const section = next[sectionIndex];
      section.items = section.items.map((it) => (it.id === itemId ? { ...it, status: newStatus } : it));
      return next;
    });
  };

  const buildDateTime = () => {
    if (!date) return null;
    const h = hour || '00';
    const m = minute || '00';
    return `${date}T${h.padStart(2, '0')}:${m.padStart(2, '0')}:00`;
  };

  const handleSave = async () => {
    setSaving(true);

    const inicio = buildDateTime() || new Date().toISOString();
    const allowArrastre = !!checklistRules?.allowArrastre;

    const remolqueObj = allowArrastre
      ? {
          enabled: remolqueEquipo !== '',
          equipo: remolqueEquipo !== '' ? remolqueEquipo : null,
          descripcion: remolqueEquipo === 'Otro' ? (remolqueDesc || null) : null,
          identificacion: remolqueEquipo !== '' ? (remolqueId || null) : null,
        }
      : null;

    const remolqueText = !allowArrastre
      ? ''
      : remolqueObj?.enabled
        ? ` | Remolque: SI (${remolqueObj.equipo}${
            remolqueObj.descripcion ? `: ${remolqueObj.descripcion}` : ''
          }${remolqueObj.identificacion ? ` - ${remolqueObj.identificacion}` : ''})`
        : ' | Remolque: NO';

    const resumen = `Chofer: ${driver || ''} | Vehículo: ${vehicle || ''} | Km: ${km || ''} | Hs: ${
      hs || ''
    }${remolqueText} | Obs: ${observations || ''}`;

    const vehiculo_snapshot = selectedVehicle
      ? {
          id: selectedVehicle.id,
          patente: selectedVehicle.patente,
          num_int: selectedVehicle.num_int,
          funcion: selectedVehicle.funcion,
          sector: selectedVehicle.sector,
          caracteristicas_equipo: selectedVehicle.caracteristicas_equipo,
          marca: selectedVehicle.marca,
          modelo: selectedVehicle.modelo,
        }
      : null;

    const novedades = {
      checklist_full: sections,
      checklist_visible: visibleSections,
      rules: checklistRules,
      vehiculo_snapshot,
      remolque: remolqueObj,
    };

    const { error } = await createShiftChange({
      turno: 'otro',
      inicio,
      fin: null,
      entregado_email: driverEmail || driver || null,
      recibido_email: null,
      resumen,
      novedades,
    });

    setSaving(false);

    if (error) {
      console.error('Error guardando cambio de turno', error);
      alert('No se pudo guardar el cambio de turno. Revisa permisos/RLS en "cambios_turno".');
      return;
    }

    onBack();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-blue-600">Cambio de Turno</h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-6">DATOS DEL CAMBIO DE TURNO</h2>

        {errorVehiculos && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            {errorVehiculos}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Fecha */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">Fecha (fecha/hs/min)</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-grow px-3 py-2 border border-slate-300 rounded text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                className="w-20 px-1 py-2 border border-slate-300 rounded text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Hs.</option>
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={i.toString().padStart(2, '0')}>
                    {i.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
              <select
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                className="w-20 px-1 py-2 border border-slate-300 rounded text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Min.</option>
                {Array.from({ length: 60 }).map((_, i) => (
                  <option key={i} value={i.toString().padStart(2, '0')}>
                    {i.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chofer */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">Chofer:</label>
            <input
              type="text"
              value={driver}
              onChange={(e) => setDriver(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Se carga con el usuario logueado"
            />
          </div>

          {/* Vehículo */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">Vehículo que entrega</label>
            <input
              type="text"
              value={vehicleSearch}
              onChange={(e) => setVehicleSearch(e.target.value)}
              placeholder="Filtrar por número interno"
              className="w-full h-9 px-3 border border-slate-300 rounded text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar</option>
              {filteredVehicles.map((v) => (
                <option key={v.id} value={v.patente || v.id}>
                  {v.patente} {v.marca ? `- ${v.marca}` : ''} {v.modelo ? `(${v.modelo})` : ''}{' '}
                  {v.num_int ? `| Interno ${v.num_int}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Remolque (solo si allowArrastre) */}
          {selectedVehicle && checklistRules.allowArrastre && (
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Remolque</label>

              <select
                value={remolqueEquipo}
                onChange={(e) => setRemolqueEquipo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {REMOLQUE_OPCIONES.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>

              {remolqueEquipo === 'Otro' && (
                <input
                  type="text"
                  value={remolqueDesc}
                  onChange={(e) => setRemolqueDesc(e.target.value)}
                  placeholder="Descripción del equipo (otro)"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

              {remolqueEquipo !== '' && (
                <input
                  type="text"
                  value={remolqueId}
                  onChange={(e) => setRemolqueId(e.target.value)}
                  placeholder="Identificación (patente / interno / serie) (opcional)"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          )}

          {/* Km */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              Km de la unidad <span className="font-normal text-slate-400 text-xs">[Ingrese un nro. entero]</span>
            </label>
            <input
              type="number"
              value={km}
              onChange={(e) => setKm(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej. 1000"
            />
          </div>

          {/* Hs */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              Hs. de la unidad <span className="font-normal text-slate-400 text-xs">[Ingrese un nro. entero]</span>
            </label>
            <input
              type="number"
              value={hs}
              onChange={(e) => setHs(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej. 300"
            />
          </div>
        </div>
      </div>

      <div className="bg-rose-100 border-l-4 border-rose-500 p-4 rounded text-rose-800 text-sm font-medium">
        Atención! Los estados de cada ítem estan predefinidos (BUENO, NO APLICA) por defecto para facilitar la carga. Tenga
        en cuenta de cambiar los estados necesarios.
      </div>

      <div className="space-y-6">
        {visibleSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold w-2/3">
                    {section.title === 'Motobomba y control de pozo'
                      ? 'Control de pozo, Motobomba y HO'
                      : section.title === 'Cargas Generales' && checklistRules.showCargasSolidas
                        ? 'Cargas Sólidas'
                        : section.title}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold w-1/3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {section.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{item.item}</td>
                    <td className="px-6 py-4">
                      <select
                        value={item.status}
                        onChange={(e) => handleChecklistChange(sectionIndex, item.id, e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Bueno">Bueno</option>
                        <option value="Malo">Malo</option>
                        <option value="No Aplica">No Aplica</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-sm font-bold text-slate-700 mb-4">Observaciones</h2>
        <textarea
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          className="w-full h-32 px-3 py-2 border border-slate-300 rounded text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="flex items-center gap-4 pt-4 pb-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 px-6 py-3 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors font-medium text-center disabled:opacity-60"
        >
          {saving ? 'Guardando...' : 'Cargar cambio de turno'}
        </button>
        <button
          onClick={onBack}
          className="flex-1 px-6 py-3 bg-red-400 text-white rounded-md hover:bg-red-500 transition-colors font-medium text-center"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default ShiftChangeForm;
