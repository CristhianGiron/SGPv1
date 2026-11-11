<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          auditoria-integral.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Auditoría integral de SGP — 7 de noviembre de 2026.
-->

# Auditoría integral de SGP — 7 de noviembre de 2026

**Resultado: 10 hallazgos reproducidos.** La aplicación compila, arranca con Tomcat y pasa sus pruebas habituales, pero hay brechas de lógica de negocio, procesamiento de datos e interacción que esas pruebas no cubrían. La prioridad es proteger el cierre de prácticas y preparar las migraciones para producción; después, corregir asistencias, paginación y el visor de fotografías.

Se revisó el checkout local existente, conservando sus cambios previos. Esta entrega incorpora pruebas, evidencias, mantenimiento de guiones de QA e informe. Los fallos funcionales descritos permanecen pendientes de corrección.

## 1. Cobertura y alcance real

| Comprobación | Resultado |
| --- | --- |
| Frontend | 52 suites; **183 pruebas aprobadas** |
| Compilación de producción | Correcta |
| Backend habitual con H2 | **142 pruebas aprobadas**, sin fallos ni errores |
| Arranque HTTP real | Tomcat en puerto local aleatorio, H2 forzada en memoria; **4 respuestas verificadas** |
| Contratos estáticos de documentos/jornadas | **68 combinaciones de método y ruta**, sin endpoints faltantes |
| Navegación por rol | **113 rutas por rol**, observadas en 390 y 1440 px: **226 combinaciones** |
| Pestañas | **256 estados de pestañas** en el recorrido principal; **28 adicionales** en contextos seleccionados |
| Diálogos | **150 observaciones de diálogos abiertos** en los recorridos principal y complementario |
| Exploración visual | **1.182 observaciones**, incluyendo revisitas para comparar pestañas y aperturas; no equivalen a 1.182 pantallas distintas |
| Casos adversos del backend | **7 sondas de diagnóstico** reprodujeron fallos; se mantienen separadas de la suite habitual |
| Casos adversos de interfaz | Listado de 205 cuentas, error 503 con mensaje largo, foco del visor y Escape en diálogos anidados |

La exploración principal y los contextos adicionales no registraron excepciones JavaScript, desbordamiento horizontal de página ni diálogos fuera de los límites en sus estados base. La revisión adicional sí encontró los problemas F08–F10. Se incluyen estados vacíos y poblados, pestañas, formularios y aperturas de creación, filtros, confirmaciones y datos complementarios.

**Límites:** los recorridos de Chrome usan API simulada. El backend se comprobó con servicios, persistencia H2, seguridad MockMvc y un arranque HTTP real aislado; no se ejecutaron cambios contra la base real. No se certificaron MySQL/MariaDB productivo, cámaras y dispositivos físicos, AWS biométrico, lectores de pantalla reales, carga concurrente ni todas las combinaciones de usuarios con varios roles. Las lecturas de código y las propuestas se distinguen de los fallos reproducidos.

La resolución de migraciones se ensayó directamente con Flyway sobre H2, sin ejecutarlas: el error por versiones duplicadas ocurre antes de aplicar SQL y también bloquea su uso con el perfil productivo predeterminado. Las pruebas habituales deshabilitan Flyway y crean el esquema con Hibernate.

- [Cobertura pantalla por pantalla y pestañas](auditoria-pantallas.md).
- [Hallazgos para seguimiento en CSV](../../evidencias/auditoria-integral-2026-11-07/hallazgos.csv).
- [Huella de los archivos revisados](../../evidencias/auditoria-integral-2026-11-07/huella-fuentes.json).

## 2. Hallazgos reproducidos y prioridad

P0 indica bloqueo de salida a producción en la condición descrita. P1 requiere corrección prioritaria por integridad de datos o bloqueo de un flujo. P2 afecta consistencia, calidad de datos o usabilidad.

