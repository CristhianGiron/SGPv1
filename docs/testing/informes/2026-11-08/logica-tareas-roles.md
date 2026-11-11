<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          logica-tareas-roles.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Revisión de lógica de tareas, acciones y responsabilidades por usuario.
-->

# Revisión de lógica de tareas, acciones y responsabilidades por usuario

Fecha: 8 de noviembre de 2026. Proyecto: SGPv1. Revisión del código local y pruebas aisladas con datos ficticios.

## 1. Dictamen

**Sí existen inconsistencias de autorización y continuidad del trabajo.** Las prioridades son cerrar las diferencias de acceso entre carreras y entre tutores, hacer coherentes las asignaciones reales con lo que muestra la pantalla, y proteger las transiciones de conclusión, archivo y reapertura.

La aplicación ya separa seis roles, restringe muchas operaciones por propiedad/asignación/carrera y bloquea la escritura ordinaria cuando una práctica deja de ser operativa. Sin embargo, esas reglas no se aplican igual en todos los listados, documentos y cambios de estado. Tener pruebas generales aprobadas no demuestra que cada tarea esté asignada correctamente.

Se documentan **13 puntos observados mediante 16 sondas diagnósticas**. Algunos contradicen permisos existentes; otros muestran una política pendiente de definición. Se distinguen de los riesgos identificados solo por lectura de código y de las funcionalidades propuestas. Esta entrega **no corrige las reglas de negocio**.

## Estado posterior a la revisión

La [etapa de continuidad y sesiones del 10 de noviembre](../2026-11-10/continuidad-y-sesiones-etapa1.md) atiende H08 (devolución de planificación institucional conservando la versión enviada) y H11 (historial de entrevistas respondidas del destinatario), y añade sesiones revocables con rotación de renovación. Las observaciones originales siguientes se conservan como evidencia histórica.

**Cambio de política del 9 de noviembre de 2026:** el estudiante recibe su práctica asignada y lista para trabajar. Se retiran la autoinscripción y la cancelación por el estudiante. El paralelo es el listado académico (uno activo por ciclo y estudiante); puede ofrecer varias prácticas. Administración o dirección crea las prácticas y administración, dirección de la carrera o tutor de prácticas asignado inscribe a los estudiantes del listado. Las tablas originales de este diagnóstico conservan el estado histórico; prevalece el [informe de asignación administrativa](../2026-11-09/asignacion-administrativa-practicas.md).

H01, H02, H12 y H13 se corrigieron en la [etapa 1 de permisos y asignaciones](correcciones-permisos-etapa1.md). Las secciones siguientes conservan el diagnóstico y las 16 sondas de la revisión original; los resultados actuales y sus límites están en el informe de correcciones. Los otros puntos continúan pendientes.

H03 y H05 y los casos de duplicación de asistencia de H07 se atendieron en la [etapa 2 de ciclo y asistencia](ciclo-asistencia-etapa2.md). Para H04 el usuario eligió cierre manual con advertencias; para H09, cierre de nuevas inscripciones que conserva el desarrollo operativo. Los detalles y límites de la implementación están en ese informe.

La aclaración posterior del usuario permite prácticas simultáneas en los paralelos a los que pertenece el estudiante. Se implementó la [pertenencia académica explícita y las prácticas simultáneas](pertenencia-y-practicas-simultaneas.md), sustituyendo las restricciones anteriores de ciclo único para elegir paralelo y de una sola inscripción activa global.

## 2. Alcance y grado de certeza

Se contrastaron controladores, seguridad HTTP, servicios, repositorios, estados, configuración de módulos, navegación y guías de producto. La revisión cubre registro/cuentas, estructura académica, inscripciones, grupos/tutores, documentos L.1–L.6, planificaciones didácticas, entrevistas/observaciones, evidencias, horarios/asistencia, notificaciones, seguimiento y archivo.

| Verificación realizada en esta revisión | Resultado |
| --- | --- |
| Sondas nuevas `RoleWorkflowAuditProbeTest` | 16 comprobaciones de comportamiento observado |
| Regresiones `RoleSeparationIntegrationTest` | 7 pruebas |
| Regresiones `PracticeWorkflowRegressionTest` | 8 pruebas |
| Total de la ejecución seleccionada | 31 pruebas, 0 fallos, 0 errores y 0 omisiones |
| Entorno | Spring Boot, H2 en memoria, transacciones revertidas y MockMvc con seguridad de Spring |

Las sondas describen y exigen **el comportamiento observado, aunque sea incorrecto**. Su aprobación reproduce el hallazgo; no significa que el sistema lo haya corregido. Están fuera de la suite habitual para evitar esa confusión. Las otras 15 pruebas comprueban restricciones que ya funcionan, entre ellas el aislamiento académico, el historial autorizado y el rechazo de cambios en archivo o de asistencia fuera de fechas. No se presentan como pendientes los defectos anteriores que esas regresiones ya rechazan.

