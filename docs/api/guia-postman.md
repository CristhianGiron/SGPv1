<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          guia-postman.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Guía Postman de la API SGPv1.
-->

# Guía Postman de la API SGPv1

Punto de entrada para probar la API. Los ejemplos están separados por área; los documentos L.1–L.6 conservan su numeración institucional. La secuencia de trabajo puede comenzar por L.2 y no equivale al orden numérico de los formatos.

## Ambiente

Crea un Environment en Postman con estas variables:

| Variable | Valor inicial |
| --- | --- |
| `baseUrl` | `http://localhost:8080` |
| `adminToken` | vacío |
| `directorToken` | vacío |
| `studentToken` | vacío |
| `accountId` | vacío |
| `institutionId` | vacío |
| `facultyId` | vacío |
| `careerId` | vacío |
| `academicCycleId` | vacío |
| `gradeId` | vacío |
| `subjectId` | vacío |
| `courseId` | vacío |
| `enrollmentId` | vacío |
| `practiceId` | vacío; práctica ofrecida a un paralelo |
| `studentId` | vacío; estudiante del listado académico |
| `practicePhotoId` | vacío |
| `provinceId` | vacío |
| `cantonId` | vacío |
| `activityEvaluationId` | vacío; asignar la respuesta correspondiente |
| `activityPlanId` | vacío; asignar la respuesta correspondiente |
| `attendanceId` | vacío; asignar la respuesta correspondiente |
| `completedActivityRecordId` | vacío; asignar la respuesta correspondiente |
| `finalReportId` | vacío; asignar la respuesta correspondiente |
| `practiceFollowUpReportId` | vacío; asignar la respuesta correspondiente |
| `practiceReportId` | vacío; asignar la respuesta correspondiente |
| `practiceScheduleId` | vacío; asignar la respuesta correspondiente |
| `schoolInstitutionId` | vacío; asignar la respuesta correspondiente |
| `practiceTutorToken` | vacío; asignar la respuesta correspondiente |
| `institutionalTutorToken` | vacío; asignar la respuesta correspondiente |
| `institutionDirectorToken` | vacío; asignar la respuesta correspondiente |
| `didacticPlanId` | vacío; asignar la respuesta correspondiente |
| `practiceFormId` | vacío; asignar la respuesta correspondiente |
| `questionId` | vacío; asignar la respuesta correspondiente |
| `notificationId` | vacío; asignar la respuesta correspondiente |
| `groupId` | vacío; asignar la respuesta correspondiente |

Para endpoints protegidos usa `Authorization > Bearer Token`:

| Rol | Token |
| --- | --- |
| Admin | `{{adminToken}}` |
| Director de prácticas | `{{directorToken}}` |
| Estudiante | `{{studentToken}}` |
| Tutor de prácticas | `{{practiceTutorToken}}` |
| Tutor institucional | `{{institutionalTutorToken}}` |
| Directora de institución | `{{institutionDirectorToken}}` |

## Usuarios de prueba: usuarios, correos y contraseñas

Estas son las **18 cuentas ficticias de demostración** registradas en el [manifiesto de usuarios](../testing/datos/usuarios-demostracion.json). Los correos corresponden a la regla del [script de carga](../testing/datos/cargar_demostracion.py): el nombre después de `demo2026.` seguido de `@demo.example.test`.

La contraseña indicada es la de la carga de demostración documentada. Si una cuenta fue modificada posteriormente, utiliza su contraseña actual; esta tabla no implica una comprobación de acceso en vivo.

### Estudiantes

