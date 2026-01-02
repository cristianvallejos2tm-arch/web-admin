import React, { useMemo, useState } from 'react';
import {
  BookOpenCheck,
  CalendarDays,
  Eye,
  Paperclip,
  Plus,
  Trash2,
  Users,
  Video,
  X,
} from 'lucide-react';

interface QuestionRow {
  id: number;
  question: string;
  answer: string;
}
interface TrainingSession {
  id: number;
  title: string;
  intro: string;
  description: string;
  date: string;
  location: string;
  type: string;
  instructor: string;
  status: string;
  participants: number;
  capacity: number;
}
interface Participant {
  id: string;
  name: string;
  role: string;
  status: 'Confirmado' | 'Pendiente' | 'Rechazado';
  since: string;
}

const emptyQuestion = (): QuestionRow => ({
  id: Date.now() + Math.random(),
  question: '',
  answer: '',
});

const trainingSessions: TrainingSession[] = [
  {
    id: 1,
    title: 'Capacitación en seguridad vial',
    intro: 'Buenas prácticas y normativa en ruta',
    description: 'Recorrido por las políticas de velocidad, uso de cinturón y señalización preventiva.',
    date: '27/01/2026 · 09:00',
    location: 'Sala de Mandos',
    type: 'Presencial',
    instructor: 'María López',
    status: 'Abierta',
    participants: 24,
    capacity: 30,
  },
  {
    id: 2,
    title: 'Mantenimiento preventivo para técnicos',
    intro: 'Revisión y documentación semanal',
    description:
      'Estrategia para inspección de sistemas críticos, registros en la planilla digital y cargas de piezas.',
    date: '03/02/2026 · 14:30',
    location: 'Auditorio Principal + Teams',
    type: 'Híbrida',
    instructor: 'Rodrigo Díaz',
    status: 'Inscripciones cerradas',
    participants: 16,
    capacity: 16,
  },
  {
    id: 3,
    title: 'Gestión de turnos y documentación',
    intro: 'Normaliza la entrega de informes',
    description:
      'Documentación obligatoria, formatos de hojas de ruta y criterios de entrega para los coordinadores de turno.',
    date: '10/02/2026 · 11:00',
    location: 'Plataforma LMS',
    type: 'Virtual',
    instructor: 'Ana Torres',
    status: 'En espera',
    participants: 8,
    capacity: 20,
  },
];
const participantsRegistry: Record<number, Participant[]> = {
  1: [
    { id: 'u101', name: 'Lucas Moreno', role: 'Operador', status: 'Confirmado', since: '12/01/2026' },
    { id: 'u102', name: 'Fernanda Ruiz', role: 'Técnico', status: 'Confirmado', since: '13/01/2026' },
    { id: 'u103', name: 'Marcos Pérez', role: 'Coordinador', status: 'Pendiente', since: '15/01/2026' },
  ],
  2: [
    { id: 'u104', name: 'Mónica Vega', role: 'Supervisor', status: 'Confirmado', since: '10/01/2026' },
    { id: 'u105', name: 'Gabriel Soto', role: 'Técnico', status: 'Confirmado', since: '11/01/2026' },
  ],
  3: [
    { id: 'u106', name: 'Daniela Costa', role: 'Operador', status: 'Pendiente', since: '09/01/2026' },
    { id: 'u107', name: 'Ignacio Funes', role: 'Analista', status: 'Confirmado', since: '14/01/2026' },
  ],
};

