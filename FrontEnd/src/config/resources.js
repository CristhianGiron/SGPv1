export const ROLES = [
  'ROLE_ESTUDIANTE',
  'ROLE_TUTOR_PRACTICAS',
  'ROLE_TUTOR_INSTITUCIONAL',
  'ROLE_DIRECTORA_INSTITUCION',
  'ROLE_DIRECTOR_PRACTICAS',
  'ROLE_ADMIN',
];

export const INSTITUTION_TYPES = ['ESCUELA', 'COLEGIO', 'UNIVERSIDAD', 'INSTITUTO', 'EMPRESA', 'FUNDACION'];
export const INSTITUTION_SUPPORTS = ['PUBLICO', 'PRIVADO', 'FISCOMISIONAL', 'MUNICIPAL'];
export const SCHOOL_REGIMES = ['COSTA', 'SIERRA'];
export const EDUCATION_MODALITIES = ['PRESENCIAL', 'SEMIPRESENCIAL', 'DISTANCIA', 'VIRTUAL'];

export const ENTITY_RELATIONS = {
  institutionId: {
    label: 'Institucion',
    path: '/api/institutions',
    placeholder: 'Seleccionar institucion',
  },
  educationalInstitutionId: {
    label: 'Institucion educativa',
    path: '/api/institutions',
    placeholder: 'Seleccionar institucion educativa',
  },
  facultyId: {
    label: 'Facultad',
    path: '/api/faculties',
    placeholder: 'Seleccionar facultad',
  },
  careerId: {
    label: 'Carrera',
    path: '/api/careers',
    placeholder: 'Seleccionar carrera',
  },
  academicCycleId: {
    label: 'Ciclo academico',
    path: '/api/academic-cycles',
    placeholder: 'Seleccionar ciclo academico',
  },
  gradeId: {
    label: 'Grado',
    path: '/api/grades',
    placeholder: 'Seleccionar grado',
  },
  gradeParallelId: {
    label: 'Paralelo',
    path: '/api/grade-parallels',
    placeholder: 'Seleccionar paralelo',
  },
  subjectId: {
    label: 'Asignatura',
    path: '/api/subjects',
    placeholder: 'Seleccionar asignatura',
  },
  courseId: {
    label: 'Paralelo',
    path: '/api/courses/search?page=0&size=200',
    placeholder: 'Seleccionar paralelo',
  },
  enrollmentId: {
    label: 'Inscripcion',
    path: '/api/enrollments/me',
    placeholder: 'Seleccionar inscripcion',
  },
  provinceId: {
    label: 'Provincia',
    path: '/api/locations/provinces',
    placeholder: 'Seleccionar provincia',
  },
};

const baseActions = (base) => [
  {
    label: 'Desactivar',
    path: (row) => `${base}/${row.id}/disable`,
    visibleWhen: (row) => row?.active !== false && row?.deleted !== true,
  },
  {
    label: 'Activar',
    path: (row) => `${base}/${row.id}/enable`,
    visibleWhen: (row) => row?.active === false && row?.deleted !== true,
  },
  {
    label: 'Restaurar',
    path: (row) => `${base}/${row.id}/restore`,
    visibleWhen: (row) => row?.deleted === true,
  },
];

const schoolInstitutionFilter = (row) => row.type === 'ESCUELA' || row.type === 'COLEGIO';
const universityInstitutionFilter = (row) => row.type === 'UNIVERSIDAD';

