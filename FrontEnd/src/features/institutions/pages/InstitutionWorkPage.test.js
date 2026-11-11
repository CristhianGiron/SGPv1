/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          InstitutionWorkPage.test.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de las instituciones mediante pruebas de regresión.
 */

import { institutionAssignments } from './InstitutionWorkPage';
test('institutional student directory combines only assigned records and keeps enrollments distinct', () => {
 const rows = institutionAssignments([{ enrollmentId: 1, studentFullName: 'Ana', courseName: 'A' }, { enrollmentId: 2, studentFullName: 'Ana', courseName: 'B' }], [{ enrollmentId: 1 }, { id: 9 }]);
 expect(rows).toHaveLength(2);
 expect(rows[0]).toMatchObject({ id: 1, forms: 1, schedules: 1 });
 expect(rows[1]).toMatchObject({ id: 2, forms: 1, schedules: 0 });
});
