/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          practiceManagement.js
 * @fecha         2026-11-10 22:13:37
 * @nota          Define la configuración de practiceManagement utilizada por la interfaz.
 */

export const INCIDENT_TYPES = {
 SUSPENSION:'Suspensión temporal', RESUMPTION:'Reanudación', WITHDRAWAL:'Retiro de la práctica',
 CHANGE_INSTITUTION:'Cambio de institución', CHANGE_INSTITUTIONAL_TUTOR:'Cambio de tutor institucional', OTHER:'Otra incidencia',
};
export const INCIDENT_STATES={OPEN:'Registrada',ASSIGNED:'Asignada',UNDER_REVIEW:'En evaluación',RESOLVED:'Resuelta',REJECTED:'Rechazada'};
export const DOCUMENT_LABELS={L1:'L.1 · Informe de actividades cumplidas',L2:'L.2 · Plan de actividades',L3:'L.3 · Informe del tutor institucional',L4:'L.4 · Evaluación de actividades',L5:'L.5 · Seguimiento de prácticas',L6:'L.6 · Registro de actividades cumplidas'};
export const DEADLINE_STAGES={SUBMISSION:'Entrega o registro',PRACTICE_REVIEW:'Revisión del tutor de prácticas',INSTITUTIONAL_REVIEW:'Revisión del tutor institucional',DIRECTOR_REVIEW:'Revisión de dirección'};
export const DEADLINE_STATES={PENDING:'Pendiente',UPCOMING:'Próximo a vencer',OVERDUE:'Vencido',FULFILLED:'Cumplido',PAUSED:'En pausa',WAITING_SUBMISSION:'Esperando entrega',CLOSED:'Práctica cerrada'};
export function canManagePractice(roles){return roles.some(r=>['ROLE_TUTOR_PRACTICAS','ROLE_DIRECTOR_PRACTICAS'].includes(r));}