| ID | Prioridad | Hallazgo | Usuarios afectados |
| --- | --- | --- | --- |
| F01 | **P0, al habilitar Flyway** | Versiones de migración repetidas impiden resolver la actualización | Operación y administración |
| F02 | **P1** | La API acepta cambios en prácticas archivadas | Estudiante, tutor institucional y responsables del archivo |
| F03 | **P1** | Se crean planificaciones con el paralelo inactivo | Autores de planificaciones |
| F04 | **P1** | Se registran asistencias fuera del período del horario | Tutor institucional, estudiante y dirección |
| F05 | P2 | Se acepta texto disfrazado de fotografía PNG | Estudiante y revisores de evidencias |
| F06 | P2 | Vaciar períodos no borra el valor anterior | Autores de planificaciones |
| F07 | **P1** | Los listados truncados a 200 ocultan registros existentes | Administración y usuarios de selectores paginados |
| F08 | P2 | El botón flotante cubre parte de un aviso largo de error | Usuario en móvil de 360 px |
| F09 | **P1** | El visor de fotos y accesibilidad pueden dejar la página sin desplazamiento | Usuarios del visor de evidencias |
| F10 | P2 | Casillas de catálogos sin nombre accesible | Administración, especialmente con teclado/lector de pantalla |

### F01. Flyway bloquea la resolución de migraciones

**Reproducción:** al pedir a Flyway que resuelva las migraciones del classpath, lanza `Found more than one migration with version 2`. Existen dos archivos para cada una de las versiones V2, V3, V4 y V12. El perfil `prod` habilita Flyway de forma predeterminada; el perfil de pruebas lo deshabilita.

**Impacto:** una compilación y una batería H2 correctas no garantizan que esa instalación productiva arranque. No se está afirmando que el entorno de desarrollo con Flyway deshabilitado esté caído.

**Cambio propuesto:** revisar `flyway_schema_history` de los entornos existentes y reconciliar el historial. Validar tanto instalación limpia como actualización sobre una copia MySQL aislada. Evitar renumerar o cambiar a ciegas migraciones ya aplicadas.

Fuentes: [migraciones](../../../../BackEnd/src/main/resources/db/migration), [perfil de producción](../../../../BackEnd/src/main/resources/application-prod.properties), [sondas](../../evidencias/auditoria-integral-2026-11-07/backend-probes.json).

### F02. La consulta histórica no es inmutable en la API

**Reproducción:** crear una jornada y una planificación en borrador; concluir la práctica como director y archivarla como administrador. Después, registrar asistencia como tutor institucional o actualizar la planificación como su autor. Ambos controladores devuelven **HTTP 200**.

**Impacto:** la interfaz aplica el modo de consulta, pero un cliente que invoque la API puede cambiar información del expediente archivado. La propiedad y el rol se siguen validando; el fallo está en el estado operacional de la práctica.

**Cambio propuesto:** centralizar la comprobación de práctica aprobada, no archivada y paralelo activo/no eliminado, y aplicarla a todas las mutaciones pertinentes. Mantener la lectura y descarga históricas según permisos. Volver a verificar esta regla al guardar, aunque el formulario se hubiera abierto antes del cierre.

Fuentes: [edición de planificaciones](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/DidacticPlanService.java), [gestión de asistencias](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/PracticeScheduleService.java), [evidencia HTTP MockMvc](../../evidencias/auditoria-integral-2026-11-07/backend-probes.json).

### F03. Planificaciones nuevas en un paralelo inactivo

**Reproducción:** mantener la inscripción en `APPROVED`, desactivar su paralelo y enviar una planificación nueva como estudiante propietario. La respuesta es **200**. La validación de creación de este servicio comprueba la aprobación, pero no la actividad del curso.

**Cambio propuesto:** usar la misma validación operacional que en F02. La respuesta debe ser un error de dominio claro y no crear el registro. Contrastar también los caminos de creación del tutor institucional.

Fuente: [DidacticPlanService](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/DidacticPlanService.java), método `validateEnrollmentApproved`.

### F04. Asistencias fuera de las fechas autorizadas

**Reproducción:** un horario del **2 al 9 de noviembre de 2026** acepta una asistencia `PRESENT` del **4 de enero de 2027**, de 08:00 a 10:00, con 120 minutos. El controlador devuelve **200**.

**Impacto:** se guardan fechas y tiempos asociados a una jornada cuyo período no los contiene. Las comprobaciones actuales de horas, duplicidad y día no sustituyen la validación del intervalo de fechas.

