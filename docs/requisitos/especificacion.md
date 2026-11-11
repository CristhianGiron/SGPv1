<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          especificacion.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Requisitos, actores y casos de uso de SGPv1.
-->

# Requisitos, actores y casos de uso de SGPv1

Catálogo de capacidades observadas en la API, la interfaz y la configuración
vigentes del proyecto. Los requisitos funcionales y no funcionales comparten
una tabla con una fila separadora. Las asociaciones entre requisitos, actores y
casos de uso se detallan en las tablas `REQ_ACT`, `CU_ACT` y `REQ_CU`; no
conceden permisos distintos de los comprobados en el backend.

Fuentes principales: [guía de API](../api/guia-postman.md),
[permisos de prácticas](../producto/permisos-practicas.md),
[roles del backend](../../BackEnd/src/main/java/com/sgp/systemsgp/enums/RoleName.java),
[controladores backend](../../BackEnd/src/main/java/com/sgp/systemsgp/controller)
y configuración de [navegación frontend](../../FrontEnd/src/config/navigation.js).

## Requisitos

| Código | Tipo | Nombre | Descripción |
| --- | --- | --- | --- |
| REQ-F-001 | Funcional | Iniciar sesión | El visitante puede enviar credenciales al servicio de autenticación para iniciar sesión. |
| REQ-F-002 | Funcional | Registrar estudiante | El visitante puede registrar una cuenta de estudiante con los datos requeridos y una imagen opcional. |
| REQ-F-003 | Funcional | Consultar ubicaciones públicas | El visitante puede consultar provincias, cantones y parroquias. |
| REQ-F-004 | Funcional | Consultar opciones de registro | El visitante puede consultar ciclos académicos, instituciones, cursos, grados y paralelos publicados para el registro. |
| REQ-F-005 | Funcional | Consultar imágenes públicas | El visitante puede consultar imágenes de interfaz marcadas como públicas. |
| REQ-F-074 | Funcional | Recuperar contraseña administrativa | Cuando la función está habilitada en la configuración, el visitante puede solicitar el cambio de contraseña de una cuenta administradora presentando la clave de recuperación válida. |
| REQ-F-006 | Funcional | Consultar perfil propio | El estudiante consulta los datos de su cuenta autenticada. |
| REQ-F-007 | Funcional | Actualizar perfil y contraseña | El estudiante actualiza los datos de su perfil y cambia la contraseña usando las operaciones de cuenta propias. |
| REQ-F-008 | Funcional | Solicitar inscripción | El estudiante solicita inscribirse en un curso disponible; el servicio valida la correspondencia del ciclo académico. |
| REQ-F-009 | Funcional | Consultar y retirar inscripciones propias | El estudiante consulta sus inscripciones y puede retirar una propia conforme al estado y validaciones del servicio. |
| REQ-F-010 | Funcional | Consultar prácticas propias | El estudiante consulta las prácticas asociadas a sus inscripciones. |
| REQ-F-011 | Funcional | Gestionar planes de actividades | El estudiante crea, consulta, actualiza y envía sus planes de actividades para revisión. |
| REQ-F-012 | Funcional | Gestionar informes de práctica | El estudiante crea, consulta, actualiza y envía informes de práctica disponibles para su inscripción. |
| REQ-F-013 | Funcional | Gestionar informe final | El estudiante crea, actualiza, consulta y envía su informe final, cuya revisión incluye los pasos configurados para tutores. |
| REQ-F-014 | Funcional | Consultar documentos y revisiones | El estudiante consulta el estado, detalle y retroalimentación de sus documentos y puede corregirlos cuando su estado lo permite. |
| REQ-F-015 | Funcional | Gestionar registro de actividades cumplidas | El estudiante crea, actualiza, consulta y envía su registro de actividades para revisión. |
| REQ-F-016 | Funcional | Consultar evaluación y seguimiento | El estudiante consulta la evaluación de actividades y el reporte de seguimiento asociados a su práctica. |
| REQ-F-017 | Funcional | Gestionar evidencias fotográficas | El estudiante carga, consulta y elimina evidencias propias conforme a las reglas del módulo. |
| REQ-F-018 | Funcional | Gestionar entrevistas y fichas | El estudiante crea y consulta entrevistas y fichas de observación propias; responde preguntas e interpreta respuestas cuando el formulario habilita esas acciones. |
| REQ-F-019 | Funcional | Gestionar planificación didáctica | El estudiante crea, consulta y actualiza planificaciones vinculadas a su práctica, envía la planificación y consulta recomendaciones. |
| REQ-F-020 | Funcional | Consultar jornadas y asistencias | El estudiante consulta sus jornadas y los registros de asistencia de su práctica. |
| REQ-F-021 | Funcional | Consultar y leer notificaciones | El estudiante lista sus notificaciones, consulta el conteo y marca una o todas como leídas. |
| REQ-F-022 | Funcional | Descargar documentos disponibles | El estudiante descarga los documentos PDF que su práctica y el estado del documento permiten. |
| REQ-F-023 | Funcional | Consultar perfil propio | El tutor institucional consulta los datos de su cuenta autenticada. |
| REQ-F-024 | Funcional | Consultar prácticas asignadas | El tutor institucional consulta inscripciones y prácticas gestionadas según sus asignaciones. |
| REQ-F-025 | Funcional | Gestionar horario de práctica | El tutor institucional crea y actualiza horarios de prácticas asignadas. |
| REQ-F-026 | Funcional | Registrar asistencia | El tutor institucional crea y actualiza registros de asistencia asociados a los horarios que gestiona. |
| REQ-F-027 | Funcional | Gestionar sección institucional del informe final | El tutor institucional actualiza la sección institucional del informe final y registra su revisión. |
| REQ-F-028 | Funcional | Revisar informes finales | El tutor institucional consulta la cola de revisión institucional y registra su decisión sobre informes finales asignados. |
| REQ-F-029 | Funcional | Gestionar entrevistas asignadas | El tutor institucional consulta entrevistas asignadas y registra respuestas cuando es destinatario. |
| REQ-F-030 | Funcional | Gestionar planificaciones institucionales | El tutor institucional crea y actualiza planificaciones asociadas a sus prácticas y adjunta o consulta el PDF correspondiente. |
| REQ-F-031 | Funcional | Recomendar planificaciones | El tutor institucional registra recomendaciones en planificaciones de estudiantes dentro de su ámbito autorizado. |
| REQ-F-032 | Funcional | Consultar documentos de práctica | El tutor institucional consulta documentos de las prácticas incluidas en sus asignaciones. |
| REQ-F-033 | Funcional | Consultar perfil propio | La directora consulta los datos de su cuenta autenticada. |
| REQ-F-034 | Funcional | Consultar jornadas institucionales | La directora consulta jornadas y asistencias vinculadas a su institución mediante las vistas de revisión disponibles. |
| REQ-F-035 | Funcional | Consultar entrevistas institucionales | La directora consulta entrevistas dentro del ámbito institucional autorizado y responde cuando el formulario la designa como destinataria. |
| REQ-F-036 | Funcional | Consultar perfil propio | El tutor de prácticas consulta los datos de su cuenta autenticada. |
| REQ-F-037 | Funcional | Gestionar grupos de práctica | El tutor de prácticas consulta y mantiene los grupos o paralelos incluidos en sus asignaciones. |
| REQ-F-038 | Funcional | Asignar estudiantes a grupos | El tutor de prácticas asigna inscripciones a grupos de práctica cuando está autorizado por el servicio. |
| REQ-F-039 | Funcional | Revisar documentos de práctica | El tutor de prácticas consulta las listas de revisión y envíos, y revisa planes e informes de prácticas asignadas. |
| REQ-F-040 | Funcional | Revisar informes finales | El tutor de prácticas consulta la cola de revisión correspondiente y registra su decisión sobre informes finales asignados. |
| REQ-F-041 | Funcional | Gestionar evaluación de actividades | El tutor de prácticas crea, consulta y actualiza evaluaciones de actividades de prácticas asignadas. |
| REQ-F-042 | Funcional | Gestionar reporte de seguimiento | El tutor de prácticas crea, consulta y actualiza reportes de seguimiento de prácticas asignadas. |
| REQ-F-043 | Funcional | Revisar registros de actividades | El tutor de prácticas revisa registros enviados por estudiantes y registra aprobación, observaciones o retroalimentación disponible. |
| REQ-F-044 | Funcional | Consultar evidencias y formularios | El tutor de prácticas consulta evidencias, entrevistas y fichas de observación dentro de sus asignaciones. |
| REQ-F-045 | Funcional | Recomendar planificaciones | El tutor de prácticas registra recomendaciones en planificaciones de estudiantes dentro de su ámbito autorizado. |
| REQ-F-046 | Funcional | Consultar jornadas y asistencias | El tutor de prácticas consulta jornadas y asistencias de prácticas dentro de su ámbito. |
| REQ-F-047 | Funcional | Descargar documentos PDF | El tutor de prácticas descarga los documentos PDF que el módulo y su autorización permiten. |
| REQ-F-048 | Funcional | Consultar perfil propio | El director consulta los datos de su cuenta autenticada. |
| REQ-F-049 | Funcional | Gestionar instituciones de práctica | El director consulta, busca y mantiene instituciones de práctica mediante las operaciones autorizadas. |
| REQ-F-050 | Funcional | Gestionar catálogos universitarios | El director consulta y mantiene los catálogos universitarios habilitados para su rol. |
| REQ-F-051 | Funcional | Gestionar cursos y tutores | El director crea, consulta, actualiza, activa, desactiva, bloquea, restaura y asigna tutores a cursos dentro de sus permisos. |
| REQ-F-052 | Funcional | Consultar solicitudes de inscripción | El director consulta inscripciones de los cursos de su ámbito y aprueba o rechaza solicitudes pendientes. |
| REQ-F-053 | Funcional | Concluir y reabrir prácticas | El director concluye prácticas aprobadas y reabre prácticas concluidas mediante las operaciones disponibles. |
| REQ-F-054 | Funcional | Consultar documentos enviados | El director consulta listados y resúmenes de documentos enviados correspondientes a su ámbito. |
| REQ-F-055 | Funcional | Consultar evidencias, formularios y asistencias | El director consulta evidencias, entrevistas, fichas, jornadas y asistencias de prácticas dentro de su ámbito autorizado. |
| REQ-F-056 | Funcional | Consultar seguimiento de coordinación | El director consulta el reporte de coordinación y sus indicadores de seguimiento disponibles. |
| REQ-F-057 | Funcional | Recomendar planificaciones | El director registra recomendaciones en planificaciones de estudiantes dentro de su ámbito autorizado. |
| REQ-F-058 | Funcional | Descargar documentos PDF | El director descarga los documentos PDF disponibles para sus permisos y ámbito. |
| REQ-F-059 | Funcional | Crear cuenta administrativa | El administrador crea cuentas con los roles y datos requeridos por las reglas de asignación. |
| REQ-F-060 | Funcional | Mantener estado de cuentas | El administrador bloquea, desbloquea, desactiva, habilita, restaura y elimina cuentas mediante las operaciones disponibles. |
| REQ-F-061 | Funcional | Asignar ciclo académico a estudiante | El administrador actualiza el ciclo académico asociado a una cuenta estudiantil. |
| REQ-F-062 | Funcional | Administrar instituciones | El administrador crea, consulta, busca, actualiza, activa, desactiva, restaura o elimina instituciones, incluidas las operaciones definitivas disponibles. |
| REQ-F-063 | Funcional | Administrar catálogos académicos | El administrador mantiene facultades, carreras, ciclos académicos, asignaturas, grados y paralelos. |
| REQ-F-064 | Funcional | Administrar ubicaciones | El administrador crea provincias, cantones y parroquias. |
| REQ-F-065 | Funcional | Administrar cursos y grupos | El administrador mantiene cursos y grupos, asigna tutores y gestiona su estado conforme a las operaciones disponibles. |
| REQ-F-066 | Funcional | Resolver inscripciones | El administrador consulta las inscripciones de su alcance y aprueba o rechaza las solicitudes pendientes. |
| REQ-F-067 | Funcional | Archivar prácticas concluidas | El administrador archiva y desarchiva prácticas concluidas individualmente o por lote, y consulta el archivo. |
| REQ-F-068 | Funcional | Administrar documentos y revisiones | El administrador consulta documentos y resúmenes disponibles y realiza las acciones de supervisión habilitadas para su rol. |
| REQ-F-069 | Funcional | Enviar anuncios | El administrador envía anuncios a usuarios o roles destinatarios mediante el servicio de notificaciones. |
| REQ-F-070 | Funcional | Consultar reporte de coordinación | El administrador consulta el reporte de coordinación disponible. |
| REQ-F-071 | Funcional | Administrar imágenes de interfaz | El administrador lista, carga, actualiza y elimina imágenes de interfaz mediante las operaciones de administración. |
| REQ-F-072 | Funcional | Recomendar planificaciones | El administrador registra recomendaciones en planificaciones de estudiantes cuando la operación está disponible para su rol. |
| REQ-F-073 | Funcional | Descargar documentos PDF | El administrador descarga los documentos PDF expuestos por los módulos del sistema. |
| **Separador** | **REQUISITOS NO FUNCIONALES** |  |  |
| REQ-NF-001 | No funcional | Hash de contraseñas | El backend codifica contraseñas con BCrypt antes de almacenarlas. |
| REQ-NF-002 | No funcional | Sesión sin estado | La seguridad HTTP configura sesiones stateless y exige autenticación en las rutas protegidas. |
| REQ-NF-003 | No funcional | Tokens con expiración | La autenticación entrega tokens firmados con expiración configurable; el token de acceso tiene un valor predeterminado de 24 horas. |
| REQ-NF-004 | No funcional | Limitación de intentos | El filtro limita por dirección IP el inicio de sesión a 8 solicitudes por minuto, el registro a 5 cada 10 minutos, la creación administrativa de cuentas a 20 cada 10 minutos, la creación inicial de administrador a 3 por hora y el cambio de contraseña a 6 cada 5 minutos; responde HTTP 429 e incluye `Retry-After`. |
| REQ-NF-005 | No funcional | Límites de carga | La configuración HTTP limita carga multipart general a 60 MB por archivo y solicitud. Los módulos también aplican límites específicos: fotografía de práctica 15 MB, imagen de perfil 5 MB, PDF de planificación 10 MB e imagen de interfaz 4 MB. |
| REQ-NF-006 | No funcional | Validación de archivos | Los módulos de fotografía, perfil e imagen de interfaz validan tipos de imagen admitidos; el módulo de planificación valida el archivo PDF antes de almacenarlo. |
| REQ-NF-007 | No funcional | Autorización por rol y ámbito | Los controladores y servicios aplican roles, propiedad y ámbito de asignación para proteger operaciones y datos. |
| REQ-NF-008 | No funcional | Validación de reglas de dominio | Las operaciones validan estados y relaciones del dominio, incluyendo ciclo académico, asignación a prácticas, transiciones de revisión y reglas de horarios/asistencia. |
| REQ-NF-009 | No funcional | Trazabilidad de revisiones | Los documentos revisables conservan el historial de feedback por ciclo con la información de autor y fecha implementada. |
| REQ-NF-010 | No funcional | Configuración de producción | El perfil de producción permite configurar sus secretos y conexión externamente, usa validación del esquema (`ddl-auto=validate`) y habilita Flyway por defecto. |
| REQ-NF-011 | No funcional | Aislamiento de pruebas | La configuración de pruebas usa H2 en memoria, crea y elimina el esquema para la ejecución y mantiene Flyway deshabilitado en ese perfil. |
| REQ-NF-012 | No funcional | Navegadores de producción | El frontend declara como objetivo de producción navegadores con más de 0,2 % de uso, no obsoletos, y excluye Opera Mini en `browserslist`. |
| REQ-NF-013 | No funcional | Recuperación administrativa configurable | La recuperación especial de contraseña administrativa está deshabilitada por defecto y requiere habilitación explícita y una clave de recuperación configurada. |