No se usó la base real ni se hicieron cambios en datos operativos. No se repitió toda la suite frontend ni una exploración de navegador en esta revisión. Los efectos de navegación indicados se deducen del código y de las respuestas API comprobadas. No se certificaron concurrencia, correo real, despliegue productivo, firma electrónica ni todas las combinaciones de cargos.

Evidencia: [resultados por prueba y huellas de fuentes](../../evidencias/logica-roles-2026-11-08/resultados.json). Fuente reproducible: [sondas de lógica por rol](../../qa/probes/RoleWorkflowAuditProbeTest.java).

## 3. Responsabilidades que debe preservar el sistema

La siguiente matriz describe el reparto actual predominante y el límite recomendado. Las propuestas adicionales no conceden permisos nuevos.

| Usuario | Trabajo que le corresponde | Acciones y límites |
| --- | --- | --- |
| Estudiante | Solicitar su práctica; elaborar y corregir sus entregables; registrar evidencias; elaborar instrumentos e interpretar sus resultados | Solo sus inscripciones y registros. Solicitar/cancelar pendiente; crear/editar/enviar L.1, L.2, L.3 y L.6; elaborar su planificación adaptada; crear entrevistas y observaciones; responder observaciones propias; subir/borrar sus evidencias mientras la práctica sea operativa. Consulta L.4/L.5 y asistencia. No se aprueba a sí mismo ni asigna tutores ni registra asistencia oficial. |
| Tutor de prácticas | Supervisar estudiantes de sus paralelos; organizar grupos; revisar entregables; evaluar y dar seguimiento | Configurar perfil común de práctica; crear grupos y asignar tutor institucional; asignar estudiantes aprobados a grupos; revisar L.1/L.2/L.3/L.6; elaborar L.4/L.5; recomendar correcciones en planificación del estudiante; consultar evidencias, instrumentos y asistencia. No debe actuar sobre paralelos ajenos ni sustituir la decisión de cierre de dirección. |
| Tutor institucional | Guiar el trabajo diario y acreditar su ejecución en el centro receptor | Solo prácticas realmente asignadas. Elaborar planificación institucional; recomendar la del estudiante; responder entrevistas dirigidas a su cuenta; completar sección institucional y revisión L.3; crear jornadas y registrar/corregir asistencia. No debe recibir por un vínculo residual de paralelo los registros de otro tutor de grupo. |
| Directora de institución | Responder instrumentos institucionales y consultar jornadas del centro que dirige | Entrevistas dirigidas a su cuenta y horarios/asistencias de su institución. No administra carreras, usuarios o paralelos universitarios; no califica automáticamente todos los documentos. Su entrada institucional requiere una forma estable de consultar pendientes y antecedentes. |
| Director de prácticas | Gobernar la operación académica de su carrera | Crear/gestionar paralelos de su carrera; asignar tutor de prácticas; aprobar/rechazar solicitudes; revisar L.1/L.2/L.3/L.6; consultar seguimiento; concluir/reabrir prácticas de su carrera. Consulta su estructura académica, sin modificar el catálogo universitario global. Puede mantener centros receptores compartidos según la política actual. No debe consultar documentos de otra carrera por conocer su ID. |
| Administrador | Mantener plataforma, cuentas, estructura académica y custodia administrativa | Crear personal; activar/bloquear cuentas; mantener universidades/facultades/carreras/ciclos y catálogos; gestión global; archivar/desarchivar prácticas concluidas; consultar seguimiento global. Su rol técnico no lo convierte automáticamente en aprobador académico ni le concede concluir/reabrir sin rol director. Las excepciones deben ser explícitas y auditadas. |

Los permisos reales deben comprobarse como **rol habilitado + relación autorizada con el registro + estado válido + contexto institucional coherente**. Un botón visible o un rol por sí solos no bastan.

### 3.1. Reparto documental actual

