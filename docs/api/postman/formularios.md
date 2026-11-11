<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          formularios.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Entrevistas y fichas de observación.
-->

# Entrevistas y fichas de observación

[Guía Postman y variables](../guia-postman.md).

Las entrevistas y las fichas comparten el recurso de formularios. La ruta de creación determina el tipo de ficha; responder no equivale a editar su estructura.

| Método | URL | Cuenta y alcance |
| --- | --- | --- |
| `POST` | `{{baseUrl}}/api/practice-forms` | Estudiante propietario de la práctica |
| `POST` | `{{baseUrl}}/api/practice-forms/observations` | Estudiante propietario; ficha de observación |
| `GET` | `{{baseUrl}}/api/practice-forms/me` | Estudiante; entrevistas propias |
| `GET` | `{{baseUrl}}/api/practice-forms/observations/me` | Estudiante; fichas propias |
| `GET` | `{{baseUrl}}/api/practice-forms/assigned` | Tutor institucional o directora de institución asignados |
| `GET` | `{{baseUrl}}/api/practice-forms/managed` | Tutor de prácticas, dirección o administración, dentro del alcance |
| `GET` | `{{baseUrl}}/api/practice-forms/observations/managed` | Supervisión autorizada; fichas |
| `GET` | `{{baseUrl}}/api/practice-forms/{{practiceFormId}}` | Cuenta con acceso al formulario |
| `POST` | `{{baseUrl}}/api/practice-forms/{{practiceFormId}}/duplicate` | Estudiante propietario |
| `PUT` | `{{baseUrl}}/api/practice-forms/{{practiceFormId}}` | Estudiante propietario, según estado |
| `POST` | `{{baseUrl}}/api/practice-forms/{{practiceFormId}}/send` | Estudiante propietario |
| `POST` | `{{baseUrl}}/api/practice-forms/{{practiceFormId}}/responses` | Estudiante, tutor institucional o directora, según asignación y tipo |
| `PATCH` | `{{baseUrl}}/api/practice-forms/{{practiceFormId}}/questions/{{questionId}}/interpretation` | Estudiante propietario |

## Cuerpos y recorrido

- Estructura, preguntas y opciones: [CreatePracticeFormRequest](../../../BackEnd/src/main/java/com/sgp/systemsgp/dto/practiceform/CreatePracticeFormRequest.java).
- Respuestas: [SubmitPracticeFormResponseRequest](../../../BackEnd/src/main/java/com/sgp/systemsgp/dto/practiceform/SubmitPracticeFormResponseRequest.java).
- Interpretación: [UpdatePracticeFormInterpretationRequest](../../../BackEnd/src/main/java/com/sgp/systemsgp/dto/practiceform/UpdatePracticeFormInterpretationRequest.java).

Prepare el formulario como estudiante, guárdelo como borrador y envíelo mediante el flujo autorizado. Consulte las entrevistas asignadas desde la cuenta receptora y registre sus respuestas. La interpretación vuelve al estudiante propietario y puede guardarse tanto para preguntas abiertas como cuantitativas; el campo `studentInterpretation` se conserva junto a la respuesta y su tabulación. La interfaz presenta gráficos de barras o pastel para las preguntas cuantitativas en la pestaña Interpretación. La ficha de observación se diferencia de la entrevista en destinatario y contenido; no asuma que toda cuenta puede responder cualquier tipo.

La autorización y las transiciones se implementan en [PracticeFormService](../../../BackEnd/src/main/java/com/sgp/systemsgp/service/PracticeFormService.java).


## Historial del destinatario

`GET /api/practice-forms/assigned` conserva las entrevistas del destinatario autenticado en estados `SENT` y `ANSWERED`; excluye borradores y formularios eliminados. La interfaz separa «Pendientes de respuesta» e «Historial de respondidas». Una entrevista respondida sigue siendo consultable, pero no se habilita un nuevo envío de respuestas por el simple hecho de conservarla en el listado. Las asignaciones de «Mi institución» también conservan ese antecedente.
