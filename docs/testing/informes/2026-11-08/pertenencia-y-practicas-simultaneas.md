<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          pertenencia-y-practicas-simultaneas.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Pertenencia a paralelos y prácticas simultáneas.
-->

# Pertenencia a paralelos y prácticas simultáneas

Fecha: 8 de noviembre de 2026. Continuación de la [auditoría de lógica por rol](logica-tareas-roles.md), con la aclaración del usuario posterior a la [etapa 2](ciclo-asistencia-etapa2.md).

## Regla aplicada

Un estudiante solo puede solicitar prácticas en los paralelos a los que pertenece académicamente y que tienen inscripciones abiertas. Puede pertenecer a varios paralelos y tener prácticas simultáneas, incluso en ciclos diferentes de su carrera. Compartir el ciclo principal no lo autoriza a elegir otros paralelos.

Se separaron dos relaciones:

| Relación | Quién la gestiona | Efecto |
| --- | --- | --- |
| Pertenencia académica al paralelo | Administración o dirección de la carrera | Habilita al estudiante para solicitar la práctica de ese paralelo si las inscripciones están abiertas. No crea ni aprueba la práctica. |
| Inscripción a la práctica | Estudiante solicita; administración o dirección decide según los permisos existentes | Mantiene su estado PENDING/APPROVED/COMPLETED/REJECTED, grupo, documentos y expediente. |

La aclaración sustituye la idea de una sola inscripción activa en todo el sistema. El cierre de inscripciones sigue siendo por paralelo y la disponibilidad del estudiante se calcula sobre sus paralelos asignados. No se implementó un cierre global de carreras o del sistema que afecte a paralelos ajenos.

## Comportamiento implementado

- La búsqueda de paralelos comprueba pertenencia activa en el servidor. Conocer el ID o cambiar filtros no habilita una solicitud ajena.
- Solicitar y aprobar una práctica requiere pertenencia activa al paralelo concreto. La apertura/cierre, actividad y cupos del paralelo siguen aplicándose.
- Se retiró la restricción global de una sola inscripción pendiente/aprobada. Se conserva la unicidad por estudiante/paralelo; no se duplican solicitudes del mismo estudiante en un mismo paralelo.
- La reapertura de una práctica existente tampoco impide mantener otras prácticas. Se conservan las comprobaciones de desarchivo previo, disponibilidad y cupos.
- Dirección de la carrera y administración disponen de **Gestión del paralelo → Estudiantes que pertenecen al paralelo** para asignar, retirar y restaurar pertenencias. El selector incluye estudiantes habilitados de la carrera y admite ciclos distintos.
- Estudiantes y tutores no pueden conceder pertenencias. La selección no entrega cédula, correo, dirección ni teléfono. Dirección ajena no puede consultar candidatos ni modificar la pertenencia.
- Retirar una pertenencia impide nuevas solicitudes y aprobar pendientes. No elimina ni suspende las prácticas ya aprobadas ni su historial. Si se requiere retirar una práctica en curso, debe definirse un flujo académico independiente.
- Los defaults de L.1/L.2/L.3/L.6 no eligen la primera práctica cuando hay varias aprobadas: exigen identificar la práctica. La creación de entrevistas y observaciones también ofrece una selección explícita.
- La interfaz utiliza identificadores de paralelo para reconocer inscripciones existentes y evitar confundir paralelos con el mismo nombre.

## Migración de datos

La [migración V21](../../../../BackEnd/src/main/resources/db/migration/V21__academic_course_student_memberships.sql) crea `course_student_memberships`, con una fila por estudiante/paralelo, estado de pertenencia, actor de asignación y fechas. Conserva los vínculos de las inscripciones existentes PENDING, APPROVED y COMPLETED. No concede pertenencia a otros paralelos por compartir ciclo ni a partir de solicitudes rechazadas.

No se aplicó esta migración a la base de datos real. Debe integrarse mediante Flyway al actualizar la instalación, antes de arrancar el código nuevo sobre la base existente. En desarrollo, `ddl-auto=update` por sí solo puede crear la tabla pero no trasladar las relaciones previas; requiere la migración controlada o asignar las pertenencias explícitamente desde la interfaz. Véase la [guía de entornos](../../../desarrollo/configuracion-entornos.md).