| Entregable | Autor operativo | Revisión/decisión actual | Condición para documento definitivo |
| --- | --- | --- | --- |
| L.1, Informe de Actividades Cumplidas | Estudiante | Tutor de prácticas y director de su carrera | Ambas aprobaciones y estado `APPROVED` |
| L.2, Plan de Actividades | Estudiante | Tutor de prácticas y director de su carrera | Ambas aprobaciones y estado `APPROVED` |
| L.3, Informe Tutor Institucional | Estudiante prepara; tutor institucional completa conclusiones, recomendaciones, membrete y horas | Tutor de prácticas, tutor institucional y director | Tres aprobaciones; requisitos institucionales antes de la aprobación institucional |
| L.4, Evaluación de Actividades | Tutor de prácticas asignado | No tiene circuito equivalente de envío/aprobación | Se exporta lo guardado; requiere definir cómo se formaliza y versiona |
| L.5, Reporte de Seguimiento | Tutor de prácticas asignado | No tiene circuito equivalente de envío/aprobación | Se exporta lo guardado; requiere definir cómo se formaliza y versiona |
| L.6, Registro de Actividades Cumplidas | Estudiante | Tutor de prácticas y director de su carrera | Ambas aprobaciones y estado `APPROVED` |
| Planificación didáctica institucional | Tutor institucional asignado | No admite recomendaciones del circuito del estudiante | Se envía, pero no existe vía ordinaria para corregir lo enviado: H08 |
| Planificación didáctica adaptada | Estudiante | Recomendaciones de personal autorizado dentro de su alcance | Envío y corrección; no hay una aprobación final equivalente a L.1/L.2 |

L.3 tiene autoría compartida; su nombre institucional no significa que el estudiante deba completar la parte reservada al tutor. L.4/L.5 son responsabilidad actual del tutor de prácticas: trasladarlos al tutor institucional sería un cambio académico que debe acordarse, no una corrección automática.

### 3.2. Secuencia de trabajo recomendada

1. Administración prepara estructura, ciclos, centros receptores y cuentas válidas.
2. Dirección abre el paralelo y asigna tutor de prácticas.
3. El estudiante solicita inscripción; dirección verifica elegibilidad y decide.
4. Tutor de prácticas crea grupos y asigna tutor institucional y estudiantes; se confirma la vinculación antes de generar tareas dependientes de ella.
5. Cada autor elabora sus registros; cada responsable recibe una tarea con plazo y contexto.
6. Revisores observan o aprueban la versión enviada. El estudiante corrige y reenvía; el historial permanece disponible.
7. El sistema evalúa requisitos de cierre; dirección concluye o justifica una excepción autorizada.
8. Administración archiva un expediente coherente. Para cambiarlo se desarchiva, se autoriza la reapertura y se registra el motivo.

Esta secuencia evita que un estudiante quede aprobado pero sin tutor, que se cierre un expediente incompleto o que una reapertura anule silenciosamente su custodia administrativa.

## 4. Hallazgos y decisiones pendientes

Prioridades: **P1** requiere atención por acceso, integridad del expediente o bloqueo importante del trabajo; **P2** afecta coherencia, recuperación o ampliación. No se ha asignado P0 ni se afirma que estos casos estén ocurriendo en producción.

| ID | Prioridad | Observación | Clasificación |
| --- | --- | --- | --- |
| H01 | P1 | Dirección puede consultar L.4/L.5 de otra carrera por ID | Inconsistencia de autorización |
| H02 | P1 | Avisos de entregas llegan a directores ajenos; el tutor institucional no recibe el envío L.3 | Destinatarios incorrectos/incompletos |
| H03 | P1 | Reabrir desarchiva aunque el actor no tenga permiso administrativo de desarchivo | Inconsistencia entre transiciones |
| H04 | P1 | Se concluye una práctica sin documentos ni comprobación de horas | Política de cierre pendiente; comportamiento reproducido |
| H05 | P2 | Se reabre una práctica de paralelo inactivo y queda sin operación posible | Transición incompleta |
| H06 | P2 | Una solicitud rechazada impide volver a solicitar ese mismo paralelo | Política de reintento pendiente |
| H07 | P1 | Asistencia repetida sin período se acepta y duplica minutos | Inconsistencia de integridad |
| H08 | P2 | Planificación institucional enviada no tiene camino de corrección | Vacío de recuperación/versionado |
| H09 | P2 | Bloquear paralelo no bloquea nuevas planificaciones operativas | Alcance del bloqueo por definir |
| H10 | P2 | Universidad adicional no puede asignar su propio tutor de prácticas | Restricción UNL incompatible con ampliación documentada |
| H11 | P2 | Entrevista respondida desaparece de la lista asignada usada para construir «Mi institución» | Vacío de continuidad e historial |
| H12 | P1 | Se muestra un grupo/tutor implícito que no concede la asignación real | Contexto mostrado distinto del autorizado |
| H13 | P1 | Listados institucionales devuelven registros de otro tutor de grupo aunque el detalle los deniegue | Inconsistencia de autorización |

### H01. Director con acceso a L.4/L.5 fuera de su carrera

**Comprobado:** con dos carreras y dos universidades distintas, el director de una consulta por ID la evaluación y el seguimiento de la otra. Ambos GET devuelven HTTP 200. Las validaciones aceptan `ROLE_DIRECTOR_PRACTICAS` sin comparar carrera; otras familias documentales sí la comprueban.

