import React, { useEffect, useMemo, useState } from 'react';
import {
  supabase,
  fetchCapacitacionDetail,
  fetchCapacitacionPreguntas,
  submitCapacitacionRespuestas,
} from '../services/supabase';

interface QuestionRow {
  id: string;
  question: string;
  answer: string;
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
  estado?: string;
  capacidad?: number;
  inscriptos?: number;
  cuestionario_nombre?: string;
}

const CapacitacionExam: React.FC = () => {
  const [capacitacion, setCapacitacion] = useState<CapacitacionSummary | null>(null);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [userSession, setUserSession] = useState<any>(null);

  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const capacitacionId = path.split('/')[2] ?? '';

  const portalUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return '/capacitaciones';
    }
    return `${window.location.origin}/capacitaciones`;
  }, []);

  useEffect(() => {
    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUserSession(data?.session ?? null);
    };
    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!capacitacionId) {
      setError('Enlace de capacitación inválido');
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      const { data: detail, error: detailError } = await fetchCapacitacionDetail(capacitacionId);
      if (detailError) {
        setError('No se pudo cargar la capacitación');
        setLoading(false);
        return;
      }
      setCapacitacion(detail ?? null);

      const { data: questionData, error: questionError } = await fetchCapacitacionPreguntas(capacitacionId);
      if (questionError) {
        setError('No se pudieron cargar las preguntas de la capacitación');
        setQuestions([]);
      } else {
        setQuestions(
          (questionData ?? []).map((question) => ({
            id: question.id,
            question: question.pregunta,
            answer: question.respuesta,
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
        if (!(question.id in next)) {
          next[question.id] = '';
        }
      });
      return next;
    });
  }, [questions]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

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

    const payload = questions.map((question) => ({
      pregunta_id: question.id,
      usuario_id: sessionData.session.user.id,
      respuesta: answers[question.id] ?? '',
    }));

    const { error: submitError } = await submitCapacitacionRespuestas(payload);
    if (submitError) {
      setError('Hubo un error al guardar tus respuestas. Intentá de nuevo más tarde.');
    } else {
      setMessage('Tus respuestas fueron guardadas correctamente.');
    }
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
                <p className="text-sm font-semibold text-slate-900">{capacitacion.tipo}</p>
              </article>
            )}
            {capacitacion?.instructor && (
              <article className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                <p className="text-xs uppercase text-slate-400">Instructor</p>
                <p className="text-sm font-semibold text-slate-900">{capacitacion.instructor}</p>
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

        {loading ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            Cargando preguntas del examen...
          </div>
        ) : (
          <>
            {!loggedIn && (
              <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
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
              <form onSubmit={handleSubmit} className="space-y-5">
                {questions.map((question, index) => (
                  <div key={question.id} className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Pregunta {index + 1}</p>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{question.question}</p>
                    <textarea
                      value={answers[question.id] ?? ''}
                      onChange={(event) => handleAnswerChange(question.id, event.target.value)}
                      rows={4}
                      className="w-full rounded-2xl border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                      placeholder="Escribí tu respuesta..."
                      required
                    />
                  </div>
                ))}
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
            )}
          </>
        )}

        <div className="text-center">
          <a href={portalUrl} className="text-sm text-slate-500 hover:underline">
            Volver al listado de capacitaciones
          </a>
        </div>
      </div>
    </div>
  );
};

export default CapacitacionExam;