La prueba SQL utilizó una MariaDB temporal con tres bases descartables. Verificó instalación V1–V21, segunda ejecución sin cambios, arranque productivo con validación de esquema y actualización V20→V21 con datos ficticios. La instancia y las bases se eliminaron al terminar. Eso no certifica un historial Flyway divergente de una instalación existente.

## Validación

| Comprobación | Resultado |
| --- | --- |
| Backend completo | 202 aprobadas, 0 fallos, 0 errores; 2 pruebas SQL optativas omitidas en esa ejecución |
| Nuevas regresiones de pertenencia | 10 aprobadas, incluidas en el total backend |
| SQL optativo, por separado | 2 aprobadas en MariaDB temporal |
| Frontend completo | 192 aprobadas en 54 suites |
| Compilación de producción | Aprobada |
| Chrome, 390 y 1440 px | 12 comprobaciones; 0 errores JavaScript |
| Documentación | Enlaces locales y rutas API verificados |

Las comprobaciones del backend cubren: rechazo de un paralelo no asignado del mismo ciclo; dos prácticas aprobadas en paralelos asignados de distintos ciclos; prohibición de autoconcederse pertenencia y de actuar como tutor/director ajeno; candidatos limitados a carrera; rechazo de cuentas de personal y carrera incompatible; cierre de inscripciones; retirada sin borrar el expediente; rechazo de aprobación tras retirar pertenencia; restauración sin duplicar filas y defaults ambiguos.

El navegador usa la compilación de producción con API ficticia. Recorre la asignación del mismo estudiante a dos paralelos, sus dos solicitudes, la aparición de ambas prácticas y la selección explícita de práctica al crear una ficha. No se realizaron esas operaciones contra datos reales.

Evidencia: [resultados, casos y huellas de código](../../evidencias/pertenencia-paralelos-2026-11-08/resultados.json), [registro de migraciones](../../evidencias/pertenencia-paralelos-2026-11-08/migraciones-mariadb.log), [regresiones backend](../../../../BackEnd/src/test/java/com/sgp/systemsgp/service/CourseMembershipWorkflowTest.java), [guion de navegador](../../qa/browser-course-memberships.cjs).

## Límites y continuación

La pertenencia académica se mantiene manualmente por las personas autorizadas. No se agregó integración con el sistema externo de matrícula universitaria ni importación masiva automática. El perfil conserva un ciclo principal; cursar otro ciclo se representa en las pertenencias, sin sobrescribirlo.

Mantener varias prácticas no significa poder registrar dos veces las mismas horas: permanece pendiente una conciliación entre horarios de diferentes prácticas del mismo estudiante. La protección de asistencia de la etapa 2 actúa dentro de un horario. La concurrencia integral de cupos y las suplencias/versionado siguen pendientes.

Una solicitud rechazada no se elimina ni se convierte automáticamente en otra solicitud para ese mismo paralelo. La reconsideración H06 sigue requiriendo su política. H08, H10 y H11 del diagnóstico original tampoco se dan por corregidos en esta entrega.

## Reproducción

Desde `BackEnd`, `./mvnw -o test`. En el aislamiento se agregó el agente local de Mockito al arrancar la JVM. Para las dos pruebas SQL, desde la raíz:

```bash
SGP_QA_OUTPUT=/tmp/sgp-membership-migrations.log python3 docs/testing/qa/check-migrations-isolated.py
```

Desde `FrontEnd`:

```bash
CI=true npm test -- --watchAll=false --runInBand
BUILD_PATH=/tmp/sgp-membership-build npm run build
```

Desde la raíz, después de compilar:

```bash
SGP_QA_BUILD_PATH=/tmp/sgp-membership-build node docs/testing/qa/browser-course-memberships.cjs
python3 docs/herramientas/verificar_documentacion.py
```

El guion de navegador responde todas las peticiones con archivos locales o datos ficticios. `SGP_QA_OUTPUT` permite elegir dónde conservar su resultado; por defecto usa `/tmp/sgp-course-memberships-browser.json`.

[Volver a informes](../README.md).
