/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          format.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Proporciona las funciones de format utilizadas por la interfaz del SGP.
 */

export function joinText(...values) {
  return values.filter(Boolean).join(' ').trim();
}

export function formatRole(role) {
  return formatEnum(role.replace('ROLE_', ''));
}

export function formatBytes(value) {
  if (!value && value !== 0) {
    return '-';
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function prettyJson(value) {
  return JSON.stringify(value, null, 2);
}

export function firstValue(record, keys) {
  for (const key of keys) {
    if (record?.[key] !== undefined && record?.[key] !== null && record?.[key] !== '') {
      return record[key];
    }
  }

  return '-';
}

export function formatEnum(value) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  const normalized = String(value).trim();
  const labels = {
    MONDAY: 'Lunes',
    TUESDAY: 'Martes',
    WEDNESDAY: 'Miércoles',
    THURSDAY: 'Jueves',
    FRIDAY: 'Viernes',
    SATURDAY: 'Sábado',
    SUNDAY: 'Domingo',
    ABSENT: 'Ausente',
    ACTIVE: 'Activo',
    ADMIN: 'Administrador',
    ANSWERED: 'Respondido',
    APPROVED: 'Aprobado',
    ARCHIVED: 'Archivada',
    COMPLETED: 'Concluida',
    DIRECTOR_PRACTICAS: 'Director de prácticas',
    DIRECTORA_INSTITUCION: 'Directora de institución',
    DRAFT: 'Borrador',
    ENABLED: 'Habilitado',
    ESCUELA: 'Escuela',
    ESTUDIANTE: 'Estudiante',
    FINAL_REPORT: 'Informe final',
    INACTIVE: 'Inactivo',
    INSTITUTION_DIRECTOR: 'Directora de institución',
    INSTITUTIONAL_TUTOR: 'Tutor institucional',
    INTERVIEW: 'Entrevista',
    LOCKED: 'Bloqueado',
    MULTIPLE_CHOICE: 'Selección múltiple',
    NEEDS_CORRECTION: 'Necesita corrección',
    NUMBER: 'Número',
    OBSERVATION: 'Ficha de observación',
    OBSERVACION: 'Observación',
    ELABORACION: 'Elaboración',
    PUBLICO: 'Público',
    OPEN_TEXT: 'Respuesta abierta',
    PENDING: 'Pendiente',
    PRESENT: 'Presente',
    LATE: 'Atraso',
    JUSTIFIED: 'Falta justificada',
    REJECTED: 'Rechazado',
    ROLE_ADMIN: 'Administrador',
    ROLE_DIRECTOR_PRACTICAS: 'Director de prácticas',
    ROLE_DIRECTORA_INSTITUCION: 'Directora de institución',
    ROLE_ESTUDIANTE: 'Estudiante',
    ROLE_TUTOR_INSTITUCIONAL: 'Tutor institucional',
    ROLE_TUTOR_PRACTICAS: 'Tutor de prácticas',
    SCALE: 'Escala',
    SENT: 'Enviado',
    SINGLE_CHOICE: 'Opción única',
    STUDENT_SELF: 'Estudiante',
    SUBMITTED: 'Enviado a revisión',
    TUTOR_INSTITUCIONAL: 'Tutor institucional',
    TUTOR_PRACTICAS: 'Tutor de prácticas',
    UNLOCKED: 'Desbloqueado',
    YES_NO: 'Sí / No',
  };

  if (labels[normalized]) {
    return labels[normalized];
  }

  return normalized
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

export function formatDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-EC', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
}

export function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-EC', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function labelFromKey(key) {
  // Etiquetas visibles del detalle y tablas: agrega aquí el nombre legible
  // cuando un campo nuevo del documento/reporte se vea con una etiqueta fea.
  // Esto no muestra ni oculta campos; solo cambia cómo se leen en pantalla.
  const labels = {
    degreeTitle: 'Titulación',
    completedHours: 'Horas de práctica realizadas',
    completedMinutes: 'Minutos adicionales (0 a 59)',
    reportDate: 'Fecha del informe institucional',
    letterheadImageUrl: 'Membrete institucional',
    studentFullName: 'Nombre del estudiante',
    studentEmail: 'Correo del estudiante',
    studentPhone: 'Teléfono del estudiante',
    educationalInstitutionName: 'Institución educativa',
    educationalInstitutionCode: 'Código de la institución',
    educationalInstitutionAddress: 'Dirección de la institución',
    educationalInstitutionPhone: 'Teléfono de la institución',
    educationalInstitutionEmail: 'Correo de la institución',
    title: 'Título',
    description: 'Descripción',
    presentation: 'Presentación',
    objectives: 'Objetivos',
    methodology: 'Metodología',
    conclusions: 'Conclusiones',
    recommendations: 'Recomendaciones',
    resources: 'Recursos',
    legalResources: 'Recursos legales',
    humanResources: 'Recursos humanos',
    technologicalResources: 'Recursos tecnológicos',
    physicalResources: 'Recursos físicos',
    antecedents: 'Antecedentes',
    observations: 'Observaciones',
    notes: 'Notas',
    feedback: 'Retroalimentación',
    approval: 'Aprobación',
    developmentMode: 'Modalidad',
    learningObjectives: 'Objetivos de aprendizaje',
    teacherName: 'Docente',
    startTime: 'Hora de inicio',
    endTime: 'Hora de finalización',
    dayOfWeek: 'Día de la semana',
    periods: 'Períodos programados',
    attendances: 'Asistencias',
    totalTime: 'Tiempo total',
    scheduledDayOfWeek: 'Día programado',
    scheduledStartTime: 'Hora de inicio programada',
    scheduledEndTime: 'Hora de finalización programada',
    attendanceDate: 'Fecha de asistencia',
    place: 'Lugar',
    scheduledBy: 'Programado por',
    registeredBy: 'Registrado por',
    registeredAt: 'Fecha de registro',
    totalMinutes: 'Tiempo en minutos',
    status: 'Estado',
    enrollmentId: 'Inscripción',
    authorId: 'Autor',
    reviewedAt: 'Fecha de revisión',
    approvedAt: 'Fecha de aprobación',
    activityWeeks: 'Actividades por semana',
    weekNumber: 'Número de semana',
    startDate: 'Fecha de inicio',
    endDate: 'Fecha de finalización',
    activities: 'Actividades de la semana',
    scheduleWeeks: 'Cronograma semanal',
    scheduledActivities: 'Actividades planificadas',
    teacherCount: 'Docentes',
    studentCount: 'Estudiantes',
    studentUsername: 'Usuario del estudiante',
    studentIdentification: 'Identificacion del estudiante',
    courseName: 'Paralelo',
    academicPeriod: 'Período académico',
    subjectDenomination: 'Denominacion de la asignatura',
    mission: 'Mision',
    vision: 'Vision',
    institutionalValues: 'Valores institucionales',
    groupId: 'Grupo',
    groupName: 'Grupo',
    curricularOrganizationUnit: 'Unidad de organización curricular',
    integrativeKnowledgeProject: 'Proyecto integrador de saberes',
    practiceType: 'Tipo de práctica',
    generalObjective: 'Objetivo general',
    specificObjective1: 'Objetivo específico 1',
    specificObjective2: 'Objetivo específico 2',
    specificObjective3: 'Objetivo específico 3',
    feedbackHistory: 'Historial de retroalimentación',
    accreditationFeedback: 'Retroalimentación de acreditación',
    activitiesFeedback: 'Retroalimentación de actividades',
    approvalFeedback: 'Retroalimentación de aprobación',
    conclusionsFeedback: 'Retroalimentación de conclusiones',
    directorActivitiesFeedback: 'Retroalimentación de actividades del director',
    directorAntecedentsFeedback: 'Retroalimentación de antecedentes del director',
    directorApprovalFeedback: 'Retroalimentación de aprobación del director',
    directorConclusionsFeedback: 'Retroalimentación de conclusiones del director',
    directorGeneralInfoFeedback: 'Retroalimentación de datos generales del director',
    directorObjectiveFeedback: 'Retroalimentación de objetivo del director',
    directorRecommendationsFeedback: 'Retroalimentación de recomendaciones del director',
    generalInfoFeedback: 'Retroalimentación de datos generales',
    institutionalActivitiesFeedback: 'Retroalimentación de actividades institucional',
    institutionalAntecedentsFeedback: 'Retroalimentación de antecedentes institucional',
    institutionalApprovalFeedback: 'Retroalimentación de aprobación institucional',
    institutionalConclusionsFeedback: 'Retroalimentación de conclusiones institucional',
    institutionalGeneralInfoFeedback: 'Retroalimentación de datos generales institucional',
    institutionalObjectiveFeedback: 'Retroalimentación de objetivo institucional',
    institutionalRecommendationsFeedback: 'Retroalimentación de recomendaciones institucional',
    methodologyFeedback: 'Retroalimentación de metodología',
    objectivesFeedback: 'Retroalimentación de objetivos',
    practiceActivitiesFeedback: 'Retroalimentación de actividades del tutor de prácticas',
    practiceAntecedentsFeedback: 'Retroalimentación de antecedentes del tutor de prácticas',
    practiceApprovalFeedback: 'Retroalimentación de aprobación del tutor de prácticas',
    practiceConclusionsFeedback: 'Retroalimentación de conclusiones del tutor de prácticas',
    practiceGeneralInfoFeedback: 'Retroalimentación de datos generales del tutor de prácticas',
    practiceObjectiveFeedback: 'Retroalimentación de objetivo del tutor de prácticas',
    practiceRecommendationsFeedback: 'Retroalimentación de recomendaciones del tutor de prácticas',
    presentationFeedback: 'Retroalimentación de presentación',
    recommendationsFeedback: 'Retroalimentación de recomendaciones',
    resourcesFeedback: 'Retroalimentación de recursos',
    scheduleFeedback: 'Retroalimentación de cronograma',
    sectionKey: 'Seccion',
    reviewCycle: 'Ciclo de revisión',
    authorName: 'Autor',
    authorRole: 'Rol',
    documentType: 'Documento',
    message: 'Mensaje',
    answeredAt: 'Respondido',
    createdAt: 'Creado',
    deletedAt: 'Eliminado',
    enabled: 'Habilitado',
    formKind: 'Tipo de formulario',
    locked: 'Bloqueado',
    submittedAt: 'Enviado',
    targetRole: 'Respondido por',
    updatedAt: 'Actualizado',
    institutionalTutorApproved: 'Aprobación del tutor institucional',
    practiceTutorApproved: 'Aprobación del tutor de prácticas',
  };

  if (labels[key]) {
    return labels[key];
  }

  return String(key)
    .replace(/([A-Z])/g, ' $1')
    .replaceAll('_', ' ')
    .trim()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

export function formatValue(value, key = '') {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No';
  }

  if (typeof value === 'number') {
    return new Intl.NumberFormat('es-EC').format(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '-';
    }

    if (value.every((item) => typeof item !== 'object')) {
      return value.map(formatEnum).join(', ');
    }

    return `${value.length} registros`;
  }

  if (typeof value === 'object') {
    return 'Ver detalle';
  }

  if (/At$|Date$|fecha/i.test(key)) {
    return String(value).includes('T') ? formatDateTime(value) : formatDate(value);
  }

  if (/^(dayOfWeek|scheduledDayOfWeek)$/i.test(key)
      || /status|role|type|modality|regime|support|level|mode/i.test(key)) {
    return formatEnum(value);
  }

  return value;
}

