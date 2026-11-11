<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          auditoria-pantallas.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Cobertura por pantalla, pestaña y diálogo.
-->

# Cobertura por pantalla, pestaña y diálogo

Auditoría del 7 de noviembre de 2026. Este anexo registra navegación y presentación con fixtures: no implica que se haya completado y guardado cada formulario con datos reales. Se recorrieron seis roles individuales, con 390 px en oscuro y 1440 px en claro. Otras baterías cubren las paletas, contraste y accesibilidad en más tamaños.

Cada ruta base se volvió a abrir para recorrer sus pestañas visibles y controles de apertura disponibles. Las revisitas explican por qué existen 1.182 observaciones para menos pantallas distintas. Los diálogos se cuentan solo cuando están visibles; el menú lateral oculto se excluye.

[Informe y hallazgos](auditoria-integral.md).

## Resumen de las rutas base

| Rol | Rutas | Tamaños por ruta | Estados de pestañas | Observaciones de diálogos |
| --- | ---: | ---: | ---: | ---: |
| Estudiante | 18 | 2 | 62 | 8 |
| Tutor de prácticas | 19 | 2 | 48 | 10 |
| Tutor institucional | 12 | 2 | 34 | 8 |
| Directora de institución | 7 | 2 | 22 | 4 |
| Director de prácticas | 26 | 2 | 42 | 28 |
| Administrador | 31 | 2 | 48 | 52 |

## Pantallas base

### Estudiante

| Ruta | Encabezado observado | Anchos | Pestañas recorridas | Diálogos observados | Notas |
| --- | --- | --- | --- | --- | --- |
| courses | Paralelos disponibles y mis prácticas | 390, 1440 | Mis prácticas; Paralelos disponibles | Buscar paralelos disponibles | Sin incidencia geométrica/JS en los estados observados |
| dashboard | Mis prácticas | 390, 1440 | — | — | Sin incidencia geométrica/JS en los estados observados |
| didactic-plans | Planificaciones didácticas | 390, 1440 | Formulario; Tabla de planificaciones | — | Sin incidencia geométrica/JS en los estados observados |
| documents | Documentos y reportes | 390, 1440 | Detalle; Editar | — | Sin incidencia geométrica/JS en los estados observados |
| documents/activity-evaluations | L.4. Evaluación de Actividades | 390, 1440 | Listado | — | Sin incidencia geométrica/JS en los estados observados |
| documents/activity-plans | L.2. Plan de Actividades | 390, 1440 | Detalle; Editar | — | Sin incidencia geométrica/JS en los estados observados |
| documents/completed-records | L.6. Registro de Actividades Cumplidas | 390, 1440 | Detalle; Editar | — | Sin incidencia geométrica/JS en los estados observados |
| documents/final-reports | L.3. Informe Tutor Institucional | 390, 1440 | Detalle; Editar | — | Sin incidencia geométrica/JS en los estados observados |
| documents/follow-up | L.5. Reporte de Seguimiento | 390, 1440 | Listado | — | Sin incidencia geométrica/JS en los estados observados |
| documents/practice-reports | L.1. Informe de Actividades Cumplidas | 390, 1440 | Detalle; Editar | — | Sin incidencia geométrica/JS en los estados observados |
| forms | Entrevistas | 390, 1440 | Crear entrevista; Mis entrevistas | — | Sin incidencia geométrica/JS en los estados observados |
| notifications | Tus notificaciones | 390, 1440 | Leídas (0); Sin leer (0); Todas (0) | — | Sin incidencia geométrica/JS en los estados observados |
| observation-forms | Fichas de observación | 390, 1440 | Crear ficha; Mis fichas | — | Sin incidencia geométrica/JS en los estados observados |
| photos | Evidencias fotograficas | 390, 1440 | Mis evidencias; Subir evidencia | — | F09: visor revisado en prueba adicional |
| practice-archive | Archivo de prácticas | 390, 1440 | — | Filtrar prácticas | Sin incidencia geométrica/JS en los estados observados |
| practices | Mis prácticas | 390, 1440 | — | — | Sin incidencia geométrica/JS en los estados observados |
| profile | Usuario de auditoría | 390, 1440 | Contraseña; Datos personales; Mi información; Resumen | Cambiar contraseña; Datos personales | Sin incidencia geométrica/JS en los estados observados |
| schedules | Mis jornadas | 390, 1440 | Agenda semanal; Jornadas y asistencias | — | Sin incidencia geométrica/JS en los estados observados |
### Tutor de prácticas

