<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          permisos-practicas.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Matriz de permisos de prácticas.
-->

# Matriz de permisos de prácticas

Regla base:

- `ROLE_ADMIN`: acceso global de administración.
- `ROLE_DIRECTOR_PRACTICAS`: acceso a prácticas de su carrera.
- `ROLE_TUTOR_PRACTICAS`: acceso a prácticas de sus paralelos asignados.
- `ROLE_TUTOR_INSTITUCIONAL`: acceso a prácticas de sus grupos o asignación institucional.
- `ROLE_DIRECTORA_INSTITUCION`: acceso a registros vinculados a su institución educativa.
- `ROLE_ESTUDIANTE`: acceso solo a sus prácticas y registros.

Estados de práctica:

- `PENDING`: solicitud pendiente; no habilita creación de registros de práctica.
- `APPROVED`: práctica activa; habilita creación y edición operativa.
- `COMPLETED`: práctica concluida; habilita consulta histórica. Los registros y revisiones operativas requieren reapertura previa.
- `archived = true`: práctica concluida enviada al archivo histórico; sigue siendo consultable desde el archivo.

| Módulo | Estudiante | Tutor institucional | Directora institución | Tutor prácticas | Director prácticas | Admin |
| --- | --- | --- | --- | --- | --- | --- |
| Paralelos e inscripciones | Solicita y consulta lo suyo | Consulta prácticas asignadas | - | Gestiona sus paralelos | Gestiona su carrera | Global |
| Archivo de prácticas | Consulta historial propio | Consulta prácticas asignadas | - | Consulta sus paralelos | Concluye/reabre su carrera; solicita desarchivo a administración cuando corresponda | Archiva/desarchiva global; concluir/reabrir requiere rol director |
| Evidencias | Crea en práctica activa y consulta lo suyo | Consulta asignadas | - | Consulta sus paralelos | Consulta su carrera | Global |
| Fichas y entrevistas | Crea, responde si aplica, interpreta lo suyo | Responde/consulta asignadas | Responde/consulta asignadas | Consulta sus paralelos | Consulta su carrera | Global |
| Planificaciones didácticas | Crea adaptada y ve la institucional de su práctica | Crea institucional y recomienda la del estudiante asignado | - | Recomienda la del estudiante en sus paralelos | Recomienda la del estudiante en su carrera | Recomienda global |
| Jornadas y asistencias | Consulta lo suyo | Crea y registra asistencia en asignadas | Consulta su institución | Consulta sus paralelos | Consulta su carrera | Global |
| Documentos de práctica | Crea/edita en práctica activa, consulta históricos propios | Según módulo institucional | Según módulo institucional | Revisa sus paralelos | Revisa su carrera | Global |

Notas:

- Las planificaciones creadas por la tutora institucional solo son visibles para la autora y el estudiante de la práctica.
- Las planificaciones creadas por estudiantes son visibles para roles superiores dentro de su alcance y pueden recibir recomendaciones.
- Crear o subir nuevos registros debe depender de una práctica `APPROVED`; consultar histórico debe permitir `COMPLETED`.

## Estructura académica y cuentas

- Administración crea y mantiene universidades, facultades, carreras, ciclos y asignaturas. Los directores consultan únicamente su universidad, facultad, carrera y sus ciclos/asignaturas; no modifican estos catálogos.
- Las escuelas y colegios receptores constituyen un directorio compartido, administrable por administración y dirección de prácticas. Un director no puede convertir una escuela en universidad ni modificar universidades mediante estos endpoints.
- Dirección selecciona tutores de prácticas de su universidad. Los tutores de prácticas seleccionan tutores institucionales del directorio receptor compartido. Estas búsquedas entregan datos de selección, sin cédula, correo, teléfono ni dirección.
- El registro público crea exclusivamente estudiantes. Administración provisiona las cuentas del personal y asigna su carrera, institución y roles según corresponda.
- La búsqueda de paralelos restringe estudiantes a sus pertenencias académicas activas y a las inscripciones abiertas; los tutores consultan sus paralelos y dirección su carrera. Un estudiante puede tener varios paralelos asignados de distintos ciclos de su carrera. Cambiar filtros o acceder por URL no amplía estos permisos.
- La interfaz adapta navegación, instrucciones y controles a los roles efectivos. Los permisos se comprueban también en el servidor; ocultar un botón no sustituye esa comprobación.
- Una cuenta con varios roles acumula las capacidades autorizadas por esos roles. Para comprobar una experiencia exclusiva se debe usar una cuenta con un solo rol.

## Coherencia de asignaciones y avisos

El grupo mostrado de una práctica es su asignación persistida; disponer de un único grupo activo en el paralelo no asigna automáticamente al estudiante. El tutor institucional efectivo es el del grupo, si existe; en otro caso se conserva el tutor del paralelo. Detalles, listados y resúmenes aplican ese mismo ámbito antes de entregar datos.

La consulta de L.4/L.5 por dirección se limita a su carrera, también para PDF y vista previa. Los nuevos avisos de entregas documentales y solicitudes pendientes respetan el ámbito de carrera de dirección y conservan administración global. L.3 notifica además al tutor institucional efectivo. Los anuncios administrativos mantienen sus destinatarios configurados.

## Inscripciones y conclusión manual

Cerrar inscripciones (`locked=true`) rechaza nuevas solicitudes de estudiantes y conserva el desarrollo de las prácticas. El tutor de prácticas asignado puede cerrar o abrir inscripciones de su paralelo; dirección actúa en su carrera y administración globalmente. No equivale a desactivar el paralelo. Las solicitudes recibidas antes del cierre pueden resolverse y los estudiantes aprobados pueden ser asignados a grupos.

Dirección mantiene la decisión manual de concluir. Antes de confirmar, consulta advertencias de L.1–L.6, horas aprobadas L.3/L.6, asistencia y fecha final. Son información para la decisión; no se impone un mínimo de horas ni se concluye automáticamente por fecha. El cierre registra las advertencias en el historial. Las horas de asistencia se muestran separadas de las aprobadas y no sustituyen su certificación.

Para reabrir, administración debe desarchivar primero si corresponde. Se comprueba disponibilidad del paralelo, estado de la cuenta, cupo, grupo disponible. Las inscripciones pueden permanecer cerradas: la reapertura retoma una práctica existente.

## Pertenencia académica y prácticas simultáneas

Administración o dirección de la carrera asigna estudiantes desde **Gestión del paralelo → Estudiantes que pertenecen al paralelo**. Esta pertenencia es distinta de aprobar una solicitud de práctica. El estudiante no puede asignarse un paralelo ni consultar candidatos de otra carrera.

La solicitud y su aprobación comprueban la pertenencia activa al paralelo concreto. Compartir ciclo académico no concede acceso a otros paralelos. Un estudiante puede solicitar y mantener prácticas en varios paralelos asignados, incluidos ciclos distintos de su carrera; se conserva una sola inscripción por estudiante/paralelo. Retirar la pertenencia impide nuevas solicitudes y la aprobación de pendientes, sin borrar ni suspender las prácticas ya aprobadas.

Al crear documentos con más de una práctica activa se debe indicar la inscripción correspondiente. La interfaz permite seleccionar la práctica y los defaults del servidor rechazan una elección implícita ambigua. El perfil mantiene su ciclo principal; las pertenencias adicionales no lo sobrescriben.
