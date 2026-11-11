<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          practicas.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Paralelos e inscripciones.
-->

# Paralelos e inscripciones

[Guía Postman y variables](../guia-postman.md) · Los ejemplos se ejecutan sobre un entorno de pruebas con cuentas del rol indicado.

## Cursos y Practicas

Admin y Director de Practicas pueden gestionar cursos. El borrado definitivo solo Admin. La búsqueda de paralelos corresponde a administración, dirección de prácticas y tutor de prácticas asignado; el estudiante consulta directamente sus prácticas.

| Metodo | URL | Rol |
| --- | --- | --- |
| `POST` | `{{baseUrl}}/api/courses` | Admin o Director |
| `GET` | `{{baseUrl}}/api/courses` | Admin o Director |
| `GET` | `{{baseUrl}}/api/courses/{{courseId}}` | Admin o Director |
| `GET` | `{{baseUrl}}/api/courses/search?name=&active=&locked=&institutionalTutor=&practiceTutor=` | Admin, Director o tutor de prácticas asignado |
| `PATCH` | `{{baseUrl}}/api/courses/{{courseId}}/institutional-tutor/{{accountId}}` | Admin o Director |
| `PATCH` | `{{baseUrl}}/api/courses/{{courseId}}/practice-tutor/{{accountId}}` | Admin o Director |
| `PATCH` | `{{baseUrl}}/api/courses/{{courseId}}/disable` | Admin o Director |
| `PATCH` | `{{baseUrl}}/api/courses/{{courseId}}/enable` | Admin o Director |
| `PATCH` | `{{baseUrl}}/api/courses/{{courseId}}/lock` | Admin, Director de su carrera o tutor de prácticas asignado |
| `PATCH` | `{{baseUrl}}/api/courses/{{courseId}}/unlock` | Admin, Director de su carrera o tutor de prácticas asignado |
| `DELETE` | `{{baseUrl}}/api/courses/{{courseId}}` | Admin o Director |
| `PATCH` | `{{baseUrl}}/api/courses/{{courseId}}/restore` | Admin o Director |
| `DELETE` | `{{baseUrl}}/api/courses/{{courseId}}/force` | Admin |

Busqueda:

`GET {{baseUrl}}/api/courses/search?name=&active=&locked=&institutionalTutor=&practiceTutor=`

Reglas de tutores:

- Tutor institucional: cuenta activa con rol `ROLE_TUTOR_INSTITUCIONAL`, institución activa de tipo `ESCUELA` o `COLEGIO`, convenio activo y acepta practicantes.
- Tutor de prácticas: cuenta activa con rol `ROLE_TUTOR_PRACTICAS`, institución activa de tipo `UNIVERSIDAD` con código `UNL`.

Crear:

```json
{
  "name": "Curso Practicas Test",
  "description": "Curso de prueba",
  "capacity": 30,
  "startDate": "2026-05-13T08:00:00",
  "endDate": "2026-06-13T17:00:00",
  "subjectId": 1
}
```


## Inscripciones

| Metodo | URL | Rol |
| --- | --- | --- |
| `POST` | `{{baseUrl}}/api/practice-offerings/{{practiceId}}/students` | Admin, director de la carrera o tutor de prácticas asignado |
| `PATCH` | `{{baseUrl}}/api/enrollments/{{enrollmentId}}/approve` | Admin o Director |
| `PATCH` | `{{baseUrl}}/api/enrollments/{{enrollmentId}}/reject` | Admin o Director |
| `GET` | `{{baseUrl}}/api/courses/{{courseId}}/enrollments` | Admin, director de la carrera o tutor de prácticas asignado |
| `GET` | `{{baseUrl}}/api/enrollments/me` | Estudiante |

Regla vigente desde el 9 de noviembre de 2026: un estudiante pertenece a un solo paralelo activo por ciclo, pero puede cursar varios ciclos de su carrera. Cada paralelo mantiene su listado académico y puede ofrecer varias prácticas. Administración y dirección de la carrera mantienen ese listado. Administración, dirección de la carrera o el tutor de prácticas asignado inscriben a sus estudiantes en cada práctica, directamente con estado `APPROVED` y tutores configurados. La API rechaza autoinscripciones, estudiantes ajenos, duplicados, cupos agotados y períodos cerrados.

Las antiguas rutas `POST /api/courses/{id}/enroll` y `DELETE /api/enrollments/{id}` están retiradas y denegadas. Aprobar o rechazar `PENDING` se conserva únicamente para resolver datos anteriores; las asignaciones nuevas no generan solicitudes.

### Crear y asignar una práctica

| Método | URL | Rol |
| --- | --- | --- |
| `GET` | `{{baseUrl}}/api/courses/{{courseId}}/practice-offerings` | Personal autorizado del paralelo |
| `POST` | `{{baseUrl}}/api/courses/{{courseId}}/practice-offerings` | Administración o dirección de la carrera |
| `GET` | `{{baseUrl}}/api/courses/{{courseId}}/practice-roster` | Personal autorizado del paralelo |
| `PATCH` | `{{baseUrl}}/api/practice-offerings/{{practiceId}}/enrollment?open=false` | Personal autorizado del paralelo |
| `POST` | `{{baseUrl}}/api/practice-offerings/{{practiceId}}/students` | Personal autorizado del paralelo |

Crear, con token de administración o dirección:

```json
{"name":"Práctica de observación", "capacity":30, "startDate":"2026-11-09T08:00:00", "endDate":"2027-02-01T12:00:00"}
```