| Ruta | Encabezado observado | Anchos | Pestañas recorridas | Diálogos observados | Notas |
| --- | --- | --- | --- | --- | --- |
| courses | Paralelos y prácticas | 390, 1440 | Paralelos | Filtrar paralelos | Sin incidencia geométrica/JS en los estados observados |
| dashboard | Tutoría de prácticas | 390, 1440 | — | — | Sin incidencia geométrica/JS en los estados observados |
| didactic-plans | Planificaciones didácticas | 390, 1440 | Tabla de planificaciones | — | Sin incidencia geométrica/JS en los estados observados |
| documents | Documentos y reportes | 390, 1440 | Listado | — | Sin incidencia geométrica/JS en los estados observados |
| documents/activity-evaluations | L.4. Evaluación de Actividades | 390, 1440 | Crear; Listado | — | Sin incidencia geométrica/JS en los estados observados |
| documents/activity-plans | L.2. Plan de Actividades | 390, 1440 | Listado | — | Sin incidencia geométrica/JS en los estados observados |
| documents/completed-records | L.6. Registro de Actividades Cumplidas | 390, 1440 | Listado | — | Sin incidencia geométrica/JS en los estados observados |
| documents/final-reports | L.3. Informe Tutor Institucional | 390, 1440 | Listado | — | Sin incidencia geométrica/JS en los estados observados |
| documents/follow-up | L.5. Reporte de Seguimiento | 390, 1440 | Crear; Listado | — | Sin incidencia geométrica/JS en los estados observados |
| documents/practice-reports | L.1. Informe de Actividades Cumplidas | 390, 1440 | Listado | — | Sin incidencia geométrica/JS en los estados observados |
| forms | Entrevistas | 390, 1440 | Respondidas | — | Sin incidencia geométrica/JS en los estados observados |
| notifications | Tus notificaciones | 390, 1440 | Leídas (0); Sin leer (0); Todas (0) | — | Sin incidencia geométrica/JS en los estados observados |
| observation-forms | Fichas de observación | 390, 1440 | Respondidas | — | Sin incidencia geométrica/JS en los estados observados |
| overview | Hola, Usuario | 390, 1440 | — | — | Sin incidencia geométrica/JS en los estados observados |
| photos | Evidencias fotograficas | 390, 1440 | Por revisar | Filtrar fotografias | F09: visor revisado en prueba adicional |
| practice-archive | Archivo de prácticas | 390, 1440 | — | Filtrar prácticas | Sin incidencia geométrica/JS en los estados observados |
| practices | Paralelos y estudiantes | 390, 1440 | — | — | Sin incidencia geométrica/JS en los estados observados |
| profile | Usuario de auditoría | 390, 1440 | Contraseña; Datos personales; Mi información; Resumen | Cambiar contraseña; Datos personales | Sin incidencia geométrica/JS en los estados observados |
| schedules | Jornadas y asistencias | 390, 1440 | Agenda semanal; Gestión y registros; Listado | — | Sin incidencia geométrica/JS en los estados observados |
### Tutor institucional

| Ruta | Encabezado observado | Anchos | Pestañas recorridas | Diálogos observados | Notas |
| --- | --- | --- | --- | --- | --- |
| dashboard | Tutoría institucional | 390, 1440 | — | — | Sin incidencia geométrica/JS en los estados observados |
| didactic-plans | Planificaciones didácticas | 390, 1440 | Formulario; Tabla de planificaciones | — | Sin incidencia geométrica/JS en los estados observados |
| documents | Documentos y reportes | 390, 1440 | Listado | — | Sin incidencia geométrica/JS en los estados observados |
| documents/final-reports | L.3. Informe Tutor Institucional | 390, 1440 | Listado | — | Sin incidencia geométrica/JS en los estados observados |
| forms | Entrevistas | 390, 1440 | Por responder | — | Sin incidencia geométrica/JS en los estados observados |
| notifications | Tus notificaciones | 390, 1440 | Leídas (0); Sin leer (0); Todas (0) | — | Sin incidencia geométrica/JS en los estados observados |
| overview | Hola, Usuario | 390, 1440 | — | — | Sin incidencia geométrica/JS en los estados observados |
| photos | Evidencias fotograficas | 390, 1440 | Por revisar | Filtrar fotografias | F09: visor revisado en prueba adicional |
| practice-archive | Archivo de prácticas | 390, 1440 | — | Filtrar prácticas | Sin incidencia geométrica/JS en los estados observados |
| practices | Mis estudiantes asignados | 390, 1440 | — | — | Sin incidencia geométrica/JS en los estados observados |
| profile | Usuario de auditoría | 390, 1440 | Contraseña; Datos personales; Mi información; Resumen | Cambiar contraseña; Datos personales | Sin incidencia geométrica/JS en los estados observados |
| schedules | Jornadas y asistencias | 390, 1440 | Agenda semanal; Crear; Gestión y registros; Listado | — | Sin incidencia geométrica/JS en los estados observados |
### Directora de institución