export function initialsFromProfile(profile) {
  const source = joinText(profile?.names, profile?.lastNames) || profile?.username || 'SGP';
  const parts = source.split(/\s+/).filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function summarizeEntity(entity) {
  if (!entity) {
    return [];
  }

  const groups = [
    {
      title: 'Identificacion',
      keys: [
        'username',
        'studentUsername',
        'studentFullName',
        'studentIdentification',
        'cedula',
        'courseName',
        'code',
        'name',
      ],
    },
    {
      title: 'Institución',
      keys: [
        'educationalInstitutionName',
        'educationalInstitutionCode',
        'institution',
        'institutionName',
        'province',
        'canton',
        'parish',
      ],
    },
    {
      title: 'Estado y fechas',
      keys: [
        'status',
        'active',
        'locked',
        'practiceTutorApproved',
        'institutionalTutorApproved',
        'practiceDate',
        'deliveryDate',
        'submittedAt',
        'reviewedAt',
        'approvedAt',
        'createdAt',
        'updatedAt',
      ],
    },
    {
      title: 'Metricas',
      keys: [
        'capacity',
        'totalMinutes',
        'totalTime',
        'hoursCompleted',
        'activitiesCompletionPercentage',
        'averageScore',
        'totalScore',
        'fileSize',
      ],
    },
    {
      title: 'Retroalimentación',
      keys: Object.keys(entity).filter((key) => /feedback|suggestions/i.test(key)),
    },
  ];

  return groups
    .map((group) => ({
      ...group,
      items: group.keys
        .filter((key, index, keys) => keys.indexOf(key) === index)
        .filter((key) => entity[key] !== undefined && entity[key] !== null && entity[key] !== '')
        .map((key) => ({
          key,
          label: labelFromKey(key),
          value: formatValue(entity[key], key),
        })),
    }))
    .filter((group) => group.items.length > 0);
}

export function extractNestedCollections(entity) {
  if (!entity) {
    return [];
  }

  return Object.entries(entity)
    .filter(([, value]) => Array.isArray(value) && value.some((item) => typeof item === 'object'))
    .map(([key, value]) => ({
      key,
      title: labelFromKey(key),
      rows: value,
    }));
}