export const CATALOG_RESOURCES = [
  {
    id: 'faculties',
    title: 'Facultades',
    listPath: '/api/faculties',
    createPath: '/api/faculties',
    updatePath: (id) => `/api/faculties/${id}`,
    deletePath: (id) => `/api/faculties/${id}`,
    fields: [
      { name: 'name', label: 'Nombre', required: true },
      { name: 'code', label: 'Codigo', required: true },
      {
        name: 'institutionId',
        label: 'Universidad',
        relation: ENTITY_RELATIONS.institutionId,
        rowFilter: universityInstitutionFilter,
        required: true,
      },
      { name: 'description', label: 'Descripcion', type: 'textarea' },
    ],
    columns: [
      { key: 'name', header: 'Nombre' },
      { key: 'code', header: 'Codigo' },
      { key: 'institutionName', header: 'Universidad' },
      { key: 'active', header: 'Estado', type: 'status' },
    ],
  },
  {
    id: 'careers',
    title: 'Carreras',
    listPath: '/api/careers',
    createPath: '/api/careers',
    updatePath: (id) => `/api/careers/${id}`,
    deletePath: (id) => `/api/careers/${id}`,
    actions: baseActions('/api/careers'),
    fields: [
      { name: 'name', label: 'Nombre', required: true },
      { name: 'code', label: 'Codigo', required: true },
      {
        name: 'institutionId',
        label: 'Universidad',
        relation: ENTITY_RELATIONS.institutionId,
        rowFilter: universityInstitutionFilter,
        submit: false,
        clearOnChange: ['facultyId'],
        required: true,
      },
      {
        name: 'facultyId',
        label: 'Facultad',
        relation: ENTITY_RELATIONS.facultyId,
        dependsOn: 'institutionId',
        disabledPlaceholder: 'Selecciona primero una universidad',
        filterBy: { field: 'institutionId', rowKey: 'institutionId' },
        required: true,
      },
      { name: 'durationCycles', label: 'Ciclos', type: 'number' },
      { name: 'description', label: 'Descripcion', type: 'textarea' },
    ],
    columns: [
      { key: 'name', header: 'Nombre' },
      { key: 'code', header: 'Codigo' },
      { key: 'faculty', header: 'Facultad' },
      { key: 'active', header: 'Estado', type: 'status' },
    ],
  },
  {
    id: 'academic-cycles',
    title: 'Ciclos academicos',
    listPath: '/api/academic-cycles',
    createPath: '/api/academic-cycles',
    updatePath: (id) => `/api/academic-cycles/${id}`,
    deletePath: (id) => `/api/academic-cycles/${id}`,
    actions: baseActions('/api/academic-cycles'),
    fields: [
      { name: 'name', label: 'Nombre', required: true },
      { name: 'level', label: 'Nivel', type: 'number', required: true },
      {
        name: 'institutionId',
        label: 'Universidad',
        relation: ENTITY_RELATIONS.institutionId,
        rowFilter: universityInstitutionFilter,
        submit: false,
        clearOnChange: ['facultyId', 'careerId'],
        required: true,
      },
      {
        name: 'facultyId',
        label: 'Facultad',
        relation: ENTITY_RELATIONS.facultyId,
        submit: false,
        dependsOn: 'institutionId',
        disabledPlaceholder: 'Selecciona primero una universidad',
        filterBy: { field: 'institutionId', rowKey: 'institutionId' },
        clearOnChange: ['careerId'],
        required: true,
      },
      {
        name: 'careerId',
        label: 'Carrera',
        relation: ENTITY_RELATIONS.careerId,
        dependsOn: 'facultyId',
        disabledPlaceholder: 'Selecciona primero una facultad',
        filterBy: { field: 'facultyId', rowKey: 'facultyId' },
        required: true,
      },
    ],
    columns: [
      { key: 'name', header: 'Nombre' },
      { key: 'level', header: 'Nivel' },
      { key: 'career', header: 'Carrera' },
      { key: 'active', header: 'Estado', type: 'status' },
    ],
  },
  {
    id: 'grades',
    title: 'Grados',
    listPath: '/api/grades',
    createPath: '/api/grades',
    updatePath: (id) => `/api/grades/${id}`,
    deletePath: (id) => `/api/grades/${id}`,
    fields: [
      { name: 'name', label: 'Nombre', required: true },
      { name: 'code', label: 'Codigo', required: true },
      { name: 'level', label: 'Nivel', type: 'number', required: true },
      {
        name: 'institutionId',
        label: 'Institucion educativa',
        relation: ENTITY_RELATIONS.institutionId,
        rowFilter: schoolInstitutionFilter,
        required: true,
      },
      { name: 'active', label: 'Activo', type: 'checkbox', defaultValue: true },
    ],
    columns: [
      { key: 'name', header: 'Nombre' },
      { key: 'code', header: 'Codigo' },
      { key: 'institution', header: 'Institucion' },
      { key: 'active', header: 'Estado', type: 'status' },
    ],
  },
  {
    id: 'grade-parallels',
    title: 'Paralelos',
    listPath: '/api/grade-parallels',
    createPath: '/api/grade-parallels',
    updatePath: (id) => `/api/grade-parallels/${id}`,
    deletePath: (id) => `/api/grade-parallels/${id}`,
    fields: [
      {
        name: 'institutionId',
        label: 'Institucion educativa',
        relation: ENTITY_RELATIONS.institutionId,
        rowFilter: schoolInstitutionFilter,
        submit: false,
        clearOnChange: ['gradeId'],
        required: true,
      },
      {
        name: 'gradeId',
        label: 'Grado',
        relation: ENTITY_RELATIONS.gradeId,
        dependsOn: 'institutionId',
        disabledPlaceholder: 'Selecciona primero una institucion educativa',
        filterBy: { field: 'institutionId', rowKey: 'institutionId' },
        required: true,
      },
      {
        name: 'letter',
        label: 'Letra',
        type: 'select',
        options: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
        required: true,
      },
      { name: 'active', label: 'Activo', type: 'checkbox', defaultValue: true },
    ],
    columns: [
      { key: 'name', header: 'Paralelo' },
      { key: 'letter', header: 'Letra' },
      { key: 'grade', header: 'Grado' },
      { key: 'institution', header: 'Institucion' },
      { key: 'active', header: 'Estado', type: 'status' },
    ],
  },
  {
    id: 'subjects',
    title: 'Asignaturas',
    listPath: '/api/subjects',
    createPath: '/api/subjects',
    updatePath: (id) => `/api/subjects/${id}`,
    deletePath: (id) => `/api/subjects/${id}`,
    mutuallyExclusiveFields: [['courseId', 'gradeParallelId']],
    exclusiveFieldGroups: [
      {
        fields: ['facultyId', 'careerId', 'academicCycleId', 'courseId'],
        excludes: ['institutionId', 'gradeId', 'gradeParallelId'],
      },
      {
        fields: ['institutionId', 'gradeId', 'gradeParallelId'],
        excludes: ['facultyId', 'careerId', 'academicCycleId'],
      },
    ],
    fields: [
      { name: 'name', label: 'Nombre', required: true },
      { name: 'code', label: 'Codigo', required: true },
      {
        name: 'facultyId',
        label: 'Facultad',
        relation: ENTITY_RELATIONS.facultyId,
        submit: false,
        clearOnChange: ['careerId', 'academicCycleId'],
      },
      {
        name: 'careerId',
        label: 'Carrera',
        relation: ENTITY_RELATIONS.careerId,
        submit: false,
        dependsOn: 'facultyId',
        disabledPlaceholder: 'Selecciona primero una facultad',
        filterBy: { field: 'facultyId', rowKey: 'facultyId' },
        clearOnChange: ['academicCycleId'],
      },
      {
        name: 'academicCycleId',
        label: 'Ciclo academico',
        relation: ENTITY_RELATIONS.academicCycleId,
        dependsOn: 'careerId',
        disabledPlaceholder: 'Selecciona primero una carrera',
        filterBy: { field: 'careerId', rowKey: 'careerId' },
        submit: false,
        clearOnChange: ['courseId'],
        requiredWhen: (form) => Boolean(form.careerId),
      },
      {
        name: 'courseId',
        label: 'Paralelo',
        relation: ENTITY_RELATIONS.courseId,
        dependsOn: 'academicCycleId',
        disabledPlaceholder: 'Selecciona primero un ciclo academico',
        filterBy: { field: 'academicCycleId', rowKey: 'academicCycleId' },
        requiredWhen: (form) => Boolean(form.academicCycleId),
      },
      {
        name: 'institutionId',
        label: 'Institucion educativa',
        relation: ENTITY_RELATIONS.institutionId,
        submit: false,
        rowFilter: schoolInstitutionFilter,
        clearOnChange: ['gradeId', 'gradeParallelId'],
      },
      {
        name: 'gradeId',
        label: 'Grado',
        relation: ENTITY_RELATIONS.gradeId,
        dependsOn: 'institutionId',
        disabledPlaceholder: 'Selecciona primero una institucion educativa',
        filterBy: { field: 'institutionId', rowKey: 'institutionId' },
        submit: false,
        clearOnChange: ['gradeParallelId'],
        requiredWhen: (form) => Boolean(form.institutionId),
      },
      {
        name: 'gradeParallelId',
        label: 'Paralelo',
        relation: ENTITY_RELATIONS.gradeParallelId,
        dependsOn: 'gradeId',
        disabledPlaceholder: 'Selecciona primero un grado',
        filterBy: { field: 'gradeId', rowKey: 'gradeId' },
        requiredWhen: (form) => Boolean(form.gradeId),
      },
      { name: 'credits', label: 'Creditos', type: 'number' },
      { name: 'hours', label: 'Horas', type: 'number' },
      { name: 'active', label: 'Activo', type: 'checkbox', defaultValue: true },
      { name: 'description', label: 'Descripcion', type: 'textarea' },
    ],
    columns: [
      { key: 'name', header: 'Nombre' },
      { key: 'code', header: 'Codigo' },
      { key: 'academicCycle', header: 'Ciclo' },
      { key: 'course', header: 'Paralelo' },
      { key: 'grade', header: 'Grado' },
      { key: 'gradeParallel', header: 'Paralelo' },
      { key: 'active', header: 'Estado', type: 'status' },
    ],
  },
];