| Ruta | Encabezado observado | Anchos | Pestañas recorridas | Diálogos observados | Notas |
| --- | --- | --- | --- | --- | --- |
| dashboard | Mi institución | 390, 1440 | — | — | Sin incidencia geométrica/JS en los estados observados |
| forms | Entrevistas | 390, 1440 | Por responder | — | Sin incidencia geométrica/JS en los estados observados |
| institution-work | Mi institución | 390, 1440 | — | — | Sin incidencia geométrica/JS en los estados observados |
| notifications | Tus notificaciones | 390, 1440 | Leídas (0); Sin leer (0); Todas (0) | — | Sin incidencia geométrica/JS en los estados observados |
| practices | Mi institución | 390, 1440 | — | — | Sin incidencia geométrica/JS en los estados observados |
| profile | Usuario de auditoría | 390, 1440 | Contraseña; Datos personales; Mi información; Resumen | Cambiar contraseña; Datos personales | Sin incidencia geométrica/JS en los estados observados |
| schedules | Jornadas y asistencias | 390, 1440 | Agenda semanal; Gestión y registros; Listado | — | Sin incidencia geométrica/JS en los estados observados |
### Director de prácticas

| Ruta | Encabezado observado | Anchos | Pestañas recorridas | Diálogos observados | Notas |
| --- | --- | --- | --- | --- | --- |
| courses | Paralelos y prácticas | 390, 1440 | Crear paralelo; Paralelos | Crear paralelo; Filtrar paralelos | Sin incidencia geométrica/JS en los estados observados |
| dashboard | Coordinación de prácticas | 390, 1440 | — | — | Sin incidencia geométrica/JS en los estados observados |
| didactic-plans | Planificaciones didácticas | 390, 1440 | Tabla de planificaciones | — | Sin incidencia geométrica/JS en los estados observados |
| documents | Documentos y reportes | 390, 1440 | Listado | — | Sin incidencia geométrica/JS en los estados observados |
| documents/activity-plans | L.2. Plan de Actividades | 390, 1440 | Listado | — | Sin incidencia geométrica/JS en los estados observados |
| documents/completed-records | L.6. Registro de Actividades Cumplidas | 390, 1440 | Listado | — | Sin incidencia geométrica/JS en los estados observados |
| documents/final-reports | L.3. Informe Tutor Institucional | 390, 1440 | Listado | — | Sin incidencia geométrica/JS en los estados observados |
| documents/practice-reports | L.1. Informe de Actividades Cumplidas | 390, 1440 | Listado | — | Sin incidencia geométrica/JS en los estados observados |
| forms | Entrevistas | 390, 1440 | Respondidas | — | Sin incidencia geométrica/JS en los estados observados |
| institutions | Centros de prácticas | 390, 1440 | — | Filtrar instituciones de práctica | Sin incidencia geométrica/JS en los estados observados |
| institutions/institutions | Centros de prácticas | 390, 1440 | — | Filtrar instituciones de práctica | Sin incidencia geométrica/JS en los estados observados |
| notifications | Tus notificaciones | 390, 1440 | Leídas (0); Sin leer (0); Todas (0) | — | Sin incidencia geométrica/JS en los estados observados |
| observation-forms | Fichas de observación | 390, 1440 | Respondidas | — | Sin incidencia geométrica/JS en los estados observados |
| overview | Hola, Usuario | 390, 1440 | — | — | Sin incidencia geométrica/JS en los estados observados |
| photos | Evidencias fotograficas | 390, 1440 | Por revisar | Filtrar fotografias | F09: visor revisado en prueba adicional |
| practice-archive | Archivo de prácticas | 390, 1440 | — | Filtrar prácticas | Sin incidencia geométrica/JS en los estados observados |
| practices | Paralelos y estudiantes | 390, 1440 | — | — | Sin incidencia geométrica/JS en los estados observados |
| profile | Usuario de auditoría | 390, 1440 | Contraseña; Datos personales; Mi información; Resumen | Cambiar contraseña; Datos personales | Sin incidencia geométrica/JS en los estados observados |
| reports | Seguimiento general | 390, 1440 | — | — | Sin incidencia geométrica/JS en los estados observados |
| schedules | Jornadas y asistencias | 390, 1440 | Agenda semanal; Gestión y registros; Listado | — | Sin incidencia geométrica/JS en los estados observados |
| universities | Estructura académica | 390, 1440 | — | Filtrar universidades | Sin incidencia geométrica/JS en los estados observados |
| universities/academic-cycles | Ciclos académicos | 390, 1440 | — | Filtros | Sin incidencia geométrica/JS en los estados observados |
| universities/careers | Carreras | 390, 1440 | — | Filtros | Sin incidencia geométrica/JS en los estados observados |
| universities/faculties | Facultades | 390, 1440 | — | Filtros | Sin incidencia geométrica/JS en los estados observados |
| universities/universities | Estructura académica | 390, 1440 | — | Filtrar universidades | Sin incidencia geométrica/JS en los estados observados |
| universities/university-subjects | Asignaturas universitarias | 390, 1440 | — | Filtros | Sin incidencia geométrica/JS en los estados observados |
### Administrador

