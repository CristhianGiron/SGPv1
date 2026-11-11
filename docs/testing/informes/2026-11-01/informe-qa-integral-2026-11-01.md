<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          informe-qa-integral-2026-11-01.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Revisión QA integral de SGPv1.
-->

# Revisión QA integral de SGPv1

> Informe de una ejecución específica. Sus conteos se conservan como evidencia histórica; consulte el [índice de pruebas](../../README.md) para localizar las revisiones posteriores.


Fecha: 1 de noviembre de 2026. Evaluación de la copia de trabajo actual, incluidos los cambios que ya existían antes de esta revisión.

La revisión encontró defectos funcionales y de indicadores aunque las pruebas anteriores pasaban. Se corrigieron los hallazgos descritos y se agregaron pruebas de regresión. Este informe distingue la ejecución real con persistencia H2, las pruebas con servicios simulados y la inspección de código. No equivale a una certificación de producción ni a la ejecución de todas las combinaciones posibles de datos.

## Resultado de las verificaciones

| Verificación | Resultado | Qué acredita |
| --- | --- | --- |
| Backend: `./mvnw -q test` | 22 suites, 100 pruebas; sin fallos, errores ni omisiones | Compilación, regresión existente, pruebas nuevas de servicios, JWT, seguridad HTTP y persistencia H2 |
| Frontend: `CI=true npm test -- --watchAll=false --runInBand` | 16 suites, 33 pruebas aprobadas | Regresión de interfaz, envío de planificaciones, fallos de carga, indicadores y notificaciones |
| Frontend: `npm run build` | Compilación correcta | Generación del bundle de producción |
| Contratos configurados de documentos y jornadas | 67 pares método/ruta únicos; ninguno sin controlador | Correspondencia estática; no valida cada cuerpo de petición ni concede permisos |
| Navegación Chrome | 102 combinaciones ruta/rol, sin errores JavaScript no capturados ni desbordamiento horizontal observado | Renderizado del frontend compilado con respuestas API simuladas y aisladas |
| Interacciones Chrome | 3 comprobaciones adicionales aprobadas | Redirección del estudiante fuera de Usuarios, cierre móvil con Escape y búsqueda con navegación |
| `git diff --check` | Correcto | Ausencia de errores de espacios en el diff |

La primera ejecución de Maven dentro del aislamiento falló al adjuntar el agente de Mockito: 66 errores de inicialización, no fallos de las reglas del negocio. La ejecución fuera del aislamiento pudo evaluar las pruebas. Una expectativa nueva comparaba inicialmente una cadena de estado con un enum; se corrigió la prueba al contrato real antes de la ejecución final.

El build advierte que la base de navegadores de Browserslist está desactualizada; no bloqueó la compilación.

## Hallazgos corregidos