const SUBJECT_RESOURCE = CATALOG_RESOURCES.find((resource) => resource.id === 'subjects');

const UNIVERSITY_SUBJECT_RESOURCE = {
  ...SUBJECT_RESOURCE,
  id: 'university-subjects',
  title: 'Asignaturas universitarias',
  rowFilter: (row) => Boolean(row.academicCycleId),
  fields: SUBJECT_RESOURCE.fields.filter(
    (field) => !['institutionId', 'gradeId', 'gradeParallelId'].includes(field.name)
  ),
  columns: SUBJECT_RESOURCE.columns.filter((column) => !['grade', 'gradeParallel'].includes(column.key)),
};

const PRACTICE_SUBJECT_RESOURCE = {
  ...SUBJECT_RESOURCE,
  id: 'practice-subjects',
  title: 'Asignaturas de practica',
  rowFilter: (row) => Boolean(row.gradeId),
  fields: SUBJECT_RESOURCE.fields.filter(
    (field) => !['facultyId', 'careerId', 'academicCycleId', 'courseId'].includes(field.name)
  ),
  columns: SUBJECT_RESOURCE.columns.filter((column) => !['academicCycle', 'course'].includes(column.key)),
};

export const UNIVERSITY_CATALOG_RESOURCES = [
  ...CATALOG_RESOURCES.filter((resource) =>
    ['faculties', 'careers', 'academic-cycles'].includes(resource.id)
  ),
  UNIVERSITY_SUBJECT_RESOURCE,
];

export const PRACTICE_CATALOG_RESOURCES = [
  ...CATALOG_RESOURCES.filter((resource) => ['grades', 'grade-parallels'].includes(resource.id)),
  PRACTICE_SUBJECT_RESOURCE,
];
