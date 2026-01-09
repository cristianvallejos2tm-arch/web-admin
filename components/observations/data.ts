export type ObservationChecklistCategory = {
  id: string;
  label: string;
  options: string[];
};

// Checklist fijo categorizado que usa el formulario para clasificar observaciones de seguridad.
export const OBSERVATION_CHECKLIST: ObservationChecklistCategory[] = [
  {
    id: 'epp',
    label: 'Equipos de protección personal',
    options: [
      'No se están utilizando',
      'Presentan desgaste',
      'Se usan de forma incorrecta',
      'No es adecuado para la tarea',
    ],
  },
  {
    id: 'posiciones',
    label: 'Posiciones de las personas',
    options: [
      'Manos y/o pies en zonas de peligro (pellizco, aprisionamiento, corte)',
      'Sobre-esfuerzos',
      'Ubicación en la línea de fuego',
      'Postura incorrecta o incómoda para la tarea',
      'Ubicarse por debajo de cargas suspendidas/caída de objetos',
    ],
  },
  {
    id: 'herramientas',
    label: 'Herramientas y equipos de trabajo',
    options: [
      'En condiciones inseguras',
      'En malas condiciones',
      'No sabe utilizar los equipos / herramientas',
      'Se usan de forma incorrecta',
      'No es adecuada/o para la tarea',
    ],
  },
  {
    id: 'normas',
    label: 'Normas y/o procedimientos',
    options: [
      'No se cumplen',
      'No es adecuado',
      'No se conocen o no se entienden',
      'No existen',
    ],
  },
  {
    id: 'frente',
    label: 'Frente de trabajo',
    options: [
      'No se confeccionó el ATS',
      'Uso insuficiente de bloqueos o barreras',
      'Falta de orden y limpieza',
      'Falta señalización y/o delimitación de zonas de peligro',
    ],
  },
  {
    id: 'reacciones',
    label: 'Reacciones de las personas',
    options: [
      'No reconoce las recomendaciones',
      'Reacciona negativamente',
      'Se muestra indiferente al momento de la observación',
      'Reconoce y corrige según lo observado',
    ],
  },
];