**Impacto:** conocer el identificador permite consultar datos fuera del alcance académico establecido. No se probó escritura ni exportación PDF en estas sondas; el código de exportación usa la misma validación de lectura.

**Corregir:** reutilizar la comprobación de director de la carrera del paralelo y mantener administración global. Aplicarla a detalle, vista previa, PDF y futuros listados.

Fuentes: [L.4: validateCanView](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/ActivityEvaluationService.java#L279), [L.5: validateCanView](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/PracticeFollowUpReportService.java#L275). Sondas: `H01_foreignDirectorCanReadL4ById`, `H01_foreignDirectorCanReadL5ById`.

### H02. Avisos fuera de alcance y responsable L.3 sin aviso

**Comprobado:** al notificar una entrega, el director de otra carrera recibe el nombre del estudiante y el paralelo. El selector incorpora todas las cuentas activas con rol administrador/director. En L.3 se notifica al tutor de prácticas, pero no al tutor institucional que debe completar y revisar su parte.

**Impacto:** divulgación de metadatos fuera de carrera, ruido en bandejas y trabajo pendiente que no llega al responsable. La autorización del documento puede denegar su apertura; eso no elimina la información ya incluida en el aviso.

**Corregir:** destinatarios por práctica, carrera y tarea; incluir al tutor institucional efectivo para L.3. Emitir avisos según la etapa y después de confirmar la transacción. No enviar a todos los administradores cada tarea académica si no se requiere su intervención.

Fuente: [NotificationService: envío y destinatarios](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/NotificationService.java#L774). Sondas: `H02_foreignDirectorReceivesSubmissionNotificationWithStudentName`, `H02_institutionalTutorDoesNotReceiveL3SubmissionNotification`.

### H03. Reabrir también desarchiva sin intervención administrativa

**Comprobado:** una práctica `COMPLETED` y `archived=true` vuelve a `APPROVED` con `archived=false` mediante la acción de un director sin rol administrador. La operación de desarchivo, por separado, está reservada a administración.

**Impacto:** una transición académica anula una decisión de custodia administrativa. Queda registro de reapertura, pero no una autorización administrativa previa de desarchivo.

**Corregir:** exigir primero desarchivo administrativo o diseñar una solicitud de reapertura con ambas responsabilidades y motivo. No resolverlo otorgando todos los permisos a dirección.

Fuente: [EnrollmentService: reopen](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/EnrollmentService.java#L154). Sonda: `H03_directorCanReopenArchivedPracticeWithoutAdminUnarchiving`.

### H04. Conclusión sin criterios académicos verificables

**Comprobado:** el director concluye por API una práctica aprobada sin documentos de práctica registrados. El servicio comprueba el estado, pero no entregables, revisiones, horas ni asignación completa.

**Impacto:** se bloquea la operación ordinaria y se habilita el archivo administrativo de un expediente potencialmente incompleto. Las revisiones documentales también exigen práctica operativa; concluir antes de revisarlas puede obligar a reabrir.

**Decisión necesaria:** acordar requisitos por carrera/ciclo/modalidad. La ausencia de checklist no se presenta como incumplimiento de un requisito previamente fijado: es una mejora de control prioritaria respaldada por el comportamiento observado.

**Agregar:** evaluación de preparación para cierre con pendientes y responsable, y excepción con permiso específico, motivo y auditoría. Debe ejecutarse en el servidor al cerrar, no solo en una pantalla.

Fuentes: [conclusión](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/EnrollmentService.java#L123), [regla operacional](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/PracticeAccessService.java#L22). Sonda: `H04_directorCanCompleteWithoutAnyPracticeDocument`.

### H05. Reapertura de una práctica cuyo paralelo no funciona

**Comprobado:** al reabrir una práctica concluida con paralelo inactivo, la API devuelve `APPROVED` y `courseActive=false`. Crear una planificación inmediatamente después devuelve HTTP 400.

**Impacto:** «reabierta» comunica una posibilidad de trabajo que no existe. La reapertura tampoco revalida disponibilidad como lo hace la aprobación de una solicitud.

**Corregir:** verificar actividad, eliminación, política de bloqueo, cupo y otra inscripción activa dentro de la misma transacción. Si el paralelo no puede reactivarse, ofrecer traslado regulado a otro contexto; no cambiar silenciosamente la inscripción histórica.

Fuente: [EnrollmentService: reopen](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/EnrollmentService.java#L154). Sonda: `H05_reopeningInactiveCourseCreatesApprovedButNonOperationalPractice`.

### H06. Rechazo sin camino de nueva solicitud al mismo paralelo

**Comprobado:** una inscripción `REJECTED` hace que volver a solicitar el mismo paralelo devuelva HTTP 400. Se comprueba existencia sin distinguir estado y existe unicidad por estudiante/paralelo. La cancelación ordinaria solo admite pendientes.

**Decisión necesaria:** definir si el rechazo es definitivo para ese paralelo o permite subsanar y solicitar reconsideración. No basta con cambiar el mensaje o borrar registros rechazados.

**Agregar:** razón obligatoria de rechazo y, si se permite, reconsideración con historial y nueva validación de ciclo/cupo. Si es definitivo, comunicarlo antes de ofrecer de nuevo el paralelo.

Fuentes: [validación de duplicado](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/EnrollmentService.java#L579), [unicidad de inscripción](../../../../BackEnd/src/main/java/com/sgp/systemsgp/model/Enrollment.java#L12). Sonda: `H06_rejectedStudentCannotApplyAgainToSameCourse`.

### H07. Asistencia duplicada cuando no se indica período

**Comprobado:** enviar dos veces el mismo registro del 2 de noviembre, 08:00–10:00, sin `schedulePeriodId`, genera dos asistencias de 120 minutos. La lista contiene 240 minutos para la misma franja. El campo es opcional y la comprobación de duplicados retorna sin validar cuando falta.

**Impacto:** el resumen de tiempo asistido suma ambas. No se afirma que L.3 tome automáticamente esas asistencias: actualmente sus horas pueden venir del valor manual o de L.6.

**Corregir:** período obligatorio en asistencia ordinaria; asistencia extraordinaria explícita con motivo y control de solapamientos por estudiante/fecha/intervalo, incluso entre horarios. Añadir garantía transaccional e idempotencia para reintentos de red. Unicidad por período/fecha por sí sola no cubre las filas sin período.

Fuentes: [validación de duplicados](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/PracticeScheduleService.java#L680), [campo opcional](../../../../BackEnd/src/main/java/com/sgp/systemsgp/dto/practiceschedule/PracticeAttendanceRequest.java), [resumen de minutos](../../../../FrontEnd/src/utils/practiceIndicators.js#L2). Sonda: `H07_duplicateAttendanceWithoutPeriodIsAcceptedAndDoublesMinutes`.

### H08. Planificación institucional sin recuperación tras enviar

**Comprobado:** el tutor institucional envía su planificación. Editarla devuelve HTTP 400; intentar recomendaciones como administrador devuelve HTTP 403 porque solo se admiten sobre planificación del estudiante. El autor tampoco puede borrarla por la misma validación de edición.

**Impacto:** corregir un error de la planificación enviada exige crear otra, sin un mecanismo explícito de sustitución de versión. La regla de privacidad institucional puede conservarse.

**Corregir o definir:** devolución al autor por responsable habilitado, o sustitución versionada que marque cuál es vigente. Mantener el documento enviado anterior y el motivo; no permitir sobrescribirlo sin trazabilidad.

Fuente: [DidacticPlanService: edición y recomendaciones](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/DidacticPlanService.java#L350). Sonda: `H08_submittedInstitutionalPlanHasNoCorrectionRoute`.

### H09. «Bloquear paralelo» tiene un alcance parcial

**Comprobado:** con `course.locked=true` sigue siendo posible crear un borrador de planificación. Las inscripciones sí comprueban ese bloqueo; la regla operacional general comprueba actividad y eliminación, pero no `locked`.

**Decisión necesaria:** si bloquear significa únicamente cerrar nuevas inscripciones, renombrar la acción y explicarlo. Si significa suspender la operación, incorporarlo a todas las mutaciones pertinentes. No se presume una política que el sistema no ha definido.

Fuentes: [bloqueo](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/CourseService.java#L339), [validación operacional](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/PracticeAccessService.java#L22). Sonda: `H09_lockedCourseStillAllowsNewOperationalRecords`.

### H10. Ampliación institucional limitada por una regla UNL fija

**Comprobado:** administración intenta asignar al paralelo de otra universidad un tutor de prácticas de esa misma universidad. Recibe HTTP 400. La validación exige que la institución del tutor tenga código literal `UNL`.

**Impacto:** el registro y los catálogos admiten otras universidades, pero su flujo operativo de asignación no queda completo. Para una instalación exclusiva UNL no es un bloqueo inmediato.

**Corregir:** comparar la universidad del tutor con la del paralelo y la política institucional vigente; no comparar con una marca fija. Validar también que una asignatura opcional pertenezca al contexto académico del paralelo.

Fuentes: [CourseService: validateUnlTutorInstitution](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/CourseService.java#L704), [ampliación documentada](../../../producto/configuracion-institucional.md). Sonda: `H10_otherUniversityCannotAssignItsOwnPracticeTutor`.

### H11. La directora pierde la entrada después de responder

**Comprobado en servicio:** una entrevista aparece en asignadas mientras está `SENT`; al responder pasa a `ANSWERED` y deja de aparecer. La consulta directa por ID sigue permitida.

**Consecuencia deducida del frontend:** «Mi institución» construye sus estudiantes con entrevistas asignadas y jornadas. Si ese era el único registro y no hay jornadas, la práctica desaparece de la entrada al recargar. No se reprodujo ese paso en un navegador en esta revisión.

**Agregar:** separar pendientes y respondidas, y construir el directorio institucional autorizado de forma estable. Mostrar estado real: actualmente el contexto sintetizado usa `APPROVED`, sin obtener el estado efectivo de inscripción. No ampliar con ello la consulta a prácticas ajenas.

Fuentes: [assignedForms](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/PracticeFormService.java#L146), [InstitutionWorkPage](../../../../FrontEnd/src/features/institutions/pages/InstitutionWorkPage.jsx#L14). Sonda: `H11_answeredInterviewDisappearsFromAssignedHistory`.

### H12. Grupo/tutor mostrado pero no asignado realmente

**Comprobado:** una inscripción sin grupo y un paralelo sin tutor institucional tienen un único grupo activo con tutor. La respuesta de inscripciones muestra ese grupo y tutor, pero el resolvedor de autorización devuelve tutor nulo y la inscripción no aparece en las prácticas gestionadas por él.

**Impacto:** el estudiante ve un responsable aparente; el tutor no recibe la práctica y los servicios dependientes de tutor pueden impedir trabajar. El contexto cambia además si se añade un segundo grupo, aunque nadie haya modificado la inscripción.

**Corregir:** persistir una asignación explícita mediante la acción autorizada o mostrar «sin asignar». Usar el mismo resolvedor para respuesta, permisos, defaults y notificaciones; una conveniencia visual no debe inventar relaciones.

Fuentes: [resolveEnrollmentGroup](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/EnrollmentService.java#L1047), [InstitutionalAssignmentResolver](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/InstitutionalAssignmentResolver.java#L13). Sonda: `H12_displayedImplicitGroupIsNotAnActualTutorAssignment`.

### H13. El listado entrega lo que el detalle prohíbe

**Comprobado:** el paralelo conserva al tutor institucional A y la inscripción está en un grupo del tutor B. A recibe el horario completo en `/managed` y L.3 en `/institutional-review`, pero abrir cada registro por ID devuelve HTTP 403. Las consultas suman el vínculo de grupo y el de paralelo sin filtrar después por el tutor efectivo.

**Impacto:** el listado ya contiene datos personales y académicos fuera de asignación. No basta con denegar el detalle. El mismo patrón aparece por lectura en la cola de fotografías y en el resumen institucional L.3; no se probaron esos dos caminos adicionales.

**Corregir:** aplicar la misma regla por registro en detalle, listas, resúmenes, búsquedas, exportaciones y contadores. Mantener el tutor del paralelo como respaldo solo cuando no haya tutor de grupo válido, según política expresa.

Fuentes: [managedSchedules](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/PracticeScheduleService.java#L98), [cola institucional L.3](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/FinalReportService.java#L201), [cola de fotografías](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/PracticePhotoService.java#L148). Sondas: `H13_courseTutorSeesAnotherGroupsScheduleInListButCannotOpenIt`, `H13_courseTutorSeesAnotherGroupsL3InListButCannotOpenIt`.

## 5. Riesgos identificados por lectura, pendientes de reproducción

Estos puntos no se cuentan como fallos reproducidos ni como cobertura de las 16 sondas.

| Riesgo | Evidencia de código y consecuencia posible | Recomendación y prueba pendiente |
| --- | --- | --- |
| Concurrencia en cupos, una inscripción activa y aprobaciones | Inscribir/aprobar cuenta registros antes de guardar. Las entidades de inscripción/documentos revisadas no incorporan `@Version`; no se encontró bloqueo equivalente del cupo en estos caminos. Dos operaciones simultáneas podrían validar el mismo estado o sobrescribir decisiones. El control de revisión de borradores de servidor es un mecanismo separado y sí existe. | Pruebas simultáneas con última plaza, dos paralelos para un estudiante y dos revisores. Elegir bloqueo/versionado y garantías de base según resultado; no tratar una transacción por sí sola como protección suficiente. |
| Cuentas con varios cargos | La documentación promete acumulación, pero varias pantallas eligen endpoints primero por `isStudent`. L.1/L.2/L.6 registran la decisión como director cuando el actor tiene ese rol, aunque también sea tutor. No hay una regla general de conflicto de interés visible. | Definir combinaciones permitidas, rol de actuación y personas independientes cuando se exijan dos firmas. Probar estudiante+tutor, tutor+director y admin+director. No conceder autoaprobación por la unión de roles. |
| Cambios de tutor y conservación del expediente | Algunos datos/autorizaciones derivan de asignaciones actuales y otros de snapshots guardados. Cambiar grupo, tutor o centro puede alterar visibilidad y nombres derivados después de aprobar documentos. | Traspaso con fechas de vigencia, motivo, tareas pendientes reasignadas y política de acceso histórico. Congelar datos y evidencia de aprobación al formalizar; no modificar en silencio un documento definitivo. |
| Tres cifras de horas sin conciliación | Asistencia suma presencia; L.6 mantiene su total; L.3 admite total manual o toma el de L.6, sin exigir aquí que esté aprobado. `FinalReportService.completedPracticeMinutes` no toma asistencia como fuente. | Definir horas registradas, verificadas y reconocidas; señalar origen y discrepancias; justificar ajustes. No convertir automáticamente cualquier cifra guardada en horas certificadas. |
| Seguimiento incompleto si se interpreta como cobertura total | Coordinación agrega L.1/L.2/L.3/L.6; no incluye L.4/L.5, planificaciones, instrumentos ni ausencias de documentos. No hay incumplimiento si el indicador pretende medir solo revisión documental. | Rotular el alcance y añadir preparación de expediente por práctica, distinguiendo faltante, borrador, enviado, observado y aprobado. No usar «0 pendientes» como prueba de expediente completo. |
| Último administrador y continuidad de cuentas | `disable/lock/softDelete` de administración no muestran una comprobación de último administrador disponible ni de la propia cuenta. Cambiar el ciclo del estudiante tampoco constituye por sí solo un traslado de sus prácticas. | Proteger continuidad administrativa y diseñar gestión de altas, bajas, reemplazos y cambios académicos con impacto explícito. Probar esos casos antes de fijar su política. |
| Auditoría parcial | Hay historial de archivo/cierre y de observaciones; marcas `createdAt/updatedAt` no equivalen a registrar actor, razón y cambio anterior/nuevo. Asignar grupos, tutores y corregir asistencia no tiene el mismo historial de negocio visible. | Eventos para asignación, asistencia, revisión, cierre, reapertura y excepciones. Actor, rol usado, relación anterior/nueva, versión, fecha y motivo; consulta dentro del alcance autorizado. |

Referencias: [EnrollmentService](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/EnrollmentService.java), [decisión por rol L.2](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/ActivityPlanService.java#L663), [fuente de horas L.3](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/FinalReportService.java#L116), [coordinación](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/CoordinationReportService.java#L81), [cuentas](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/AdminAccountService.java), [auditoría](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/PracticeAuditService.java).

## 6. Qué conviene agregar para una operación coordinada

| Capacidad | Para qué sirve | Responsable de negocio | Criterio de aceptación |
| --- | --- | --- | --- |
| Bandeja de tareas por práctica y responsable | Que cada usuario sepa qué hacer, sobre qué versión y para cuándo | Dirección define reglas; cada autor/revisor atiende su parte | Cada tarea tiene estado, responsable, plazo, contexto y siguiente acción. Reintentar no duplica tareas. Una notificación es un aviso de la tarea, no su única fuente. |
| Preparación para cierre configurable | Evitar cierre prematuro sin imponer un reglamento único a todas las carreras | Dirección académica | El servidor explica cada impedimento; una excepción registra quién la autorizó y por qué. |
| Máquina de estados de práctica y entregables | Evitar transiciones que contradigan otras responsabilidades | Dirección y custodia administrativa | Matriz explícita de estados/acciones/roles/precondiciones; incluye rechazo, retiro, suspensión, devolución y reapertura según las políticas acordadas. |
| Revisiones ligadas a versión | Que una aprobación acredite exactamente lo revisado | Autores y revisores | Cambiar contenido invalida decisiones de esa versión; la versión aprobada y su historial se conservan. Conflictos concurrentes devuelven un resultado recuperable. |
| Asignaciones y suplencias con vigencia | Mantener continuidad cuando cambia personal o centro | Dirección, tutor de prácticas y administración | Traspaso explícito de tareas y ámbito; ninguna relación se deduce por ser el único grupo. |
| Conciliación de horas y asistencia | Detectar duplicados, solapamientos y diferencias entre L.3/L.6/asistencia | Tutor institucional verifica presencia; tutor de prácticas valida reconocimiento | Se distingue duración observada de reconocida; extras/ajustes tienen motivo y no se duplican por reintentar. |
| Formalización L.4/L.5 y planificación institucional | Aclarar cuándo son borrador, entregado o definitivo | Autor y autoridad académica correspondiente | Se define una versión vigente, posibilidad de corrección y tratamiento de versiones sustituidas. No se agregan aprobadores sin una necesidad académica. |
| Recuperación e historial para cada rol | Evitar tareas huérfanas y antecedentes inaccesibles | Responsables actuales de cada flujo | Pendientes y resueltas siguen localizables; rechazo, error de envío, devolución y reemplazo tienen salida documentada. |
| Plazos, recordatorios y escalamiento | Evitar expedientes detenidos por una única persona | Dirección fija plazos y suplencias | Aviso al responsable efectivo; vencimiento visible; escalamiento dentro de la carrera; sin difusión global de datos. |
| Expediente final verificable | Conservar la evidencia del cierre | Administración custodia; dirección valida contenido | Manifest de documentos/versiones aprobadas y excepciones; mecanismo de integridad y, si se requiere, firma institucional. El ZIP actual es una exportación autorizada, no una certificación inmutable del cierre. |

Conviene implementar primero estas piezas sobre los módulos existentes. Añadir más paneles o botones sin una regla común de autorización, estado y responsabilidad mantendría las mismas contradicciones.

## 7. Orden propuesto y criterios para cerrar la revisión

| Etapa | Trabajo | Evidencia mínima para darla por terminada |
| --- | --- | --- |
| 1. Corregir acceso y asignaciones | H01, H02, H12 y H13 | Director ajeno no recibe detalle/PDF/listado/metadatos; tutor de paralelo no recibe datos del grupo de otro; tutor mostrado coincide con el autorizado; notificaciones llegan al responsable efectivo. |
| 2. Proteger expediente y tiempos | H03, H05, H07; definición H04/H09 | Archivo exige su transición autorizada; reapertura produce un contexto operativo; cierre aplica la política acordada; duplicados/solapamientos no alteran horas. |
| 3. Completar los caminos de trabajo | H06, H08, H10 y H11 | Rechazo/reconsideración claros; planificación institucional corregible o sustituible; universidad adicional operativa; entrevistas respondidas y contexto histórico localizables. |
| 4. Robustecer para uso institucional | Concurrencia, multicargo, suplencias, versionado y auditoría | Pruebas de escrituras simultáneas, cuenta con varios roles y traslado de responsables; historial preservado y conflictos recuperables. |
| 5. Automatizar coordinación | Tareas, plazos, conciliación y expediente verificable | Un recorrido real por rol desde preparación hasta archivo y reapertura, incluyendo devoluciones, faltantes, sustituciones y recuperación de sesión. |

No se recomienda «resolver» un bloqueo dando rol administrador al usuario afectado: ampliaría permisos y ocultaría la causa. Cada excepción debe tener alcance, responsable y registro.

## 8. Diferencias documentales a actualizar cuando se acuerden las reglas

- La [matriz de permisos](../../../producto/permisos-practicas.md) dice en una fila que dirección archiva su carrera, pero controlador, servicio y pantalla reservan archivo/desarchivo a administración. La misma guía menciona revisión en `COMPLETED`, mientras la validación operacional actual también bloquea revisión documental al concluir.
- La [ampliación institucional](../../../producto/configuracion-institucional.md) admite varias universidades; debe alinearse con H10.
- Las guías deberían definir «bloquear paralelo», diferencia entre conclusión y archivo, reintento tras rechazo y quién puede devolver una planificación institucional.

Este informe describe el estado observado. Las guías normativas no se modificaron para convertir una recomendación en un permiso nuevo.

## 9. Reproducción y mantenimiento de la evidencia

Las sondas permanecen en `docs/testing/qa/probes/RoleWorkflowAuditProbeTest.java`. Para repetirlas, desde la raíz del repositorio, copiar temporalmente a `BackEnd/src/test/java/com/sgp/systemsgp/service/RoleWorkflowAuditProbeTest.java`; comprobar antes que ese destino no contenga trabajo propio. Desde `BackEnd`, ejecutar:

```bash
./mvnw -o -Dtest=RoleWorkflowAuditProbeTest,RoleSeparationIntegrationTest,PracticeWorkflowRegressionTest test
```

En esta revisión se cargó Mockito mediante `-DargLine=-javaagent:/ruta/local/mockito-core-5.20.0.jar` para evitar la autoasociación de agente restringida por el entorno. La ruta depende del repositorio Maven local. El perfil `test` fuerza H2 en memoria y deshabilita Flyway; no valida migraciones productivas.

Al terminar, retirar la copia temporal y el `target` generado; conservar la fuente de sondas y el JSON de resultados. Cuando se corrija un hallazgo, convertirlo en una regresión del comportamiento deseado dentro de la suite habitual y actualizar su estado. No conservar como validación funcional una sonda que exige el defecto.

[Volver a informes de QA](../README.md).
