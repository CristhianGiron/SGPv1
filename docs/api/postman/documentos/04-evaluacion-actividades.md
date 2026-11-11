<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          04-evaluacion-actividades.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta L.4. Evaluación de actividades.
-->

# L.4. Evaluación de actividades

[Guía Postman y variables](../../guia-postman.md) · Los ejemplos se ejecutan sobre un entorno de pruebas con cuentas del rol indicado.

## Evaluacion de Actividades Realizadas

El tutor de practicas asignado al curso llena la evaluacion de actividades realizadas. El estudiante solo puede consultarla.

| Metodo | URL | Rol |
| --- | --- | --- |
| `POST` | `{{baseUrl}}/api/activity-evaluations` | Tutor de Practicas |
| `GET` | `{{baseUrl}}/api/activity-evaluations/me` | Estudiante |
| `GET` | `{{baseUrl}}/api/activity-evaluations/managed` | Tutor de Practicas |
| `GET` | `{{baseUrl}}/api/activity-evaluations/{{activityEvaluationId}}` | Autenticado con acceso |
| `PUT` | `{{baseUrl}}/api/activity-evaluations/{{activityEvaluationId}}` | Tutor de Practicas asignado |

Reglas:

- Solo se puede crear una evaluacion para una inscripcion `APPROVED`.
- Solo puede crear o editar la evaluacion el tutor de practicas asignado al curso.
- El estudiante propietario de la inscripcion solo puede ver la evaluacion.
- Solo puede existir una evaluacion por inscripcion.
- La institucion educativa receptora debe ser `ESCUELA` o `COLEGIO`.
- Si la práctica tiene tutor institucional asignado por grupo o paralelo, la institucion receptora debe coincidir con la institucion de ese tutor.
- La evaluacion debe tener al menos un aspecto `GENERAL` y un aspecto `ESPECIFICO`.
- Niveles permitidos: `ALTO` = 3, `MEDIO` = 2, `BAJO` = 1.
- Tipos de practica permitidos: `OBSERVACION`, `ELABORACION`, `DOCENTE`.
- Desarrollo de actividades permitido: `ONLINE`, `PRESENCIAL`.

Crear evaluacion:

```json
{
  "enrollmentId": 1,
  "educationalInstitutionId": 2,
  "educationalInstitutionName": "Colegio Test",
  "educationalInstitutionCode": "11H00001",
  "educationalInstitutionAddress": "Loja",
  "educationalInstitutionPhone": "0990000002",
  "educationalInstitutionEmail": "colegio@test.local",
  "practiceType": "DOCENTE",
  "studentFullName": "Ana Loja",
  "studentIdentification": "1100000001",
  "academicPeriod": "septiembre 2025-febrero 2026",
  "developmentMode": "PRESENCIAL",
  "aspects": [
    {
      "aspectType": "GENERAL",
      "item": "Puntualidad y cumplimiento de responsabilidades asignadas.",
      "level": "ALTO"
    },
    {
      "aspectType": "GENERAL",
      "item": "Comunicación y actitud profesional dentro de la institución.",
      "level": "MEDIO"
    },
    {
      "aspectType": "ESPECIFICO",
      "item": "Planificación y ejecución de actividades pedagógicas.",
      "level": "ALTO"
    },
    {
      "aspectType": "ESPECIFICO",
      "item": "Uso de recursos didácticos acordes al contexto educativo.",
      "level": "MEDIO"
    }
  ],
  "hoursCompleted": 120,
  "activitiesCompletionPercentage": 95.50,
  "evaluationDate": "2026-05-13"
}
```

Actualizar evaluacion:

```json
{
  "practiceType": "OBSERVACION",
  "developmentMode": "ONLINE",
  "aspects": [
    {
      "aspectType": "GENERAL",
      "item": "Cumplimiento de horarios establecidos.",
      "level": "ALTO"
    },
    {
      "aspectType": "ESPECIFICO",
      "item": "Registro y analisis de actividades observadas.",
      "level": "MEDIO"
    }
  ],
  "hoursCompleted": 80,
  "activitiesCompletionPercentage": 88.00,
  "evaluationDate": "2026-05-20"
}
```

