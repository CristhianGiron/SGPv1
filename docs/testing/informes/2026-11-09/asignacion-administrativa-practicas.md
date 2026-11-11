<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          asignacion-administrativa-practicas.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Asignación administrativa de prácticas.
-->

# Asignación administrativa de prácticas

Fecha: 9 de noviembre de 2026. Política confirmada por el usuario y aplicada al código local. La implementación se validó inicialmente sin modificar la base real. Posteriormente, por instrucción del usuario, se aplicaron las migraciones en la instalación local: [registro de aplicación y respaldo](aplicacion-migraciones-local.md).

## Resultado y responsabilidades

El estudiante recibe una práctica aprobada y habilitada, con sus tutores configurados. Se eliminaron los botones y las rutas HTTP de solicitud y cancelación del estudiante. Las rutas antiguas se deniegan también en Spring Security, aunque se invoquen directamente.

| Tarea | Responsable y alcance |
| --- | --- |
| Mantener el listado académico del paralelo | Administración o dirección de la carrera |
| Crear prácticas para un paralelo | Administración o dirección de la carrera |
| Consultar el listado e inscribir estudiantes | Administración, dirección de la carrera o tutor de prácticas asignado al paralelo |
| Elegir el grupo al inscribir | El mismo personal autorizado; el grupo debe ser del paralelo |
| Cerrar o abrir inscripciones | Personal autorizado del paralelo; se puede cerrar una práctica o todo el paralelo |
| Trabajar en documentos, evidencias e instrumentos propios | Estudiante con práctica aprobada, activa y no archivada |
| Organizar jornadas y acreditar asistencia | Tutor institucional asignado, según los permisos anteriores |
| Concluir o reabrir la práctica | Dirección de la carrera; cierre manual con advertencias |
| Archivar o recuperar el expediente concluido | Administración |

La pertenencia académica admite un paralelo activo por estudiante y ciclo. Un estudiante puede pertenecer a diferentes ciclos de su carrera. El ciclo principal de su perfil no sustituye sus pertenencias explícitas. Para cambiar de paralelo en el mismo ciclo se retira primero la pertenencia anterior; sus prácticas e historial permanecen intactos.

## Cambios de modelo y controles

- `Course` conserva el paralelo y su listado académico. `PracticeOffering` representa cada práctica ofrecida a ese paralelo, con nombre, cupos, fechas y apertura de inscripciones independientes.
- `Enrollment` enlaza al estudiante con una práctica concreta. La unicidad pasa de estudiante/paralelo a estudiante/práctica, permitiendo varias prácticas en un paralelo.
- La inscripción administrativa se crea directamente en `APPROVED`, genera notificación hacia el espacio de trabajo y registra el actor en el historial.
- Se rechazan estudiantes ajenos al listado, cuentas inhabilitadas, autoinscripción del propio gestor, gestores fuera de alcance, duplicados, cupos agotados, paralelo inactivo y períodos de inscripción cerrados.
- Antes de habilitar el trabajo se exige tutor de prácticas y tutor institucional con cuenta y rol habilitados. El tutor institucional procede del grupo seleccionado o del paralelo cuando no se selecciona grupo.
- El control de cupos de nuevas asignaciones utiliza bloqueos transaccionales. La pertenencia se serializa por estudiante y tiene una restricción SQL adicional por estudiante/ciclo activo.
- Los cupos del grupo cuentan estudiantes distintos: dos prácticas de una persona en el mismo grupo no consumen dos plazas.
- Las semanas calculadas de L.1/L.2/L.3 y la advertencia de fin del período usan las fechas de la práctica concreta. Se conservan las fechas explícitas de documentos ya registrados.
- El cierre de inscripciones no concluye ni interrumpe las prácticas existentes. La conclusión continúa siendo manual, con las advertencias documentales y de horas acordadas.

## Interfaz y compatibilidad

En «Paralelos y prácticas», abrir la gestión del paralelo. Dirección o administración define el listado académico y crea las prácticas. El personal autorizado selecciona una práctica, un grupo cuando corresponda y pulsa «Inscribir y habilitar» para cada estudiante del listado. El estudiante encuentra la práctica en «Mis prácticas» y abre directamente sus actividades.

Los selectores y los listados administrativos diferencian el nombre de la práctica y el paralelo. Las notificaciones del estudiante abren su práctica, no el catálogo de paralelos. El generador de datos de demostración utiliza el nuevo flujo administrativo; se comprobó su sintaxis sin ejecutar cargas contra la API real.