## Actores

| Código | Nombre | Descripción |
| --- | --- | --- |
| ACT-001 | Visitante | Persona no autenticada que accede a las funciones públicas de autenticación, registro y consulta de información pública. |
| ACT-002 | Estudiante | Usuario que gestiona sus propias inscripciones, prácticas, documentos, evidencias, formularios y registros. |
| ACT-003 | Tutor institucional | Usuario que gestiona o revisa prácticas asignadas desde una institución educativa. |
| ACT-004 | Directora de institución | Usuario que consulta información vinculada a su institución en las vistas habilitadas. |
| ACT-005 | Tutor de prácticas | Usuario que gestiona grupos asignados y supervisa documentos y actividades de las prácticas bajo su ámbito. |
| ACT-006 | Director de prácticas | Usuario que coordina cursos, instituciones y prácticas dentro de su ámbito y consulta el reporte de coordinación. |
| ACT-007 | Administrador | Usuario autorizado para gestionar cuentas, catálogos, instituciones, prácticas archivadas, anuncios e imágenes de interfaz. |
| ACT-008 | Sistema SGP | Software que aplica autenticación, autorización, validaciones, límites y las demás restricciones técnicas descritas en los requisitos no funcionales. |

## Casos de uso

| Código | Nombre | Descripción |
| --- | --- | --- |
| CU-001 | Iniciar sesión | ACT-001 o cualquier actor con cuenta presenta credenciales y accede a las funciones autorizadas. |
| CU-002 | Registrar estudiante | ACT-001 crea una cuenta estudiantil mediante el registro público. |
| CU-003 | Consultar información pública de registro | ACT-001 consulta catálogos públicos para completar el registro. |
| CU-004 | Gestionar perfil | ACT-002–ACT-007 consultan o actualizan los datos de su cuenta y las acciones personales habilitadas. |
| CU-005 | Administrar cuentas | ACT-007 crea cuentas, busca usuarios y cambia el estado de cuentas existentes. |
| CU-006 | Mantener ubicaciones y catálogos | ACT-007 administra ubicaciones y catálogos académicos. |
| CU-007 | Gestionar instituciones | ACT-006 o ACT-007 consulta y mantiene instituciones dentro del alcance autorizado. |
| CU-008 | Gestionar cursos y grupos | ACT-005, ACT-006 o ACT-007 consulta o mantiene cursos, grupos y asignaciones permitidas. |
| CU-009 | Solicitar y resolver inscripción | ACT-002 solicita o retira una inscripción; ACT-006 o ACT-007 aprueba o rechaza solicitudes pendientes. |
| CU-010 | Asignar estudiante a grupo | ACT-005 o ACT-007 asigna una inscripción a un grupo cuando el servicio lo autoriza. |
| CU-011 | Concluir o reabrir práctica | ACT-006 concluye o reabre una práctica conforme a su estado. |
| CU-012 | Archivar o recuperar práctica | ACT-007 archiva o desarchiva prácticas concluidas, individualmente o por lote. |
| CU-013 | Gestionar documentos de práctica | ACT-002 crea, actualiza, envía y consulta documentos propios; ACT-003, ACT-005, ACT-006 o ACT-007 consulta los documentos disponibles en su ámbito. |
| CU-014 | Revisar documento | ACT-003 o ACT-005 revisa un documento asignado y registra su decisión y retroalimentación. |
| CU-015 | Consultar evaluación o seguimiento | ACT-002 consulta sus registros; ACT-005 gestiona evaluaciones y reportes de seguimiento asignados. |
| CU-016 | Gestionar registro de actividades | ACT-002 crea y envía su registro; ACT-005 revisa y registra retroalimentación. |
| CU-017 | Gestionar evidencias fotográficas | ACT-002 carga y consulta evidencias propias; los actores supervisores autorizados consultan evidencias de su ámbito. |
| CU-018 | Gestionar entrevistas y fichas | ACT-002 o los tutores y responsables institucionales autorizados crean, responden o consultan formularios dentro de su ámbito. |
| CU-019 | Gestionar jornadas y asistencias | ACT-003 registra jornadas y asistencias; ACT-002, ACT-004, ACT-005, ACT-006 o ACT-007 consulta registros según sus permisos. |
| CU-020 | Gestionar planificación didáctica | ACT-002 o ACT-003 gestiona una planificación; los roles supervisores autorizados registran recomendaciones. |
| CU-021 | Consultar panel y notificaciones | ACT-002–ACT-007 consulta el panel y sus notificaciones, y actualiza su estado de lectura. |
| CU-022 | Enviar anuncio | ACT-007 envía un anuncio a los destinatarios admitidos por el servicio. |
| CU-023 | Consultar reporte de coordinación | ACT-006 o ACT-007 consulta los indicadores implementados para coordinación. |
| CU-024 | Administrar imágenes de interfaz | ACT-007 mantiene imágenes de interfaz y ACT-001 consulta las publicadas. |
| CU-025 | Descargar documento PDF | ACT-002–ACT-007 descarga un documento cuando el módulo y su autorización ofrecen esa operación. |
| CU-026 | Recuperar contraseña administrativa | ACT-001 cambia una contraseña administradora mediante el endpoint temporal únicamente cuando la función está habilitada y proporciona la clave de recuperación válida. |

