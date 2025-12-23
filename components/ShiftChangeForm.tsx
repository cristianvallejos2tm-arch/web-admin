import React, { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
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

const ShiftChangeForm: React.FC<ShiftChangeFormProps> = ({ onBack, userName }) => {
    // Form State
    const [date, setDate] = useState('2025-12-12');
    const [hour, setHour] = useState('');
    const [minute, setMinute] = useState('');
    const [driver, setDriver] = useState(userName || '');
    const [driverEmail, setDriverEmail] = useState(userName || '');
    const [vehicle, setVehicle] = useState('');
    const [km, setKm] = useState('');
    const [hs, setHs] = useState('');
    const [observations, setObservations] = useState('');
    const [vehiculos, setVehiculos] = useState<any[]>([]);
    const [errorVehiculos, setErrorVehiculos] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

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
            ]
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
            ]
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
            ]
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
            ]
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
            ]
        },
        {
            title: 'Tren Rodante',
            items: [
                { id: 39, item: 'Estado de Cubiertas.', status: 'Bueno' },
                { id: 40, item: 'Rueda/s de auxilio.', status: 'Bueno' },
            ]
        },
        {
            title: 'Equipo de radio',
            items: [
                { id: 41, item: 'Funcionamiento.', status: 'Bueno' },
            ]
        },
        {
            title: 'Control y estados de elementos y niveles',
            items: [
                { id: 42, item: 'Aceite de Motor.', status: 'Bueno' },
                { id: 43, item: 'Aceite sistema Hidraulico.', status: 'Bueno' },
                { id: 44, item: 'Agua Radiador.', status: 'Bueno' },
                { id: 45, item: 'Agua Sorrino.', status: 'Bueno' },
                { id: 46, item: 'Estado de filtros.', status: 'Bueno' },
                { id: 47, item: 'Sistema Hidraulico, Mangueras, conexiones, etc.', status: 'Bueno' },
            ]
        },
        {
            title: 'Control Bomba Vacio',
            items: [
                { id: 48, item: 'Correas.', status: 'Bueno' },
                { id: 49, item: 'Perdidas.', status: 'Bueno' },
                { id: 50, item: 'Ruidos.', status: 'Bueno' },
            ]
        },
        {
            title: 'Hidrogrúa',
            items: [
                { id: 51, item: 'Estado de Comandos/Señalética', status: 'No Aplica' },
                { id: 52, item: 'Estado de Mangueras y Estabilizadores', status: 'No Aplica' },
                { id: 53, item: 'Funcionamiento general de la Hidrogrúa', status: 'No Aplica' },
                { id: 54, item: 'Niveles de Aceites', status: 'No Aplica' },
                { id: 55, item: 'Pérdidas', status: 'No Aplica' },
            ]
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
            ]
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
            ]
        },
        {
            title: 'Porta Contenedores',
            items: [
                { id: 69, item: 'Cilindro y Pistón Hidráulicos', status: 'Bueno' },
                { id: 70, item: 'Estabilizadores', status: 'Bueno' },
                { id: 71, item: 'Estado de sistema de Izaje (Cadenas, placas, grampas, hammerlock y arco.)', status: 'Bueno' },
                { id: 72, item: 'Estado Parapeto', status: 'Bueno' },
                { id: 73, item: 'Sistema Hidráulico (Bomba, tacho y circuito)', status: 'Bueno' },
            ]
        },
        {
            title: 'Vactor',
            items: [
                { id: 74, item: 'Condiciones de la trampa del soplador', status: 'Bueno' },
                { id: 75, item: 'Estado de control', status: 'Bueno' },
                { id: 76, item: 'Estado de mangueras y circuitos hidráulicos', status: 'Bueno' },
                { id: 77, item: 'Estado del flotante y si el camión está vacio / descargado', status: 'Bueno' },
                { id: 78, item: 'Qué la bomba no esté pasada.', status: 'Bueno' },
            ]
        }
    ]);

    useEffect(() => {
        // Prefill chofer con usuario logueado y cargar vehículos
        const loadUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            let u = user;
            if (!u) {
                const { data: sessionData } = await supabase.auth.getSession();
                u = sessionData.session?.user || null;
            }
            let emailLS = '';
            let userIdFromToken: string | null = null;
            if (typeof window !== 'undefined') {
                emailLS = localStorage.getItem('user_email') || localStorage.getItem('email') || '';
                const authKey = Object.keys(localStorage).find((k) => k.includes('auth-token')) || '';
                if (authKey) {
                    try {
                        const stored = JSON.parse(localStorage.getItem(authKey) || 'null');
                        const sess = Array.isArray(stored) ? stored[0]?.currentSession : stored?.currentSession || stored?.session;
                        const emailFromToken = sess?.user?.email;
                        userIdFromToken = sess?.user?.id || null;
                        if (emailFromToken) emailLS = emailFromToken;
                    } catch (e) {
                        console.warn('No se pudo leer email de localStorage', e);
                    }
                }
            }
            if (u) {
                const nombre = (u as any)?.user_metadata?.nombre;
                const email = (u as any)?.email;
                setDriver(nombre || email || emailLS);
                setDriverEmail(email || emailLS || nombre || '');
            } else {
                if (emailLS) {
                    setDriver(emailLS);
                    setDriverEmail(emailLS);
                }
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
        if(!driver) loadUser();
        loadVehicles();
    }, []);

    useEffect(() => {
        if (userName) {
            setDriver(userName);
        }
    }, [userName]);

    const buildDateTime = () => {
        if (!date) return null;
        const h = hour || '00';
        const m = minute || '00';
        return `${date}T${h.padStart(2, '0')}:${m.padStart(2, '0')}:00`;
    };

    const handleSave = async () => {
        setSaving(true);
        const inicio = buildDateTime() || new Date().toISOString();
        const resumen = `Chofer: ${driver || ''} | Vehículo: ${vehicle || ''} | Km: ${km || ''} | Hs: ${hs || ''} | Obs: ${observations || ''}`;
        const novedades = { checklist: sections };
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

    const handleChecklistChange = (sectionIndex: number, itemId: number, newStatus: string) => {
        setSections(prevSections => {
            const newSections = [...prevSections];
            const section = newSections[sectionIndex];
            section.items = section.items.map(item =>
                item.id === itemId ? { ...item, status: newStatus } : item
            );
            return newSections;
        });
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-blue-600">Cambio de Turno</h1>

            {/* Main Form Data */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-6">DATOS DEL CAMBIO DE TURNO</h2>

                {/* Correct Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Date */}
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
                                    <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                                ))}
                            </select>
                            <select
                                value={minute}
                                onChange={(e) => setMinute(e.target.value)}
                                className="w-20 px-1 py-2 border border-slate-300 rounded text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Min.</option>
                                {Array.from({ length: 60 }).map((_, i) => (
                                    <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
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

                    {/* Vehicle */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">Vehículo que entrega</label>
                        <select
                            value={vehicle}
                            onChange={(e) => setVehicle(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Seleccionar</option>
                            {vehiculos.map((v) => (
                                <option key={v.id} value={v.patente || v.id}>
                                    {v.patente} {v.marca ? `- ${v.marca}` : ''} {v.modelo ? `(${v.modelo})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Km */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">Km de la unidad <span className="font-normal text-slate-400 text-xs">[Ingrese un nro. entero]</span></label>
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
                        <label className="block text-sm font-bold text-slate-700">Hs. de la unidad <span className="font-normal text-slate-400 text-xs">[Ingrese un nro. entero]</span></label>
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

            {/* Warning Banner */}
            <div className="bg-rose-100 border-l-4 border-rose-500 p-4 rounded text-rose-800 text-sm font-medium">
                Atención! Los estados de cada ítem estan predefinidos (BUENO, NO APLICA) por defecto para facilitar la carga. Tenga en cuenta de cambiar los estados necesarios.
            </div>

            {/* Checklist Tables */}
            <div className="space-y-6">
                {sections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-900 text-white">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-bold w-2/3">{section.title}</th>
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

            {/* Observations */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-sm font-bold text-slate-700 mb-4">Observaciones</h2>
                <textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    className="w-full h-32 px-3 py-2 border border-slate-300 rounded text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
            </div>

            {/* Actions */}
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