| Nombre | Usuario | Correo | Contraseña | Escenario de demostración |
| --- | --- | --- | --- | --- |
| Antonella María Carrión Delgado | `demo2026.antonella.carrion` | `antonella.carrion@demo.example.test` | `DemoPracticas2026!` | Práctica concluida |
| Camila Alejandra Espinosa Rojas | `demo2026.camila.espinosa` | `camila.espinosa@demo.example.test` | `DemoPracticas2026!` | Práctica activa |
| Daniela Belén Villavicencio Ruiz | `demo2026.daniela.villavicencio` | `daniela.villavicencio@demo.example.test` | `DemoPracticas2026!` | Plan en borrador |
| David Francisco Alvarado Zambrano | `demo2026.david.alvarado` | `david.alvarado@demo.example.test` | `DemoPracticas2026!` | Práctica archivada |
| Emilio Alejandro Aguirre Castillo | `demo2026.emilio.aguirre` | `emilio.aguirre@demo.example.test` | `DemoPracticas2026!` | Plan con observaciones |
| Gabriel Esteban Romero Pardo | `demo2026.gabriel.romero` | `gabriel.romero@demo.example.test` | `DemoPracticas2026!` | Plan aprobado |
| Isabela Fernanda Samaniego León | `demo2026.isabela.
samaniego` | `isabela.samaniego@demo.example.test` | `DemoPracticas2026!` | Plan enviado |
| Mateo Andrés Ortega Salazar | `demo2026.mateo.ortega` | `mateo.ortega@demo.example.test` | `DemoPracticas2026!` | Solicitud pendiente |
| Nicolás Sebastián Pineda Torres | `demo2026.nicolas.pineda` | `nicolas.pineda@demo.example.test` | `DemoPracticas2026!` | Práctica activa |
| Sebastián David Maldonado Vélez | `demo2026.sebastian.maldonado` | `sebastian.maldonado@demo.example.test` | `DemoPracticas2026!` | Plan en borrador |
| Sofía Gabriela Quezada Moreno | `demo2026.sofia.quezada` | `sofia.quezada@demo.example.test` | `DemoPracticas2026!` | Plan aprobado |
| Valentina Isabel Jaramillo Cueva | `demo2026.valentina.jaramillo` | `valentina.jaramillo@demo.example.test` | `DemoPracticas2026!` | Solicitud pendiente |

### Tutorías y direcciones

| Nombre | Rol | Usuario | Correo | Contraseña |
| --- | --- | --- | --- | --- |
| Teresa Elizabeth Cabrera Ríos | Dirección de institución | `demo2026.teresa.cabrera` | `teresa.cabrera@demo.example.test` | `DemoPracticas2026!` |
| Marcela Patricia Vélez Samaniego | Dirección de prácticas | `demo2026.marcela.velez` | `marcela.velez@demo.example.test` | `DemoPracticas2026!` |
| Elena Rocío Benítez Palacios | Tutor institucional | `demo2026.elena.benitez` | `elena.benitez@demo.example.test` | `DemoPracticas2026!` |
| Javier Eduardo Ríos Valdivieso | Tutor institucional | `demo2026.javier.rios` | `javier.rios@demo.example.test` | `DemoPracticas2026!` |
| Andrés Mauricio Córdova Molina | Tutor de prácticas | `demo2026.andres.cordova` | `andres.cordova@demo.example.test` | `DemoPracticas2026!` |
| Paola Cristina Salinas Cabrera | Tutor de prácticas | `demo2026.paola.salinas` | `paola.salinas@demo.example.test` | `DemoPracticas2026!` |

La carga no creó cuentas administradoras adicionales. La contraseña de estas cuentas de demostración **no debe atribuirse a `admin` ni a usuarios anteriores**. Para administración, utiliza la cuenta local existente y su contraseña vigente.

Para probar un rol, inicia sesión con el **usuario** de esa fila y guarda el token en la variable correspondiente: `studentToken`, `practiceTutorToken`, `institutionalTutorToken`, `directorToken` o `institutionDirectorToken`. El [inicio de sesión](postman/autenticacion.md) recibe `username` y `password`; el correo de la tabla identifica la cuenta y no sustituye ese campo.

## Guías por área

| Área | Contenido |
| --- | --- |
| [Autenticación y tokens](postman/autenticacion.md) | Login y Tokens |
| [Cuentas y perfiles](postman/cuentas.md) | Cuentas |
| [Catálogos académicos y territoriales](postman/catalogos.md) | Ubicaciones, Instituciones, Facultades, Carreras, Ciclos Academicos, Grados, Asignaturas |
| [Paralelos e inscripciones](postman/practicas.md) | Cursos y Practicas, Inscripciones |
| [L.1. Informe de actividades cumplidas](postman/documentos/01-informe-actividades.md) | Informes de Practicas |
| [L.2. Plan de actividades](postman/documentos/02-plan-actividades.md) | Planes de Actividades |
| [L.3. Informe de tutor institucional](postman/documentos/03-informe-tutor-institucional.md) | Informes Finales |
| [L.4. Evaluación de actividades](postman/documentos/04-evaluacion-actividades.md) | Evaluacion de Actividades Realizadas |
| [L.5. Reporte de seguimiento](postman/documentos/05-seguimiento.md) | Reporte de Seguimiento de Practica Preprofesional |
| [L.6. Registro de actividades cumplidas](postman/documentos/06-registro-actividades.md) | Registro de Actividades Cumplidas |
| [Evidencias, jornadas y asistencias](postman/evidencias-jornadas.md) | Fotografias de Practicas, Horario y Asistencias de Practicas |
| [Pruebas y recorrido de la API](postman/pruebas-flujo.md) | Scripts utiles de Postman, Orden recomendado para probar flujo completo, Cuentas adicionales con escenarios de avance |
| [Alcance institucional y archivos de portada](postman/alcance-institucion.md) | Alcance por rol y configuración institucional, Portadas y logotipos elegidos en la creación |

