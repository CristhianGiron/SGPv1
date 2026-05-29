# Mejoras pendientes del SGP

Este backlog recoge las mejoras generales que todavia conviene implementar. Esta ordenado por impacto y riesgo para que el sistema avance sin perder estabilidad.

## Prioridad alta

Sin pendientes de alta prioridad registrados por ahora.

## Prioridad media

Sin pendientes de prioridad media registrados por ahora.

## Prioridad baja

- Refactorizar `EndpointConsole` y `DataInspector` en componentes mas especificos por dominio.
- Revisar textos de interfaz para hacerlos mas accionables y consistentes.

## Ya implementado

- Feedback visible en la seccion que corresponde.
- Autor, rol y fecha del feedback visible para el estudiante.
- Feedback por fila para registros de actividades.
- Limpieza de feedback vigente al iniciar un nuevo ciclo de revision.
- Historial append-only de feedback por ciclo.
- `reviewCycle` en documentos revisables.
- Linea de tiempo visible por documento con envio, feedback, revisiones y cierre del ciclo.
- Indicadores visuales por seccion: sin feedback, observado, corregido y aprobado.
- Notificaciones de feedback con secciones observadas y accion esperada para el estudiante.
- Maquina de estados explicita para documentos revisables, con transiciones permitidas entre borrador, enviado, observado y aprobado.
- Pruebas de flujo de correccion, reenvio y aprobacion en servicios para los cuatro documentos revisables.
- Pruebas de flujo completo a nivel HTTP/controlador para los cuatro documentos revisables.
- Invalidacion de revisiones parciales del informe final cuando el estudiante edita una version enviada.
- Revision de endpoints `isAuthenticated()`: detalles y revisiones de documentos quedan restringidos por rol y alcance de servicio.
- Pruebas de seguridad para rutas de revision del director de practicas.
- Perfil de pruebas con base H2 en memoria para evitar dependencia de MySQL local.
- Seeders de datos base desactivados en perfil `test` para pruebas mas rapidas y reproducibles.
- Separacion de dialecto JPA por perfil `dev`, `test` y `prod`.
- Guia de configuracion de entornos y variables de base de datos.
- `open-in-view` y modo debug desactivados por defecto.
- Hilo conversacional de feedback por seccion en el detalle del documento.
- Panel del estudiante con resumen de documentos y proximos pasos.
- Optimizacion de listados de documentos con `EntityGraph`, batch fetching y feedback precargado por lote.
- Reporte de coordinacion para documentos pendientes, correcciones, aprobaciones por curso y tiempos de revision.
- Configuracion sensible por variables de entorno.
- Perfil `prod` con `ddl-auto=validate`.
- Preparacion inicial de Flyway para migraciones versionadas.
- Migracion baseline `V1` con el esquema completo y eliminacion del `schema.sql` parcial.
- DTO de resumen para listados de documentos revisables, separado del detalle completo con feedback e historial.
- Filtros avanzados por estado, estudiante, curso, tutor y ciclo academico en listados.
- Exportacion a PDF para documentos aprobados.