## Alcance y criterio de inclusión

- Se excluyen requisitos o actores no implementados, aunque aparezcan en
  documentos externos o exportaciones históricas.
- `ROLE_TUTOR_ACADEMICO` no se incluye como actor porque no está presente en el
  enum de roles del backend actual.
- La recuperación administrativa se incluye como función condicional: el
  endpoint existe, pero la función está deshabilitada por defecto.
- Los requisitos funcionales se separan por actor responsable. Los no
  funcionales describen propiedades del sistema y se agrupan bajo ACT-008.
- Las descripciones recogen capacidades identificadas en controladores,
  servicios, configuración y navegación; no son una afirmación de que cada
  escenario haya superado pruebas de aceptación.

**Leyenda de matrices:** ☑ indica que existe una relación entre la fila y la columna.

## REQ_ACT

| Código requisito | ACT-001 | ACT-002 | ACT-003 | ACT-004 | ACT-005 | ACT-006 | ACT-007 | ACT-008 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-F-001 | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |  |
| REQ-F-002 | ☑ |  |  |  |  |  |  |  |
| REQ-F-003 | ☑ |  |  |  |  |  |  |  |
| REQ-F-004 | ☑ |  |  |  |  |  | ☑ |  |
| REQ-F-005 | ☑ |  |  |  |  |  | ☑ |  |
| REQ-F-006 |  | ☑ |  |  |  |  | ☑ |  |
| REQ-F-007 |  | ☑ |  |  |  |  | ☑ |  |
| REQ-F-008 |  | ☑ | ☑ |  | ☑ | ☑ | ☑ |  |
| REQ-F-009 |  | ☑ | ☑ |  | ☑ | ☑ | ☑ |  |
| REQ-F-010 |  | ☑ | ☑ |  | ☑ | ☑ | ☑ |  |
| REQ-F-011 |  | ☑ | ☑ |  | ☑ | ☑ | ☑ |  |
| REQ-F-012 |  | ☑ | ☑ |  | ☑ | ☑ | ☑ |  |
| REQ-F-013 |  | ☑ | ☑ |  | ☑ | ☑ | ☑ |  |
| REQ-F-014 |  | ☑ | ☑ |  | ☑ |  |  |  |
| REQ-F-015 |  | ☑ |  |  | ☑ |  |  |  |
| REQ-F-016 |  | ☑ |  |  | ☑ |  |  |  |
| REQ-F-017 |  | ☑ | ☑ |  | ☑ | ☑ | ☑ |  |
| REQ-F-018 |  | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |  |
| REQ-F-019 |  | ☑ | ☑ |  | ☑ | ☑ | ☑ |  |
| REQ-F-020 |  | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |  |
| REQ-F-021 |  | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |  |
| REQ-F-022 |  | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |  |
| REQ-F-023 |  | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |  |
| REQ-F-024 |  | ☑ | ☑ |  | ☑ | ☑ | ☑ |  |
| REQ-F-025 |  | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |  |
| REQ-F-026 |  | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |  |
| REQ-F-027 |  | ☑ | ☑ |  | ☑ | ☑ | ☑ |  |
| REQ-F-028 |  | ☑ | ☑ |  | ☑ | ☑ | ☑ |  |
| REQ-F-029 |  | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |  |
| REQ-F-030 |  | ☑ | ☑ |  | ☑ | ☑ | ☑ |  |
| REQ-F-031 |  | ☑ | ☑ |  | ☑ | ☑ | ☑ |  |
| REQ-F-032 |  | ☑ | ☑ |  | ☑ | ☑ | ☑ |  |
| REQ-F-033 |  | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |  |
| REQ-F-034 |  | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |  |
| REQ-F-035 |  | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |  |
| REQ-F-036 |  | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |  |
| REQ-F-037 |  | ☑ |  |  | ☑ | ☑ | ☑ |  |
| REQ-F-038 |  |  |  |  | ☑ |  | ☑ |  |
| REQ-F-039 |  | ☑ | ☑ |  | ☑ | ☑ | ☑ |  |
| REQ-F-040 |  | ☑ | ☑ |  | ☑ | ☑ | ☑ |  |
| REQ-F-041 |  | ☑ |  |  | ☑ |  |  |  |
| REQ-F-042 |  | ☑ |  |  | ☑ |  |  |  |
| REQ-F-043 |  | ☑ |  |  | ☑ |  |  |  |
| REQ-F-044 |  | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |  |
| REQ-F-045 |  | ☑ | ☑ |  | ☑ | ☑ | ☑ |  |
| REQ-F-046 |  | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |  |
| REQ-F-047 |  | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |  |
| REQ-F-048 |  | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |  |
| REQ-F-049 |  |  |  |  | ☑ | ☑ | ☑ |  |
| REQ-F-050 |  |  |  |  |  | ☑ | ☑ |  |
| REQ-F-051 |  | ☑ |  |  |  | ☑ | ☑ |  |
| REQ-F-052 |  | ☑ | ☑ |  | ☑ | ☑ | ☑ |  |
| REQ-F-053 |  |  |  |  |  | ☑ |  |  |
| REQ-F-054 |  |  | ☑ |  | ☑ | ☑ |  |  |
| REQ-F-055 |  | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |  |
| REQ-F-056 |  |  |  |  |  | ☑ | ☑ |  |
| REQ-F-057 |  | ☑ | ☑ |  | ☑ | ☑ | ☑ |  |
| REQ-F-058 |  | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |  |
| REQ-F-059 |  |  |  |  |  |  | ☑ |  |
| REQ-F-060 |  |  |  |  |  |  | ☑ |  |
| REQ-F-061 |  |  |  |  |  |  | ☑ |  |
| REQ-F-062 |  |  |  |  |  |  | ☑ |  |
| REQ-F-063 |  |  |  |  |  |  | ☑ |  |
| REQ-F-064 |  |  |  |  |  |  | ☑ |  |
| REQ-F-065 |  | ☑ |  |  |  | ☑ | ☑ |  |
| REQ-F-066 |  | ☑ | ☑ |  | ☑ | ☑ | ☑ |  |
| REQ-F-067 |  |  |  |  |  |  | ☑ |  |
| REQ-F-068 |  | ☑ | ☑ |  | ☑ | ☑ | ☑ |  |
| REQ-F-069 |  |  |  |  |  |  | ☑ |  |
| REQ-F-070 |  |  |  |  |  | ☑ | ☑ |  |
| REQ-F-071 | ☑ |  |  |  |  |  | ☑ |  |
| REQ-F-072 |  | ☑ | ☑ |  | ☑ | ☑ | ☑ |  |
| REQ-F-073 |  | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |  |
| REQ-F-074 | ☑ |  |  |  |  |  |  |  |
| REQ-NF-001 | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| REQ-NF-002 | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| REQ-NF-003 | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| REQ-NF-004 | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| REQ-NF-005 | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| REQ-NF-006 | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| REQ-NF-007 | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| REQ-NF-008 |  | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| REQ-NF-009 |  | ☑ | ☑ |  | ☑ | ☑ | ☑ | ☑ |
| REQ-NF-010 |  |  |  |  |  |  |  | ☑ |
| REQ-NF-011 |  |  |  |  |  |  |  | ☑ |
| REQ-NF-012 |  |  |  |  |  |  |  | ☑ |
| REQ-NF-013 | ☑ |  |  |  |  |  |  | ☑ |

