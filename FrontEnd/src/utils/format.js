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

  return String(value)
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
    teacherCount: 'Docentes',
    studentCount: 'Estudiantes',
    studentUsername: 'Usuario del estudiante',
    studentIdentification: 'Identificacion del estudiante',
    courseName: 'Paralelo',
    academicPeriod: 'Periodo academico',
    subjectDenomination: 'Denominacion de la asignatura',
    mission: 'Mision',
    vision: 'Vision',
    institutionalValues: 'Valores institucionales',
    groupId: 'Grupo',
    groupName: 'Grupo',
    curricularOrganizationUnit: 'Unidad de organizacion curricular',
    integrativeKnowledgeProject: 'Proyecto integrador de saberes',
    practiceType: 'Tipo de practica',
    generalObjective: 'Objetivo general',
    specificObjective1: 'Objetivo especifico 1',
    specificObjective2: 'Objetivo especifico 2',
    specificObjective3: 'Objetivo especifico 3',
    feedbackHistory: 'Historial de retroalimentacion',
    sectionKey: 'Seccion',
    reviewCycle: 'Ciclo de revision',
    authorName: 'Autor',
    authorRole: 'Rol',
    documentType: 'Documento',
    message: 'Mensaje',
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
    return value ? 'Si' : 'No';
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

  if (/status|role|type|modality|regime|support|level|mode/i.test(key)) {
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
      title: 'Institucion',
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
      title: 'Retroalimentacion',
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
