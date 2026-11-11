<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          incidencias-versiones-plazos-etapa2.md
  @fecha         2026-11-10 22:16:26
  @nota          Documenta Incidencias, versiones documentales y plazos.
-->

# Incidencias, versiones documentales y plazos

Fecha: 10 de noviembre de 2026. Implementación local de la segunda etapa de mejoras solicitada por el usuario. Se conserva la asignación administrativa de prácticas, el trabajo del estudiante sobre sus asignaciones y el cierre académico manual con advertencias.

## Resultado funcional

El espacio de cada práctica incorpora «Incidencias y cambios», «Versiones de documentos» y «Plazos y responsables», con operaciones según el rol y la relación real con la práctica. La visibilidad en la interfaz no reemplaza las comprobaciones del backend.

### Incidencias

Los participantes autorizados pueden registrar una situación mientras la práctica esté activa o suspendida. Dirección de la carrera o el tutor de prácticas asignado designa a un responsable habilitado relacionado con esa práctica. El responsable o dirección inicia la evaluación. Solo dirección de la carrera resuelve o rechaza; el estudiante no puede decidir su propio cambio académico aunque posea otro cargo.

El flujo es `OPEN → ASSIGNED → UNDER_REVIEW → RESOLVED / REJECTED`. Todas las transiciones registran actor, fecha y motivo; la reasignación conserva un evento y vuelve al estado asignado. Las decisiones finales no se vuelven a aplicar. Los interesados reciben notificaciones dentro de su alcance.

Una resolución puede suspender, reanudar, retirar o cambiar el grupo receptor para sustituir institución o tutor institucional. Una incidencia de otro tipo conserva la decisión sin alterar automáticamente la práctica. El cambio receptor debe usar un grupo del mismo paralelo, con tutor habilitado y cupos suficientes. La sustitución de tutor institucional conserva la misma institución; el cambio de institución exige una distinta. El tutor de prácticas común del paralelo no se modifica mediante un cambio individual. El cambio receptor no reabre automáticamente documentos ya aprobados ni reparte las horas anteriores por centro; si se requiere un expediente académico nuevo para otra institución, debe crearse otra asignación mediante el flujo administrativo.

La suspensión bloquea las escrituras ordinarias de la práctica y conserva las consultas. La reanudación comprueba cuenta, pertenencia académica, tutores, disponibilidad y cupos, sin exigir abrir nuevas inscripciones. El retiro conserva el expediente y no equivale a conclusión satisfactoria. Los documentos, aprobaciones y horas anteriores permanecen; las asignaciones actuales determinan los permisos posteriores de los tutores.

Las prácticas suspendidas siguen visibles entre las actuales; las retiradas aparecen en el historial. La conclusión manual advierte si quedan incidencias abiertas. Si dirección decide concluir de todos modos, su seguimiento queda de consulta; no se resuelven incidencias automáticamente. Las prácticas archivadas no admiten nuevas gestiones.

### Versiones documentales

L.1/L.2/L.3/L.6 conservan las entregas y decisiones de revisión con las aprobaciones existentes en cada momento. L.3 conserva sus tres revisiones. El PDF definitivo se guarda al llegar al estado aprobado: modificaciones posteriores de nombres, institución u otros datos no cambian ese archivo conservado. Las descargas normales también reutilizan el PDF conservado, previa comprobación de acceso e integridad.

L.4/L.5 conservan un contenido y PDF por registro o modificación; continúan sin un circuito de aprobación añadido. Las actualizaciones de la sección institucional L.3 quedan registradas. La incorporación del membrete faltante en un L.3 anterior conserva el antes y el después, mantiene su aprobación anterior y exige una práctica operativa; no habilita cambios sobre expedientes archivados o concluidos.

Los documentos anteriores sin versiones conservan una copia inicial al intervenir en su flujo. El personal puede usar «Conservar documentos anteriores» para capturar los documentos ya aprobados y las evaluaciones/seguimientos existentes que tiene derecho a consultar. Es una captura del estado actual con fecha propia; no reconstruye revisiones ni fechas históricas inexistentes y no duplica versiones en ejecuciones sucesivas. Esta captura de consulta puede conservar expedientes concluidos o archivados sin alterar sus documentos.

Cada versión registra documento, número secuencial, actor, fecha, evento, estado y huellas SHA-256 del contenido y del PDF cuando existe. Las huellas se comprueban al descargar; no se presentan como firma electrónica ni sello de tiempo certificado. No hay rutas para editar o borrar estas versiones.

Los permisos se aplican también por formato y estado: el borrador conservado sigue siendo privado y el tutor institucional no obtiene acceso a L.1/L.2/L.4/L.5/L.6 por consultar la práctica. El ZIP del expediente incorpora los PDF históricos autorizados en `versiones/`, revalidando el acceso y conservando el límite global de 64 MB. Para expedientes con muchas versiones que superen ese límite, quedan disponibles las descargas individuales.

