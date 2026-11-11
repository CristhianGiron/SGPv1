/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          roleExperience.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Define la configuración de roleExperience utilizada por la interfaz.
 */

const has = (roles, role) => roles.includes(`ROLE_${role}`);

export function workflowCopy(page, roles = [], module) {
  const admin = has(roles, 'ADMIN'), director = has(roles, 'DIRECTOR_PRACTICAS');
  const student = has(roles, 'ESTUDIANTE'), institutional = has(roles, 'TUTOR_INSTITUCIONAL');
  const practice = has(roles, 'TUTOR_PRACTICAS');
  const scope = admin ? 'del sistema' : director ? 'de tu carrera' : practice ? 'de tus paralelos asignados' : 'de tus prácticas asignadas';
  if (page === 'documents') {
    if (!module) return student ? 'Selecciona un documento para consultar su estado y continuar tu práctica.' : `Selecciona un documento para consultar los registros ${scope}.`;
    const allowed = key => (module[key] || []).some(role => roles.includes(role));
    if (allowed('createRoles') || allowed('updateRoles')) return allowed('submitRoles')
      ? 'Completa tu documento, guarda los cambios y envíalo a revisión. Las observaciones aparecen en su apartado correspondiente.'
      : `Registra y actualiza la información ${scope}. Selecciona la práctica antes de completar los datos.`;
    if (allowed('reviewRoles')) return `Selecciona un documento enviado ${scope}, revisa sus apartados y registra tu decisión con observaciones.`;
    if ((module.extraActions || []).some(action => (action.roles || []).some(role => roles.includes(role)))) return 'Abre el informe de una práctica asignada para completar la sección institucional y registrar tu revisión.';
    return `Consulta el estado y el contenido de los documentos ${student ? 'de tu práctica' : scope}.`;
  }
  const copies = {
    photos: student ? 'Añade fotografías de tu práctica activa y consulta tus evidencias registradas.' : `Consulta las evidencias ${scope}. Busca por estudiante, paralelo o descripción para localizar una fotografía.`,
    forms: student ? 'Prepara entrevistas, envíalas al destinatario de tu práctica y consulta sus respuestas e interpretaciones.' : institutional || has(roles, 'DIRECTORA_INSTITUCION') ? 'Consulta las entrevistas que tienes asignadas y responde las que estén pendientes.' : `Consulta las entrevistas y respuestas ${scope}.`,
    observations: student ? 'Crea y responde tus fichas de observación para registrar e interpretar lo observado en tu práctica.' : `Consulta las fichas de observación respondidas ${scope}.`,
    plans: student ? 'Crea tu planificación, toma como referencia la de tu tutora institucional y atiende las recomendaciones recibidas.' : institutional ? 'Prepara planificaciones institucionales para tus estudiantes asignados y recomienda mejoras en sus planificaciones.' : `Consulta las planificaciones de estudiantes ${scope} y registra recomendaciones para su corrección.`,
    archive: admin ? 'Consulta el historial y archiva o recupera prácticas concluidas, individualmente o por cohorte.' : director ? 'Consulta las prácticas de tu carrera y concluye o reabre las que corresponda.' : student ? 'Consulta tus prácticas actuales e históricas y su estado.' : `Consulta las prácticas actuales e históricas ${scope}.`,
    schedules: institutional ? 'Organiza jornadas y registra la asistencia de tus estudiantes asignados.' : student ? 'Consulta tus jornadas, registros de asistencia y tiempo asistido.' : has(roles,'DIRECTORA_INSTITUCION') ? 'Consulta las jornadas y asistencias de estudiantes vinculados a tu institución educativa.' : `Consulta las jornadas y asistencias ${scope}.`,
    courses: student ? 'Consulta las prácticas que te haya asignado el personal académico y trabaja en sus actividades.' : admin ? 'Administra paralelos, asignaciones e inscripciones del sistema.' : director ? 'Gestiona los paralelos e inscripciones de tu carrera y concluye o reabre sus prácticas.' : 'Organiza los grupos de tus paralelos asignados y asigna estudiantes a un tutor institucional.',
    universities: admin ? 'Administra universidades, facultades, carreras, ciclos y asignaturas. Puedes incorporar nuevas instituciones desde estos catálogos.' : 'Consulta la universidad, facultad, carrera, ciclos y asignaturas de tu ámbito académico.',
  };
  return copies[page] || `Consulta la información ${scope}.`;
}

export function navigationLabel(item, roles = []) {
  const labels = roles.includes('ROLE_ADMIN') ? { universities: 'Estructura académica', documents: 'Consulta de documentos' }
    : roles.includes('ROLE_DIRECTOR_PRACTICAS') ? { universities: 'Mi estructura académica', courses: 'Paralelos de mi carrera', reports: 'Coordinación de mi carrera' }
    : roles.includes('ROLE_TUTOR_PRACTICAS') ? { courses: 'Mis paralelos y grupos', documents: 'Revisión de documentos' }
    : roles.includes('ROLE_TUTOR_INSTITUCIONAL') ? { forms: 'Entrevistas asignadas', documents: 'Informes asignados', schedules: 'Jornadas y asistencias' }
    : roles.includes('ROLE_DIRECTORA_INSTITUCION') ? { forms: 'Entrevistas asignadas', schedules: 'Jornadas de mi institución' }
    : { photos: 'Mis evidencias', forms: 'Mis entrevistas', 'observation-forms': 'Mis fichas de observación', courses: 'Inscripciones', documents: 'Mis documentos', schedules: 'Mis jornadas', 'practice-archive': 'Historial de prácticas' };
  if (item.id === 'dashboard' && roles.some(role => role !== 'ROLE_ESTUDIANTE')) return 'Mi trabajo';
  if (item.id === 'practices' || item.id === 'dashboard') return roles.includes('ROLE_ADMIN') ? 'Prácticas y estudiantes' : roles.includes('ROLE_DIRECTORA_INSTITUCION') ? 'Mi institución' : roles.includes('ROLE_ESTUDIANTE') && !roles.some(role => ['ROLE_DIRECTOR_PRACTICAS', 'ROLE_TUTOR_PRACTICAS', 'ROLE_TUTOR_INSTITUCIONAL'].includes(role)) ? 'Mis prácticas' : roles.includes('ROLE_TUTOR_INSTITUCIONAL') ? 'Mis estudiantes' : 'Paralelos y estudiantes';
  return labels[item.id] || item.label;
}
