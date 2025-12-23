import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { createEvaluacionDesempeno, fetchEvaluacionesDesempeno } from '../services/supabase';

const PerformanceEval: React.FC = () => {
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        fecha: '',
        operario: '',
        puesto: '',
        antiguedad: '',
        periodo: '',
    });
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [fortalezas, setFortalezas] = useState('');
    const [debilidades, setDebilidades] = useState('');
    const [saving, setSaving] = useState(false);
    const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
    const [selectedEval, setSelectedEval] = useState<any | null>(null);

    useEffect(() => {
        fetchEvaluacionesDesempeno().then(({ data }) => setEvaluaciones(data || []));
    }, []);

    const operarios = ['Operario 1', 'Operario 2', 'Operario 3'];
    const sections = [
        {
            title: 'ASPECTOS GENERALES Y RESPONSABILIDADES',
            questions: [
                '¿Ejecuta las tareas y obligaciones a su cargo, sin que necesite de continuas directivas y controles?',
                '¿Revisa la unidad antes de salir? ¿Conoce cómo debe estar la unidad para realizar las tareas?',
                '¿Cumple con las verificaciones vehiculares para anticiparse a los posibles desperfectos del equipo?',
                '¿Se preocupa por el orden y la limpieza de los equipos y de las instalaciones donde desempeña su función?.',
                '¿Utiliza los EPP e Indumentaria otorgada por la Empresa?.',
                '¿Cumple con la ejecución de la documentación requerida en forma diaria?. (ATS, Cambios de Turnos, etc.)',
                '¿Mantiene su documentación personal vigente?',
                '¿Cumple con las velocidades autorizadas por la Empresa?',
                '¿Inspecciona la documentación de la unidad que le asignan? ¿Realiza el reporte ante desvíos?',
                '¿Cumple con conductas de manejo seguro y defensivo?',
                '¿El Operario ingresa y egresa en los horarios definidos por la Empresa?',
                '¿Cumple con el NO uso de Anillos, Aros, Pelos sueltos, etc? ¿Dispone de la indumentaria, etc.?',
                '¿Toma decisiones que contribuyan al cumplimiento en tiempo de las tareas asignadas?.',
                '¿Posee clara adhesión a los objetivos de la Empresa con los cuales muestra un alto grado de compromiso, transmitiendo esta actitud hacia el entorno?.',
                '¿Organiza y planifica su trabajo en forma práctica y establece prioridades de manera de obtener una mayor eficiencia?.',
                '¿Asegurar que la prestación del servicio cumpla con las expectativas del Cliente?.',
                '¿Cumple con las actividades Asignadas por los coordinadores o supervisores para el cumplimiento de los objetivos de su área de trabajo?.',
            ],
        },
        {
            title: 'CRITERIOS',
            questions: [
                '¿Ante problemas operativos en el trabajo, se interesa por investigar las causas?',
                '¿Acepta desconocer sobre determinados temas, consulta e incorpora sugerencias?',
            ],
        },
        {
            title: 'INICIATIVA',
            questions: [
                '¿Demuestra habilidad para desarrollar de forma segura las tareas en cumplimiento de las Políticas, Normas y Procedimientos de la Empresa?',
                '¿Se muestra predispuesto a implementar cambios en sus actividades?',
                '¿Presenta aptitud y capacidad para resolver problemas durante las actividades?',
                '¿Genera clima que permita que todos los integrantes puedan participar abiertamente?.',
                '¿Muestra nuevas ideas para mejorar los procesos?.',
                '¿Se anticipa a las posibles dificultades en su área de trabajo?.',
            ],
        },
        {
            title: 'CALIDAD',
            questions: [
                '¿No comete errores durante las actividades laborales?.',
                '¿Hace uso racional de los recursos?.',
                '¿No Requiere de supervisión frecuente?.',
                '¿Se muestra profesional en el trabajo?.',
                '¿Se muestra respetuoso y amable en el trato con el resto del personal y los clientes?.',
                '¿Se encuentra capacitado y entrenado para el puesto de trabajo que le es asignado?',
            ],
        },
        {
            title: 'RELACIONES INTERPERSONALES',
            questions: [
                '¿Demuestra aptitudes personales para una interacción armónica con otras personas?.',
                '¿Mantiene una buena relación con todos los compañeros de trabajo?.',
                '¿Se muestra cortés con el personal y con sus compañeros?.',
                '¿Brinda una adecuada orientación a sus compañeros?.',
                '¿Evita los conflictos dentro del trabajo?.',
            ],
        },
        {
            title: 'TRABAJO EN EQUIPO',
            questions: [
                '¿Muestra aptitud para integrarse al equipo?.',
                '¿Se identifica fácilmente con los objetivos del equipo de trabajo?.',
            ],
        },
        {
            title: 'RESULTADOS',
            questions: [
                '¿Termina su trabajo en el tiempo solicitado?',
                '¿Cumple con las tareas que se le encomiendan en cada jornada?',
            ],
        },
        {
            title: 'ASPECTOS PARA EVALUAR SI POSEE PERSONAL A CARGO',
            questions: [
                '¿Conduce y motiva a su personal hacia el logro de los objetivos propuestos por la Empresa?',
                '¿Las directivas al personal son claras para la ejecución de la actividad?.',
                '¿Planifica las actividades con el equipo de trabajo?.',
                '¿Asigna a sus colaboradores la autoridad y responsabilidad necesarias para el cumplimiento de los objetivos y metas acordadas?.',
                '¿Realiza el seguimiento y control de las actividades?.',
                '¿Capacita y desarrolla al personal a su cargo en el ámbito laboral?.',
                '¿Obtiene la cooperación de su equipo de trabajo para lograr los resultados esperados?.',
                '¿Incorpora habilidades para aprender y anticipar necesidades de los clientes?.',
                '¿Posee iniciativas en la busqueda de actividad laboral durante la jornada?.',
                '¿Logra los objetivos fijados en la prestación del servicio, teniendo en cuenta la calidad, cantidad y tiempos esperados?.',
            ],
        },
    ];

    const handleAnswer = (idx: number, value: number) => {
        setAnswers((prev) => ({ ...prev, [idx]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        const secciones = sections.map((section, sIdx) => {
            const offset = sections.slice(0, sIdx).reduce((acc, s) => acc + s.questions.length, 0);
            const respuestas = section.questions.map((_, qIdx) => answers[offset + qIdx] || null);
            return { titulo: section.title, respuestas };
        });

        const competencias = {
            secciones,
            fortalezas,
            debilidades,
            meta: {
                fecha: form.fecha,
                operario: form.operario,
            },
        };

        await createEvaluacionDesempeno({
            evaluado_id: null, // se puede mapear a usuario real si se agrega selector
            evaluador_id: null,
            periodo: form.periodo,
            puntaje: null,
            comentarios: '',
            competencias,
            puesto_actual: form.puesto || null,
            antiguedad_anios: form.antiguedad ? Number(form.antiguedad) : null,
        });
        setSaving(false);
        setShowModal(false);
        const refreshed = await fetchEvaluacionesDesempeno();
        setEvaluaciones(refreshed.data || []);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-blue-600">Detalle evaluación de desempeño</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium text-sm"
                >
                    <Plus size={16} />
                    Agregar Nueva
                </button>
            </div>

            {/* List Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">LISTADO DE EVALUACIONES</h2>

                {evaluaciones.length === 0 ? (
                    <p className="text-slate-500 text-sm">No hay items para listar</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Fecha</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Operario</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Periodo</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Puesto</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {evaluaciones.map((ev) => (
                                    <tr key={ev.id} className="hover:bg-slate-50">
                                        <td className="px-3 py-2 text-sm text-slate-700">
                                            {ev.competencias?.meta?.fecha || new Date(ev.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-slate-700">{ev.competencias?.meta?.operario || '—'}</td>
                                        <td className="px-3 py-2 text-sm text-slate-700">{ev.periodo || '—'}</td>
                                        <td className="px-3 py-2 text-sm text-slate-700">{ev.puesto_actual || '—'}</td>
                                        <td className="px-3 py-2 text-sm text-slate-700">
                                            <button
                                                onClick={() => setSelectedEval(ev)}
                                                className="px-3 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                            >
                                                Ver detalle
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-auto p-4">
                    <div className="bg-white w-full max-w-6xl rounded-2xl shadow-xl border border-slate-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-slate-900">Detalle evaluación de desempeño</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 text-sm font-medium"
                            >
                                Cerrar
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-5">
                            <div className="border border-slate-200 rounded-lg p-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-800 mb-1">Fecha (fecha/hs/min)</label>
                                        <input
                                            type="date"
                                            value={form.fecha}
                                            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-800 mb-1">Operario</label>
                                        <select
                                            value={form.operario}
                                            onChange={(e) => setForm({ ...form, operario: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Seleccionar un operario</option>
                                            {operarios.map((opt) => (
                                                <option key={opt} value={opt}>
                                                    {opt}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-800 mb-1">Puesto actual</label>
                                        <input
                                            value={form.puesto}
                                            onChange={(e) => setForm({ ...form, puesto: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-800 mb-1">Antiguedad en la empresa</label>
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="number"
                                                value={form.antiguedad}
                                                onChange={(e) => setForm({ ...form, antiguedad: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-slate-600">Años</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-800 mb-1">Periodo de Eval.</label>
                                        <input
                                            value={form.periodo}
                                            onChange={(e) => setForm({ ...form, periodo: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="bg-emerald-100 text-emerald-800 text-sm px-4 py-2 rounded border border-emerald-200">
                                    Referencia: En una escala del 1 al 5, donde 1 (representa el nivel más bajo del requerimiento requerido) al 5 (el más alto- sobresaliente)
                                </div>

                                <div className="space-y-4">
                                    {sections.map((section, sectionIdx) => (
                                        <div key={section.title} className="border border-slate-200 rounded">
                                            <div className="bg-slate-300 px-4 py-2 font-bold text-slate-800 text-sm flex items-center justify-between">
                                                <span>{section.title}</span>
                                                <span className="w-10 h-5 bg-emerald-500 rounded-full inline-block"></span>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="border-b border-slate-300">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Pregunta</th>
                                                            <th className="px-3 py-2 text-xs font-bold text-slate-700 uppercase text-center">1<br />No Alcanza</th>
                                                            <th className="px-3 py-2 text-xs font-bold text-slate-700 uppercase text-center">2<br />Mínimo</th>
                                                            <th className="px-3 py-2 text-xs font-bold text-slate-700 uppercase text-center">3<br />Requerido</th>
                                                            <th className="px-3 py-2 text-xs font-bold text-slate-700 uppercase text-center">4<br />Superior</th>
                                                            <th className="px-3 py-2 text-xs font-bold text-slate-700 uppercase text-center">5<br />Sobresaliente</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {section.questions.map((q, idx) => {
                                                            const offset = sections.slice(0, sectionIdx).reduce((acc, s) => acc + s.questions.length, 0);
                                                            const rowIndex = offset + idx;
                                                            return (
                                                                <tr key={`${section.title}-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                                                                    <td className="px-3 py-3 text-sm text-slate-700">{q}</td>
                                                                    {[1, 2, 3, 4, 5].map((val) => (
                                                                        <td key={val} className="px-3 py-3 text-center">
                                                                            <input
                                                                                type="radio"
                                                                                name={`q-${sectionIdx}-${idx}`}
                                                                                checked={answers[rowIndex] === val}
                                                                                onChange={() => handleAnswer(rowIndex, val)}
                                                                                className="h-4 w-4 text-blue-600"
                                                                            />
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-800 mb-1">Fortalezas</label>
                                        <textarea
                                            value={fortalezas}
                                            onChange={(e) => setFortalezas(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[140px]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-800 mb-1">Debilidades</label>
                                        <textarea
                                            value={debilidades}
                                            onChange={(e) => setDebilidades(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[140px]"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 pt-2">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 text-sm font-medium disabled:opacity-60"
                                    >
                                        {saving ? 'Guardando...' : 'Guardar evaluación'}
                                    </button>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 text-sm font-medium"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedEval && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-auto p-4">
                    <div className="bg-white w-full max-w-6xl rounded-2xl shadow-xl border border-slate-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-slate-900">Detalle de evaluación</h2>
                            <button
                                onClick={() => setSelectedEval(null)}
                                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 text-sm font-medium"
                            >
                                Cerrar
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-slate-700">
                                <div>
                                    <span className="font-semibold">Fecha:</span> {selectedEval.competencias?.meta?.fecha || new Date(selectedEval.created_at).toLocaleDateString()}
                                </div>
                                <div>
                                    <span className="font-semibold">Operario:</span> {selectedEval.competencias?.meta?.operario || '—'}
                                </div>
                                <div>
                                    <span className="font-semibold">Periodo:</span> {selectedEval.periodo || '—'}
                                </div>
                                <div>
                                    <span className="font-semibold">Puesto:</span> {selectedEval.puesto_actual || '—'}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {sections.map((section, sIdx) => {
                                    const savedSection = selectedEval.competencias?.secciones?.find((s: any) => s.titulo === section.title);
                                    const respuestas = savedSection?.respuestas || [];
                                    return (
                                        <div key={section.title} className="border border-slate-200 rounded">
                                            <div className="bg-slate-300 px-4 py-2 font-bold text-slate-800 text-sm flex items-center justify-between">
                                                <span>{section.title}</span>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="border-b border-slate-300">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Pregunta</th>
                                                            <th className="px-3 py-2 text-xs font-bold text-slate-700 uppercase text-center">Respuesta</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {section.questions.map((q, idx) => (
                                                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                                                                <td className="px-3 py-3 text-sm text-slate-700">{q}</td>
                                                                <td className="px-3 py-3 text-center text-sm text-slate-800">
                                                                    {respuestas[idx] ? `${respuestas[idx]} / 5` : '—'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">Fortalezas</p>
                                    <p className="text-sm text-slate-700 border border-slate-200 rounded p-3 min-h-[100px]">
                                        {selectedEval.competencias?.fortalezas || '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">Debilidades</p>
                                    <p className="text-sm text-slate-700 border border-slate-200 rounded p-3 min-h-[100px]">
                                        {selectedEval.competencias?.debilidades || '—'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerformanceEval;
