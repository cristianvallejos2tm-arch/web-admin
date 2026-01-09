import React, { useMemo, useState } from 'react';
import ObservationChecklist, {
  ObservationChecklistValue,
} from './ObservationChecklist';
import { OBSERVATION_CHECKLIST } from './data';

export type ObservationFormValues = {
  area: string;
  tarea: string;
  tipo: 'acto inseguro' | 'condición insegura' | '';
  descripcion: string;
  accion: string;
  checklist: ObservationChecklistValue;
};

type Props = {
  onSave: (values: ObservationFormValues) => Promise<void>;
  onCancel?: () => void;
};

const createChecklistState = (): ObservationChecklistValue =>
  OBSERVATION_CHECKLIST.reduce<Record<string, string[]>>((acc, category) => {
    acc[category.id] = [];
    return acc;
  }, {});

// Componente controlado para crear observaciones con checklist y validaciones mínimas.
export default function ObservationForm({ onSave }: Props) {
  const [values, setValues] = useState<ObservationFormValues>({
    area: '',
    tarea: '',
    tipo: '',
    descripcion: '',
    accion: '',
    checklist: createChecklistState(),
  });
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const isValid = useMemo(
    () =>
      Boolean(values.area.trim()) &&
      Boolean(values.tarea.trim()) &&
      Boolean(values.tipo) &&
      Boolean(values.descripcion.trim()),
    [values],
  );

  const handleChange = (field: keyof ObservationFormValues, payload: string) => {
    setValues((prev) => ({ ...prev, [field]: payload }));
  };

  const handleToggleChecklist = (categoryId: string, option: string, checked: boolean) => {
    setValues((prev) => {
      const list = prev.checklist[categoryId] ?? [];
      const updated = checked ? [...list, option] : list.filter((item) => item !== option);
      return {
        ...prev,
        checklist: {
          ...prev.checklist,
          [categoryId]: updated,
        },
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid) {
      setError('Complete todos los campos obligatorios.');
      return;
    }
    setStatus('saving');
    setError(null);
    try {
      await onSave(values);
      setStatus('saved');
      setValues({
        area: '',
        tarea: '',
        tipo: '',
        descripcion: '',
        accion: '',
        checklist: createChecklistState(),
      });
      onCancel?.();
    } catch (err) {
      console.error(err);
      setStatus('error');
      setError('No se pudo guardar la observación.');
    }
  };

  return (
    <form className="space-y-4 rounded-lg border border-slate-200 bg-white px-4 py-6 shadow-sm" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4 md:flex-row">
        <label className="flex-1">
          <span className="text-sm font-semibold text-slate-700">Área / Sector / Equipo</span>
          <input
            type="text"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            value={values.area}
            onChange={(event) => handleChange('area', event.target.value)}
          />
        </label>
        <label className="flex-1">
          <span className="text-sm font-semibold text-slate-700">Tarea observada</span>
          <input
            type="text"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            value={values.tarea}
            onChange={(event) => handleChange('tarea', event.target.value)}
          />
        </label>
        <label className="flex-1">
          <span className="text-sm font-semibold text-slate-700">Tipo de observación</span>
          <select
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            value={values.tipo}
            onChange={(event) => handleChange('tipo', event.target.value)}
          >
            <option value="">Seleccionar</option>
            <option value="acto inseguro">Acto inseguro</option>
            <option value="condición insegura">Condición insegura</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex-1">
          <span className="text-sm font-semibold text-slate-700">Descripción del acto o condición</span>
          <textarea
            rows={3}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            value={values.descripcion}
            onChange={(event) => handleChange('descripcion', event.target.value)}
          />
        </label>
        <label className="flex-1">
          <span className="text-sm font-semibold text-slate-700">Acción sugerida para evitarlo</span>
          <textarea
            rows={3}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            value={values.accion}
            onChange={(event) => handleChange('accion', event.target.value)}
          />
        </label>
      </div>

      <ObservationChecklist value={values.checklist} onToggle={handleToggleChecklist} />

      <div className="flex flex-col gap-2 pt-2 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-slate-600">
          {status === 'saved' && 'Registro guardado correctamente.'}
          {status === 'error' && error}
        </div>
        <button
          type="submit"
          className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          disabled={!isValid || status === 'saving'}
        >
          {status === 'saving' ? 'Guardando...' : 'Guardar Observación'}
        </button>
      </div>
    </form>
  );
}