| ID | Prioridad | Hallazgo y consecuencia | Corrección / evidencia |
| --- | --- | --- | --- |
| QA-01 | Alta | El reporte de coordinación cargaba todos los documentos sin considerar la carrera del director. | El controlador pasa la identidad y el servicio aplica `PracticeAccessService`. Admin conserva alcance global; director sin carrera no obtiene datos ajenos. `CoordinationReportServiceTest` y seguridad HTTP en `QaUserWorkflowsTest`. |
| QA-02 | Alta | El refresh token podía autenticarse como access token, prolongando el acceso fuera de la duración prevista. | Se distinguen ambos usos. HTTP y WebSocket comparten la validación. Los access tokens antiguos con roles siguen siendo reconocidos; los refresh antiguos sin roles se rechazan. Pruebas JWT y petición Bearer real en MockMvc. |
| QA-03 | Media | La duración de acceso estaba fija en 24 horas e ignoraba `jwt.expiration`. | Se utiliza la configuración, con 24 horas como valor de respaldo. `JwtServiceTest`. |
| QA-04 | Media | Los contadores “por revisar” sumaban documentos aprobados y revisiones ya realizadas por el tutor. | Se cuentan únicamente `SUBMITTED` pendientes del revisor correspondiente. Las listas de evaluación y seguimiento, que no son bandejas de revisión, se excluyen de tareas pendientes. `practiceIndicators.test.js` y `DashboardPage.test.jsx`. |
| QA-05 | Media | Errores de carga del inicio se convertían en listas vacías: se anunciaban cero documentos o ausencia de pendientes sin haber consultado los datos. | Se propagan los errores y se muestra información no disponible. Los indicadores de jornadas/archivo también distinguen errores de ceros válidos; el reporte fallido no muestra tablas vacías como resultado exitoso. Pruebas del dashboard. |
| QA-06 | Media | Sin aprobaciones, el promedio general se mostraba como cero horas; fechas de aprobación residuales podían participar en el cálculo. | Sin muestra se muestra “—”. Solo documentos actualmente aprobados, con fechas presentes y duración no negativa, integran el promedio. Una aprobación realmente instantánea conserva `0.0`. Pruebas del reporte. |
| QA-07 | Media | Cursos distintos con el mismo nombre se agrupaban en el reporte; en archivo se subestimaba el número de paralelos al contar nombres. | Agrupación de reporte por ID y nombre; conteos de archivo por identidad de curso/carrera/ciclo, con respaldo por texto para registros sin ID. Pruebas del reporte y de archivo. |
| QA-08 | Media | Inicio sumaba ausencias justificadas al tiempo asistido, mientras Jornadas solo sumaba presentes y atrasos. | Ambas pantallas usan el mismo cálculo. Justificadas y faltas se cuentan separadamente sin agregar tiempo asistido. Pruebas de indicadores. |
| QA-09 | Media | Una asistencia podía declarar minutos distintos de los derivados de sus horas y alterar los acumulados. | Se rechaza la discrepancia entre minutos declarados e intervalo registrado. `PracticeScheduleServiceTest`. |
| QA-10 | Alta | Enviar una planificación existente sin guardar enviaba la versión anterior del servidor. | Enviar persiste el contenido actual del formulario con el estado solicitado. `DidacticPlansPage.test.jsx`. |
| QA-11 | Media | Si fallaba el PDF después de crear la planificación, reintentar podía crear otro borrador. | Se conserva inmediatamente el borrador creado y su ID; reintentar lo actualiza. Prueba con fallo de carga y comprobación de una única creación. |
| QA-12 | Media | La carga de planificación aceptaba texto arbitrario si tenía extensión o tipo MIME de PDF. | PDFBox valida el contenido antes de almacenarlo; se rechazan archivos ilegibles y protegidos. Prueba con texto renombrado y con PDF real. |
| QA-13 | Media | Los errores de permisos se ocultaban y los errores generales desaparecían antes de que el usuario pudiera atenderlos. | Errores visibles hasta cerrarlos y avisos no descartables persistentes. `Alert.test.jsx`. |
| QA-14 | Media | El formulario de imágenes del inicio utilizaba `event.currentTarget` después de esperar la petición. React ya había liberado esa referencia. | Se captura el formulario antes del `await` para restablecerlo tras guardar. Corrección por inspección del ciclo de eventos; no se ejecutó una carga real contra almacenamiento externo. |
| QA-15 | Media | Promedio, mínimo y máximo de una respuesta numérica igual a cero aparecían como “-”. | Se conserva cero al presentar la tabulación. Pruebas de `PracticeFormsPage`, más persistencia de respuesta cero en H2. |
| QA-16 | Media | Repetir un mensaje WebSocket aumentaba otra vez los no leídos; marcar como leído en una pantalla no actualizaba la otra instancia de la campana/listado. | Se deduplican los eventos por identidad y estado de lectura; las mutaciones recargan el conteo del servidor y sincronizan las instancias montadas. `useNotifications.test.jsx`. |

## Inventario de indicadores revisados

