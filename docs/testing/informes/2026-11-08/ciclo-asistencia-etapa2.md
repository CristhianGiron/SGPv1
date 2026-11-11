<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          ciclo-asistencia-etapa2.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Ciclo de práctica, inscripciones y asistencia — etapa 2.
-->

# Ciclo de práctica, inscripciones y asistencia — etapa 2

Fecha: 8 de noviembre de 2026. Continuación de la [revisión de lógica por usuario](logica-tareas-roles.md) y de la [etapa 1 de permisos](correcciones-permisos-etapa1.md).

## Resultado y decisiones aplicadas

Se corrigieron H03 y H05, y la reproducción de H07 de duplicación/solapamiento de asistencia dentro del horario. H04 se atendió con el control elegido por el usuario: **cierre manual con advertencias**, sin imponer requisitos académicos obligatorios ni un mínimo de horas. Para H09 se aplicó la decisión de que cerrar inscripciones no suspenda el desarrollo de las prácticas ya registradas.

El cierre de nuevas solicitudes es actualmente por paralelo. El alcance de un cierre conjunto del período —ciclo, carrera o sistema— se consulta por separado antes de extender permisos entre ámbitos. No se ha creado una regla global implícita ni un cierre automático por fecha.

## Aclaración posterior

El usuario precisó después que la disponibilidad debe basarse en los paralelos a los que pertenece cada estudiante, permitiendo varios simultáneamente. La [entrega de pertenencias y prácticas simultáneas](pertenencia-y-practicas-simultaneas.md) reemplaza la restricción global de una sola práctica y resuelve la consulta de alcance mediante asignaciones académicas concretas. El resto de esta etapa conserva su resultado histórico.

## Cambios

| Área | Comportamiento actual |
| --- | --- |
| Archivo y reapertura | Un director no puede reabrir una práctica archivada. Administración debe desarchivar primero; después dirección decide la reapertura. La interfaz deshabilita la acción y muestra el motivo. |
| Disponibilidad al reabrir | Se exige paralelo activo y no eliminado, estudiante habilitado/desbloqueado, cupo del paralelo, grupo disponible/con tutor y cupo del grupo si está limitado. Se mantiene la prohibición de otra inscripción activa. |
| Inscripciones cerradas | `locked` significa que no se aceptan nuevas solicitudes. No impide aprobar/rechazar solicitudes recibidas, asignar grupos, trabajar documentos, revisar ni retomar una práctica existente. |
| Responsable de inscripciones | El tutor de prácticas asignado puede abrir/cerrar solicitudes en su paralelo; dirección y administración conservan su alcance. No se concede al tutor la facultad de desactivar paralelos ajenos o administrar la plataforma. |
| Aviso previo al cierre manual | En Archivo y en Inscripciones, dirección consulta un resumen del servidor antes de confirmar: L.1–L.6, asignación, horas aprobadas L.3/L.6, asistencia y fecha final. Las advertencias son visibles y el botón permite concluir expresamente con ellas. |
| Historial de cierre | El servidor recalcula las advertencias al concluir y las registra con el evento de cierre. No depende solo del resumen que abrió el navegador. |
| Asistencia repetida | Se rechaza el mismo período/fecha, una franja idéntica o solapada, también sin `schedulePeriodId` y al editar. Se permiten franjas contiguas y fechas distintas. La edición excluye la fila que se está modificando. |
| Solicitudes simultáneas | El horario se bloquea durante la escritura de asistencia y edición de horario; la segunda transacción vuelve a comprobar lo guardado. Dos solicitudes iguales simultáneas producen una escritura y un rechazo, sin sumar dos veces los minutos. |

La fecha de finalización del paralelo se informa como referencia del desarrollo. Su vencimiento no concluye prácticas ni aprueba documentos automáticamente. La dirección conserva la decisión manual por cumplimiento académico o por terminación del período, con los pendientes a la vista.

## Advertencias de cierre y fuentes de horas

La nueva consulta `GET /api/enrollments/{id}/completion-summary` está reservada a dirección de la carrera de la práctica. Otra carrera y estudiantes no pueden consultarla.

El resumen señala documentos sin registrar o pendientes de aprobación en L.1/L.2/L.3/L.6 y ausencia de L.4/L.5. Los minutos aprobados se distinguen de los minutos de asistencia; se advierte si faltan totales positivos o no coinciden. No se presupone que todos los formatos sean obligatorios en todas las carreras: son información para la decisión manual y no barreras nuevas.