**Cambio propuesto:** contrastar `attendanceDate` con `startDate/endDate` del horario cuando esos límites existan. Definir aparte la política de registros futuros, retroactivos y excepciones autorizadas; no inferirla solo en el formulario.

Fuente: [PracticeScheduleService](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/PracticeScheduleService.java), `validateAttendance`.

### F05. Archivo almacenado que no es una imagen

**Reproducción:** subir un multipart llamado `texto.png`, con MIME `image/png`, cuyo contenido son bytes de texto. La carga de evidencia devuelve **200**.

**Impacto:** existe una evidencia guardada que no se puede visualizar como fotografía. No se ha demostrado ejecución de código: el hallazgo es de validación y calidad del archivo.

**Cambio propuesto:** comprobar el contenido real con una decodificación controlada, limitar tamaño/dimensiones y resolver de forma explícita los formatos HEIC/HEIF admitidos por la interfaz. Mantener las validaciones de tamaño y permisos existentes.

Fuente: [PracticePhotoService](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/PracticePhotoService.java), `validatePhoto`.

### F06. Borrar un campo numérico no actualiza su valor

**Reproducción:** crear una planificación con `periods=4`; guardar después `periods=null`, que es lo que envía el frontend al vaciar el campo. La respuesta conserva **4**. `setIfNotNull` omite esa actualización.

**Impacto:** el formulario aparenta permitir borrar el valor, pero el dato anterior reaparece al volver a abrirlo. El mismo patrón afecta a otros campos opcionales tratados de esa manera. Además, la carga del formulario usa `plan.periods || ''` y `plan.weeks || ''`, que convierten un cero en vacío; esto último se identificó por lectura de código.

**Cambio propuesto:** definir la diferencia entre campo omitido y nulo explícito en la operación de actualización. Permitir limpiar los campos opcionales acordados y conservar los ceros con `??`. Añadir pruebas de guardado y recarga con vacío, cero y valor positivo.

Fuentes: [payload y carga del formulario](../../../../FrontEnd/src/pages/DidacticPlansPage.jsx), [actualización del servicio](../../../../BackEnd/src/main/java/com/sgp/systemsgp/service/DidacticPlanService.java), [sonda numérica](../../evidencias/auditoria-integral-2026-11-07/backend-probes.json).

### F07. Un registro existente desaparece de búsqueda y gestión

**Reproducción:** una API paginada contiene **205 cuentas**. La pantalla solicita `page=0&size=200`, muestra **200 de 200 usuarios** y no encuentra «Persona 205». Con ese filtro, el estado vacío dice «Aun no hay usuarios registrados». Se reprodujo en 390 y 1440 px.

**Impacto:** se confunde no haber coincidencias entre los datos cargados con no existir la cuenta. El patrón de cargar una sola página también aparece en instituciones, cursos, pertenencias del perfil y relaciones configuradas con `size=200`; la reproducción de 205 registros se realizó específicamente sobre usuarios.

**Cambio propuesto:** utilizar paginación y búsqueda del servidor, conservar `totalElements` y separar los estados «sin registros», «sin coincidencias» y «error de carga». Revisar los selectores para que tampoco oculten opciones posteriores a esa primera página.

Fuentes: [AccountsPage](../../../../FrontEnd/src/pages/AccountsPage.jsx), [contraprueba de 205 cuentas](../../evidencias/auditoria-integral-2026-11-07/limite-listados.json), [captura móvil](../../evidencias/auditoria-integral-2026-11-07/cuentas-limite-390.png).

### F08. Colisión de acceso flotante con un aviso

**Reproducción:** a 360 px, con respuesta 503 y un mensaje largo del documento, el botón de accesibilidad cubre parte de la esquina inferior izquierda del aviso, en claro y oscuro.

**Cambio propuesto:** reservar una zona o evitar colisiones por defecto con avisos y acciones relevantes. Poder mover el botón ofrece una salida manual, pero no evita la colisión inicial.

Evidencia: [resultado geométrico](../../evidencias/auditoria-integral-2026-11-07/aviso-error/resultado.json), [captura](../../evidencias/auditoria-integral-2026-11-07/aviso-error/light-error-360.png).