## Otros módulos operativos

- [Entrevistas y fichas de observación](postman/formularios.md).
- [Planificaciones didácticas y PDF adjunto](postman/planificaciones.md).
- [Notificaciones y avisos](postman/notificaciones.md).

## Antes de probar

1. Configure la API con la [guía de entornos](../desarrollo/configuracion-entornos.md).
2. Prepare las variables y autentique una cuenta de cada rol que vaya a probar.
3. Siga el [recorrido de prueba](postman/pruebas-flujo.md); reutilice identificadores reales de su instalación.
4. Consulte la [matriz de permisos](../producto/permisos-practicas.md) para conocer el alcance de cada cuenta.

Las cuentas y estados de ejemplo se describen en [datos de demostración](../testing/datos/usuarios-demostracion.md). Su existencia y contraseña dependen de la carga local; los ejemplos de esta guía no acreditan que una cuenta esté disponible.

## Enlaces de secciones anteriores

Los siguientes accesos conservan los anclajes principales de la guía anterior.

<a id="login-y-tokens"></a>

- [Login y Tokens](postman/autenticacion.md).

<a id="cuentas"></a>

- [Cuentas](postman/cuentas.md).

<a id="ubicaciones"></a>

- [Ubicaciones](postman/catalogos.md).

<a id="instituciones"></a>

- [Instituciones](postman/catalogos.md).

<a id="facultades"></a>

- [Facultades](postman/catalogos.md).

<a id="carreras"></a>

- [Carreras](postman/catalogos.md).

<a id="ciclos-academicos"></a>

- [Ciclos Academicos](postman/catalogos.md).

<a id="grados"></a>

- [Grados](postman/catalogos.md).

<a id="asignaturas"></a>

- [Asignaturas](postman/catalogos.md).

<a id="cursos-y-practicas"></a>

- [Cursos y Practicas](postman/practicas.md).

<a id="inscripciones"></a>

- [Inscripciones](postman/practicas.md).

<a id="informes-de-practicas"></a>

- [Informes de Practicas](postman/documentos/01-informe-actividades.md).

<a id="planes-de-actividades"></a>

- [Planes de Actividades](postman/documentos/02-plan-actividades.md).

<a id="informes-finales"></a>

- [Informes Finales](postman/documentos/03-informe-tutor-institucional.md).

<a id="evaluacion-de-actividades-realizadas"></a>

- [Evaluacion de Actividades Realizadas](postman/documentos/04-evaluacion-actividades.md).

<a id="reporte-de-seguimiento-de-practica-preprofesional"></a>

- [Reporte de Seguimiento de Practica Preprofesional](postman/documentos/05-seguimiento.md).

<a id="registro-de-actividades-cumplidas"></a>

- [Registro de Actividades Cumplidas](postman/documentos/06-registro-actividades.md).

<a id="fotografias-de-practicas"></a>

- [Fotografias de Practicas](postman/evidencias-jornadas.md).

<a id="horario-y-asistencias-de-practicas"></a>

- [Horario y Asistencias de Practicas](postman/evidencias-jornadas.md).

<a id="scripts-utiles-de-postman"></a>

- [Scripts utiles de Postman](postman/pruebas-flujo.md).

<a id="orden-recomendado-para-probar-flujo-completo"></a>

- [Orden recomendado para probar flujo completo](postman/pruebas-flujo.md).

<a id="cuentas-adicionales-con-escenarios-de-avance"></a>

- [Cuentas adicionales con escenarios de avance](postman/pruebas-flujo.md).

<a id="alcance-por-rol-y-configuración-institucional"></a>

- [Alcance por rol y configuración institucional](postman/alcance-institucion.md).

<a id="portadas-y-logotipos-elegidos-en-la-creación"></a>

- [Portadas y logotipos elegidos en la creación](postman/alcance-institucion.md).

