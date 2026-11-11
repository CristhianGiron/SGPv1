<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          borradores-vista-previa-expediente.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Borradores privados, vista previa y expediente.
-->

# Borradores privados, vista previa y expediente

## Validación de campos

Las respuestas HTTP 400 de validación DTO conservan `message` y añaden `fieldErrors`, un mapa de rutas de campos a mensajes. Por ejemplo, `{"fieldErrors":{"presentation":"Completa la presentación","activityWeeks[0].activities":"Registra la actividad"}}`. La ruta identifica también elementos de colecciones. Otros errores pueden devolver el mapa nulo. El cliente documental utiliza estas rutas para asociar los mensajes con los controles y los enlaces del resumen de errores.

## Copia automática

`GET /api/drafts/{scope}` consulta exclusivamente la copia del usuario autenticado. `scope` identifica módulo, práctica y registro, por ejemplo `activity-plans:7:21`. La respuesta contiene `scope`, `content` (objeto JSON serializado como texto, o null), `revision` y `savedAt`. Una copia inexistente tiene revisión 0.

`PUT /api/drafts/{scope}` recibe `{"revision":0,"content":"{\"presentation\":\"Educación\"}"}`. Para limpiar la copia, enviar `content:null` y la última revisión conocida. Cada escritura incrementa la revisión; el servidor conserva esa revisión incluso después de limpiar la copia, para impedir que un guardado atrasado la restaure. Una revisión antigua devuelve HTTP 409. Se serializan escrituras por propietario mediante bloqueo transaccional. El contenido debe ser un objeto JSON de hasta 500 000 caracteres.

Las copias son privadas: no se comparten con revisores y no alteran documentos ni sus estados. El servidor siempre toma el propietario de la autenticación, nunca del cuerpo o de parámetros.

La tabla `workspace_drafts` se agrega mediante `V16__workspace_drafts.sql`. El entorno que usa `ddl-auto=update` la crea al iniciar; instalaciones con migraciones gestionadas deben incorporar V16 en su proceso de despliegue y resolver previamente las versiones duplicadas ya documentadas.

## PDF previo

`GET /api/{recurso}/{id}/pdf/preview`, para `activity-plans`, `practice-reports`, `final-reports`, `activity-evaluations`, `practice-follow-up-reports` y `completed-activity-records`. Devuelve `application/pdf`, disposición `inline` y caché `no-store`, manteniendo la autorización por documento. Todas las páginas llevan una marca de vista previa. Los endpoints definitivos `/pdf` mantienen sus requisitos de aprobación existentes.

La vista previa usa la última versión guardada del documento académico, no la copia automática privada. El cliente guarda explícitamente antes de abrirla desde el formulario. No envía credenciales en la URL del visor: obtiene el PDF con autorización y usa una URL blob que libera al cerrar.

## Expediente

`GET /api/enrollments/{id}/archive.zip` devuelve `application/zip`, como adjunto `expediente-practica-{id}.zip`, con caché `no-store`. Requiere un rol de estudiante, tutor de prácticas, tutor institucional, director de prácticas o administrador, y autorización sobre la inscripción. Cada documento y evidencia vuelve a pasar su autorización habitual.

El ZIP contiene `documentos/`, `evidencias/` y `00-INDICE.txt` en UTF-8. Se omiten documentos sin aprobar cuando su exportación requiere aprobación, registros eliminados, copias privadas y elementos inaccesibles. El índice explica las omisiones. Los nombres de entrada se generan con identificadores internos y extensiones según tipo, sin reutilizar rutas de archivos enviadas por usuarios. No se consultan enlaces externos. Si el total sin comprimir supera 64 MB, devuelve HTTP 413 antes de entregar el ZIP.

[Producto](../producto/experiencia-de-trabajo.md) · [Índice de documentación](../README.md).