Guardar el `id` como `practiceId`. Consultar el listado académico y enviar la asignación con token de administración, dirección de la carrera o tutor asignado:

```json
{"studentId":123, "groupId":45}
```

`groupId` puede omitirse únicamente cuando el paralelo ya tiene tutor institucional. El grupo debe pertenecer al mismo paralelo. La respuesta incluye `practiceId`, `practiceName`, `courseId`, `courseName` y `status: APPROVED`. El estudiante consulta `GET /api/enrollments/practices` y abre su asignación sin solicitudes ni cancelaciones.

El cierre de inscripciones de la práctica o del paralelo impide nuevas asignaciones y conserva el trabajo de los ya inscritos. El cierre académico sigue siendo manual por dirección con advertencias documentales y de horas.


## Consulta y ciclo de vida de una práctica

Todas las operaciones comprueban también el alcance y el estado en el servicio. Los identificadores de esta tabla son inscripciones, no identificadores de documentos.

| Método | URL | Cuenta y alcance |
| --- | --- | --- |
| `GET` | `{{baseUrl}}/api/enrollments/practices` | Estudiante, administración, dirección y tutorías, dentro de su alcance |
| `GET` | `{{baseUrl}}/api/enrollments/managed` | Personal autorizado dentro de su alcance |
| `GET` | `{{baseUrl}}/api/enrollments/{{enrollmentId}}/history` | Propietario o personal con acceso a la práctica; excluye directora de institución |
| `GET` | `{{baseUrl}}/api/enrollments/{{enrollmentId}}/completion-summary` | Director de prácticas de la carrera |
| `PATCH` | `{{baseUrl}}/api/enrollments/{{enrollmentId}}/complete` | Director de prácticas de la carrera |
| `PATCH` | `{{baseUrl}}/api/enrollments/{{enrollmentId}}/reopen` | Director de prácticas de la carrera |
| `PATCH` | `{{baseUrl}}/api/enrollments/{{enrollmentId}}/archive` | Administración |
| `PATCH` | `{{baseUrl}}/api/enrollments/{{enrollmentId}}/unarchive` | Administración |
| `PATCH` | `{{baseUrl}}/api/enrollments/{{enrollmentId}}/group/{{groupId}}` | Administración o tutor de prácticas autorizado |

El historial devuelve eventos persistidos de la práctica. Los eventos documentales mostrados en el resumen de React también usan las fechas de los documentos visibles; no se deben confundir con un registro completo de todas las revisiones.

Consulte [EnrollmentController](../../../BackEnd/src/main/java/com/sgp/systemsgp/controller/EnrollmentController.java) para los cuerpos y operaciones adicionales del ciclo de vida, y [PracticeHistoryController](../../../BackEnd/src/main/java/com/sgp/systemsgp/controller/PracticeHistoryController.java) para el alcance del historial.

## Cierre de inscripciones y revisión previa a concluir

`PATCH /api/courses/{id}/lock` cierra las nuevas inscripciones administrativas del paralelo; `unlock` las abre. El tutor de prácticas solo puede actuar sobre el paralelo que tiene asignado. Las prácticas existentes siguen operativas y las solicitudes pendientes pueden aprobarse o rechazarse después del cierre.

Antes del cierre manual, consultar `GET /api/enrollments/{id}/completion-summary` con dirección de la carrera. Devuelve `warnings`, `periodEnd`, `periodEnded`, `approvedRecordMinutes`, `institutionalReportMinutes` y `attendanceMinutes`. Los minutos aprobados pueden ser null cuando no haya un total aprobado; no equivalen a una meta institucional de horas. `warnings` es informativo y no bloquea el PATCH de conclusión. La API recalcula las advertencias al concluir y las registra en el historial.

Una práctica archivada debe desarchivarse como administración antes de reabrirla como dirección. La reapertura requiere paralelo disponible, cuenta habilitada, y cupo en práctica/grupo (en registros anteriores sin práctica separada, en paralelo/grupo); no exige abrir inscripciones nuevas.

## Pertenencias académicas al paralelo

| Método | URL | Cuenta y alcance |
| --- | --- | --- |
| `GET` | `{{baseUrl}}/api/courses/{{courseId}}/students` | Administración o dirección de la carrera |
| `GET` | `{{baseUrl}}/api/courses/{{courseId}}/student-candidates?page=0&size=50` | Administración o dirección; estudiantes de la carrera del paralelo |
| `PUT` | `{{baseUrl}}/api/courses/{{courseId}}/students/{{accountId}}` | Asignar/restaurar pertenencia; administración o dirección de la carrera |
| `DELETE` | `{{baseUrl}}/api/courses/{{courseId}}/students/{{accountId}}` | Retirar pertenencia; administración o dirección de la carrera |

La selección de candidatos devuelve identificador de cuenta, usuario y nombres; no entrega cédula, correo, teléfono o dirección. La asignación requiere una cuenta de estudiante habilitada y una carrera compatible. El ciclo principal puede diferir del ciclo del paralelo.

PUT no aprueba la práctica y no inscribe automáticamente al estudiante. DELETE conserva las prácticas e historial existentes; una solicitud pendiente ya no puede aprobarse mientras no se restaure la pertenencia. La apertura/cierre de inscripciones sigue siendo una regla separada.

Los defaults de L.1/L.2/L.3/L.6 requieren `enrollmentId` explícito cuando hay varias prácticas aprobadas. Sin él, la API devuelve un error de dominio y solicita elegir la práctica.
