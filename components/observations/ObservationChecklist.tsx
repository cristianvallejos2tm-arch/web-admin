import React from 'react';
import { OBSERVATION_CHECKLIST, ObservationChecklistCategory } from './data';

export type ObservationChecklistValue = Record<string, string[]>;

type Props = {
  value: ObservationChecklistValue;
  onToggle: (categoryId: string, option: string, checked: boolean) => void;
};

export default function ObservationChecklist({ value, onToggle }: Props) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      {OBSERVATION_CHECKLIST.map((category) => (
        <section key={category.id} className="divide-y divide-slate-200">
          <div className="bg-slate-900 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white">
            {category.label}
          </div>
          <div className="grid grid-cols-1 gap-2 px-4 py-3 md:grid-cols-2">
            {category.options.map((option) => {
              const checked = value[category.id]?.includes(option) ?? false;
              return (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-2 rounded border border-slate-200 px-3 py-2 text-sm transition hover:border-slate-400"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-400 text-slate-700 focus:ring-slate-500"
                    checked={checked}
                    onChange={(event) => onToggle(category.id, option, event.target.checked)}
                  />
                  <span className="text-slate-700">{option}</span>
                </label>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
