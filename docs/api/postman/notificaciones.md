<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          notificaciones.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Notificaciones y avisos.
-->

# Notificaciones y avisos

[Guía Postman y variables](../guia-postman.md).

Todas las consultas pertenecen a la cuenta autenticada. Los filtros Sin leer/Todas/Leídas de la interfaz no cambian ese alcance.

| Método | URL | Cuenta y alcance |
| --- | --- | --- |
| `GET` | `{{baseUrl}}/api/notifications/me` | Cuenta autenticada; avisos propios |
| `GET` | `{{baseUrl}}/api/notifications/me/count` | Cuenta autenticada; contador propio |
| `PATCH` | `{{baseUrl}}/api/notifications/{{notificationId}}/read` | Propietario del aviso |
| `PATCH` | `{{baseUrl}}/api/notifications/read-all` | Cuenta autenticada; solo avisos propios |
| `POST` | `{{baseUrl}}/api/notifications/announcements` | Administración |

## Avisos de administración

El cuerpo usa [CreateAnnouncementRequest](../../../BackEnd/src/main/java/com/sgp/systemsgp/dto/notification/CreateAnnouncementRequest.java): `title`, `message`, `link` opcional y `roles`. El DTO valida título de hasta 120 caracteres, mensaje de hasta 2000 y enlace de hasta 500. El formulario web limita el mensaje a 1000 caracteres. El enlace admite una ruta interna con `#` o una URL HTTP/HTTPS.

Publicar un aviso envía una comunicación a los destinatarios. Para comprobar la presentación sin enviar comunicaciones reales, use el [script con fixtures](../../testing/qa/browser-inbox-agenda.cjs). La banda de notificaciones y su manejo de errores se describen en [experiencia de trabajo](../../producto/experiencia-de-trabajo.md).
