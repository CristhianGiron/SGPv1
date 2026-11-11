/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          actionIntent.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Proporciona las funciones de actionIntent utilizadas por la interfaz del SGP.
 */

const INTENTS = new Set(['neutral', 'info', 'success', 'warning', 'danger']);

// Explicit intent takes precedence. Shared controls otherwise recognize the action
// verb, never a record name or a word buried elsewhere in its label.
export function resolveActionIntent(label = '', explicit, fallback = 'neutral') {
  if (INTENTS.has(explicit)) return explicit;
  const verb = String(label).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  if (/^(eliminar|borrar|quitar|retirar|rechazar|desactivar|deshabilitar|bloquear|revocar)\b/.test(verb)) return 'danger';
  if (/^(aprobar|aceptar|activar|habilitar|desbloquear|completar|concluir|finalizar|restaurar)\b/.test(verb)) return 'success';
  if (/^(corregir|reabrir|archivar|desarchivar|devolver|revisar)\b/.test(verb)) return 'warning';
  if (/^(guardar|crear|agregar|nuevo|nueva|editar|enviar|continuar|abrir|ver|consultar|descargar|actualizar|asignar|registrar|subir|solicitar|inscribirme)\b/.test(verb)) return 'info';
  return fallback;
}
