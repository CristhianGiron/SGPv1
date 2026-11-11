/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          formConfig.js
 * @fecha         2026-11-11 10:29:41
 * @nota          Implementa el componente formConfig de la interfaz del SGP.
 */



export const QUESTION_TYPES = [
  ['OPEN_TEXT', 'Respuesta abierta'],
  ['SINGLE_CHOICE', 'Opción única'],
  ['MULTIPLE_CHOICE', 'Selección múltiple'],
  ['YES_NO', 'Sí / No'],
  ['SCALE', 'Escala'],
  ['NUMBER', 'Número'],
];

export const TARGET_ROLES = [
  ['INSTITUTIONAL_TUTOR', 'Tutor institucional'],
  ['INSTITUTION_DIRECTOR', 'Directora de la institución'],
  ['STUDENT_SELF', 'Estudiante'],
];

export const FORM_MODES = {
  interviews: {
    eyebrow: 'Prácticas',
    title: 'Entrevistas',
    description: 'Crea entrevistas para la institución receptora, registra respuestas y guarda la interpretación del estudiante.',
    singular: 'entrevista',
    plural: 'entrevistas',
    mineTab: 'Mis entrevistas',
    createTab: 'Crear entrevista',
    createdTitle: 'Entrevistas creadas',
    assignedTitle: 'Mis entrevistas asignadas',
    emptyText: 'Aún no hay entrevistas registradas.',
    createEndpoint: '/api/practice-forms',
    listEndpoint: '/api/practice-forms/me',
    managedEndpoint: '/api/practice-forms/managed',
    showAssigned: true,
    selfAnswered: false,
  },
  observations: {
    eyebrow: 'Prácticas',
    title: 'Fichas de observación',
    description: 'Crea y responde fichas de observación para registrar información directamente desde tu práctica.',
    singular: 'ficha de observación',
    plural: 'fichas de observación',
    mineTab: 'Mis fichas',
    createTab: 'Crear ficha',
    createdTitle: 'Fichas de observación creadas',
    assignedTitle: '',
    emptyText: 'Aún no hay fichas de observación registradas.',
    createEndpoint: '/api/practice-forms/observations',
    listEndpoint: '/api/practice-forms/observations/me',
    managedEndpoint: '/api/practice-forms/observations/managed',
    showAssigned: false,
    selfAnswered: true,
  },
};

export const CHOICE_TYPES = new Set(['SINGLE_CHOICE', 'MULTIPLE_CHOICE']);

export const choiceLabelClass = 'inline-flex min-h-[2.45rem] cursor-pointer items-center gap-2 rounded-lg border border-field-border bg-panel px-3 py-2 text-sm font-semibold text-body transition-colors hover:bg-field-hover dark:border-line dark:bg-surface dark:text-ink dark:hover:bg-hover-soft';

export const questionEditorCardClass = 'overflow-hidden rounded-lg border border-border bg-panel shadow-card dark:border-line dark:bg-surface';

export const questionEditorHeaderClass = 'flex flex-wrap items-center justify-between gap-3 border-b border-line-soft bg-field px-4 py-3 dark:border-line dark:bg-surface-soft';

export const printableQuestionClass = 'rounded-lg border border-border bg-panel p-4 dark:border-line dark:bg-surface practice-form-print-question print:break-inside-avoid print:[page-break-inside:avoid] print:bg-panel print:shadow-none';

