import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
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
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import EvaluacionTemplate, { EvaluacionQA, EvaluacionTemplateProps } from './EvaluacionTemplate';
import {
  createCapacitacion,
  fetchCapacitacionDetail,
  fetchCapacitacionParticipants,
  fetchCapacitacionPreguntas,
  fetchCapacitacionResultados,
  fetchCapacitaciones,
  insertCapacitacionInscripciones,
  queueCapacitacionNotifications,
  updateCapacitacion,
  upsertCapacitacionPreguntas,
  fetchCapacitacionUsuarioRespuestas,
  fetchUsuariosLite,
  supabase,
  uploadCapacitacionMaterial,
} from '../services/supabase';

interface QuestionRow {
  id: string;
  question: string;
  answer: string;
  tipo: 'texto' | 'multiple_single' | 'multiple_multi';
  opciones: { id: string; label: string }[];
  opciones_correctas: string[];
}

interface AttachmentInput {
  label: string;
  name?: string;
  url?: string;
  file?: File | null;
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
  video_url?: string;
  archivos?: Array<{ name?: string; url?: string }>;
}

interface ParticipantRecord {
  id: string;
  estado: string;
  created_at: string;
  usuarios?: {
    id: string;
    nombre: string;
    email: string;
  };
}

interface UsuarioAsignado {
  id: string;
  nombre: string;
  email: string;
}

const emptyQuestion = (): QuestionRow => ({
  id: `${Date.now()}-${Math.random()}`,
  question: '',
  answer: '',
  tipo: 'texto',
  opciones: [],
  opciones_correctas: [],
});

const emptyAttachments = (): AttachmentInput[] =>
  Array.from({ length: 3 }, (_, index) => ({
    label: `Archivo ${index + 1}`,
    name: '',
    url: '',
    file: null,
  }));

