/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          practiceIndicators.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Proporciona las funciones de practiceIndicators utilizadas por la interfaz del SGP.
 */

// A justified absence is tracked separately and never adds time actually attended.
export function summarizeAttendances(attendances = []) {
  return attendances.reduce((summary, attendance) => {
    summary.total += 1;
    const counters = { PRESENT: 'presentCount', LATE: 'lateCount', ABSENT: 'absentCount', JUSTIFIED: 'justifiedCount' };
    if (counters[attendance.status]) summary[counters[attendance.status]] += 1;
    const minutes = Number(attendance.totalMinutes);
    if (['PRESENT', 'LATE'].includes(attendance.status) && Number.isFinite(minutes) && minutes >= 0) {
      summary.assistedMinutes += minutes;
    }
    return summary;
  }, { total: 0, assistedMinutes: 0, presentCount: 0, lateCount: 0, absentCount: 0, justifiedCount: 0 });
}

export function pendingReviewCount(rows = [], reviewer = 'practice') {
  const approvalField = { practice: 'practiceTutorApproved', institutional: 'institutionalTutorApproved', director: 'directorApproved' }[reviewer];
  return rows.filter((row) => row.status === 'SUBMITTED' && (!approvalField || !row[approvalField])).length;
}