| Área | Indicadores / interpretación | Verificación |
| --- | --- | --- |
| Inicio de estudiante | Inscripciones y fotografías registradas; no se interpretan todas las inscripciones históricas como prácticas activas | Trazado de endpoints, carga fallida y estados vacíos en pruebas React |
| Expediente | Documentos aprobados y creados; evidencias; entrevistas; número de registros de asistencia y minutos asistidos | Cálculos compartidos y pruebas de estados; una jornada programada no equivale a una asistencia registrada |
| Mis documentos | Borradores, enviados, por corregir y aprobados | Conteo por estado y comprobación de carga fallida |
| Inicio de tutor | Planes/informes pendientes y bandejas de tareas | Pruebas con documentos aprobados, enviados y con aprobación parcial |
| Inicio de administrador | Total de cuentas obtenido de `totalElements`; facultades del listado | Revisión del contrato y renderizado; no se reemplaza el total paginado por el tamaño de una página |
| Coordinación | Pendientes, correcciones, aprobados, estudiantes únicos con correcciones y tiempo medio | Pruebas de alcance por carrera, totales por estado, deduplicación y tiempos válidos/nulos/cero |
| Coordinación por documento | Borrador + pendiente + corrección + aprobado = total | Prueba de suma de estados |
| Coordinación por paralelo | Identidad por ID, pendientes y aprobaciones | Prueba de dos paralelos con el mismo nombre |
| Tiempo de revisión | Desde el último envío hasta la aprobación final; muestra válida y promedio redondeado a una décima | Pruebas con 90/150 minutos, fecha negativa, documento no aprobado y ausencia de muestra |
| Jornadas | Presentes, atrasos, faltas, justificadas y tiempo asistido | Pruebas de cada estado, dato inválido y minutos declarados inconsistentes |
| Archivo | Totales por estado, archivadas, archivables y número de carreras/ciclos/paralelos | Prueba de IDs con nombres iguales; inspección de agrupaciones. Archivadas es una propiedad de prácticas concluidas y puede solaparse con el contador Concluidas |
| Entrevistas/fichas | Frecuencias por opción, Sí/No, número de respuestas, promedio, mínimo, máximo y porcentajes | Persistencia H2 de cero y respuesta booleana falsa; prueba visual de cero y distribución vacía. Inspección de cálculo BigDecimal y guardas contra división por cero |
| Notificaciones | Conteo del servidor, deduplicación y lectura entre instancias | Pruebas con evento repetido, cambio de estado de lectura y página/campana montadas a la vez |
| Listas y filtros | Registros visibles frente a registros cargados | Inspección de filtrado local y contratos de paginación. No se ejecutó una prueba de volumen elevado |

## Cobertura por caso de uso

Numeración de `docs/requisitos/especificacion.md`, que enumera 26 casos; el diagrama PlantUML tiene otra agrupación.

| Casos | Revisión / ejecución alcanzada |
| --- | --- |
| CU-001 Inicio de sesión | Inspección del flujo y pruebas de JWT, Bearer HTTP, cuenta bloqueada y acceso sin token. La suite React también verifica la pantalla pública. No se probó un login con contraseña contra una base real externa |
| CU-002 y CU-003 Registro y opciones públicas | Inspección de DTO, validaciones, consultas y frontend. No se ejecutó un registro público completo persistido por HTTP |
| CU-004 Perfil | Navegación de seis roles y API propia con Bearer; no se ejecutaron todos los cambios de campos/imagen/contraseña desde navegador |
| CU-005 Cuentas | Pruebas HTTP de acceso restringido y navegación de admin; no ciclo CRUD completo de administración |
| CU-006 Catálogos y territorio | Inspección y rutas permitidas; no CRUD exhaustivo |
| CU-007 Instituciones | Inspección y rutas permitidas; esquema real MySQL pendiente |
| CU-008 Cursos y grupos | Regresión existente de cursos y asignación de un grupo persistida en H2 |
| CU-009 Inscripción | Regresión existente, aprobación y retirada persistidas en H2 |
| CU-010 Asignación | Asignación a grupo y resolución del tutor institucional comprobadas con persistencia |
| CU-011 Concluir/reabrir | Flujo persistido y reglas de acceso existentes |
| CU-012 Archivar/recuperar | Flujo persistido y conteos de agrupación en frontend |
| CU-013 y CU-014 Documentos y revisión | Regresión existente de plan/informe/final/actividades, controladores, corrección, aprobaciones, PDF y permisos; nuevos conteos de bandejas |
| CU-015 Evaluación y seguimiento | Suites existentes de ambos servicios y navegación; no todas las interacciones del formulario en navegador |
| CU-016 Actividades cumplidas | Regresión existente de servicio/controlador y navegación |
| CU-017 Evidencias | Regresión existente de acceso/carga/consulta y navegación; no prueba de un almacenamiento remoto |
| CU-018 Entrevistas/fichas | Flujos H2 con autor, tutor, directora institucional y supervisores; respuesta, interpretación, persistencia y tabulación. No se ejecutó una encuesta de gran volumen |
| CU-019 Jornadas/asistencias | Regresión de servicio, fechas, permisos y minutos; cálculo compartido de resumen |
| CU-020 Planificación | Borrador → envío → recomendación → corrección → reenvío con H2, PDF real, acceso ajeno rechazado y pruebas React de envío/reintento |
| CU-021 Panel/notificaciones | Indicadores, cargas fallidas, deduplicación y sincronización; WebSocket simulado en pruebas unitarias, no conexión real de producción |
| CU-022 Anuncios | Inspección y acceso visual de admin; no envío real a destinatarios |
| CU-023 Coordinación | Seguridad HTTP, pruebas de cálculo/alcance y navegador con fixtures |
| CU-024 Imágenes de interfaz | Inspección y corrección del formulario; no carga real de almacenamiento |
| CU-025 PDF | Pruebas existentes de exportación y carga/lectura de PDF de planificación; no descarga manual de cada formato para cada rol |
| CU-026 Recuperación administrativa | Suite existente de recuperación y configuración condicional; no recuperación contra cuentas externas |