| Ruta | Encabezado observado | Anchos | Pestañas recorridas | Diálogos observados | Notas |
| --- | --- | --- | --- | --- | --- |
| accounts | Gestionar usuarios | 390, 1440 | — | — | Sin incidencia geométrica/JS en los estados observados |
| courses | Paralelos y prácticas | 390, 1440 | Crear paralelo; Paralelos | Crear paralelo; Filtrar paralelos | Sin incidencia geométrica/JS en los estados observados |
| dashboard | Administración | 390, 1440 | — | — | Sin incidencia geométrica/JS en los estados observados |
| didactic-plans | Planificaciones didácticas | 390, 1440 | Tabla de planificaciones | — | Sin incidencia geométrica/JS en los estados observados |
| documents | Documentos y reportes | 390, 1440 | Listado | — | Sin incidencia geométrica/JS en los estados observados |
| documents/activity-plans | L.2. Plan de Actividades | 390, 1440 | Listado | — | Sin incidencia geométrica/JS en los estados observados |
| documents/completed-records | L.6. Registro de Actividades Cumplidas | 390, 1440 | Listado | — | Sin incidencia geométrica/JS en los estados observados |
| documents/final-reports | L.3. Informe Tutor Institucional | 390, 1440 | Listado | — | Sin incidencia geométrica/JS en los estados observados |
| documents/practice-reports | L.1. Informe de Actividades Cumplidas | 390, 1440 | Listado | — | Sin incidencia geométrica/JS en los estados observados |
| forms | Entrevistas | 390, 1440 | Respondidas | — | Sin incidencia geométrica/JS en los estados observados |
| institutions | Centros de prácticas | 390, 1440 | — | Filtrar instituciones de práctica | Sin incidencia geométrica/JS en los estados observados |
| institutions/grade-parallels | Paralelos | 390, 1440 | — | Agregar paralelos; Filtros | Sin incidencia geométrica/JS en los estados observados |
| institutions/grades | Grados | 390, 1440 | — | Agregar grados; Filtros | Sin incidencia geométrica/JS en los estados observados |
| institutions/institutions | Centros de prácticas | 390, 1440 | — | Filtrar instituciones de práctica | Sin incidencia geométrica/JS en los estados observados |
| institutions/practice-subjects | Asignaturas de práctica | 390, 1440 | — | Agregar asignaturas de práctica; Filtros | Sin incidencia geométrica/JS en los estados observados |
| locations | Territorio | 390, 1440 | Cantones; Parroquias; Provincias | Agregar provincias; Filtros | Sin incidencia geométrica/JS en los estados observados |
| notifications | Tus notificaciones | 390, 1440 | Leídas (0); Sin leer (0); Todas (0) | — | Sin incidencia geométrica/JS en los estados observados |
| observation-forms | Fichas de observación | 390, 1440 | Respondidas | — | Sin incidencia geométrica/JS en los estados observados |
| overview | Hola, Usuario | 390, 1440 | — | — | Sin incidencia geométrica/JS en los estados observados |
| photos | Evidencias fotograficas | 390, 1440 | Por revisar | Filtrar fotografias | F09: visor revisado en prueba adicional |
| practice-archive | Archivo de prácticas | 390, 1440 | — | Filtrar prácticas | Sin incidencia geométrica/JS en los estados observados |
| practices | Paralelos y estudiantes | 390, 1440 | — | — | Sin incidencia geométrica/JS en los estados observados |
| profile | Usuario de auditoría | 390, 1440 | Contraseña; Datos personales; Mi información; Resumen | Cambiar contraseña; Datos personales | Sin incidencia geométrica/JS en los estados observados |
| reports | Seguimiento general | 390, 1440 | — | — | Sin incidencia geométrica/JS en los estados observados |
| schedules | Jornadas y asistencias | 390, 1440 | Agenda semanal; Gestión y registros; Listado | — | Sin incidencia geométrica/JS en los estados observados |
| universities | Estructura académica | 390, 1440 | — | Filtrar universidades | Sin incidencia geométrica/JS en los estados observados |
| universities/academic-cycles | Ciclos académicos | 390, 1440 | — | Agregar ciclos académicos; Filtros | Sin incidencia geométrica/JS en los estados observados |
| universities/careers | Carreras | 390, 1440 | — | Agregar carreras; Filtros | Sin incidencia geométrica/JS en los estados observados |
| universities/faculties | Facultades | 390, 1440 | — | Agregar facultades; Filtros | Sin incidencia geométrica/JS en los estados observados |
| universities/universities | Estructura académica | 390, 1440 | — | Filtrar universidades | Sin incidencia geométrica/JS en los estados observados |
| universities/university-subjects | Asignaturas universitarias | 390, 1440 | — | Agregar asignaturas universitarias; Filtros | Sin incidencia geométrica/JS en los estados observados |

