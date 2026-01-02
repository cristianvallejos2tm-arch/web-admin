import React from 'react';
import { BookOpenCheck, CalendarDays, Users, ShieldCheck } from 'lucide-react';

const trainingSessions = [
  {
    id: 1,
    title: 'Capacitación en seguridad vial',
    type: 'Presencial',
    instructor: 'María López',
    date: '27/01/2026 · 09:00',
    location: 'Sala de Mandos',
    status: 'Abierta',
    participants: 24,
    capacity: 30,
  },
  {
    id: 2,
    title: 'Mantenimiento preventivo para técnicos',
    type: 'Híbrida',
    instructor: 'Rodrigo Díaz',
    date: '03/02/2026 · 14:30',
    location: 'Auditorio Principal + Teams',
    status: 'Inscripciones cerradas',
    participants: 16,
    capacity: 16,
  },
  {
    id: 3,
    title: 'Gestión de turnos y documentación',
    type: 'Virtual',
    instructor: 'Ana Torres',
    date: '10/02/2026 · 11:00',
    location: 'Plataforma LMS',
    status: 'En espera',
    participants: 8,
    capacity: 20,
  },
];

const summaryCards = [
  { id: 'sessions', label: 'Sesiones activas', value: trainingSessions.length.toString(), icon: CalendarDays },
  { id: 'participants', label: 'Participantes inscritos', value: '48', icon: Users },
  { id: 'compliance', label: 'Programas certificados', value: '12', icon: ShieldCheck },
];

const Capacitaciones: React.FC = () => {
  return (
    <div className="space-y-8">
      <section className="bg-white border border-stone-200 rounded-3xl shadow-sm shadow-stone-800/5 p-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-amber-500">
            <BookOpenCheck size={20} />
            <span className="text-xs font-semibold uppercase tracking-[0.3em]">Capacitaciones</span>
          </div>
          <h1 className="text-3xl font-semibold text-stone-900">Formación continua del equipo</h1>
          <p className="text-sm text-stone-500 max-w-2xl">
            Organiza y visualiza todas las sesiones de formación vinculadas al control vehicular, cumplimiento y
            mantenimiento preventivo. Activa recordatorios para los equipos y acelera los procesos de aprobación.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.id} className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col gap-1 shadow-sm">
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
          <span className="text-sm text-stone-500">Actualizado automáticamente</span>
        </div>
        <div className="grid gap-4">
          {trainingSessions.map((session) => (
            <article key={session.id} className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm text-stone-500">{session.type}</p>
                  <h3 className="text-2xl font-semibold text-stone-900">{session.title}</h3>
                  <p className="text-sm text-stone-500">{session.instructor}</p>
                </div>
                <div className="text-sm text-stone-500">
                  <p>{session.date}</p>
                  <p>{session.location}</p>
                </div>
                <div className="flex flex-col items-start text-sm">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      session.status === 'Abierta'
                        ? 'bg-emerald-100 text-emerald-700'
                        : session.status === 'Inscripciones cerradas'
                          ? 'bg-stone-100 text-stone-600'
                          : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {session.status}
                  </span>
                  <span className="mt-2 text-xs text-stone-400">
                    {session.participants}/{session.capacity} inscritos
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Capacitaciones;
