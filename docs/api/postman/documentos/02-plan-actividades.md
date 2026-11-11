<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          02-plan-actividades.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta L.2. Plan de actividades.
-->

# L.2. Plan de actividades

[Guía Postman y variables](../../guia-postman.md) · Los ejemplos se ejecutan sobre un entorno de pruebas con cuentas del rol indicado.

## Planes de Actividades

El estudiante llena el plan de actividades a partir de una inscripción aprobada. El tutor de prácticas asignado al curso puede revisarlo y dejar retroalimentación por apartado.

| Metodo | URL | Rol |
| --- | --- | --- |
| `POST` | `{{baseUrl}}/api/activity-plans` | Estudiante |
| `GET` | `{{baseUrl}}/api/activity-plans/me` | Estudiante |
| `GET` | `{{baseUrl}}/api/activity-plans/me/summary` | Estudiante |
| `GET` | `{{baseUrl}}/api/activity-plans/review` | Tutor de Practicas |
| `GET` | `{{baseUrl}}/api/activity-plans/review/summary` | Tutor de Practicas |
| `GET` | `{{baseUrl}}/api/activity-plans/submitted/summary` | Director de Practicas o Admin |
| `GET` | `{{baseUrl}}/api/activity-plans/{{activityPlanId}}` | Autenticado con acceso |
| `GET` | `{{baseUrl}}/api/activity-plans/{{activityPlanId}}/pdf` | Autenticado con acceso, solo aprobado |
| `PUT` | `{{baseUrl}}/api/activity-plans/{{activityPlanId}}` | Estudiante propietario |
| `PATCH` | `{{baseUrl}}/api/activity-plans/{{activityPlanId}}/submit` | Estudiante propietario |
| `PATCH` | `{{baseUrl}}/api/activity-plans/{{activityPlanId}}/review` | Tutor de prácticas asignado o director de prácticas de la carrera |

Reglas:

- La aprobación definitiva requiere tutoría de prácticas y dirección de prácticas. Una sola aprobación no cierra el proceso.
- Solo se puede crear un plan para una inscripción `APPROVED`.
- La institución educativa debe ser `ESCUELA` o `COLEGIO`.
- Si la práctica tiene tutor institucional asignado por grupo o paralelo, la institución educativa del plan debe coincidir con la institución de ese tutor.
- El estudiante puede editar planes en estado `DRAFT`, `NEEDS_CORRECTION` o `SUBMITTED`. Al editar un documento enviado, vuelve a borrador y se reinician sus decisiones de revisión.
- El tutor de prácticas solo puede revisar planes `SUBMITTED`.

Crear borrador:

```json
{
  "enrollmentId": 1,
  "educationalInstitutionId": 2,
  "studentFullName": "Ana Loja",
  "studentIdentification": "1100000001",
  "studentEmail": "ana@test.local",
  "studentPhone": "0990000001",
  "curricularOrganizationUnit": "Unidad de organización curricular profesional",
  "subjectDenomination": "Prácticas Preprofesionales I",
  "integrativeKnowledgeProject": "Proyecto integrador de saberes del ciclo",
  "practiceType": "Preprofesional",
  "educationalInstitutionName": "Colegio Test",
  "educationalInstitutionCode": "11H00001",
  "educationalInstitutionAddress": "Loja",
  "educationalInstitutionPhone": "0990000002",
  "educationalInstitutionEmail": "colegio@test.local",
  "teacherCount": 25,
  "studentCount": 640,
  "mission": "Texto largo de misión institucional...",
  "vision": "Texto largo de visión institucional...",
  "institutionalValues": "Responsabilidad, respeto, solidaridad...",
  "presentation": "Texto largo de presentación del plan de actividades...",
  "generalObjective": "Planificar actividades para el desarrollo de las prácticas preprofesionales.",
  "specificObjective1": "Identificar el contexto institucional.",
  "specificObjective2": "Organizar actividades pedagógicas por semana.",
  "specificObjective3": "Definir recursos para la ejecución de la práctica.",
  "activityWeeks": [
    {
      "weekNumber": 1,
      "startDate": "2026-05-13",
      "endDate": "2026-05-17",
      "activities": "- Socialización institucional\n- Observación de clases\n- Revisión de planificación"
    },
    {
      "weekNumber": 2,
      "startDate": "2026-05-20",
      "endDate": "2026-05-24",
      "activities": "- Apoyo en actividades de aula\n- Elaboración de recursos didácticos"
    }
  ],
  "scheduleWeeks": [
    {
      "weekNumber": 1,
      "startDate": "2026-05-13",
      "endDate": "2026-05-17",
      "scheduledActivities": "Lunes: inducción. Martes a viernes: observación y registro."
    },
    {
      "weekNumber": 2,
      "startDate": "2026-05-20",
      "endDate": "2026-05-24",
      "scheduledActivities": "Planificación y apoyo en actividades guiadas."
    }
  ],
  "legalResources": "Normativa institucional, reglamento de prácticas, convenio vigente.",
  "humanResources": "Estudiante, tutor institucional, tutor de prácticas, docentes.",
  "technologicalResources": "Computadora, internet, proyector, plataforma institucional.",
  "physicalResources": "Aulas, biblioteca, laboratorios, material didáctico.",
  "approval": "Texto de aprobación del plan..."
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
  ],
  "scheduleWeeks": [
    {
      "weekNumber": 1,
      "startDate": "2026-05-13",
      "endDate": "2026-05-17",
      "scheduledActivities": "Cronograma corregido de la semana 1"
    }
  ]
}
```

Enviar al tutor:

`PATCH {{baseUrl}}/api/activity-plans/{{activityPlanId}}/submit`

Revisar como tutor de prácticas:

```json
{
  "approved": false,
  "generalInfoFeedback": "Completar misión, visión y valores institucionales.",
  "presentationFeedback": "Ampliar la presentación con el contexto del curso.",
  "objectivesFeedback": "Reformular los objetivos específicos con verbos medibles.",
  "activitiesFeedback": "Agregar actividades más concretas por semana.",
  "scheduleFeedback": "Ajustar fechas del cronograma.",
  "resourcesFeedback": "Separar mejor recursos legales y tecnológicos.",
  "approvalFeedback": "Actualizar el texto final de aprobación."
}
```

Para aprobar:

```json
{
  "approved": true,
  "generalInfoFeedback": null,
  "presentationFeedback": null,
  "objectivesFeedback": null,
  "activitiesFeedback": null,
  "scheduleFeedback": null,
  "resourcesFeedback": null,
  "approvalFeedback": null
}
```