const Capacitaciones: React.FC = () => {
  const [title, setTitle] = useState('');
  const [intro, setIntro] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoLink, setVideoLink] = useState('');
  const [attachments, setAttachments] = useState<Array<File | null>>([null, null, null]);
  const [questionnaireName, setQuestionnaireName] = useState('');
  const [questions, setQuestions] = useState<QuestionRow[]>([emptyQuestion()]);
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(null);
  const [detailSession, setDetailSession] = useState<TrainingSession | null>(null);
  const [participantsSession, setParticipantsSession] = useState<TrainingSession | null>(null);

  const totalParticipants = useMemo(
    () => trainingSessions.reduce((acc, session) => acc + session.participants, 0),
    [],
  );
  const openSessions = useMemo(
    () => trainingSessions.filter((session) => session.participants < session.capacity).length,
    [],
  );

  const summaryCards = useMemo(
    () => [
      { id: 'sessions', label: 'Capacitaciones activas', value: trainingSessions.length.toString(), icon: CalendarDays },
      { id: 'participants', label: 'Total inscriptos', value: totalParticipants.toString(), icon: Users },
      { id: 'open', label: 'Cupos disponibles', value: openSessions.toString(), icon: BookOpenCheck },
    ],
    [totalParticipants, openSessions],
  );

  const canSave = useMemo(() => {
    return title.trim().length > 0 && questions.every((q) => q.question.trim() && q.answer.trim());
  }, [title, questions]);

  const resetFormFields = () => {
    setTitle('');
    setIntro('');
    setDescription('');
    setVideoFile(null);
    setVideoLink('');
    setAttachments([null, null, null]);
    setQuestionnaireName('');
    setQuestions([emptyQuestion()]);
  };

  const startNew = () => {
    resetFormFields();
    setEditingSession(null);
    setShowForm(true);
  };

  const startEdit = (session: TrainingSession) => {
    resetFormFields();
    setTitle(session.title);
    setIntro(session.intro);
    setDescription(session.description);
    setQuestionnaireName(`Planilla ${session.title}`);
    setEditingSession(session);
    setShowForm(true);
  };

  const handleAttachmentChange = (index: number, file: File | null) => {
    setAttachments((current) => {
      const clone = [...current];
      clone[index] = file;
      return clone;
    });
  };

  const addQuestion = () => setQuestions((current) => [...current, emptyQuestion()]);

  const removeQuestion = (id: number) => {
    if (questions.length === 1) return;
    setQuestions((current) => current.filter((q) => q.id !== id));
  };

  const updateQuestionField = (id: number, field: 'question' | 'answer', value: string) => {
    setQuestions((current) =>
      current.map((question) => (question.id === id ? { ...question, [field]: value } : question)),
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    console.log('Guardar capacitación', {
      title,
      intro,
      description,
      videoFile,
      videoLink,
      attachments,
      questionnaireName,
      questions,
      mode: editingSession ? 'edit' : 'create',
    });
    resetFormFields();
    setEditingSession(null);
    setShowForm(false);
  };

  const handleCancel = () => {
    resetFormFields();
    setEditingSession(null);
    setShowForm(false);
  };

  const viewDetails = (session: TrainingSession) => {
    setDetailSession(session);
  };

  const viewParticipants = (session: TrainingSession) => {
    setParticipantsSession(session);
  };

  const currentParticipants = participantsSession ? participantsRegistry[participantsSession.id] ?? [] : [];

  return (
    <div className="space-y-6">
      {!showForm && (
        <>
          <header className="bg-white border border-stone-200 rounded-3xl shadow-sm p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3 text-amber-500">
                <BookOpenCheck size={24} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em]">Capacitaciones</p>
                  <h1 className="text-3xl font-semibold text-stone-900">Listado de capacitaciones</h1>
                </div>
              </div>
              <p className="mt-2 text-sm text-stone-500 max-w-3xl">
                Revisa el estado de las planillas, accede a los usuarios inscriptos y arma nuevas sesiones cuando lo necesites.
              </p>
            </div>
            <button
              type="button"
              onClick={startNew}
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-amber-500/40 transition hover:bg-amber-600"
            >
              <Plus size={16} />
              Crear capacitación
            </button>
          </header>

          <section className="grid gap-4 md:grid-cols-3">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.id}
                  className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col gap-1 shadow-sm transition hover:border-amber-200"
                >
                  <div className="flex items-center gap-2 text-stone-500">
                    <Icon size={18} />
                    <span className="text-xs uppercase tracking-wide">{card.label}</span>
                  </div>
                  <p className="text-3xl font-bold text-stone-900">{card.value}</p>
                  <p className="text-xs text-stone-400">Actualizado hace unos minutos</p>
                </article>
              );
            })}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-stone-900">Próximas sesiones</h2>
              <span className="text-sm text-stone-500">Filtra y gestiona las planillas de preguntas</span>
            </div>
            <div className="grid gap-4">
              {trainingSessions.map((session) => (
                <article
                  key={session.id}
                  className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm transition hover:border-amber-200"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm text-stone-500">{session.type}</p>
                      <h3 className="text-2xl font-semibold text-stone-900">{session.title}</h3>
                      <p className="text-sm text-stone-500">{session.instructor}</p>
                    </div>
                    <div className="text-sm text-stone-500">
                      <p>{session.date}</p>
                      <p>{session.location}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4 text-sm">
                    <p className="text-stone-500">
                      {session.participants}/{session.capacity} inscritos
                    </p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        session.status === 'Abierta'
                          ? 'bg-emerald-100 text-emerald-700'
                          : session.status === 'Inscripciones cerradas'
                            ? 'bg-stone-100 text-stone-600'
                            : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => viewDetails(session)}
                      className="inline-flex items-center gap-2 rounded-full border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 transition hover:border-amber-300 hover:text-stone-900"
                    >
                      <Eye size={16} />
                      Ver detalle
                    </button>
                    <button
                      type="button"
                      onClick={() => viewParticipants(session)}
                      className="inline-flex items-center gap-2 rounded-full border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 transition hover:border-amber-300 hover:text-stone-900"
                    >
                      <Users size={16} />
                      Usuarios inscriptos
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(session)}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                    >
                      <BookOpenCheck size={16} />
                      Editar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {showForm && (
        <section className="bg-white border border-stone-200 rounded-3xl shadow-sm space-y-6 p-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 text-amber-500">
              <BookOpenCheck size={24} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em]">Capacitaciones</p>
                <h1 className="text-3xl font-semibold text-stone-900">
                  {editingSession ? 'Editar capacitación' : 'Nueva capacitación'}
                </h1>
              </div>
            </div>
            <p className="text-sm text-stone-500 max-w-3xl">
              Define el contenido, el soporte multimedia y las planillas de preguntas para que los usuarios las completen al finalizar.
            </p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-stone-900">Datos de la capacitación</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-stone-600">
                  Título:
                  <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-4 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                    placeholder="Título de la capacitación"
                  />
                </label>
                <label className="space-y-2 text-sm text-stone-600">
                  Breve introducción:
                  <textarea
                    value={intro}
                    onChange={(event) => setIntro(event.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-4 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                    rows={3}
                    placeholder="Resumen corto del objetivo de la sesión"
                  />
                </label>
              </div>
              <label className="space-y-2 text-sm text-stone-600">
                Descripción completa:
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-4 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  rows={4}
                  placeholder="Detalle el temario, duración, requisitos y destinatarios"
                />
              </label>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-stone-900">Video</h2>
              <div className="md:grid md:grid-cols-2 gap-4">
                <label className="space-y-2 text-sm text-stone-600">
                  Subir archivo MP4/MP3:
                  <div className="flex items-center gap-2 rounded-xl border border-stone-200 p-3">
                    <Video size={18} className="text-stone-400" />
                    <input
                      type="file"
                      accept="video/mp4,audio/mpeg"
                      onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)}
                      className="text-sm text-stone-500"
                    />
                  </div>
                </label>
                <label className="space-y-2 text-sm text-stone-600">
                  O pegar URL externa (YouTube, Vimeo, etc):
                  <input
                    type="url"
                    value={videoLink}
                    onChange={(event) => setVideoLink(event.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-4 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                    placeholder="https://www.youtube.com/..."
                  />
                </label>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-stone-900">Archivos adjuntos</h2>
                <span className="text-xs text-stone-400">Máx. 3 archivos</span>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {attachments.map((attachment, index) => (
                  <label key={index} className="space-y-2 text-sm text-stone-600">
                    Archivo {index + 1}:
                    <div className="flex items-center gap-2 rounded-xl border border-stone-200 p-3 text-sm">
                      <Paperclip size={18} className="text-stone-500" />
                      <input
                        type="file"
                        onChange={(event) => handleAttachmentChange(index, event.target.files?.[0] ?? null)}
                        className="text-sm text-stone-500"
                      />
                    </div>
                  </label>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div className="grid md:grid-cols-[1fr,150px] gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-stone-900">Cuestionario</h2>
                  <p className="text-xs text-stone-400">Define la plantilla que completarán los usuarios</p>
                </div>
                <label className="space-y-2 text-sm text-stone-600">
                  Nombre del cuestionario:
                  <input
                    type="text"
                    value={questionnaireName}
                    onChange={(event) => setQuestionnaireName(event.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-4 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                    placeholder="Ej. Revisión técnica mensual"
                  />
                </label>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-stone-900">Preguntas y respuestas</h3>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-600"
                  >
                    <Plus size={14} />
                    Agregar pregunta
                  </button>
                </div>
                <div className="space-y-3">
                  {questions.map((question) => (
                    <div
                      key={question.id}
                      className="rounded-2xl border border-stone-200 p-4 shadow-sm transition hover:border-amber-200"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-stone-900">Pregunta</h4>
                        <button
                          type="button"
                          onClick={() => removeQuestion(question.id)}
                          className="text-stone-400 transition hover:text-red-500"
                          aria-label="Eliminar pregunta"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <label className="mt-3 block space-y-2 text-sm text-stone-600">
                        Enunciado:
                        <input
                          type="text"
                          value={question.question}
                          onChange={(event) => updateQuestionField(question.id, 'question', event.target.value)}
                          className="w-full rounded-xl border border-stone-200 px-4 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                          placeholder="Describe la situación a evaluar"
                        />
                      </label>
                      <label className="mt-3 block space-y-2 text-sm text-stone-600">
                        Respuesta esperada:
                        <textarea
                          value={question.answer}
                          onChange={(event) => updateQuestionField(question.id, 'answer', event.target.value)}
                          className="w-full rounded-xl border border-stone-200 px-4 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                          rows={3}
                          placeholder="Describe los criterios que deben cumplirse"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-stone-100 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!canSave}
                className={`rounded-full px-6 py-2 text-sm font-semibold text-white shadow-sm transition ${
                  canSave
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-stone-300 cursor-not-allowed'
                }`}
              >
                Guardar capacitación
              </button>
            </div>
          </form>
        </section>
      )}

      {detailSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Detalle</p>
                <h3 className="text-lg font-semibold text-stone-900">{detailSession.title}</h3>
              </div>
              <button
                onClick={() => setDetailSession(null)}
                className="text-stone-400 transition hover:text-stone-900"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <p className="text-sm text-stone-500">{detailSession.description}</p>
              <div className="grid gap-4 md:grid-cols-2">
                <article className="rounded-2xl bg-stone-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-stone-400">Tipo</p>
                  <p className="text-sm font-semibold text-stone-900">{detailSession.type}</p>
                </article>
                <article className="rounded-2xl bg-stone-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-stone-400">Instructor</p>
                  <p className="text-sm font-semibold text-stone-900">{detailSession.instructor}</p>
                </article>
                <article className="rounded-2xl bg-stone-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-stone-400">Fecha</p>
                  <p className="text-sm font-semibold text-stone-900">{detailSession.date}</p>
                </article>
                <article className="rounded-2xl bg-stone-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-stone-400">Ubicación</p>
                  <p className="text-sm font-semibold text-stone-900">{detailSession.location}</p>
                </article>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    detailSession.status === 'Abierta'
                      ? 'bg-emerald-100 text-emerald-700'
                      : detailSession.status === 'Inscripciones cerradas'
                        ? 'bg-stone-100 text-stone-600'
                        : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {detailSession.status}
                </span>
                <span className="text-xs text-stone-500">
                  {detailSession.participants}/{detailSession.capacity} inscriptos
                </span>
              </div>
              <div className="rounded-2xl border border-stone-100 p-4 text-sm text-stone-600">
                <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Breve introducción</p>
                <p className="mt-2 text-sm text-stone-700">{detailSession.intro}</p>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetailSession(null)}
                  className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {participantsSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Usuarios inscriptos</p>
                <h3 className="text-lg font-semibold text-stone-900">{participantsSession.title}</h3>
              </div>
              <button
                onClick={() => setParticipantsSession(null)}
                className="text-stone-400 transition hover:text-stone-900"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 p-6">
              {currentParticipants.length === 0 ? (
                <p className="text-sm text-stone-500">No hay usuarios inscriptos aún.</p>
              ) : (
                <div className="space-y-3">
                  {currentParticipants.map((participant) => (
                    <article key={participant.id} className="flex items-center justify-between rounded-2xl border border-stone-100 p-4">
                      <div>
                        <p className="text-sm font-semibold text-stone-900">{participant.name}</p>
                        <p className="text-xs text-stone-400">{participant.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Estado</p>
                        <p
                          className={`text-sm font-semibold ${
                            participant.status === 'Confirmado'
                              ? 'text-emerald-600'
                              : participant.status === 'Pendiente'
                                ? 'text-amber-600'
                                : 'text-red-600'
                          }`}
                        >
                          {participant.status}
                        </p>
                        <p className="text-xs text-stone-400">{participant.since} - inscripción</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setParticipantsSession(null)}
                  className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Capacitaciones;