Las solicitudes `PENDING` anteriores conservan su circuito de aprobación/rechazo para regularizar datos existentes. Las inscripciones nuevas no pasan por ese circuito. Los informes del 8 de noviembre conservan sus diagnósticos históricos; esta política sustituye sus referencias a autoinscripción o varios paralelos activos en un mismo ciclo.

## Verificación

| Comprobación | Resultado |
| --- | --- |
| Backend completo | 213 casos: 211 aprobados, 2 omitidos por ser las pruebas SQL optativas; ningún fallo |
| Cadena de migraciones en MariaDB temporal | 2 pruebas aprobadas por separado; 23 migraciones; arranque con Hibernate `validate` |
| Conservación de registros previos | Verificada en MariaDB: pertenencia e inscripción preservadas y enlazadas a la práctica migrada |
| Restricciones SQL | Rechaza duplicado estudiante/práctica y segundo paralelo activo del mismo ciclo; permite traslado tras retirar pertenencia |
| Frontend | 55 suites, 196 pruebas aprobadas |
| Compilación de producción | Correcta |
| Navegador con API ficticia y paquete compilado | 16 comprobaciones en 390 y 1440 px; sin errores de JavaScript ni desbordamiento horizontal |

La prueba de navegador cubre creación por dirección, inscripción aprobada, cierre de inscripciones, continuidad del trabajo del estudiante, ausencia de controles de autoinscripción y bloqueo de su entrada a la gestión. Los permisos y validaciones reales de la API se comprobaron por separado con Spring Security/MockMvc y base H2 aislada. No equivale a una prueba contra la instalación real.

La compilación conserva el aviso de antigüedad de Browserslist. Algunas pruebas del frontend emiten avisos de React `act`; los casos terminan aprobados.

Evidencia reproducible: [resultados y huellas de fuentes](../../evidencias/asignacion-administrativa-2026-11-09/resultados.json), [navegador](../../evidencias/asignacion-administrativa-2026-11-09/navegador.json), [MariaDB](../../evidencias/asignacion-administrativa-2026-11-09/migraciones-mariadb.log), [script de navegador](../../qa/browser-staff-practice-assignment.cjs). Contrato de API: [guía de prácticas en Postman](../../../api/postman/practicas.md).

## Aplicación de las migraciones

V22 crea una práctica equivalente por paralelo existente y conserva los identificadores de inscripción y sus documentos. V23 añade el control de un paralelo activo por ciclo. Ambas se probaron primero en una instancia temporal y después se aplicaron en la base local `sgp` por instrucción del usuario. Ver el [registro de aplicación y respaldo](aplicacion-migraciones-local.md).

Antes de aplicar V23, revisar las pertenencias heredadas: V21 importó relaciones de inscripciones pendientes, aprobadas y concluidas. Si una persona aparece activa en dos paralelos del mismo ciclo, dirección debe decidir cuál conserva como pertenencia actual. V23 rechaza la contradicción; no elimina prácticas ni elige un paralelo automáticamente.

Con V21 disponible, la consulta de diagnóstico es:

```sql
SELECT m.student_id,
       COALESCE(c.academic_cycle_id, s.academic_cycle_id) AS cycle_id,
       GROUP_CONCAT(m.course_id ORDER BY m.course_id) AS parallels
FROM course_student_memberships m
JOIN courses c ON c.id = m.course_id
LEFT JOIN subjects s ON s.id = c.subject_id
WHERE m.active = 1
GROUP BY m.student_id, COALESCE(c.academic_cycle_id, s.academic_cycle_id)
HAVING cycle_id IS NOT NULL AND COUNT(*) > 1;
```

Si V21 todavía no está aplicada, revisar las mismas relaciones desde `enrollments` con estado `PENDING`, `APPROVED` o `COMPLETED`, agrupando estudiantes y ciclos y contando paralelos distintos. No ejecutar migraciones sobre inconsistencias conocidas: MariaDB no revierte automáticamente todos los cambios DDL si una migración falla. Las pertenencias académicas sin ciclo también requieren regularización del catálogo antes de nuevas asignaciones académicas.

Este cambio resuelve la asignación y pertenencia acordadas. Los demás hallazgos del informe original mantienen el estado documentado en sus respectivas etapas; esta validación no declara resuelto todo el sistema.