## Contextos adicionales: catálogos, paralelos y cuentas

### Tutor de prácticas

| Ruta | Encabezado observado | Anchos | Pestañas recorridas | Diálogos observados | Notas |
| --- | --- | --- | --- | --- | --- |
| courses?courseId=10&view=enrollments | Paralelos y prácticas | 390, 1440 | Gestión del paralelo; Inscripciones; Paralelos | Filtros | Sin incidencia geométrica/JS en los estados observados |
| courses?courseId=10&view=manage | Paralelos y prácticas | 390, 1440 | Gestión del paralelo; Inscripciones; Paralelos | Crear grupo; Datos comunes del paralelo; Filtros | Sin incidencia geométrica/JS en los estados observados |
### Administrador

| Ruta | Encabezado observado | Anchos | Pestañas recorridas | Diálogos observados | Notas |
| --- | --- | --- | --- | --- | --- |
| accounts | Estudiante | 390, 1440 | — | Crear usuario | Sin incidencia geométrica/JS en los estados observados |
| courses?courseId=10&view=enrollments | Paralelos y prácticas | 390, 1440 | Crear paralelo; Gestión del paralelo; Inscripciones; Paralelos | Crear paralelo; Filtros | Sin incidencia geométrica/JS en los estados observados |
| courses?courseId=10&view=manage | Paralelos y prácticas | 390, 1440 | Crear paralelo; Gestión del paralelo; Inscripciones; Paralelos | Bloquear paralelo; Crear grupo; Crear paralelo; Desactivar paralelo; Filtros | Sin incidencia geométrica/JS en los estados observados |
| institutions?institutionId=2 | Colegio de prácticas | 390, 1440 | — | Agregar grados; Filtros | F10: casilla sin nombre accesible |
| institutions?institutionId=2&gradeId=14&view=parallels | Octavo | 390, 1440 | — | Agregar paralelos; Filtros | F10: casilla sin nombre accesible |
| universities?institutionId=1 | Universidad de prueba | 390, 1440 | — | Agregar facultades; Filtros | Sin incidencia geométrica/JS en los estados observados |
| universities?institutionId=1&facultyId=11 | Facultad de Educación | 390, 1440 | — | Agregar carreras; Filtros | Sin incidencia geométrica/JS en los estados observados |
| universities?institutionId=1&facultyId=11&careerId=12 | Informática | 390, 1440 | — | — | Sin incidencia geométrica/JS en los estados observados |

## Pruebas adicionales que no deben confundirse con las rutas base

- Visor de fotografías: foco fuera del diálogo, ausencia de nombre y conflicto de Escape con accesibilidad, en 390 y 1440 px (F09).
- Creación de grados y paralelos en contexto: cuatro instancias de checkbox sin nombre accesible (F10).
- Mensaje 503 largo en documento: colisión con el botón flotante a 360 px, en claro y oscuro (F08).
- Gestión de 205 usuarios: búsqueda y contador incompletos por primera página de 200, en 390 y 1440 px (F07).
- Login: validación, Enter desde ambos campos, recuperación de error y registro visible en su batería propia. La captura biométrica real se mantiene fuera del alcance ejecutado.

Los resultados completos y los controles visibles capturados están en [pantallas.json](../../evidencias/auditoria-integral-2026-11-07/pantallas.json) y [contextos-modales.json](../../evidencias/auditoria-integral-2026-11-07/contextos-modales.json).

[Volver al informe](auditoria-integral.md).