### F09. El visor pierde el foco y deja bloqueada la página

**Reproducción:** abrir una evidencia a pantalla completa. El diálogo carece de nombre accesible y no recibe el foco; Tab permite continuar por el contenido del fondo. Abrir después accesibilidad y pulsar Escape cierra **ambos** diálogos. Quedan **cero diálogos visibles**, pero `body` y `html` conservan `overflow:hidden`. Se reprodujo en 390 y 1440 px, excluyendo del conteo el menú lateral oculto.

**Impacto:** cierre inesperado del visor, navegación de teclado fuera del diálogo y pérdida del desplazamiento de la página.

**Cambio propuesto:** integrar el visor con `Modal/useDialogFocus`, asignar nombre y foco inicial, cerrar solo el diálogo superior y usar el mismo contador de bloqueo de desplazamiento. Al cerrar, devolver el foco a la fotografía que lo abrió.

Fuentes: [PhotoFullscreen](../../../../FrontEnd/src/pages/PhotosPage.jsx), [resultado del visor](../../evidencias/auditoria-integral-2026-11-07/visor-modales.json), [captura posterior a Escape](../../evidencias/auditoria-integral-2026-11-07/visor-escape-390.png).

### F10. Casilla «Activo» sin asociación accesible

**Reproducción:** en «Agregar grados» y «Agregar paralelos», la casilla no tiene etiqueta asociada, `aria-label` ni `aria-labelledby`. Se capturaron cuatro instancias: dos formularios en dos tamaños de pantalla.

**Causa:** `Field` no reconoce `ResourceInput` como control asociado; el checkbox interno tampoco recibe un nombre explícito. Los textos comunes sí utilizan `aria-label`, por lo que el problema se concentra en esa rama.

**Cambio propuesto:** asociar la etiqueta al control real y hacer que pulsar el texto cambie su estado. Verificar todas las casillas que reutilicen `ResourceInput`, además de su área de interacción.

Fuentes: [ResourceInput](../../../../FrontEnd/src/components/ResourceCrud.jsx), [Field](../../../../FrontEnd/src/components/ui/FormControls.jsx), [contextos y campos observados](../../evidencias/auditoria-integral-2026-11-07/contextos-modales.json).

## 3. Revisión de flujos por usuario

| Usuario | Recorridos revisados | Resultado y mejoras prioritarias |
| --- | --- | --- |
| Estudiante | Acceso, registro visible, perfil, solicitud, práctica activa/histórica, evidencias, entrevistas, observaciones, planificaciones, L.1–L.6, jornadas, notificaciones y expediente | Las restricciones visuales por estado y la asignación contextual funcionan en los recorridos cubiertos. Corregir F02–F06 y el visor F09. Ante carga fallida, ofrecer reintento y evitar que se trabaje con un estado inicial no confirmado. |
| Tutor institucional | Prácticas asignadas, jornadas/asistencia, planificación institucional, entrevistas asignadas y sección institucional de documentos | Prioridad: F02 y F04. Mostrar claramente la práctica, el alumno y el rango del horario antes de registrar asistencia. Mantener el acceso de consulta al historial. |
| Tutor de prácticas | Paralelos, grupos, inscripciones, revisión por estudiante, retroalimentación, evidencias y datos comunes | La retroalimentación se comprobó con las etiquetas actuales con tildes. Mantener visibles estudiante y paralelo en la bandeja global; dentro de la práctica, conservar el contexto compacto. Revisar consistencia de cupos bajo concurrencia. |
| Directora de institución | Panel de institución, entrevistas asignadas/respondidas y agenda institucional | Vistas y fuentes autorizadas cubiertas en los fixtures y en pruebas de separación de roles. Añadir indicadores que distingan «sin asignaciones» de «no se pudo cargar». No ampliar su acceso usando la cola genérica de otros revisores. |
| Director de prácticas | Ámbito de carrera, paralelos, revisión, reportes, conclusión/reapertura y consulta del archivo | Mantener las restricciones de carrera verificadas por backend. Definir el checklist académico de conclusión y aclarar qué documentos cuenta coordinación. El cierre debe impedir escrituras posteriores, según F02. |
| Administrador | Usuarios por rol, catálogos, instituciones, cursos, grupos, imágenes, archivo por lote/individual y reportes | Resolver F01 antes del despliegue con migraciones; F07 en gestión de usuarios y listas; F10 en catálogos. La disponibilidad del archivo exige corregir F02, aunque el administrador no sea quien haga la escritura posterior. |

