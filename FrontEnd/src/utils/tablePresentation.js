/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          tablePresentation.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Proporciona las funciones de tablePresentation utilizadas por la interfaz del SGP.
 */

// Context removes repetition, never server authorization or required payload data.
const practiceIdentity = new Set(['courseName', 'course', 'student', 'studentName', 'studentFullName', 'studentUsername', 'studentIdentification']);
const ownIdentity = new Set(['student', 'studentName', 'studentFullName', 'studentUsername', 'studentIdentification']);
const auditDates = new Set(['createdAt', 'updatedAt', 'enrolledAt', 'archivedAt']);

export function relevantTableColumns(columns, { practice = null, ownRecords = false, contextColumns = [] } = {}) {
  const fixed = new Set(contextColumns);
  return columns.filter(Boolean).filter(column => column.key !== 'id' && column.header !== 'ID'
    && !fixed.has(column.key) && !(practice && practiceIdentity.has(column.key))
    && !(ownRecords && ownIdentity.has(column.key)));
}

export function isSecondaryColumn(column) {
  return column.secondary ?? auditDates.has(column.key);
}
