<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          01-informe-actividades.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta L.1. Informe de actividades cumplidas.
-->

# L.1. Informe de actividades cumplidas

[Guía Postman y variables](../../guia-postman.md) · Los ejemplos se ejecutan sobre un entorno de pruebas con cuentas del rol indicado.

## Informes de Practicas

El estudiante llena el informe de prácticas a partir de una inscripción aprobada. El tutor de prácticas asignado al curso puede revisar el informe y dejar retroalimentación por apartado.

| Metodo | URL | Rol |
| --- | --- | --- |
| `POST` | `{{baseUrl}}/api/practice-reports` | Estudiante |
| `GET` | `{{baseUrl}}/api/practice-reports/me` | Estudiante |
| `GET` | `{{baseUrl}}/api/practice-reports/me/summary` | Estudiante |
| `GET` | `{{baseUrl}}/api/practice-reports/review` | Tutor de Practicas |
| `GET` | `{{baseUrl}}/api/practice-reports/review/summary` | Tutor de Practicas |
| `GET` | `{{baseUrl}}/api/practice-reports/submitted/summary` | Director de Practicas o Admin |
| `GET` | `{{baseUrl}}/api/practice-reports/{{practiceReportId}}` | Autenticado con acceso |
| `GET` | `{{baseUrl}}/api/practice-reports/{{practiceReportId}}/pdf` | Autenticado con acceso, solo aprobado |
| `PUT` | `{{baseUrl}}/api/practice-reports/{{practiceReportId}}` | Estudiante propietario |
| `PATCH` | `{{baseUrl}}/api/practice-reports/{{practiceReportId}}/submit` | Estudiante propietario |
| `PATCH` | `{{baseUrl}}/api/practice-reports/{{practiceReportId}}/review` | Tutor de prácticas asignado o director de prácticas de la carrera |

Reglas:

- La aprobación definitiva requiere tutoría de prácticas y dirección de prácticas. Una sola aprobación no cierra el proceso.
- Solo se puede crear un informe para una inscripción `APPROVED`.
- La institución educativa debe ser `ESCUELA` o `COLEGIO`.
- Si la práctica tiene tutor institucional asignado por grupo o paralelo, la institución educativa del informe debe coincidir con la institución de ese tutor.
- El estudiante puede editar informes en estado `DRAFT`, `NEEDS_CORRECTION` o `SUBMITTED`. Al editar un documento enviado, vuelve a borrador y se reinician sus decisiones de revisión.
- El tutor de prácticas solo puede revisar informes `SUBMITTED`.

Crear borrador:

```json
{
  "enrollmentId": 1,
  "educationalInstitutionId": 2,
  "studentFullName": "Ana Loja",
  "studentIdentification": "1100000001",
  "studentEmail": "ana@test.local",
  "studentPhone": "0990000001",
  "educationalInstitutionName": "Colegio Test",
  "educationalInstitutionCode": "11H00001",
  "educationalInstitutionAddress": "Loja",
  "educationalInstitutionPhone": "0990000002",
  "educationalInstitutionEmail": "colegio@test.local",
  "presentation": "Texto largo de presentación del informe...",
  "generalObjective": "Desarrollar competencias profesionales mediante prácticas preprofesionales.",
  "specificObjective1": "Aplicar conocimientos pedagógicos en el aula.",
  "specificObjective2": "Planificar actividades académicas acordes al contexto institucional.",
  "specificObjective3": "Evaluar el proceso de aprendizaje de los estudiantes.",
  "methodology": "Texto largo de metodología aplicada durante las prácticas...",
  "activityWeeks": [
    {
      "weekNumber": 1,
      "startDate": "2026-05-13",
      "endDate": "2026-05-17",
      "activities": "- Observación de clases\n- Apoyo en planificación\n- Registro de evidencias"
    },
    {
      "weekNumber": 2,
      "startDate": "2026-05-20",
      "endDate": "2026-05-24",
      "activities": "- Desarrollo de actividades guiadas\n- Elaboración de material didáctico"
    }
  ],
  "conclusion1": "Conclusión relacionada con el objetivo específico 1.",
  "conclusion2": "Conclusión relacionada con el objetivo específico 2.",
  "conclusion3": "Conclusión relacionada con el objetivo específico 3.",
  "recommendation1": "Recomendación relacionada con la conclusión 1.",
  "recommendation2": "Recomendación relacionada con la conclusión 2.",
  "recommendation3": "Recomendación relacionada con la conclusión 3.",
  "approval": "Texto de aprobación o constancia final..."
}
```

Actualizar borrador o corregido:

```json
{
  "presentation": "Presentación corregida...",
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

Enviar al tutor:

`PATCH {{baseUrl}}/api/practice-reports/{{practiceReportId}}/submit`

Revisar como tutor de prácticas:

```json
{
  "approved": false,
  "generalInfoFeedback": "Completar teléfono de la institución.",
  "presentationFeedback": "Ampliar el contexto de la institución educativa.",
  "objectivesFeedback": "Reformular el objetivo específico 2 con verbo medible.",
  "methodologyFeedback": "Describir mejor las técnicas utilizadas.",
  "activitiesFeedback": "Agregar más detalle en la semana 2.",
  "conclusionsFeedback": "Relacionar cada conclusión con su objetivo específico.",
  "recommendationsFeedback": "Las recomendaciones deben responder a cada conclusión.",
  "approvalFeedback": "Actualizar texto final luego de corregir."
}
```

Para aprobar:

```json
{
  "approved": true,
  "generalInfoFeedback": null,
  "presentationFeedback": null,
  "objectivesFeedback": null,
  "methodologyFeedback": null,
  "activitiesFeedback": null,
  "conclusionsFeedback": null,
  "recommendationsFeedback": null,
  "approvalFeedback": null
}
```

