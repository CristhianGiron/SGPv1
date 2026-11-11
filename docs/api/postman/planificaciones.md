<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          planificaciones.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Planificaciones didácticas.
-->

# Planificaciones didácticas

[Guía Postman y variables](../guia-postman.md).

Recurso independiente de los formatos L.1–L.6. Los listados y las operaciones se restringen por autoría y práctica; pertenecer a un rol supervisor no concede acceso universal.

| Método | URL | Cuenta y alcance |
| --- | --- | --- |
| `POST` | `{{baseUrl}}/api/didactic-plans` | Estudiante o tutor institucional autorizado |
| `GET` | `{{baseUrl}}/api/didactic-plans/me` | Estudiante propietario |
| `GET` | `{{baseUrl}}/api/didactic-plans/managed` | Tutor institucional, tutor de prácticas, dirección o administración, dentro de su alcance |
| `GET` | `{{baseUrl}}/api/didactic-plans/{{didacticPlanId}}` | Cuenta con acceso al registro |
| `PUT` | `{{baseUrl}}/api/didactic-plans/{{didacticPlanId}}` | Estudiante o tutor institucional autor autorizado |
| `PATCH` | `{{baseUrl}}/api/didactic-plans/{{didacticPlanId}}/submit` | Autor autorizado |
| `PATCH` | `{{baseUrl}}/api/didactic-plans/{{didacticPlanId}}/recommendations` | Supervisor autorizado dentro del alcance |
| `POST` | `{{baseUrl}}/api/didactic-plans/{{didacticPlanId}}/pdf` | Autor autorizado; multipart |
| `GET` | `{{baseUrl}}/api/didactic-plans/{{didacticPlanId}}/pdf` | Cuenta con acceso al registro |
| `DELETE` | `{{baseUrl}}/api/didactic-plans/{{didacticPlanId}}` | Autor autorizado, según estado |

## Cuerpos y archivos

La creación y edición utilizan [DidacticPlanRequest](../../../BackEnd/src/main/java/com/sgp/systemsgp/dto/didacticplan/DidacticPlanRequest.java); las recomendaciones usan [DidacticPlanRecommendationRequest](../../../BackEnd/src/main/java/com/sgp/systemsgp/dto/didacticplan/DidacticPlanRecommendationRequest.java). Consulte sus campos y restricciones antes de construir el JSON.

Para subir el PDF, seleccione `Body → form-data` y la parte de archivo `file`; no utilice `image`, que corresponde a portadas y logotipos. El texto del borrador y el PDF se guardan mediante operaciones distintas. La copia automática local de la interfaz no conserva objetos de archivo.

Las planificaciones de tutoría institucional son visibles para su autora y el estudiante correspondiente; las de estudiantes admiten supervisión según el alcance. Véase [permisos](../../producto/permisos-practicas.md).


## Devolución de planificación institucional y conservación de versiones

`PATCH /api/didactic-plans/{id}/return` recibe `{ "reason": "Precisar objetivos y fechas" }`. Requiere un motivo no vacío de hasta 2000 caracteres, práctica operativa y planificación institucional en estado `SUBMITTED`. Solo dirección de la carrera o el tutor de prácticas asignado pueden devolverla; el autor no puede devolverse su propia entrega.

La devolución conserva una instantánea de los datos enviados y del PDF adjunto, registra actor, fecha y motivo, notifica al autor y pasa a `NEEDS_CORRECTION`. El autor puede corregir y reenviar mediante las operaciones existentes. No se permite eliminar una planificación que ya conserva versiones enviadas.

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/api/didactic-plans/{id}/revisions` | Metadatos de las versiones conservadas |
| GET | `/api/didactic-plans/{id}/revisions/{revisionId}` | Datos de la versión original |
| GET | `/api/didactic-plans/{id}/revisions/{revisionId}/pdf` | PDF de esa versión, si existía |

Todas las lecturas comprueban el acceso a la planificación y que la revisión pertenece al identificador solicitado. Las versiones se conservan al devolver la entrega; esta etapa no añade todavía un versionado general a todos los documentos del sistema.