## CU_ACT

| Código caso de uso | ACT-001 | ACT-002 | ACT-003 | ACT-004 | ACT-005 | ACT-006 | ACT-007 | ACT-008 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CU-001 | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |  |
| CU-002 | ☑ |  |  |  |  |  |  |  |
| CU-003 | ☑ |  |  |  |  |  |  |  |
| CU-004 |  | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |  |
| CU-005 |  |  |  |  |  |  | ☑ |  |
| CU-006 |  |  |  |  |  |  | ☑ |  |
| CU-007 |  |  |  |  | ☑ | ☑ | ☑ |  |
| CU-008 |  | ☑ |  |  |  | ☑ | ☑ |  |
| CU-009 |  | ☑ | ☑ |  | ☑ | ☑ | ☑ |  |
| CU-010 |  |  |  |  | ☑ |  | ☑ |  |
| CU-011 |  |  |  |  |  | ☑ |  |  |
| CU-012 |  |  |  |  |  |  | ☑ |  |
| CU-013 |  | ☑ | ☑ |  | ☑ | ☑ | ☑ |  |
| CU-014 |  |  | ☑ |  | ☑ |  |  |  |
| CU-015 |  | ☑ |  |  | ☑ |  |  |  |
| CU-016 |  | ☑ |  |  | ☑ |  |  |  |
| CU-017 |  | ☑ | ☑ |  | ☑ | ☑ | ☑ |  |
| CU-018 |  | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |  |
| CU-019 |  | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |  |
| CU-020 |  | ☑ | ☑ |  | ☑ | ☑ | ☑ |  |
| CU-021 |  | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |  |
| CU-022 |  |  |  |  |  |  | ☑ |  |
| CU-023 |  |  |  |  |  | ☑ | ☑ |  |
| CU-024 | ☑ |  |  |  |  |  | ☑ |  |
| CU-025 |  | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |  |
| CU-026 | ☑ |  |  |  |  |  |  |  |

