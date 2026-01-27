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
    label: 'Posiciones del cuerpo',
    options: [
      'Manos y/o pies en zonas de peligro (pellizco, aprisionamiento, corte)',
      'Sobre-esfuerzos',
      'Postura incorrecta o incómoda',
      'Ubicarse por debajo de cargas suspendidas/caída de objetos',
    ],
  },
  {
    id: 'herramientas',
    label: 'Herramientas y equipos de trabajo',
    options: [
      'En malas condiciones',
      'Se usan de forma incorrecta',
      'No es adecuada/o para la tarea',
    ],
  },
  {
    id: 'normas',
    label: 'Procedimientos',
    options: [
      'No se cumplen',
      'No es adecuado',
      'No se conocen o no se entienden',
      'No existen',
    ],
  },
  {
    id: 'frente',
    label: 'Areas de trabajo',
    options: [
      'Falta de orden y limpieza',
      'Suelos, pasillos obstruidos, áreas en malas condiciones, etc',
      'Instalaciones en mal estado(eléctricas, gas, aire comprimido, otras.)',
      'Falta señalizacion y/o delimitación de zonas de peligro',
      'Condiciones ambientales (iluminacion, ruido, temperatura, otras)'
      
    ],
  },
  
  {
    id:'reacciones',
    label: 'Estado de la tarea',
    options:[
      'Se detuvo la tareas',
      'Situación corregida'
    ]

  },
];