## 4. Riesgos y decisiones pendientes, sin atribuirles una reproducción que no se hizo

1. **Concurrencia de cupos.** El servicio comprueba cantidad y después guarda; no se observó bloqueo del curso/grupo ni una versión de entidad que haga atómica esa regla. La restricción única de estudiante/curso no garantiza el cupo total. Falta una prueba simultánea sobre MySQL para confirmar el comportamiento y elegir bloqueo, actualización atómica o restricción equivalente.
2. **Guardado definitivo en dos pestañas.** Los borradores privados sí tienen revisión y pruebas de conflicto. Las entidades operativas y sus PUT no muestran una versión equivalente. El guardado manual necesita una política de concurrencia para evitar sobrescribir una edición posterior; no se ejecutó un ensayo simultáneo de producción.
3. **Pertenencia de una planificación al editar.** El DTO recibe `enrollmentId/sourcePlanId`, mientras la actualización aplica los campos de contenido y no vuelve a asignar esas relaciones. El formulario global puede mostrar esas elecciones. Definir si son inmutables y ocultarlas durante edición, o validar y aplicar el cambio explícitamente. Se detectó por revisión de código.
4. **Caducidad de sesión.** Se emiten y almacenan refresh tokens, pero no aparece una operación de renovación ni un manejo global de 401 en el cliente. La recarga del perfil sí limpia la sesión cuando corresponde. Falta comprobar la expiración durante una edición y ofrecer reautenticación conservando el borrador.
5. **Alcance de coordinación.** El agregador incluye L.1, L.2, L.3 y L.6; no agrega L.4/L.5. Si pretende representar todos los documentos, faltan datos; si pretende medir solo documentos con revisión, la interfaz debe explicar ese alcance y distinguir los estados de los otros dos modelos.
6. **Cuentas con varios roles.** La exploración cubrió los seis roles individuales. Hay decisiones de prioridad basadas en `isStudent` y otras basadas primero en tutor. Si se permiten cuentas multicargo, se necesita una matriz específica de navegación, autoría y permisos efectivos.

## 5. Mejoras de diseño y UX propuestas

- **Estados de pantalla:** diferenciar carga, error recuperable, resultado vacío y búsqueda sin coincidencias. Usar contadores del servidor y un reintento visible. Evitar habilitar guardados cuando no se confirmó la carga del contexto/documento.
- **Diálogos:** unificar foco, Escape, nombre accesible y bloqueo de desplazamiento en un único mecanismo compartido. Aplicarlo primero al visor de evidencias.
- **Datos y formularios:** indicar qué campos proceden de la institución, quién puede corregirlos y cómo pedir esa corrección; validar antes del envío los datos institucionales imprescindibles para documentos. Mantener las decisiones automáticas cuando la práctica ya está determinada.
- **Bandejas de revisión:** priorizar estado, responsable y siguiente acción; agrupar por estudiante/paralelo cuando se trabaja globalmente. Conservar acceso al detalle sin añadir columnas que repitan el contexto.
- **Cierre de práctica:** acordar un checklist de documentos, revisiones y horas necesarias, y un posible motivo de excepción auditable. El requisito actual permite concluir una práctica aprobada; no se ha clasificado la ausencia de ese checklist como un incumplimiento ya especificado.
- **Elementos flotantes:** conservar movimiento y restauración de posición, y añadir prevención de colisiones por defecto con mensajes y controles importantes.
- **Accesibilidad:** corregir etiquetas de casillas y el visor; mantener pruebas de foco en diálogos anidados. Las paletas y acciones ensayadas conservaron contraste mínimo de 5,2 en 144 combinaciones; esto no equivale a una certificación completa de accesibilidad.

## 6. Orden de corrección y aceptación

