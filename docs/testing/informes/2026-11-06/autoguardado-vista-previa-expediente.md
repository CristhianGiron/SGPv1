<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          autoguardado-vista-previa-expediente.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Autoguardado, PDF previo, expediente y arranque — 2026-11-06.
-->

# Autoguardado, PDF previo, expediente y arranque — 2026-11-06

## Resultado

Se completaron las copias privadas en el servidor, la vista previa de los seis documentos y la descarga del expediente por práctica. Se corrigió la resolución del tipo `ResponseEntity` en los nuevos métodos de `ActivityEvaluationController` y `PracticeFollowUpReportController`, y se recompilaron las clases desde cero.

El backend inició con Tomcat real en el puerto temporal 18089 y H2 aislado, respondió HTTP 200 en `/api/public/institutional-defaults` y se detuvo normalmente al terminar. Los nombres de facultad y carrera conservaron las tildes. No se afirma haber validado el esquema o los datos de una instalación MySQL existente.

## Verificación

- Backend completo: **141 pruebas aprobadas**. Incluye configuración de seguridad, enlace institucional, documentos, imágenes, borradores, ZIP y contexto de aplicación.
- Frontend completo: **47 suites y 152 pruebas aprobadas**.
- Compilación de producción: aprobada.
- Chrome: dos contextos aislados para simular equipos diferentes, autoguardado, recuperación expresa, conflicto sin reemplazo automático del texto local, guardado antes de PDF, visor con URL blob, geometría móvil de 390 px y descarga del expediente seleccionado.
- Se revisaron capturas de escritorio y móvil. El aviso del PDF se presenta dentro del diálogo, sin tapar los enlaces del visor. Si el navegador no dibuja el PDF incrustado, permanecen disponibles abrir en otra pestaña y descargar la vista previa.
- Validación documental y revisión de espacios en los cambios: sin errores.

Las pruebas HTTP comprueban las seis vistas previas y un ZIP con seis PDF definitivos sin marca de vista previa, más denegación a otro estudiante. Otra prueba comprueba omisiones de documentos pendientes y separación de evidencias entre inscripciones. Las pruebas de borradores comprueban privacidad, revisiones antiguas y limpieza con revisión conservada. En el cliente se comprueba también que una copia retirada en otro dispositivo no reaparezca mediante un reintento automático atrasado.

## Evidencias y reproducción

- [Recorrido Chrome](../../qa/browser-drafts-preview-archive.cjs).
- [Resultado del navegador](../../evidencias/borradores-pdf-expediente/resultado.json).
- [Respuesta del Tomcat real](../../evidencias/borradores-pdf-expediente/arranque-tomcat.json).
- [Vista previa de escritorio](../../evidencias/borradores-pdf-expediente/vista-previa-escritorio.png).
- [Vista previa móvil](../../evidencias/borradores-pdf-expediente/vista-previa-movil.png).

Backend: `mvn test` (en entornos que impiden adjuntar Mockito dinámicamente, pasar su JAR como `-javaagent` en `argLine`). Frontend: `CI=true npm test -- --watchAll=false --runInBand`, `CI=true npm run build`; desde la raíz del proyecto: `node docs/testing/qa/browser-drafts-preview-archive.cjs`. El navegador usa API simulada; la persistencia y las autorizaciones reales se verifican mediante integración H2.

Para el arranque aislado se usó el classpath de pruebas del plugin Spring Boot, perfil `test`, H2 en memoria y propiedades de conexión explícitas para no depender de configuraciones MySQL externas. El proceso de prueba ya fue detenido.

## Aplicación de los cambios

Reiniciar el backend para cargar los controladores y crear `workspace_drafts` en desarrollo con `ddl-auto=update`. Si el IDE conserva clases incompletas, detener el proceso y ejecutar `mvn clean spring-boot:run` desde `BackEnd`. Las instalaciones con migraciones gestionadas deben incorporar V16 según su proceso de despliegue; las versiones Flyway duplicadas previamente documentadas siguen siendo un pendiente separado.

[API](../../../api/borradores-vista-previa-expediente.md) · [Experiencia de trabajo](../../../producto/experiencia-de-trabajo.md) · [Índice QA](../README.md).
