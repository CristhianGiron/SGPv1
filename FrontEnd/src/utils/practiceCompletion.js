/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          practiceCompletion.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Proporciona las funciones de practiceCompletion utilizadas por la interfaz del SGP.
 */

import { apiRequest } from '../api/client';

export async function practiceCompletionConfirmation(path, confirmation, token) {
  const match = /^\/api\/enrollments\/(\d+)\/complete$/.exec(path);
  if (!match) return confirmation;
  const summary = await apiRequest(`/api/enrollments/${match[1]}/completion-summary`, { token });
  if (!summary || !Array.isArray(summary.warnings)) {
    throw new Error('No se pudo comprobar el estado de documentos y horas. Vuelve a intentar antes de concluir.');
  }
  const minutes = value => value == null ? 'Sin total aprobado' : `${Math.floor(value / 60)} h ${value % 60} min`;
  const lines = [confirmation?.details, `L.6: ${minutes(summary.approvedRecordMinutes)}`, `L.3: ${minutes(summary.institutionalReportMinutes)}`, `Asistencia: ${minutes(summary.attendanceMinutes)}`].filter(Boolean);
  if (summary.warnings.length) lines.push('Advertencias antes del cierre:', ...summary.warnings.map(message => `• ${message}`));
  else lines.push('Sin advertencias en los documentos y horas comprobados.');
  return {
    ...confirmation,
    title: 'Revisar y concluir práctica',
    description: 'El cierre es una decisión manual de dirección. La práctica quedará para consulta y dejará de admitir registros y revisiones. Revisa las advertencias, incluso si ya terminó el período.',
    details: lines.join('\n'),
    confirmLabel: summary.warnings.length ? 'Concluir con advertencias' : 'Concluir práctica',
    tone: 'warning',
  };
}
