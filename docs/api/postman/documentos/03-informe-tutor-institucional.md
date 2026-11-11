<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          03-informe-tutor-institucional.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta L.3. Informe de tutor institucional.
-->

# L.3. Informe de tutor institucional

[Guía Postman y variables](../../guia-postman.md) · Los ejemplos se ejecutan sobre un entorno de pruebas con cuentas del rol indicado.

## Informes Finales

El estudiante completa la información general, antecedentes, objetivo y actividades de L.3. La sección denominada aprobación es contenido del informe; no concede al estudiante la decisión de revisión. Las conclusiones y recomendaciones corresponden al tutor institucional asignado a la práctica. El informe solo queda `APPROVED` cuando tutoría de prácticas, tutoría institucional y dirección de prácticas lo aprueban.

| Metodo | URL | Rol |
| --- | --- | --- |
| `POST` | `{{baseUrl}}/api/final-reports` | Estudiante |
| `GET` | `{{baseUrl}}/api/final-reports/me` | Estudiante |
| `GET` | `{{baseUrl}}/api/final-reports/me/summary` | Estudiante |
| `GET` | `{{baseUrl}}/api/final-reports/practice-review` | Tutor de Practicas |
| `GET` | `{{baseUrl}}/api/final-reports/practice-review/summary` | Tutor de Practicas |
| `GET` | `{{baseUrl}}/api/final-reports/institutional-review` | Tutor Institucional |
| `GET` | `{{baseUrl}}/api/final-reports/institutional-review/summary` | Tutor Institucional |
| `GET` | `{{baseUrl}}/api/final-reports/submitted/summary` | Director de Practicas o Admin |
| `GET` | `{{baseUrl}}/api/final-reports/{{finalReportId}}` | Autenticado con acceso |
| `GET` | `{{baseUrl}}/api/final-reports/{{finalReportId}}/pdf` | Autenticado con acceso, solo aprobado |
| `PUT` | `{{baseUrl}}/api/final-reports/{{finalReportId}}` | Estudiante propietario |
| `GET` | `{{baseUrl}}/api/final-reports/{{finalReportId}}/letterhead` | Autenticado con acceso al informe |
| `PUT` | `{{baseUrl}}/api/final-reports/{{finalReportId}}/letterhead` | Tutor institucional asignado; membrete faltante de informe aprobado antiguo |
| `PATCH` | `{{baseUrl}}/api/final-reports/{{finalReportId}}/submit` | Estudiante propietario |
| `PATCH` | `{{baseUrl}}/api/final-reports/{{finalReportId}}/institutional-section` | Tutor Institucional asignado |
| `PATCH` | `{{baseUrl}}/api/final-reports/{{finalReportId}}/practice-review` | Tutor de Practicas asignado |
| `PATCH` | `{{baseUrl}}/api/final-reports/{{finalReportId}}/director-review` | Director de prácticas de la carrera |
| `PATCH` | `{{baseUrl}}/api/final-reports/{{finalReportId}}/institutional-review` | Tutor Institucional asignado |

Reglas:

- Solo se puede crear un informe final para una inscripcion `APPROVED`.
- La práctica debe tener tutor institucional asignado, mediante su grupo o el paralelo.
- La institucion educativa debe ser `ESCUELA` o `COLEGIO`.
- Si la práctica tiene tutor institucional asignado por grupo o paralelo, la institucion educativa del informe debe coincidir con la institucion de ese tutor.
- El estudiante no llena conclusiones ni recomendaciones.
- El tutor institucional llena conclusiones y recomendaciones cuando el informe ya fue enviado.
- Tutoría de prácticas, tutoría institucional y dirección pueden dejar retroalimentación por apartado, desde su ruta y alcance autorizados.
- Si un revisor autorizado solicita correcciones, el informe vuelve a `NEEDS_CORRECTION`.
- El informe final queda `APPROVED` solo cuando tutoría de prácticas, tutoría institucional y dirección de prácticas aprueban.

Crear borrador:

```json
{
  "enrollmentId": 1,
  "educationalInstitutionId": 2,
  "educationalInstitutionName": "Colegio Test",
  "educationalInstitutionCode": "11H00001",
  "educationalInstitutionAddress": "Loja",
  "educationalInstitutionPhone": "0990000002",
  "educationalInstitutionEmail": "colegio@test.local",
  "studentFullName": "Ana Loja",
  "studentIdentification": "1100000001",
  "studentEmail": "ana@test.local",
  "studentPhone": "0990000001",
  "antecedents": "Texto largo de antecedentes del informe final...",
  "objective": "Presentar los resultados finales de las practicas preprofesionales.",
  "activityWeeks": [
    {
      "weekNumber": 1,
      "startDate": "2026-05-13",
      "endDate": "2026-05-17",
      "activities": "- Observacion de clases\n- Apoyo en planificacion\n- Registro de evidencias"
    },
    {
      "weekNumber": 2,
      "startDate": "2026-05-20",
      "endDate": "2026-05-24",
      "activities": "- Desarrollo de actividades guiadas\n- Elaboracion de material didactico"
    }
  ],
  "approval": "Texto de aprobacion o constancia final..."
}
```

Actualizar parte del estudiante:

```json
{
  "antecedents": "Antecedentes corregidos...",
  "objective": "Objetivo corregido...",
  "activityWeeks": [
    {
      "weekNumber": 1,
      "startDate": "2026-05-13",
      "endDate": "2026-05-17",
      "activities": "- Actividades corregidas de la semana 1"
    }
  ]
}
```

Enviar a revision:

`PATCH {{baseUrl}}/api/final-reports/{{finalReportId}}/submit`

Completar conclusiones, recomendaciones, horas y fecha como tutor institucional. Las horas pueden precargarse del L.6 de la misma inscripción:


```json
{
  "completedHours": 46,
  "completedMinutes": 55,
  "reportDate": "2026-11-04",
  "conclusion1": "Conclusion relacionada con el objetivo especifico 1.",
  "conclusion2": "Conclusion relacionada con el objetivo especifico 2.",
  "conclusion3": "Conclusion relacionada con el objetivo especifico 3.",
  "recommendation1": "Recomendacion relacionada con la conclusion 1.",
  "recommendation2": "Recomendacion relacionada con la conclusion 2.",
  "recommendation3": "Recomendacion relacionada con la conclusion 3."
}
```

Revisar como tutor de practicas:

`PATCH {{baseUrl}}/api/final-reports/{{finalReportId}}/practice-review`

```json
{
  "approved": false,
  "generalInfoFeedback": "Completar telefono de la institucion educativa.",
  "antecedentsFeedback": "Ampliar los antecedentes con el contexto institucional.",
  "objectiveFeedback": "Reformular el objetivo con mayor precision.",
  "activitiesFeedback": "Agregar mas detalle a las actividades por semana.",
  "conclusionsFeedback": "Relacionar cada conclusion con los objetivos trabajados.",
  "recommendationsFeedback": "Ajustar recomendaciones para que respondan a las conclusiones.",
  "approvalFeedback": "Actualizar el texto de aprobacion."
}
```

Revisar como tutor institucional:

`PATCH {{baseUrl}}/api/final-reports/{{finalReportId}}/institutional-review`

```json
{
  "approved": true,
  "generalInfoFeedback": null,
  "antecedentsFeedback": null,
  "objectiveFeedback": null,
  "activitiesFeedback": null,
  "conclusionsFeedback": null,
  "recommendationsFeedback": null,
  "approvalFeedback": null
}
```


## Adjuntar el membrete en el formulario L.3

`POST /api/final-reports`, `PUT /api/final-reports/{id}` y `PATCH /api/final-reports/{id}/institutional-section` admiten `multipart/form-data`, con la parte `data` de tipo `application/json` y la parte `image` JPG/PNG opcional. Los cuerpos JSON existentes continúan admitidos. En Postman, añade `data` como archivo JSON y `image` como archivo de imagen; deja que el cliente genere el encabezado multipart con su boundary.

La aprobación requiere el membrete y un total de horas realizadas, además de los textos institucionales. Se admiten borradores sin imagen. El servidor valida contenido, tipo, tamaño de hasta 4 MB y dimensiones de hasta 4096 px por lado / 16 megapíxeles. La respuesta incluye `letterheadImageUrl`, `completedHours`, `completedMinutes` y `reportDate`. La lectura de la imagen verifica el acceso al informe.

Para un informe antiguo que ya esté aprobado y no tenga membrete, el tutor asignado puede utilizar `PUT /api/final-reports/{id}/letterhead` con la parte `image`. Esta ruta solo permite completar esa imagen faltante una vez; conserva la información y las aprobaciones existentes.

La [comparación completa de modelos y fuentes de datos](../../../producto/generacion-pdf-modelos-l1-l6.md) describe los formatos L.1–L.6.