| Orden | Trabajo | Evidencia necesaria para cerrarlo |
| --- | --- | --- |
| 1 | F01: historial de migraciones | Resolver todas las versiones sin duplicados; instalar y actualizar una base MySQL aislada con el perfil productivo |
| 2 | F02–F04: validación operacional y temporal | Las peticiones reproducidas deben devolver 4xx sin crear ni modificar datos; las lecturas históricas siguen disponibles |
| 3 | F07 y F06: integridad de lectura/edición | Encontrar el registro 205 y paginar con totales reales; limpiar períodos/semanas y conservar cero tras guardar y recargar |
| 4 | F09, F10 y F08: interacción | Escape cierra solo el diálogo superior; el foco queda dentro; se restaura scroll; «Activo» tiene nombre y etiqueta funcional; el aviso no queda cubierto por defecto |
| 5 | F05 y riesgos restantes | Rechazar la falsa imagen y validar formatos reales; ejecutar concurrencia, expiración y decisiones de cierre/alcance de reportes |

Los cambios deberían acompañarse de pruebas de regresión que conviertan las sondas de diagnóstico en pruebas positivas de rechazo o actualización correcta.

## 7. QA y evidencia reproducible

La batería inicial de 18 guiones de navegador produjo 14 aprobaciones y cuatro fallos de guion. La revisión mostró:

- **Un fallo visual real:** colisión del aviso con el botón flotante, F08.
- **Tres expectativas de QA desactualizadas:** borde de tarjetas de 0 px frente al diseño vigente de 1 px; fondo neutro constante frente a las paletas actuales; y selectores sin tildes para «Presentación» y «Abrir retroalimentación». Se ajustaron exclusivamente esos guiones, conservaron sus comprobaciones funcionales/geométricas y pasaron al repetirse.

El resultado revisado de esa batería es **17 guiones aprobados y uno con incidencia real**. La exploración de pantallas, los contextos, las 205 cuentas y el visor son pruebas adicionales; F09/F10 no quedan descartados por el resultado de los guiones anteriores.

La primera ejecución de Mockito dentro del aislamiento del agente no pudo adjuntarse a la JVM. La repetición con ese permiso completó las 142 pruebas. Ese incidente se clasificó como limitación del entorno de prueba.

Comandos principales, desde la raíz del repositorio:

```bash
CI=true npm test --prefix FrontEnd -- --watchAll=false --runInBand
CI=true npm run build --prefix FrontEnd
cd BackEnd
./mvnw -q test
```

Desde la raíz, después de compilar:

```bash
node docs/testing/qa/check-contracts.cjs
node docs/testing/qa/browser-screen-audit.cjs
node docs/testing/qa/browser-screen-audit.cjs --contexts
node docs/testing/qa/browser-audit-data-cases.cjs
node docs/testing/qa/browser-modal-audit.cjs
node docs/testing/qa/audit-http-startup.cjs
```

Las sondas del backend se ejecutan por separado con `node docs/testing/qa/audit-backend-probes.cjs`. Exigen el comportamiento deseado y, en el estado auditado, producen siete fallos diagnósticos. El ejecutor usa H2 de prueba, copia temporalmente la clase y retira esa copia y sus resultados de la suite habitual al terminar. No forma parte del `mvn test` normal.

Evidencias principales:

- [Resumen de base verificada](../../evidencias/auditoria-integral-2026-11-07/base-verificada.json).
- [142 pruebas backend por clase](../../evidencias/auditoria-integral-2026-11-07/backend-baseline.json).
- [Siete reproducciones backend](../../evidencias/auditoria-integral-2026-11-07/backend-probes.json).
- [HTTP real con Tomcat y H2](../../evidencias/auditoria-integral-2026-11-07/http-arranque.json).
- [Batería de navegador y revalidaciones](../../evidencias/auditoria-integral-2026-11-07/browser-suite.json).
- [Pantallas y pestañas](../../evidencias/auditoria-integral-2026-11-07/pantallas.json).
- [Contextos, modales y casillas](../../evidencias/auditoria-integral-2026-11-07/contextos-modales.json).
- [Visor de fotografías y diálogos anidados](../../evidencias/auditoria-integral-2026-11-07/visor-modales.json).
- [Hallazgos estructurados](../../evidencias/auditoria-integral-2026-11-07/hallazgos.json).

[Volver a informes](../README.md).