// Módulo principal de capacitaciones: lista sesiones, gestiona formularios, resultados y descargas.
const Capacitaciones: React.FC = () => {
  const [trainings, setTrainings] = useState<CapacitacionSummary[]>([]);
  const [isListLoading, setIsListLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [intro, setIntro] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoLink, setVideoLink] = useState('');
  const [attachments, setAttachments] = useState<AttachmentInput[]>(emptyAttachments());
  const [questionnaireName, setQuestionnaireName] = useState('');
  const [questions, setQuestions] = useState<QuestionRow[]>([emptyQuestion()]);
  const [usuariosCatalogo, setUsuariosCatalogo] = useState<UsuarioAsignado[]>([]);
  const [selectedUsuarioIds, setSelectedUsuarioIds] = useState<string[]>([]);

  const [editingSession, setEditingSession] = useState<CapacitacionSummary | null>(null);
  const [detailSession, setDetailSession] = useState<CapacitacionSummary | null>(null);
  const [participantsSession, setParticipantsSession] = useState<CapacitacionSummary | null>(null);
  const [currentParticipants, setCurrentParticipants] = useState<ParticipantRecord[]>([]);
  const [participantResults, setParticipantResults] = useState<Record<string, any>>({});
  const [detailResults, setDetailResults] = useState<any[]>([]);
  const [detailFilter, setDetailFilter] = useState<'all' | 'approved' | 'failed'>('all');
  const [renderTemplateProps, setRenderTemplateProps] = useState<EvaluacionTemplateProps | null>(null);
  const templateRef = useRef<HTMLDivElement>(null);
  const sanitizeSlug = (text: string) =>
    text
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');

  const normalizeResultEntry = useCallback((result: any) => {
    const scoreValue = Number(result?.score ?? 0);
    const scoreNormalized = scoreValue > 1 ? scoreValue / 100 : scoreValue;
    const approvedFromFlag = [true, 't', 'true', '1', 1].includes(result?.aprobado);
    const aprobado = approvedFromFlag || scoreNormalized >= 0.7;
    return {
      ...result,
      aprobado,
      score: scoreNormalized,
    };
  }, []);

  const normalizedDetailResults = useMemo(
    () => detailResults.map((result) => normalizeResultEntry(result)),
    [detailResults, normalizeResultEntry],
  );

  const filteredDetailResults = useMemo(() => {
    if (detailFilter === 'approved') {
      return normalizedDetailResults.filter((result) => Boolean(result.aprobado));
    }
    if (detailFilter === 'failed') {
      return normalizedDetailResults.filter((result) => !result.aprobado);
    }
    
    return normalizedDetailResults;
  }, [detailFilter, normalizedDetailResults]);
  const captureTemplatePdf = useCallback(async (fileName: string) => {
    if (!templateRef.current) return;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    const canvas = await html2canvas(templateRef.current, {
      scale: 2,
      backgroundColor: '#fff',
      useCORS: true,
    });
    const pdf = new jsPDF({
      unit: 'pt',
      format: [canvas.height, canvas.width],
    });
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${fileName}.pdf`);
  }, []);
  const buildEvaluationTemplate = useCallback(
    async (userId: string, displayName: string, email?: string, normalizedResult?: any) => {
      if (!detailSession) return null;
      const { data: answersData, error: answersError } = await fetchCapacitacionUsuarioRespuestas(
        detailSession.id,
        userId,
      );
      if (answersError) {
        console.error('Error cargando respuestas del usuario', answersError);
        return null;
      }
      const sorted = (answersData ?? [])
        .map((row: any, index: number) => ({
          orden: row.orden ?? index + 1,
          pregunta: row.pregunta ?? '',
          respuestaTexto: (() => {
            const response = row.capacitaciones_respuestas?.[0];
            if (response?.respuesta) return response.respuesta;
            if (response?.respuesta_json) {
              try {
                const parsed = JSON.parse(response.respuesta_json);
                if (Array.isArray(parsed)) {
                  return parsed
                    .map((id: string) => row.opciones?.find((option: any) => option.id === id)?.label ?? id)
                    .join(', ');
                }
              } catch {
                return response.respuesta ?? '';
              }
            }
            return response?.respuesta ?? 'Sin respuesta';
          })(),
        }))
        .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
      const creatorName =
        detailSession.creador?.nombre ?? detailSession.created_by ?? 'Evaluador no especificado';
      const parts = displayName.split(' ').filter(Boolean);
      const apellidos = parts.shift() ?? displayName;
      const nombres = parts.join(' ');
      const resultEntry =
        normalizedResult ?? normalizeResultEntry(participantResults[userId] ?? {});
      const puntajeValue = Math.round(Number(resultEntry.score ?? 0) * 100);
      const resultadoLabel =
        (resultEntry.resultado as string) ?? (resultEntry.aprobado ? 'Aprobado' : 'Reprobado');
      return {
        props: {
          codigo: 'RGI-06.03',
          revision: detailSession.revisionNumero ?? '00',
          fechaDocumento: new Date(
            detailSession.updated_at ?? detailSession.created_at ?? Date.now(),
          ).toLocaleDateString('es-AR'),
          empleado: {
            apellidos,
            nombres,
            fecha: new Date().toLocaleDateString('es-AR'),
            email: email ?? '',
            puesto: detailSession.puestoTrabajo ?? '',
            tema: detailSession.titulo ?? '',
          },
          puntaje: `${puntajeValue}%`,
          resultado: resultadoLabel,
          evaluador: creatorName,
          qa: sorted.map((item) => ({
            orden: item.orden,
            pregunta: item.pregunta,
            respuesta: item.respuestaTexto,
          })),
        },
        fileName: `${sanitizeSlug(detailSession.capacitacion ?? '')}-${sanitizeSlug(displayName)}-evaluacion`,
      };
    },
    [detailSession, participantResults, sanitizeSlug, normalizeResultEntry],
  );

  const downloadEvaluation = useCallback(
    async (participant: ParticipantRecord) => {
      if (!participant?.usuarios?.id) return;
      const normalizedParticipantResult = normalizeResultEntry(
        participantResults[participant.usuarios.id] ?? {},
      );
      const result = await buildEvaluationTemplate(
        participant.usuarios.id,
        participant.usuarios.nombre ?? 'Usuario',
        participant.usuarios.email,
        normalizedParticipantResult,
      );
      if (!result) return;
      setRenderTemplateProps(result.props);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await captureTemplatePdf(result.fileName);
      setRenderTemplateProps(null);
    },
    [buildEvaluationTemplate, captureTemplatePdf],
  );

  const downloadEvaluationResult = useCallback(
    async (result: any) => {
      const userId = result.usuarios?.id ?? result.usuario_id;
      if (!userId) return;
      const displayName = result.usuarios?.nombre ?? result.usuarios?.email ?? 'Usuario';
      const email = result.usuarios?.email ?? '';
      const normalized = normalizeResultEntry(result);
      const payload = await buildEvaluationTemplate(userId, displayName, email, normalized);
      if (!payload) return;
      setRenderTemplateProps(payload.props);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await captureTemplatePdf(payload.fileName);
      setRenderTemplateProps(null);
    },
    [buildEvaluationTemplate, captureTemplatePdf],
  );
  const [mailStatus, setMailStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [mailError, setMailError] = useState('');

  // Recupera el listado general de capacitaciones para mostrar en el dashboard.
  const loadCapacitaciones = async () => {
    setIsListLoading(true);
    const { data, error } = await fetchCapacitaciones();
    setIsListLoading(false);
    if (error) {
      console.error('Error cargando capacitaciones', error);
      return;
    }
    setTrainings(data ?? []);
  };

  useEffect(() => {
    loadCapacitaciones();
    loadUsuariosCatalogo();
  }, []);

  // Carga rápida del catálogo de usuarios disponible para asignar a capacitaciones.
  const loadUsuariosCatalogo = async () => {
    const { data, error } = await fetchUsuariosLite();
    if (error) {
      console.error('Error cargando usuarios para capacitaciones', error);
      return;
    }
    setUsuariosCatalogo(data ?? []);
  };

  const totalParticipants = useMemo(
    () => trainings.reduce((acc, session) => acc + (session.inscriptos ?? 0), 0),
    [trainings],
  );

  const openSessions = useMemo(
    () =>
      trainings.filter(
        (session) =>
          session.estado === 'Abierta' ||
          (!!session.capacidad && (session.inscriptos ?? 0) < session.capacidad),
      ).length,
    [trainings],
  );

  const summaryCards = useMemo(
    () => [
      { id: 'sessions', label: 'Capacitaciones activas', value: trainings.length.toString(), icon: CalendarDays },
      { id: 'participants', label: 'Total inscriptos', value: totalParticipants.toString(), icon: Users },
      { id: 'open', label: 'Cupos disponibles', value: openSessions.toString(), icon: BookOpenCheck },
    ],
    [openSessions, totalParticipants, trainings.length],
  );

  const allUsuariosSelected =
    usuariosCatalogo.length > 0 && selectedUsuarioIds.length === usuariosCatalogo.length;

  const isQuestionValid = (question: QuestionRow) => {
    if (!question.question.trim()) return false;
    if (question.tipo === 'texto') {
      return question.answer.trim().length > 0;
    }
    const opciones = question.opciones ?? [];
    const validOptions = opciones.filter((option) => option.label.trim());
    return validOptions.length >= 2 && (question.opciones_correctas?.length ?? 0) > 0;
  };

  const canSave = useMemo(() => {
    return title.trim().length > 0 && questions.every(isQuestionValid);
  }, [title, questions]);

  const resetFormFields = () => {
    setTitle('');
    setIntro('');
    setDescription('');
    setVideoFile(null);
    setVideoLink('');
    setAttachments(emptyAttachments());
    setQuestionnaireName('');
    setQuestions([emptyQuestion()]);
    setSelectedUsuarioIds([]);
  };

  // Registra las inscripciones en la tabla y encola notificaciones por correo para los usuarios asignados.
  const assignAndNotifyUsuarios = async (capacitacionId: string) => {
    if (selectedUsuarioIds.length === 0) return;
    const assignedUsers = usuariosCatalogo.filter((user) => selectedUsuarioIds.includes(user.id));
    if (assignedUsers.length === 0) return;

    const { error: inscripcionesError } = await insertCapacitacionInscripciones(
      capacitacionId,
      assignedUsers.map((user) => user.id),
    );
    if (inscripcionesError) {
      console.error('Error registrando inscripciones de capacitacion', inscripcionesError);
    }

    const contextText = [intro, description].filter(Boolean).join(' ');
    const portalUrl = `${window.location.origin}/capacitaciones/${capacitacionId}`;
    const invitationEntries = assignedUsers
      .filter((user) => user.email)
      .map((user) => ({
        to_email: user.email,
        subject: `Nueva capacitación: ${title}`,
        body: `
          <p>Hola ${user.nombre ?? 'colaborador'},</p>
          <p>Se ha creado la capacitación <strong>${title}</strong>.</p>
          ${contextText ? `<p>${contextText}</p>` : ''}
          <p>Ingresá al portal para revisar la capacitación y realizar el examen oficial: <a href="${portalUrl}">${portalUrl}</a></p>
          <p>Saludos,<br/>Equipo CAM</p>
        `.trim(),
      }));

    if (invitationEntries.length === 0) return;

    const { error: notificationError } = await queueCapacitacionNotifications(invitationEntries);
    if (notificationError) {
      console.error('Error enviando notificaciones de capacitacion', notificationError);
    }
  };

  // Ejecuta la función remota que despacha la cola de emails desde el backend.
  const triggerEmailDispatch = async () => {
    try {
      await supabase.functions.invoke('processEmailQueue');
      return null;
    } catch (dispatchError: any) {
      console.error('No se pudo procesar la cola de mails', dispatchError);
      return dispatchError;
    }
  };

  const toggleUsuarioAsignado = (usuarioId: string) => {
    setSelectedUsuarioIds((current) =>
      current.includes(usuarioId) ? current.filter((id) => id !== usuarioId) : [...current, usuarioId],
    );
  };

  const handleSelectAllUsuarios = () => {
    if (selectedUsuarioIds.length === usuariosCatalogo.length) {
      setSelectedUsuarioIds([]);
      return;
    }
    setSelectedUsuarioIds(usuariosCatalogo.map((user) => user.id));
  };

  const startNew = () => {
    resetFormFields();
    setEditingSession(null);
    setShowForm(true);
  };

  const startEdit = async (session: CapacitacionSummary) => {
    setIsFormLoading(true);
    try {
      const { data } = await fetchCapacitacionDetail(session.id);
      const record = data ?? session;
      setEditingSession(record);
      setTitle(record.titulo ?? '');
      setIntro(record.introduccion ?? '');
      setDescription(record.descripcion ?? '');
      setVideoLink(record.video_url ?? '');
      setVideoFile(null);
      setQuestionnaireName(record.cuestionario_nombre ?? '');
      setAttachments(
        Array.from({ length: 3 }, (_, index) => {
          const existing = record.archivos?.[index];
          return {
            label: `Archivo ${index + 1}`,
            name: existing?.name ?? '',
            url: existing?.url ?? '',
            file: null,
          };
        }),
      );
      const { data: questionsData } = await fetchCapacitacionPreguntas(session.id);
      if (questionsData && questionsData.length > 0) {
        setQuestions(
          questionsData.map((question) => ({
            id: question.id,
            question: question.pregunta,
            answer: question.respuesta,
            tipo: question.tipo ?? 'texto',
            opciones: question.opciones ?? [],
            opciones_correctas: question.opciones_correctas ?? [],
          })),
        );
      } else {
        setQuestions([emptyQuestion()]);
      }
      setShowForm(true);
    } catch (error) {
      console.error('Error cargando la capacitación', error);
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleAttachmentChange = (index: number, file: File | null) => {
    setAttachments((current) =>
      current.map((attachment, idx) =>
        idx === index
          ? {
              ...attachment,
              file,
              name: file ? file.name : attachment.name,
              url: file ? '' : attachment.url,
            }
          : attachment,
      ),
    );
  };

  const addQuestion = () => setQuestions((current) => [...current, emptyQuestion()]);

  const removeQuestion = (id: string) => {
    if (questions.length === 1) return;
    setQuestions((current) => current.filter((question) => question.id !== id));
  };

  const updateQuestionField = (
    id: string,
    field: 'question' | 'answer' | 'tipo',
    value: string,
  ) => {
    setQuestions((current) =>
      current.map((question) =>
        question.id === id
          ? {
              ...question,
              [field]: value,
              ...(field === 'tipo' && value === 'texto'
                ? { opciones: [], opciones_correctas: [] }
                : {}),
            }
          : question,
      ),
    );
  };

  const addOption = (questionId: string) => {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...question,
              opciones: [...question.opciones, { id: `${Date.now()}-${Math.random()}`, label: '' }],
            }
          : question,
      ),
    );
  };

  const updateOptionLabel = (questionId: string, optionId: string, label: string) => {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...question,
              opciones: question.opciones.map((option) =>
                option.id === optionId ? { ...option, label } : option,
              ),
            }
          : question,
      ),
    );
  };

  const removeOption = (questionId: string, optionId: string) => {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...question,
              opciones: question.opciones.filter((option) => option.id !== optionId),
              opciones_correctas: question.opciones_correctas.filter((correct) => correct !== optionId),
            }
          : question,
      ),
    );
  };

  const toggleCorrectOption = (questionId: string, optionId: string) => {
    setQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId) return question;
        if (question.tipo === 'multiple_single') {
          return { ...question, opciones_correctas: [optionId] };
        }
        const next = question.opciones_correctas.includes(optionId)
          ? question.opciones_correctas.filter((correct) => correct !== optionId)
          : [...question.opciones_correctas, optionId];
        return { ...question, opciones_correctas: next };
      }),
    );
  };

  const notifyAssignedUsuarios = async (capacitacionId: string) => {
    setMailStatus('sending');
    setMailError('');
    await assignAndNotifyUsuarios(capacitacionId);
    const dispatchError = await triggerEmailDispatch();
    if (dispatchError) {
      setMailStatus('failed');
      setMailError(dispatchError.message ?? 'Error enviando correos');
      return;
    }
    setMailStatus('sent');
  };

  const prepareAttachmentsPayload = useCallback(async () => {
    const uploaded = await Promise.all(
      attachments.map(async (attachment, index) => {
        let url = attachment.url?.trim() || '';
        if (attachment.file) {
          try {
            url = await uploadCapacitacionMaterial(attachment.file);
          } catch (uploadError) {
            console.error('Error subiendo el archivo adjunto', uploadError);
          }
        }
        const name =
          attachment.name?.trim() ||
          attachment.file?.name ||
          `Archivo ${index + 1}`;
        return { name, url };
      }),
    );
    return uploaded.filter((item) => item.url);
  }, [attachments]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    setIsSaving(true);
    const attachmentsPayload = await prepareAttachmentsPayload();
    let finalVideoUrl = videoLink.trim();
    if (videoFile) {
      try {
        finalVideoUrl = await uploadCapacitacionMaterial(videoFile);
      } catch (videoUploadError) {
        console.error('Error subiendo el video', videoUploadError);
      }
    }
    const payload = {
      titulo: title,
      introduccion: intro,
      descripcion: description,
      tipo: editingSession?.tipo ?? 'Virtual',
      instructor: editingSession?.instructor ?? 'Equipo CAM',
      ubicacion: editingSession?.ubicacion ?? 'Instalaciones CAM',
      estado: editingSession?.estado ?? 'borrador',
      capacidad: editingSession?.capacidad ?? 0,
      cuestionario_nombre: questionnaireName,
      video_url: finalVideoUrl,
      archivos: attachmentsPayload,
    };
    try {
      let capacitacionId = editingSession?.id;
      if (capacitacionId) {
        await updateCapacitacion(capacitacionId, payload);
      } else {
        const { data } = await createCapacitacion(payload);
        capacitacionId = data?.id ?? null;
      }
      if (capacitacionId) {
        const questionPayload = questions.map((question) => {
          const answerValue =
            question.tipo === 'texto'
              ? question.answer
              : (question.opciones ?? [])
                  .filter((option) => (question.opciones_correctas ?? []).includes(option.id))
                  .map((option) => option.label)
                  .join(', ');
          return {
            question: question.question,
            answer: answerValue,
            tipo: question.tipo,
            opciones: (question.opciones ?? []).map((option) => ({
              id: option.id,
              label: option.label,
            })),
            opciones_correctas: question.opciones_correctas ?? [],
          };
        });
        await upsertCapacitacionPreguntas(capacitacionId, questionPayload);
        await notifyAssignedUsuarios(capacitacionId);
      }
      resetFormFields();
      setEditingSession(null);
      setShowForm(false);
      await loadCapacitaciones();
    } catch (error) {
      console.error('Error guardando la capacitación', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    resetFormFields();
    setEditingSession(null);
    setShowForm(false);
  };

  const viewDetails = async (session: CapacitacionSummary) => {
    const { data } = await fetchCapacitacionDetail(session.id);
    setDetailSession(data ?? session);
    const { data: resultados } = await fetchCapacitacionResultados(session.id);
    setDetailResults((resultados ?? []).map(normalizeResultEntry));
    setDetailFilter('all');
  };

  const viewParticipants = async (session: CapacitacionSummary) => {
    setParticipantsSession(session);
    setParticipantsLoading(true);
    const { data } = await fetchCapacitacionParticipants(session.id);
    setParticipantsLoading(false);
    setCurrentParticipants(data ?? []);

    const { data: resultados } = await fetchCapacitacionResultados(session.id);
    const scores: Record<string, any> = {};
    (resultados ?? []).forEach((result) => {
      if (result.usuario_id) {
        scores[result.usuario_id] = normalizeResultEntry(result);
      }
    });
    setParticipantResults(scores);
  };

  const closeParticipants = () => {
    setParticipantsSession(null);
    setCurrentParticipants([]);
    setParticipantResults({});
  };

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
          {mailStatus !== 'idle' && (
            <div className="px-6 py-3 text-sm flex items-center gap-2">
              {mailStatus === 'sending' && <span className="text-amber-500">Enviando correos...</span>}
              {mailStatus === 'sent' && <span className="text-emerald-600">Correos enviados</span>}
              {mailStatus === 'failed' && (
                <span className="text-rose-600">Error enviando correos: {mailError}</span>
              )}
            </div>
          )}

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
                  <p className="text-xs text-stone-400">{isListLoading ? 'Actualizando...' : 'Actualizado hace unos minutos'}</p>
                </article>
              );
            })}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-stone-900">Próximas sesiones</h2>
              <span className="text-sm text-stone-500">{isListLoading ? 'Cargando...' : 'Filtra y gestiona las planillas de preguntas'}</span>
            </div>
            <div className="grid gap-4">
              {trainings.map((session) => (
                <article
                  key={session.id}
                  className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm transition hover:border-amber-200"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm text-stone-500">{session.tipo ?? 'General'}</p>
                      <h3 className="text-2xl font-semibold text-stone-900">{session.titulo}</h3>
                      <p className="text-sm text-stone-500">{session.instructor}</p>
                    </div>
                    <div className="text-sm text-stone-500">
                      <p>{session.fecha ? new Date(session.fecha).toLocaleString() : 'Fecha por definir'}</p>
                      <p>{session.ubicacion ?? 'Ubicación por definir'}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4 text-sm">
                    <p className="text-stone-500">
                      {(session.inscriptos ?? 0)}/{session.capacidad ?? 0} inscritos
                    </p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        session.estado === 'Abierta'
                          ? 'bg-emerald-100 text-emerald-700'
                          : session.estado === 'Inscripciones cerradas'
                            ? 'bg-stone-100 text-stone-600'
                            : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {session.estado ?? 'Borrador'}
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
              {!isListLoading && trainings.length === 0 && (
                <div className="rounded-3xl border border-dashed border-stone-200 bg-white p-6 text-center text-sm text-stone-500">
                  Aún no hay capacitaciones registradas. Crea una nueva para trabajar con planillas oficiales.
                </div>
              )}
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

          {isFormLoading ? (
            <div className="rounded-3xl border border-stone-100 bg-stone-50 p-6 text-center text-sm text-stone-500">
              Cargando los datos de la capacitación...
            </div>
          ) : (
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
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-stone-900">Usuarios asignados</h2>
                  <button
                    type="button"
                    onClick={handleSelectAllUsuarios}
                    className="text-xs font-semibold text-amber-500 hover:text-amber-600 transition"
                  >
                    {allUsuariosSelected ? 'Limpiar selección' : 'Seleccionar todos'}
                  </button>
                </div>
                <p className="text-sm text-stone-500">
                  Seleccioná quién debe recibir la notificación por correo cuando guardes la capacitación.
                </p>
                <div className="max-h-56 overflow-y-auto rounded-2xl border border-stone-200 p-3">
                  {usuariosCatalogo.length === 0 ? (
                    <p className="text-xs text-stone-400">No hay usuarios registrados.</p>
                  ) : (
                    <div className="grid gap-2">
                      {usuariosCatalogo.map((usuario) => {
                        const isChecked = selectedUsuarioIds.includes(usuario.id);
                        return (
                          <label
                            key={usuario.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 px-3 py-2 text-sm text-stone-600 transition hover:border-amber-200"
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleUsuarioAsignado(usuario.id)}
                                className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                              />
                              <div>
                                <p className="text-sm font-semibold text-stone-900">{usuario.nombre}</p>
                                <p className="text-xs text-stone-500">{usuario.email}</p>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
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
                      {attachment.label}:
                      <div className="flex items-center gap-2 rounded-xl border border-stone-200 p-3 text-sm">
                        <Paperclip size={18} className="text-stone-500" />
                        <input
                          type="file"
                          onChange={(event) => handleAttachmentChange(index, event.target.files?.[0] ?? null)}
                          className="text-sm text-stone-500"
                        />
                      </div>
                      {attachment.url && (
                        <p className="text-xs text-stone-500">Archivo guardado: {attachment.url}</p>
                      )}
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
                        <label className="mt-3 block space-y-2 text-sm text-stone-600">
                          Tipo de respuesta
                          <select
                            value={question.tipo}
                            onChange={(event) => updateQuestionField(question.id, 'tipo', event.target.value)}
                            className="w-full rounded-xl border border-stone-200 px-4 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                          >
                            <option value="texto">Respuesta abierta</option>
                            <option value="multiple_single">Multiple choice (una respuesta)</option>
                            <option value="multiple_multi">Multiple choice (varias respuestas)</option>
                          </select>
                        </label>
                        {(question.tipo === 'multiple_single' || question.tipo === 'multiple_multi') && (
                          <div className="space-y-2 border border-stone-100 rounded-2xl p-3 bg-stone-50 mt-3">
                            <p className="text-xs font-semibold text-stone-600">Opciones de respuesta</p>
                            {(question.opciones ?? []).map((option) => {
                              const isCorrect = (question.opciones_correctas ?? []).includes(option.id);
                              return (
                                <div key={option.id} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={option.label}
                                    onChange={(event) => updateOptionLabel(question.id, option.id, event.target.value)}
                                    className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                                    placeholder="Texto de la opción"
                                  />
                                  <label className="inline-flex items-center gap-1 text-xs text-stone-500">
                                    <input
                                      type={question.tipo === 'multiple_multi' ? 'checkbox' : 'radio'}
                                      checked={isCorrect}
                                      name={`correct-${question.id}`}
                                      onChange={() => toggleCorrectOption(question.id, option.id)}
                                      className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    Correcta
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => removeOption(question.id, option.id)}
                                    className="text-xs text-red-500 hover:text-red-600"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              );
                            })}
                            <button
                              type="button"
                              onClick={() => addOption(question.id)}
                              className="inline-flex items-center gap-1 rounded-full border border-dashed border-amber-400 px-3 py-1 text-xs text-amber-600 hover:border-amber-600"
                            >
                              <Plus size={12} />
                              Agregar opción
                            </button>
                          </div>
                        )}
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
                  disabled={!canSave || isSaving}
                  className={`rounded-full px-6 py-2 text-sm font-semibold text-white shadow-sm transition ${
                    canSave && !isSaving
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-stone-300 cursor-not-allowed'
                  }`}
                >
                  {isSaving ? 'Guardando...' : 'Guardar capacitación'}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {detailSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Detalle</p>
                <h3 className="text-lg font-semibold text-stone-900">{detailSession.titulo}</h3>
              </div>
                <button
                  onClick={() => {
                    setDetailSession(null);
                    setDetailResults([]);
                    setDetailFilter('all');
                  }}
                  className="text-stone-400 transition hover:text-stone-900"
                >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <p className="text-sm text-stone-500">{detailSession.descripcion}</p>
              <div className="grid gap-4 md:grid-cols-2">
                <article className="rounded-2xl bg-stone-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-stone-400">Tipo</p>
                  <p className="text-sm font-semibold text-stone-900">{detailSession.tipo ?? 'General'}</p>
                </article>
                <article className="rounded-2xl bg-stone-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-stone-400">Instructor</p>
                  <p className="text-sm font-semibold text-stone-900">{detailSession.instructor ?? 'Equipo CAM'}</p>
                </article>
                <article className="rounded-2xl bg-stone-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-stone-400">Fecha</p>
                  <p className="text-sm font-semibold text-stone-900">
                    {detailSession.fecha ? new Date(detailSession.fecha).toLocaleString() : 'Por definir'}
                  </p>
                </article>
                <article className="rounded-2xl bg-stone-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-stone-400">Ubicación</p>
                  <p className="text-sm font-semibold text-stone-900">{detailSession.ubicacion ?? 'Por definir'}</p>
                </article>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    detailSession.estado === 'Abierta'
                      ? 'bg-emerald-100 text-emerald-700'
                      : detailSession.estado === 'Inscripciones cerradas'
                        ? 'bg-stone-100 text-stone-600'
                        : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {detailSession.estado ?? 'Borrador'}
                </span>
                <span className="text-xs text-stone-500">
                  {(detailSession.inscriptos ?? 0)}/{detailSession.capacidad ?? 0} inscriptos
                </span>
              </div>
              <div className="rounded-2xl border border-stone-100 p-4 text-sm text-stone-600">
                <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Breve introducción</p>
                <p className="mt-2 text-sm text-stone-700">{detailSession.introduccion}</p>
              </div>
              {detailResults.length > 0 && (
                <div className="rounded-3xl border border-stone-100 bg-slate-50 p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-700">Resultados del examen</p>
                        <div className="flex flex-wrap gap-2">
                      {[{ value: 'all', label: 'Todos' }, { value: 'approved', label: 'Aprobados' }, { value: 'failed', label: 'Reprobados' }].map((filter) => (
                        <button
                          key={filter.value}
                          type="button"
                          onClick={() => setDetailFilter(filter.value as 'all' | 'approved' | 'failed')}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                            detailFilter === filter.value
                              ? 'border-amber-400 bg-amber-100 text-amber-700'
                              : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredDetailResults.length > 0 ? (
                      <div className="grid gap-2">
                        {filteredDetailResults.map((result) => (
                          <div
                            key={`${result.usuario_id}-${result.score}-${result.total_questions}`}
                            className="flex items-center justify-between bg-white rounded-2xl border border-stone-200 p-3"
                          >
                          <div>
                            <p className="text-sm font-semibold text-stone-900">
                              {result.usuarios?.nombre ?? 'Usuario'}
                            </p>
                            <p className="text-xs text-slate-500">{result.usuarios?.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-slate-900">
                              {Math.round((Number(result.score) || 0) * 100)}%
                            </p>
                            <p
                              className={`text-xs font-semibold ${
                                result.aprobado ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {result.aprobado ? 'Aprobado' : 'Reprobado'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {result.correct_answers}/{result.total_questions} correctas
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => downloadEvaluationResult(result)}
                            className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-600 hover:border-stone-300 hover:text-stone-900"
                          >
                            Descargar evaluación
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500">No hay resultados que coincidan con este filtro.</p>
                  )}
                </div>
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setDetailSession(null);
                    setDetailResults([]);
                    setDetailFilter('all');
                  }}
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
                <h3 className="text-lg font-semibold text-stone-900">{participantsSession.titulo}</h3>
              </div>
              <button
                onClick={closeParticipants}
                className="text-stone-400 transition hover:text-stone-900"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 p-6">
              {participantsLoading ? (
                <p className="text-sm text-stone-500">Cargando participantes...</p>
              ) : currentParticipants.length === 0 ? (
                <p className="text-sm text-stone-500">No hay usuarios inscriptos aún.</p>
              ) : (
                <div className="space-y-3">
                    {currentParticipants.map((participant) => (
                      <article
                        key={participant.id}
                        className="flex items-center justify-between rounded-2xl border border-stone-100 p-4"
                      >
                      <div>
                        <p className="text-sm font-semibold text-stone-900">
                          {participant.usuarios?.nombre ?? participant.usuarios?.email}
                        </p>
                        <p className="text-xs text-stone-400">{participant.created_at}</p>
                      </div>
                          <div className="text-right">
                            <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Estado</p>
                            <p
                              className={`text-sm font-semibold ${
                                participant.estado === 'Confirmado'
                                  ? 'text-emerald-600'
                                  : participant.estado === 'Pendiente'
                                    ? 'text-amber-600'
                                    : 'text-red-600'
                              }`}
                            >
                              {participant.estado}
                            </p>
                            <p className="text-xs text-stone-400">{participant.usuarios?.email}</p>
                            <button
                              type="button"
                              onClick={() => downloadEvaluation(participant)}
                              className="mt-2 w-full rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-600 hover:border-stone-300 hover:text-stone-900"
                            >
                              Descargar evaluación
                            </button>
                            {participant.usuarios?.id && participantResults[participant.usuarios.id] && (
                              <div className="text-right mt-2 space-y-1">
                                <p className="text-xs text-stone-400">
                                  Puntaje: {Math.round((participantResults[participant.usuarios.id].score ?? 0) * 100)}%
                            </p>
                            <p
                              className={`text-xs font-semibold ${
                                participantResults[participant.usuarios.id].aprobado ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {participantResults[participant.usuarios.id].aprobado ? 'Aprobó' : 'Reprobó'}
                            </p>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeParticipants}
                  className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {renderTemplateProps && (
        <div
          ref={templateRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            transform: 'translateX(-150vw)',
            width: 840,
            pointerEvents: 'none',
            opacity: 1,
            zIndex: -1,
          }}
        >
          <EvaluacionTemplate {...renderTemplateProps} />
        </div>
      )}
    </div>
  );
};

export default Capacitaciones;