## Recorrido visual por rol

| Rol | Combinaciones de rutas |
| --- | ---: |
| Estudiante | 17 |
| Tutor de prácticas | 17 |
| Tutor institucional | 10 |
| Directora de institución | 5 |
| Director de prácticas | 24 |
| Administrador | 29 |
| Total | 102 |

El recorrido incluye rutas principales y secundarias. Todas mostraron un encabezado y ninguna ruta distinta de Inicio cayó inesperadamente en el dashboard. Los fixtures solo acreditan renderizado y navegación: la autorización de datos se comprobó separadamente en las pruebas del backend, no se deduce de esta tabla.

## Pendientes y límites

1. **Renovación de sesión:** la API devuelve un refresh token, pero no existe un endpoint de renovación ni un flujo automático en React. Se corrigió su aceptación indebida como acceso; el usuario debe volver a iniciar sesión al vencer el acceso. Falta definir e implementar la renovación si se desea esa capacidad.
2. **Producción y migraciones:** H2 usa `create-drop` con Flyway deshabilitado. No se ejecutaron V1–V4 contra una copia de MySQL/MariaDB ni el arranque de producción con `ddl-auto=validate`. No se debe interpretar el resultado H2 como validación de esas migraciones.
3. **Integraciones reales:** no se validaron AWS/Rekognition, almacenamiento remoto, orígenes WebSocket/CORS de despliegue ni la infraestructura de producción.
4. **Concurrencia/volumen:** faltan pruebas simultáneas de cupos, revisiones, eventos de notificación y carga de datos. Las pruebas de duplicación de notificaciones son deterministas, no una prueba de carga del servidor.
5. **Cobertura manual:** la tabla de casos explicita los módulos revisados por inspección o renderizado que aún no tienen un recorrido completo de creación/edición/eliminación por HTTP y navegador.

Los pendientes anteriores son límites concretos del veredicto. No se declara “todo el sistema libre de errores”. Las correcciones no requieren una migración nueva.

## Evidencia y reproducción

- [Resultado de navegación](../../evidencias/evidencia-qa-navegacion.json).
- [Resultado de contratos](../../evidencias/evidencia-qa-contratos.json).
- [Comprobador de contratos](../../qa/check-contracts.cjs), sin dependencias adicionales.
- [Recorrido de navegador](../../qa/browser-routes.cjs), requiere `FrontEnd/build`, Chrome y `puppeteer-core` disponible en `FrontEnd/node_modules` (presente en el entorno de esta revisión). Si no están disponibles, no se instala nada automáticamente.
- Pruebas nuevas backend: `CoordinationReportServiceTest`, `QaUserWorkflowsTest`, `JwtServiceTest` y regresión adicional en `PracticeScheduleServiceTest`.
- Pruebas nuevas frontend: dashboard, planificación, archivo, tabulación, alertas, notificaciones e indicadores.

Desde la raíz `SGPv1`:

```bash
node docs/testing/qa/check-contracts.cjs
node docs/testing/qa/browser-routes.cjs
```

Desde `BackEnd`: `./mvnw -q test`.
Desde `FrontEnd`: `CI=true npm test -- --watchAll=false --runInBand` y `npm run build`.

El recorrido de navegador usa un servidor estático efímero en loopback y respuestas API ficticias; cierra ambos al terminar. Los flujos H2 se ejecutan dentro de transacciones de prueba revertidas. No se usaron cuentas reales ni se modificaron registros de una base externa.
