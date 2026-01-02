import React, { useMemo, useState } from 'react';
import { BookOpenCheck, Paperclip, Plus, Video, Trash2 } from 'lucide-react';

interface QuestionRow {
  id: number;
  question: string;
  answer: string;
}

const emptyQuestion = (): QuestionRow => ({
  id: Date.now() + Math.random(),
  question: '',
  answer: '',
});

const Capacitaciones: React.FC = () => {
  const [title, setTitle] = useState('');
  const [intro, setIntro] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoLink, setVideoLink] = useState('');
  const [attachments, setAttachments] = useState<Array<File | null>>([null, null, null]);
  const [questionnaireName, setQuestionnaireName] = useState('');
  const [questions, setQuestions] = useState<QuestionRow[]>([emptyQuestion()]);

  const canSave = useMemo(() => {
    return title.trim().length > 0 && questions.every((q) => q.question.trim() && q.answer.trim());
  }, [title, questions]);

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
    });
  };

  return (
    <div className="space-y-6">
      <header className="bg-white border border-stone-200 rounded-3xl shadow-sm p-6">
        <div className="flex items-center gap-3 text-amber-500">
          <BookOpenCheck size={24} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em]">Capacitaciones</p>
            <h1 className="text-3xl font-semibold text-stone-900">Nueva capacitación</h1>
          </div>
        </div>
        <p className="mt-2 text-sm text-stone-500 max-w-3xl">
          Define el contenido, soporte de video y las planillas de preguntas que los usuarios deberán completar al
          finalizar la formación.
        </p>
      </header>

      <form className="bg-white border border-stone-200 rounded-3xl shadow-sm space-y-6 p-6" onSubmit={handleSubmit}>
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
            onClick={() => {
              setTitle('');
              setIntro('');
              setDescription('');
              setVideoFile(null);
              setVideoLink('');
              setAttachments([null, null, null]);
              setQuestionnaireName('');
              setQuestions([emptyQuestion()]);
            }}
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
    </div>
  );
};

export default Capacitaciones;