Se añadieron controles de versión optimista a las inscripciones y los seis documentos, y bloqueo transaccional al numerar las versiones. Un conflicto de escritura devuelve HTTP 409 en lugar de sobrescribir silenciosamente la actualización de otro usuario.

### Plazos y recordatorios

Dirección o el tutor de prácticas asignado configura una fecha de entrega o revisión por práctica, formato y etapa, con motivo obligatorio. L.4/L.5 solo admiten registro. La revisión institucional corresponde a L.3. Cada modificación incrementa una revisión y queda en el historial de la práctica.

Los estados se calculan con los documentos actuales: pendiente, próximo, vencido, cumplido, esperando entrega, en pausa o práctica cerrada. Cada revisión responde a la aprobación de su responsable, no a la existencia de cualquier aprobación. El revisor no recibe un aviso mientras se espere la entrega o corrección del autor. Los responsables se resuelven con las asignaciones vigentes, incluyendo el alcance por carrera de dirección.

Las horas se interpretan en `America/Guayaquil`. Por defecto el planificador comprueba los plazos al minuto del arranque y luego cada hora. La deduplicación es persistente por plazo, revisión, destinatario y fase (próximo/vencido), con bloqueo para trabajadores concurrentes. Un cambio de plazo permite un nuevo aviso motivado. No se envía correo externo.

La suspensión pausa los recordatorios; retiro, conclusión o archivo detienen los avisos operativos. No se bloquean entregas por vencer un plazo ni se concluye automáticamente una práctica. Configuración y contratos completos en la [guía de prácticas de la API](../../../api/postman/practicas.md).

## Validación

El 11 de noviembre de 2026 se repitieron y aprobaron las dos pruebas de MariaDB con las fuentes finales, incluidas las consultas de versiones documentales y plazos. El resumen de suites se sincronizó con el registro completo de 252 casos.

| Comprobación | Resultado |
| --- | --- |
| Backend completo, Spring Security/MockMvc y H2 | 252 casos: 250 aprobados, 2 omitidos por ser pruebas SQL optativas; sin fallos |
| Nuevas regresiones de gestión de prácticas | 26 casos de incidencias, permisos, conservación de L.1–L.6, capturas previas, ZIP y plazos |
| Concurrencia con transacciones confirmadas en H2 separado | Un único recordatorio ante dos trabajadores y números de versión distintos ante dos capturas simultáneas |
| MariaDB temporal | 2 pruebas aprobadas por separado; cadena de 27 migraciones, actualización desde V20 con registros previos, validación y arranque del backend |
| Frontend | 59 suites, 212 pruebas aprobadas |
| Compilación de producción | Correcta |
| Navegador con API ficticia | 18 comprobaciones, 390 y 1440 px; registro por estudiante, flujo motivado de dirección, historial, plazos, consulta de versión y ausencia de desbordamiento horizontal en los tres apartados |
| Documentación y metadatos | Enlaces y cabeceras institucionales comprobados |

[Evidencia y huellas de fuentes](../../evidencias/incidencias-versiones-plazos-2026-11-10/resultados.json), [resultado del navegador](../../evidencias/incidencias-versiones-plazos-2026-11-10/navegador.json), [verificador de navegador](../../qa/browser-practice-governance.cjs).

Las pruebas del navegador utilizan el paquete compilado y una API simulada; los permisos y las escrituras reales se comprueban por separado en las regresiones del backend. Esto no equivale a una sesión completa sobre la base operativa ni a pruebas de carga. Persisten los avisos de antigüedad de Browserslist y algunos avisos React `act` en pruebas que terminan aprobadas.

## Migraciones y despliegue local

- V25: estados de suspensión/retiro, versión de inscripción, incidencias e historial.
- V26: versiones de L.1–L.6 y control optimista de sus documentos.
- V27: plazos y deduplicación persistente de recordatorios.

Estas migraciones se comprobaron únicamente en MariaDB temporal durante esta etapa. No se ejecutaron comandos de migración ni de modificación contra la base de uso real. Las pruebas y la compilación del backend se hicieron desde una copia temporal para evitar que DevTools actualizase la instalación abierta durante el trabajo.

El backend actualizado requiere que Flyway aplique las migraciones antes de validar el esquema. Si V24 de la etapa anterior aún está pendiente, Flyway la ejecutará primero. Se debe conservar el procedimiento habitual de respaldo antes de actualizar la instalación; las migraciones no eliminan documentos ni horas existentes. Las capturas de documentos previos se solicitan explícitamente desde la interfaz, no se ejecutan como una tarea oculta al arrancar.

## Alcance pendiente

Esta entrega implementa incidencias, versiones y plazos. No incluye respaldos automáticos, correo externo, delegaciones temporales del tutor de prácticas, rúbricas institucionales configurables, integración con matrícula universitaria ni firma electrónica. La asignación administrativa por lotes tampoco forma parte de esta etapa. No se introdujeron cambios en el modelo de permisos acordado para que el estudiante trabaje sobre prácticas asignadas.
