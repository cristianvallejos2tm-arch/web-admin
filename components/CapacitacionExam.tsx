import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  supabase,
  fetchCapacitacionDetail,
  fetchCapacitacionIntentos,
  fetchCapacitacionPreguntas,
  submitCapacitacionAttempt,
  queueCapacitacionNotifications,
  uploadCapacitacionMaterial,
} from '../services/supabase';
import DiplomaTemplate, { DiplomaTemplateProps } from './DiplomaTemplate';

interface QuestionRow {
  id: string;
  question: string;
  answer: string;
  tipo: 'texto' | 'multiple_single' | 'multiple_multi';
  opciones: { id: string; label: string }[];
  opciones_correctas: string[];
}

interface AnswerValue {
  text?: string;
  selectedOptions?: string[];
}

interface CapacitacionSummary {
  id: string;
  titulo: string;
  introduccion?: string;
  descripcion?: string;
  tipo?: string;
  instructor?: string;
  ubicacion?: string;
  fecha?: string;
}

interface AttemptRecord {
  id: string;
  intento: number;
  score: number;
  aprobado: boolean;
  created_at?: string;
}

// Página pública para resolver el examen de una capacitación, gestiona login, intentos,
// envío de respuestas, notificaciones y generación de diploma.
const CapacitacionExam: React.FC = () => {
  const [capacitacion, setCapacitacion] = useState<CapacitacionSummary | null>(null);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [userSession, setUserSession] = useState<any>(null);
  const [attempts, setAttempts] = useState(0);
  const [attemptHistory, setAttemptHistory] = useState<AttemptRecord[]>([]);
  const [hasPassedPreviousAttempt, setHasPassedPreviousAttempt] = useState(false);
  const [popNotification, setPopNotification] = useState<
    | { type: 'success' | 'warning' | 'error'; message: string }
    | null
  >(null);

  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const capacitacionId = path.split('/')[2] ?? '';
  const portalUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return '/capacitaciones';
    }
    return `${window.location.origin}/capacitaciones`;
  }, []);

  const questionsSectionRef = useRef<HTMLDivElement | null>(null);
  const scrollToQuestions = useCallback(() => {
    questionsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const materialVideoUrl = useMemo(() => (capacitacion?.video_url ?? '').trim(), [capacitacion]);
  const materialAttachments = useMemo(
    () => (capacitacion?.archivos ?? []).filter((item) => Boolean(item?.url)),
    [capacitacion],
  );
  const hasMaterials = Boolean(materialVideoUrl || materialAttachments.length);

  const [diplomaProps, setDiplomaProps] = useState<DiplomaTemplateProps | null>(null);
  const diplomaRef = useRef<HTMLDivElement | null>(null);

  const sanitizeFilePart = useCallback((value: string) => {
    return value
      .trim()
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }, []);

  const remainingAttempts = Math.max(0, 3 - attempts);
  const currentUserId = userSession?.user?.id ?? null;

  useEffect(() => {
    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUserSession(data?.session ?? null);
    };

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserSession(session ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadAttempts = useCallback(async () => {
    if (!capacitacionId || !currentUserId) {
      setAttemptHistory([]);
      setAttempts(0);
      setHasPassedPreviousAttempt(false);
      return;
    }
    const { data } = await fetchCapacitacionIntentos(capacitacionId, currentUserId);
    if (data) {
      setAttemptHistory(data);
      setAttempts(data.length);
      setHasPassedPreviousAttempt(data.some((attempt) => attempt.aprobado));
    } else {
      setAttemptHistory([]);
      setAttempts(0);
      setHasPassedPreviousAttempt(false);
    }
  }, [capacitacionId, currentUserId]);

  useEffect(() => {
    loadAttempts();
  }, [loadAttempts]);

  useEffect(() => {
    if (!capacitacionId) return;
    const loadData = async () => {
      setLoading(true);
      const { data: detail, error: detailError } = await fetchCapacitacionDetail(capacitacionId);
      if (detailError) {
        setError('No se pudo cargar la capacitación.');
        setLoading(false);
        return;
      }
      setCapacitacion(detail ?? null);

      const { data: questionData, error: questionError } = await fetchCapacitacionPreguntas(capacitacionId);
      if (questionError) {
        setError('No se pudieron cargar las preguntas de la capacitación.');
        setQuestions([]);
      } else {
        setQuestions(
          (questionData ?? []).map((question) => ({
            id: question.id,
            question: question.pregunta,
            answer: question.respuesta,
            tipo: question.tipo ?? 'texto',
            opciones: question.opciones ?? [],
            opciones_correctas: question.opciones_correctas ?? [],
          })),
        );
      }
      setLoading(false);
    };
    loadData();
  }, [capacitacionId]);

  useEffect(() => {
    setAnswers((prev) => {
      const next = { ...prev };
      questions.forEach((question) => {
        const existing = next[question.id] ?? {};
        next[question.id] = {
          ...existing,
          text: existing.text ?? '',
          selectedOptions: existing.selectedOptions ?? [],
        };
      });
      return next;
    });
  }, [questions]);

  useEffect(() => {
    if (!popNotification) return undefined;
    const timeout = setTimeout(() => setPopNotification(null), 5000);
    return () => clearTimeout(timeout);
  }, [popNotification]);

  const handleTextAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        text: value,
      },
    }));
  };

  const handleSingleChoice = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        selectedOptions: [optionId],
      },
    }));
  };

  const handleMultiChoiceToggle = (questionId: string, optionId: string) => {
    setAnswers((prev) => {
      const current = prev[questionId]?.selectedOptions ?? [];
      const nextSelection = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      return {
        ...prev,
        [questionId]: {
          ...prev[questionId],
          selectedOptions: nextSelection,
        },
      };
    });
  };

  const triggerEmailDispatch = async () => {
    try {
      await supabase.functions.invoke('processEmailQueue');
    } catch (dispatchError) {
      console.error('No se pudo procesar la cola de correos tras aprobar', dispatchError);
    }
  };

  const captureDiplomaBlob = useCallback(async () => {
  const el = diplomaRef.current;
  if (!el) return null;

  // Esperar 2 frames para que termine de renderizar
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );

  const canvas = await html2canvas(el, {
    scale: 3, // 2 si te consume mucho
    backgroundColor: "#fff",
    useCORS: true,
    allowTaint: true,
    logging: false,
    width: el.scrollWidth,
    height: el.scrollHeight,
  });

  const imgData = canvas.toDataURL("image/png", 1.0);

  // Diploma size EXACTO
  const pdfW = 148.5;
  const pdfH = 105;

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [pdfW, pdfH],
    compress: true,
  });

  // Imagen a tamaño exacto del PDF (0 márgenes)
  pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH, undefined, "FAST");

  return pdf.output("blob");
}, []);


  const formatAnswerForDiploma = useCallback(
    (question: QuestionRow) => {
      const answerState = answers[question.id] ?? { text: '', selectedOptions: [] };
      if (question.tipo === 'texto') {
        return answerState.text ?? '';
      }
      const selection = answerState.selectedOptions ?? [];
      return selection
        .map((optionId) => question.opciones.find((option) => option.id === optionId)?.label ?? optionId)
        .join(', ');
    },
    [answers],
  );

  const createDiplomaForUser = useCallback(
    async (displayName: string, userEmail: string, scoreValue: number, courseTitle: string) => {
      const qa = questions.map((question, index) => ({
        orden: index + 1,
        pregunta: question.question,
        respuesta: formatAnswerForDiploma(question),
      }));
      const fileSlug = [
        sanitizeFilePart(courseTitle || 'capacitacion'),
        sanitizeFilePart(displayName || 'usuario'),
      ]
        .filter(Boolean)
        .join('-');
      const props: DiplomaTemplateProps = {
        nombreApellido: displayName,
        curso: courseTitle,
        calificacion: `${Math.round(scoreValue * 100)}%`,
        fechaValidez: new Date().toLocaleDateString('es-AR'),
      };
      setDiplomaProps(props);
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const blob = await captureDiplomaBlob();
      setDiplomaProps(null);
      if (!blob) return null;
      const pdfFile = new File([blob], `${fileSlug || 'diploma'}.pdf`, { type: 'application/pdf' });
      try {
        return await uploadCapacitacionMaterial(pdfFile);
      } catch (uploadError) {
        console.error('Error subiendo el diploma', uploadError);
        return null;
      }
    },
    [captureDiplomaBlob, capacitacion?.instructor, capacitacion?.tipo, capacitacion?.titulo, formatAnswerForDiploma, questions, sanitizeFilePart],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      setError('Debes iniciar sesión para registrar tus respuestas.');
      setSubmitting(false);
      return;
    }

    if (hasPassedPreviousAttempt) {
      setPopNotification({
        type: 'success',
        message: 'Ya habías aprobado esta capacitación.',
      });
      setSubmitting(false);
      return;
    }

    if (attempts >= 3) {
      setPopNotification({
        type: 'error',
        message: 'Has agotado los 3 intentos disponibles.',
      });
      setSubmitting(false);
      return;
    }

    const entries = questions.map((question) => {
      const answerState = answers[question.id] ?? { text: '', selectedOptions: [] };
      const selected = answerState.selectedOptions ?? [];
      const normalizedSelection = [...selected].sort();
      const responseLabel = normalizedSelection
        .map(
          (optionId) =>
            question.opciones.find((option) => option.id === optionId)?.label ?? optionId,
        )
        .join(', ');
      const respuestaJson = normalizedSelection.length > 0 ? JSON.stringify(normalizedSelection) : null;
      const respuestaText = question.tipo === 'texto' ? answerState.text ?? '' : responseLabel;
      return {
        pregunta_id: question.id,
        respuesta: respuestaText,
        respuesta_json: respuestaJson,
      };
    });

    const { data: attemptResult, error: submitError } = await submitCapacitacionAttempt({
      capacitacion_id: capacitacionId,
      responses: entries,
    });
    if (submitError) {
      const backendMessage = submitError.message ?? '';
      if (backendMessage.includes('NO_INSCRIPTO')) {
        setError('No estás inscripto en esta capacitación.');
      } else if (backendMessage.includes('MAX_ATTEMPTS_REACHED')) {
        setPopNotification({
          type: 'error',
          message: 'Has agotado los 3 intentos disponibles.',
        });
      } else if (backendMessage.includes('ALREADY_PASSED')) {
        setPopNotification({
          type: 'success',
          message: 'Ya habías aprobado esta capacitación.',
        });
      } else {
        setError('Hubo un error al guardar tus respuestas. Inténtalo de nuevo más tarde.');
      }
      setSubmitting(false);
      return;
    }

    const score = Number(attemptResult?.score ?? 0);
    const passed = Boolean(attemptResult?.aprobado);
    const attemptNumber = Number(attemptResult?.attempt_number ?? attempts + 1);
    const triesLeft = Number(attemptResult?.tries_left ?? Math.max(0, 3 - attemptNumber));
    await loadAttempts();

      if (passed) {
        setPopNotification({
          type: 'success',
          message: '¡Aprobaste la capacitación! 🎉',
        });
        const userEmail = sessionData.session.user.email;
        const displayName =
          sessionData.session.user.user_metadata?.full_name ??
          sessionData.session.user.user_metadata?.name ??
          userEmail ??
          'Colaborador';
        const courseTitle = capacitacion?.titulo ?? 'la capacitación';
        let diplomaUrl: string | null = null;
        if (userEmail) {
          diplomaUrl = await createDiplomaForUser(displayName, userEmail, score, courseTitle);
        }
        if (userEmail) {
          const portalUrl = `${window.location.origin}/capacitaciones/${capacitacionId}`;
          const courseTitle = capacitacion?.titulo ?? 'la capacitación';
          const diplomaSection = diplomaUrl
            ? `<p>Descargá tu diploma oficial desde <a href="${diplomaUrl}">este enlace</a>.</p>`
            : '';
          const bodySections = [
            `<p>Hola ${displayName},</p>`,
            `<p>Felicitaciones por aprobar <strong>${courseTitle}</strong>.</p>`,
            capacitacion?.introduccion ? `<p>${capacitacion.introduccion}</p>` : '',
            capacitacion?.descripcion ? `<p>${capacitacion.descripcion}</p>` : '',
            `<p>Podés repasar el contenido desde el portal: <a href="${portalUrl}">${portalUrl}</a></p>`,
            diplomaSection,
            '<p>Saludos,<br/>Equipo CAM</p>',
          ].filter(Boolean);
          const notificationEntry = {
            to_email: userEmail,
            subject: `Aprobaste ${courseTitle}`,
            body: bodySections.join(''),
          };
          const { error: notificationError } = await queueCapacitacionNotifications([notificationEntry]);
          if (notificationError) {
            console.error('Error al notificar aprobación', notificationError);
          } else {
            await triggerEmailDispatch();
          }
        }
      } else {
        setPopNotification({
          type: attemptNumber >= 3 ? 'error' : 'warning',
          message:
          attemptNumber >= 3
            ? 'Desaprobaste la capacitación y agotaste los intentos.'
            : `Desaprobaste la capacitación. Te quedan ${triesLeft} intento${triesLeft === 1 ? '' : 's'}.`,
      });
    }

      setMessage(
        passed
          ? 'Tus respuestas fueron guardadas correctamente. Te enviamos el resumen por correo.'
          : 'Tus respuestas fueron guardadas correctamente.',
      );
    setSubmitting(false);
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthLoading(true);
    setLoginError('');

    const { error: loginErr, data } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    });

    if (loginErr) {
      setLoginError('Credenciales inválidas');
      setAuthLoading(false);
      return;
    }

    setUserSession(data?.session ?? null);
    setAuthLoading(false);
  };

  if (!capacitacionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">El enlace de la capacitación es inválido o está incompleto.</p>
      </div>
    );
  }

  const loggedIn = !!userSession?.user;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-lg">
          <h1 className="text-2xl font-semibold text-slate-900">{capacitacion?.titulo ?? 'Capacitación'}</h1>
          <p className="text-sm text-slate-500">{capacitacion?.introduccion}</p>
          {capacitacion?.descripcion && <p className="mt-3 text-sm text-stone-600">{capacitacion.descripcion}</p>}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {capacitacion?.tipo && (
              <article className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                <p className="text-xs uppercase text-slate-400">Tipo</p>
                <p className="text-sm font-semibold text-stone-900">{capacitacion.tipo}</p>
              </article>
            )}
            {capacitacion?.instructor && (
              <article className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                <p className="text-xs uppercase text-slate-400">Instructor</p>
                <p className="text-sm font-semibold text-stone-900">{capacitacion.instructor}</p>
              </article>
            )}
            {capacitacion?.fecha && (
              <article className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                <p className="text-xs uppercase text-slate-400">Fecha</p>
                <p className="text-sm font-semibold text-stone-900">
                  {new Date(capacitacion.fecha).toLocaleString('es-AR')}
                </p>
              </article>
            )}
          </div>
        </div>

        {hasMaterials && (
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Contenido previo al examen</p>
              <h2 className="text-lg font-semibold text-stone-900">Material recomendado</h2>
            </div>
            {materialVideoUrl && (
              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                <p className="text-xs text-slate-500">Video / recurso principal</p>
                <a
                  href={materialVideoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-amber-600 hover:underline"
                >
                  {materialVideoUrl}
                </a>
              </div>
            )}
            {materialAttachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">Archivos adjuntos</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {materialAttachments.map((attachment, index) => (
                    <a
                      key={`${attachment.url}-${index}`}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-2xl border border-stone-200 px-4 py-3 text-sm font-semibold text-stone-900 transition hover:border-amber-300"
                    >
                      <span>{attachment.name || `Material ${index + 1}`}</span>
                      <span className="text-xs text-amber-500">Abrir</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={scrollToQuestions}
                className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-amber-500/30 hover:bg-amber-600 transition"
              >
                Realizar examen
              </button>
            </div>
          </div>
        )}

        {popNotification && (
          <div
            className={`rounded-2xl px-4 py-3 text-sm font-medium ${
              popNotification.type === 'success'
                ? 'bg-emerald-50 text-emerald-700'
                : popNotification.type === 'warning'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-rose-50 text-rose-700'
            }`}
          >
            {popNotification.message}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            Cargando preguntas del examen...
          </div>
        ) : (
          <>
            {!loggedIn && (
              <div className="bg-white rounded-3xl border border-stone-200 p-5 space-y-3">
                <p className="text-sm text-slate-500">Iniciá sesión para registrar tus respuestas.</p>
                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wide">Email</label>
                    <input
                      type="email"
                      value={loginForm.email}
                      onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                      className="w-full rounded-2xl border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wide">Contraseña</label>
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                      className="w-full rounded-2xl border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full rounded-2xl bg-slate-900 text-white py-2 text-sm font-semibold hover:bg-slate-800 transition disabled:opacity-50"
                  >
                    {authLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                  </button>
                  {loginError && <p className="text-xs text-red-600">{loginError}</p>}
                </form>
              </div>
            )}

            {loggedIn && (
              <>
                {attemptHistory.length > 0 && (
                  <p className="text-xs text-stone-500">
                    Intentos usados: {attempts}/3{' '}
                    {hasPassedPreviousAttempt
                      ? '(aprobaste)'
                      : attempts >= 3
                        ? '(intentos agotados)'
                        : `(disponibles: ${remainingAttempts})`}
                  </p>
                )}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {questions.map((question, index) => {
                    const answerState = answers[question.id] ?? { text: '', selectedOptions: [] };
                    const selectedOptions = answerState.selectedOptions ?? [];
                    const opciones = question.opciones ?? [];
                    return (
                      <div key={question.id} className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs uppercase tracking-wide text-slate-400">Pregunta {index + 1}</p>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">{question.question}</p>
                        {question.tipo === 'texto' && (
                          <textarea
                            value={answerState.text ?? ''}
                            onChange={(event) => handleTextAnswerChange(question.id, event.target.value)}
                            rows={4}
                            className="w-full rounded-2xl border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                            placeholder="Escribí tu respuesta..."
                            required
                          />
                        )}
                        {(question.tipo === 'multiple_single' || question.tipo === 'multiple_multi') && (
                          <div className="space-y-2">
                            {opciones.length === 0 && (
                              <p className="text-xs text-stone-400">Esta pregunta no tiene opciones configuradas.</p>
                            )}
                            {opciones.map((option) => (
                              <label
                                key={option.id}
                                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-stone-200 px-3 py-2 text-sm text-stone-600 transition hover:border-amber-300"
                              >
                                <input
                                  type={question.tipo === 'multiple_multi' ? 'checkbox' : 'radio'}
                                  name={`question-${question.id}`}
                                  checked={
                                    question.tipo === 'multiple_multi'
                                      ? selectedOptions.includes(option.id)
                                      : selectedOptions.length > 0 && selectedOptions[0] === option.id
                                  }
                                  onChange={() =>
                                    question.tipo === 'multiple_multi'
                                      ? handleMultiChoiceToggle(question.id, option.id)
                                      : handleSingleChoice(question.id, option.id)
                                  }
                                  className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                                />
                                <span>{option.label}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {message && <p className="text-sm text-emerald-600">{message}</p>}
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <button
                    type="submit"
                    disabled={submitting || questions.length === 0}
                    className="w-full rounded-2xl bg-amber-500 text-white py-2 text-sm font-semibold hover:bg-amber-600 transition disabled:opacity-50"
                  >
                    {submitting ? 'Guardando respuestas...' : 'Enviar respuestas'}
                  </button>
                </form>
              </>
            )}
          </>
        )}

        <div className="text-center">
          <a href={portalUrl} className="text-sm text-slate-500 hover:underline">
            Volver al listado de capacitaciones
          </a>
        </div>
        {diplomaProps && (
          <div
            ref={diplomaRef}
            style={{
            position: 'fixed',
            left: '-99999px',
            top: 0,
            width: '148.5mm',
            height: '105mm',
            pointerEvents: 'none',
            opacity: 1,
            zIndex: -1,
            overflow: 'hidden',
            background: '#fff',
    }}
  >
            <DiplomaTemplate {...diplomaProps} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CapacitacionExam;
