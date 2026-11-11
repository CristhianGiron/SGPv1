<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          correcciones-permisos-etapa1.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Correcciones de permisos y asignaciones — etapa 1.
-->

# Correcciones de permisos y asignaciones — etapa 1

Fecha: 8 de noviembre de 2026.

Se corrigieron H01, H02, H12 y H13 de la [revisión de lógica por usuario](logica-tareas-roles.md). Esta etapa cubre aislamiento por carrera, tutor institucional efectivo, coherencia del contexto mostrado y destinatarios de nuevos avisos. Los demás hallazgos y decisiones de negocio continúan pendientes.

## Cambios aplicados

| Hallazgo | Comportamiento corregido | Comprobación |
| --- | --- | --- |
| H01 | L.4/L.5 verifican la carrera del director mediante la política compartida. Detalle, PDF y vista previa usan la misma autorización. | Director ajeno recibe 403 en las seis rutas; director de la carrera y administración conservan 200. |
| H02 | Avisos de L.1/L.2/L.3/L.6 y solicitudes pendientes filtran a los directores por carrera. L.3 incorpora al tutor institucional efectivo de la inscripción. | Otra carrera no recibe avisos; tutor de grupo recibe L.3; el tutor de paralelo no lo recibe cuando ha sido sustituido por el de grupo. Se conservan administración global y tutor de prácticas. |
| H12 | La respuesta de inscripción muestra exclusivamente su grupo persistido. El tutor y centro receptor se resuelven desde la asignación real, usando el resolvedor compartido. | Tener un único grupo activo no inventa pertenencia, tutor ni centro. Una asignación explícita coincide con el ámbito autorizado. |
| H13 | Listas de horarios, cola completa y resumen L.3, y colas de fotografías filtran los candidatos antes de convertirlos en respuestas. | El tutor del paralelo no recibe datos ni enlaces de fotografías de una inscripción cuyo grupo corresponde a otro tutor. El tutor efectivo conserva acceso. |

Se conserva el respaldo existente del tutor del paralelo cuando no hay tutor de grupo. No se migran inscripciones automáticamente ni se asignan estudiantes a grupos por inferencia. Si el contexto no tiene asignación, la respuesta permite mostrarlo como tal.

Los anuncios administrativos conservan su mecanismo de distribución; no se sustituyen por el filtro de avisos de tareas académicas. Se deduplican los destinatarios de una entrega y se siguen excluyendo las cuentas desactivadas, bloqueadas o eliminadas.

## Validación

Antes de la corrección, las 12 nuevas regresiones reprodujeron **9 fallos**, con tres controles legítimos aprobados. Después de la corrección:

| Comprobación | Resultado |
| --- | --- |
| Regresiones nuevas `PracticeAuthorizationRegressionTest` | 12 aprobadas |
| Suite completa backend | 170 aprobadas, 0 fallos, 0 errores; 1 omitida |
| Prueba omitida | `MigrationChainMariaDbTest`, requiere instancia SQL configurada |
| Compilación de fuentes y pruebas | Aprobada como parte de Maven |
| Revisión documental | Enlaces locales comprobados con `verificar_documentacion.py` |

Las comprobaciones usan datos ficticios, H2 en memoria y MockMvc con seguridad de Spring. Incluyen restricciones y controles positivos de acceso. No se usó la base real ni se modificó el frontend; no se ejecutó QA de navegador en esta etapa. Se utilizó el agente Mockito al arrancar la JVM para evitar la restricción de autoasociación del entorno.

La [evidencia JSON](../../evidencias/permisos-etapa1-2026-11-08/resultados.json) incluye resultados anteriores y posteriores, pruebas por clase y huellas de los archivos. Las regresiones están incorporadas en la [suite habitual](../../../../BackEnd/src/test/java/com/sgp/systemsgp/service/PracticeAuthorizationRegressionTest.java).

## Límites y continuación

- Los avisos corregidos son los generados después del cambio. No se eliminaron avisos históricos ni se revocaron enlaces públicos de fotografías emitidos antes; cualquier saneamiento de datos existentes requiere identificar los registros afectados en la instalación correspondiente.
- Las sondas originales de `RoleWorkflowAuditProbeTest` se conservan como evidencia del diagnóstico anterior. Las que exigen los defectos corregidos ya no deben interpretarse como aceptación del código actual; sus sustitutas son las regresiones de la suite habitual.
- La política de conclusión, desarchivo y reapertura, las asistencias duplicadas, el rechazo/reconsideración y el resto de mejoras del informe no se han dado por resueltos en esta etapa.
- No se certificaron concurrencia ni un circuito real de navegador y producción. Los avisos WebSocket conservan su mecanismo de entrega actual; la entrega tras confirmar la transacción sigue siendo una mejora pendiente.

Para reproducir, desde `BackEnd`:

```bash
./mvnw -o test
```

En entornos que requieren agente explícito: agregar `-DargLine=-javaagent:/ruta/local/mockito-core-5.20.0.jar`. No hace falta copiar las sondas históricas.

[Volver a informes de QA](../README.md).
