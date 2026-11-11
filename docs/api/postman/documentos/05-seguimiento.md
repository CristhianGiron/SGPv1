<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          05-seguimiento.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta L.5. Reporte de seguimiento.
-->

# L.5. Reporte de seguimiento

[Guía Postman y variables](../../guia-postman.md) · Los ejemplos se ejecutan sobre un entorno de pruebas con cuentas del rol indicado.

## Reporte de Seguimiento de Practica Preprofesional

El tutor de practicas asignado al curso llena el reporte de seguimiento de la practica preprofesional. El estudiante solo puede consultarlo.

| Metodo | URL | Rol |
| --- | --- | --- |
| `POST` | `{{baseUrl}}/api/practice-follow-up-reports` | Tutor de Practicas |
| `GET` | `{{baseUrl}}/api/practice-follow-up-reports/me` | Estudiante |
| `GET` | `{{baseUrl}}/api/practice-follow-up-reports/managed` | Tutor de Practicas |
| `GET` | `{{baseUrl}}/api/practice-follow-up-reports/{{practiceFollowUpReportId}}` | Autenticado con acceso |
| `PUT` | `{{baseUrl}}/api/practice-follow-up-reports/{{practiceFollowUpReportId}}` | Tutor de Practicas asignado |

Reglas:

- Solo se puede crear un seguimiento para una inscripcion `APPROVED`.
- Solo puede crear o editar el seguimiento el tutor de practicas asignado al curso.
- El estudiante propietario de la inscripcion solo puede ver el seguimiento.
- Solo puede existir un reporte de seguimiento por inscripcion.
- La institucion educativa receptora debe ser `ESCUELA` o `COLEGIO`.
- Si la práctica tiene tutor institucional asignado por grupo o paralelo, la institucion receptora debe coincidir con la institucion de ese tutor.
- El reporte debe tener al menos una visita o supervision.
- Cada visita requiere fecha, hora de inicio, hora de fin y actividades supervisadas.
- Si no se envia `totalMinutes` en una visita, el backend lo calcula con `startTime` y `endTime`.
- Si no se envia `totalMinutes` general, el backend suma los minutos de todas las visitas.

Crear reporte:

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
  "sessions": [
    {
      "supervisionDate": "2026-05-13",
      "startTime": "08:00",
      "endTime": "10:30",
      "supervisedActivities": "Observacion de clase, revision de planificacion y retroalimentacion al estudiante."
    },
    {
      "supervisionDate": "2026-05-20",
      "startTime": "09:00",
      "endTime": "11:00",
      "totalMinutes": 120,
      "supervisedActivities": "Supervision de actividades didacticas y revision de evidencias."
    }
  ],
  "deliveryDate": "2026-05-21"
}
```

Actualizar reporte:

```json
{
  "practiceType": "OBSERVACION",
  "developmentMode": "ONLINE",
  "sessions": [
    {
      "supervisionDate": "2026-05-27",
      "startTime": "14:00",
      "endTime": "16:15",
      "supervisedActivities": "Seguimiento virtual de actividades observadas y revision de informe semanal."
    }
  ],
  "deliveryDate": "2026-05-28"
}
```

