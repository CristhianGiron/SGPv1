/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          actionIntent.test.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo action Intent mediante pruebas de regresión.
 */

import { resolveActionIntent } from './actionIntent';
test.each([
 ['Aprobar', 'success'], ['Concluir práctica', 'success'], ['Desbloquear usuario', 'success'],
 ['Desactivar', 'danger'], ['Bloquear', 'danger'], ['Eliminar documento', 'danger'], ['Rechazar', 'danger'],
 ['Reabrir práctica', 'warning'], ['Archivar', 'warning'], ['Desarchivar', 'warning'],
 ['Guardar cambios', 'info'], ['Enviar', 'info'], ['Volver a prácticas', 'neutral'], ['Cancelar', 'neutral'],
 ['Ver solicitudes pendientes', 'info'], ['Consultar usuarios bloqueados', 'info'],
])('%s has a consistent action meaning', (label, intent) => expect(resolveActionIntent(label)).toBe(intent));
test('explicit intent wins and unrecognized labels keep their fallback', () => {
 expect(resolveActionIntent('Acción especial', 'danger')).toBe('danger');
 expect(resolveActionIntent('Ingresar', undefined, 'info')).toBe('info');
});