Si la consulta falla, la interfaz permite reintentar antes de abrir la confirmación. El endpoint de conclusión sigue siendo manual y no bloquea por las advertencias; mantiene sus permisos y estados válidos. Esto no constituye firma electrónica, certificación automática de horas ni una instantánea inmutable del expediente.

## Validación realizada

| Verificación | Resultado |
| --- | --- |
| Backend completo | 192 aprobadas, 0 fallos, 0 errores; 1 omitida |
| Nuevas regresiones de ciclo, inscripciones y advertencias | 21 aprobadas en `PracticeLifecycleIntegrityTest` |
| Escrituras concurrentes de asistencia | 1 aprobada en `PracticeAttendanceConcurrencyTest` |
| Frontend completo | 190 aprobadas en 53 suites |
| Compilación de producción | Aprobada |
| Chrome con API ficticia, 390 y 1440 px | 12 comprobaciones, sin errores JavaScript ni escrituras API |
| Documentación | Enlaces y rutas API comprobados con el verificador documental |

El navegador comprueba motivos de reapertura deshabilitada, advertencias de documentos/horas y la confirmación manual, y las acciones de abrir/cerrar solicitudes del tutor. Las confirmaciones se cancelan en el guion; el comportamiento de escritura se valida en el backend.

Las 14 regresiones iniciales reprodujeron 11 fallos antes de corregir. Después de la aclaración del usuario, la expectativa de exigir inscripciones abiertas al reabrir se sustituyó por la contraria: la reapertura de una práctica existente se permite aunque no se acepten nuevas solicitudes. La suite final incorpora además las comprobaciones de cierre manual, alcance del tutor y continuidad de solicitudes pendientes.

Pruebas y evidencia:

- [Resultados y huellas de las fuentes](../../evidencias/ciclo-asistencia-etapa2-2026-11-08/resultados.json).
- [Regresiones de ciclo y control manual](../../../../BackEnd/src/test/java/com/sgp/systemsgp/service/PracticeLifecycleIntegrityTest.java).
- [Regresión de concurrencia](../../../../BackEnd/src/test/java/com/sgp/systemsgp/service/PracticeAttendanceConcurrencyTest.java).
- [Guion de navegador](../../qa/browser-practice-reopening.cjs).

El backend utiliza H2 en memoria; la prueba simultánea usa una base H2 separada porque las transacciones deben confirmar. No se utilizó la base operativa. La prueba opcional omitida es la integración MariaDB que requiere una instancia configurada. No se certificó concurrencia de cupos, cierre contra escritura documental simultánea ni el comportamiento del bloqueo SQL en una instalación MySQL/MariaDB real.

## Límites y pendientes

- Se evitan nuevos duplicados de asistencia dentro del horario; no se eliminan duplicados históricos ni se recalculan documentos ya emitidos. La conciliación entre varios expedientes/horarios históricos de un mismo estudiante requiere una revisión específica.
- La reapertura revalida cupos, pero esta etapa no incorpora un protocolo de exclusión compartido por todas las aprobaciones y asignaciones concurrentes. Sigue pendiente la prueba y corrección integral de concurrencia de cupos.
- No hay una meta institucional de horas configurada. El aviso puede señalar ausencia o discrepancias de cifras; no puede declarar cuántas horas faltan para una meta inexistente.
- La fecha final se interpreta según el reloj/configuración actual del servidor, como el resto de eventos del dominio. No se agregó un calendario institucional global.
- H06, H08, H10 y H11 y las mejoras de versionado, suplencias y tareas siguen pendientes. Las sondas históricas que exigían H03/H05/H07 ya no son aceptación del estado actual.

## Reproducción

Desde `BackEnd`, ejecutar `./mvnw -o test`; en el aislamiento de esta sesión se agregó `-DargLine=-javaagent:/ruta/local/mockito-core-5.20.0.jar`.

Desde `FrontEnd`:

```bash
CI=true npm test -- --watchAll=false --runInBand
BUILD_PATH=/tmp/sgp-stage2-build npm run build
```

Desde la raíz del repositorio, después de compilar:

```bash
SGP_QA_BUILD_PATH=/tmp/sgp-stage2-build node docs/testing/qa/browser-practice-reopening.cjs
python3 docs/herramientas/verificar_documentacion.py
```

El guion escribe por defecto en `/tmp/sgp-reopening-browser.json`; `SGP_QA_OUTPUT` permite otra ruta. El servidor local y Chrome requieren que el entorno permita escuchar en la interfaz de bucle local.

[Volver a informes de QA](../README.md).
