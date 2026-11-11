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


## Incidencias y cambios justificados

Cada incidencia pertenece a una práctica concreta. Los participantes con acceso a esa práctica pueden consultarla y comunicar una situación mientras la práctica esté activa o suspendida. Dirección de la carrera o el tutor de prácticas asignado elige a un responsable habilitado de esa práctica; el responsable o dirección inicia la evaluación. Solo dirección resuelve o rechaza, con motivo obligatorio. El estudiante no decide sus propios cambios académicos, aunque tenga cargos adicionales.

| Método | Ruta | Operación |
| --- | --- | --- |
| GET / POST | `/api/enrollments/{id}/incidents` | Consultar o registrar incidencias |
| GET | `/api/enrollments/{id}/incidents/responsibles` | Candidatos habilitados de la práctica para el gestor |
| PATCH | `/api/incidents/{id}/assign` | `{ "responsibleId": 123, "reason": "Evaluación asignada al tutor" }` |
| PATCH | `/api/incidents/{id}/evaluate` | `{ "reason": "Análisis iniciado" }` |
| PATCH | `/api/incidents/{id}/decide` | `{ "approved": true, "reason": "Decisión justificada", "targetGroupId": null }` |

Registrar una incidencia:

```json
{"type":"SUSPENSION","title":"Interrupción temporal","description":"El centro receptor comunica una interrupción de sus actividades."}
```

Secuencia: `OPEN → ASSIGNED → UNDER_REVIEW → RESOLVED / REJECTED`. Puede reasignarse una incidencia todavía abierta dejando el motivo en el historial; vuelve a `ASSIGNED`. Una decisión final no se puede volver a aplicar.

Tipos y efecto al resolver:

| Tipo | Efecto |
| --- | --- |
| SUSPENSION | La práctica pasa de `APPROVED` a `SUSPENDED`; conserva consulta y bloquea las operaciones ordinarias de trabajo. |
| RESUMPTION | Pasa de `SUSPENDED` a `APPROVED` tras comprobar cuenta, pertenencia, disponibilidad, tutores y cupos. No requiere reabrir inscripciones. |
| WITHDRAWAL | Pasa a `WITHDRAWN`; conserva expediente y registros para consulta. No equivale a conclusión académica satisfactoria. |
| CHANGE_INSTITUTION | Exige `targetGroupId` de un grupo disponible del mismo paralelo, con otra institución y tutor habilitado. |
| CHANGE_INSTITUTIONAL_TUTOR | Exige otro tutor institucional en un grupo del mismo paralelo y la misma institución. |
| OTHER | Registra la resolución sin modificar automáticamente la asignación académica. |

Los cambios de institución o tutor se aplican únicamente a la práctica afectada mediante su grupo. No cambian la pertenencia académica ni el tutor común de todo el paralelo. Los documentos, las revisiones anteriores y las horas se conservan; la asignación actual determina los permisos posteriores. La sustitución del tutor de prácticas del paralelo continúa en su gestión académica existente y no se confunde con un cambio de tutor institucional individual.

Las prácticas archivadas o concluidas no admiten nuevas gestiones de incidencias. El cierre manual advierte si todavía hay incidencias abiertas y conserva esa decisión; no las resuelve automáticamente.

## Versiones de L.1–L.6

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/api/enrollments/{id}/document-versions` | Versiones autorizadas del expediente |
| GET | `/api/enrollments/{id}/document-versions/{versionId}` | Copia del contenido conservado |
| GET | `/api/enrollments/{id}/document-versions/{versionId}/pdf` | PDF conservado cuando existe |
| POST | `/api/enrollments/{id}/document-versions/baseline` | El personal conserva el estado actual de documentos anteriores autorizados |

Se conservan entregas y decisiones de revisión de L.1/L.2/L.3/L.6. Cada decisión incluye las aprobaciones presentes en ese momento; el PDF definitivo se conserva cuando el documento queda aprobado. L.4/L.5 conservan una versión y PDF por registro o actualización, sin añadirles aprobaciones ficticias. Las actualizaciones de la sección institucional L.3 también quedan registradas.

Antes de modificar un documento heredado se conserva su contenido anterior cuando no hay versiones. El personal puede capturar documentos ya aprobados y evaluaciones/seguimientos anteriores, incluso desde un expediente histórico: esta captura tiene fecha propia y no reconstruye el momento de una aprobación pasada. Es idempotente para los documentos que ya tienen versiones.

Los borradores conservados mantienen su privacidad. El tutor institucional solo puede consultar las versiones L.3 que le correspondan; no recibe acceso por esta vía a L.1/L.2/L.4/L.5/L.6. Se comprueba tanto la práctica solicitada como la versión concreta. Los hashes SHA-256 permiten comprobar integridad de contenido y PDF; no constituyen una firma electrónica ni un sello de tiempo certificado. El ZIP añade los PDF históricos autorizados en `versiones/`, respetando el límite de tamaño existente del expediente.

## Plazos y recordatorios

`GET /api/enrollments/{id}/deadlines` permite consultar los plazos dentro del alcance del usuario. `PUT` en la misma ruta corresponde a dirección o al tutor de prácticas asignado; exige práctica operativa, motivo y datos válidos:

```json
{"kind":"L2","stage":"SUBMISSION","dueAt":"2026-12-01T12:00:00","reminderHours":48,"reason":"Calendario acordado para el período"}
```

Etapas: `SUBMISSION`, `PRACTICE_REVIEW`, `INSTITUTIONAL_REVIEW` (solo L.3) y `DIRECTOR_REVIEW`. L.4/L.5 únicamente admiten registro, `SUBMISSION`. Cada combinación práctica/documento/etapa tiene un plazo; modificarlo incrementa su revisión y registra un evento de auditoría.

Las horas corresponden a `America/Guayaquil`. El estado se calcula con los documentos actuales: pendiente, próximo a vencer, vencido, cumplido, esperando entrega, en pausa o práctica cerrada. Una revisión no avisa al revisor mientras siga esperando una entrega o corrección del autor. Los responsables se resuelven según las asignaciones actuales; dirección se filtra por la carrera. Si una corrección reinicia una entrega o aprobación, el plazo vuelve a reflejar el trabajo pendiente.

Los recordatorios internos se procesan periódicamente: por defecto al minuto del arranque y luego cada hora. Se persiste una deduplicación por plazo, revisión, destinatario y fase (próximo/vencido), con bloqueo transaccional. Una suspensión pausa los avisos; la conclusión, el retiro o el archivo detienen los avisos operativos. No se envía correo externo. La fecha límite no bloquea entregas tardías ni concluye una práctica automáticamente.

Configuración: `app.practice.reminders-enabled`, `app.practice.reminders-initial-delay-ms` y `app.practice.reminders-delay-ms`. El perfil `test` no activa el planificador.