## Trazabilidad de relaciones

- `REQ_ACT` incluye al actor responsable y a los actores participantes en los casos de uso relacionados.
- `CU_ACT` registra actores que participan directamente en cada caso de uso.
- `REQ_CU` relaciona requisitos con los casos que los realizan. Los requisitos no funcionales transversales de despliegue, pruebas y navegadores no se fuerzan a un caso de uso cuando no tienen una relación directa.

## REQ_CU

| Código requisito | CU-001 | CU-002 | CU-003 | CU-004 | CU-005 | CU-006 | CU-007 | CU-008 | CU-009 | CU-010 | CU-011 | CU-012 | CU-013 | CU-014 | CU-015 | CU-016 | CU-017 | CU-018 | CU-019 | CU-020 | CU-021 | CU-022 | CU-023 | CU-024 | CU-025 | CU-026 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-F-001 | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-002 |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-003 |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-004 |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |
| REQ-F-005 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |
| REQ-F-006 |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-007 |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-008 |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-009 |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-010 |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-011 |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-012 |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-013 |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-014 |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-015 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |
| REQ-F-016 |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-017 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |
| REQ-F-018 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |
| REQ-F-019 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |
| REQ-F-020 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |
| REQ-F-021 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |
| REQ-F-022 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |
| REQ-F-023 |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-024 |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-025 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |
| REQ-F-026 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |
| REQ-F-027 |  |  |  |  |  |  |  |  |  |  |  |  | ☑ | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-028 |  |  |  |  |  |  |  |  |  |  |  |  | ☑ | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-029 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |
| REQ-F-030 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |
| REQ-F-031 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |
| REQ-F-032 |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-033 |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-034 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |
| REQ-F-035 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |
| REQ-F-036 |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-037 |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-038 |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-039 |  |  |  |  |  |  |  |  |  |  |  |  | ☑ | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-040 |  |  |  |  |  |  |  |  |  |  |  |  | ☑ | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-041 |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-042 |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-043 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |
| REQ-F-044 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ | ☑ |  |  |  |  |  |  |  |  |
| REQ-F-045 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |
| REQ-F-046 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |
| REQ-F-047 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |
| REQ-F-048 |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-049 |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-050 |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-051 |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-052 |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-053 |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-054 |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-055 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ | ☑ | ☑ |  |  |  |  |  |  |  |
| REQ-F-056 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |
| REQ-F-057 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |
| REQ-F-058 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |
| REQ-F-059 |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-060 |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-061 |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-062 |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-063 |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-064 |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-065 |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-066 |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-067 |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-068 |  |  |  |  |  |  |  |  |  |  |  |  | ☑ | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-F-069 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |
| REQ-F-070 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |
| REQ-F-071 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |
| REQ-F-072 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |  |  |  |  |  |
| REQ-F-073 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |  |
| REQ-F-074 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |
| REQ-NF-001 | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-NF-002 | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-NF-003 | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-NF-004 | ☑ | ☑ |  |  | ☑ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |
| REQ-NF-005 |  | ☑ |  | ☑ |  |  |  |  |  |  |  |  | ☑ |  |  |  | ☑ |  |  | ☑ |  |  |  | ☑ | ☑ |  |
| REQ-NF-006 |  | ☑ |  | ☑ |  |  |  |  |  |  |  |  | ☑ |  |  |  | ☑ |  |  | ☑ |  |  |  | ☑ |  |  |
| REQ-NF-007 |  |  |  | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |  |
| REQ-NF-008 |  |  |  |  |  |  |  | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |  |  |  |  |  |  |
| REQ-NF-009 |  |  |  |  |  |  |  |  |  |  |  |  | ☑ | ☑ |  | ☑ |  |  |  |  |  |  |  |  |  |  |
| REQ-NF-010 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-NF-011 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-NF-012 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| REQ-NF-013 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ☑ |

