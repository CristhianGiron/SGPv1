<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          06-registro-actividades.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta L.6. Registro de actividades cumplidas.
-->

# L.6. Registro de actividades cumplidas

[Guía Postman y variables](../../guia-postman.md) · Los ejemplos se ejecutan sobre un entorno de pruebas con cuentas del rol indicado.

## Registro de Actividades Cumplidas

El estudiante llena el registro de actividades cumplidas y lo envia al tutor de practicas. El tutor de practicas asignado revisa el registro y puede dejar retroalimentacion por apartado y por cada fila de actividad.

| Metodo | URL | Rol |
| --- | --- | --- |
| `POST` | `{{baseUrl}}/api/completed-activity-records` | Estudiante |
| `GET` | `{{baseUrl}}/api/completed-activity-records/me` | Estudiante |
| `GET` | `{{baseUrl}}/api/completed-activity-records/me/summary` | Estudiante |
| `GET` | `{{baseUrl}}/api/completed-activity-records/review` | Tutor de Practicas |
| `GET` | `{{baseUrl}}/api/completed-activity-records/review/summary` | Tutor de Practicas |
| `GET` | `{{baseUrl}}/api/completed-activity-records/submitted/summary` | Director de Practicas o Admin |
| `GET` | `{{baseUrl}}/api/completed-activity-records/{{completedActivityRecordId}}` | Autenticado con acceso |
| `GET` | `{{baseUrl}}/api/completed-activity-records/{{completedActivityRecordId}}/pdf` | Autenticado con acceso, solo aprobado |
| `PUT` | `{{baseUrl}}/api/completed-activity-records/{{completedActivityRecordId}}` | Estudiante propietario |
| `PATCH` | `{{baseUrl}}/api/completed-activity-records/{{completedActivityRecordId}}/submit` | Estudiante propietario |
| `PATCH` | `{{baseUrl}}/api/completed-activity-records/{{completedActivityRecordId}}/review` | Tutor de prácticas asignado o director de prácticas de la carrera |

Reglas:

- La aprobación definitiva requiere tutoría de prácticas y dirección de prácticas. Una sola aprobación no cierra el proceso.
- Solo se puede crear un registro para una inscripcion `APPROVED`.
- El estudiante propietario llena y edita el registro mientras este en `DRAFT`, `NEEDS_CORRECTION` o `SUBMITTED`. Al editar un documento enviado, vuelve a borrador y se reinician sus decisiones de revisión.
- Solo puede existir un registro de actividades cumplidas por inscripcion.
- La institucion educativa receptora debe ser `ESCUELA` o `COLEGIO`.
- Si la práctica tiene tutor institucional asignado por grupo o paralelo, la institucion receptora debe coincidir con la institucion de ese tutor.
- Cada fila requiere fecha, hora de inicio, hora de fin, actividades desarrolladas y link de evidencia.
- Si no se envia `totalMinutes` en una fila, el backend lo calcula con `startTime` y `endTime`.
- Si no se envia `totalMinutes` general, el backend suma los minutos de todas las filas.
- El tutor de practicas solo puede revisar registros `SUBMITTED`.
- Para retroalimentar una fila, use el `id` de la fila devuelto en `entries`.

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
  "practiceType": "DOCENTE",
  "studentFullName": "Ana Loja",
  "studentIdentification": "1100000001",
  "academicPeriod": "septiembre 2025-febrero 2026",
  "developmentMode": "PRESENCIAL",
  "entries": [
    {
      "activityDate": "2026-05-13",
      "startTime": "08:00",
      "endTime": "10:30",
      "developedActivities": "Apoyo en planificacion, observacion de clase y registro de evidencias.",
      "evidenceLink": "https://drive.google.com/example/evidencia-1"
    },
    {
      "activityDate": "2026-05-20",
      "startTime": "09:00",
      "endTime": "11:00",
      "totalMinutes": 120,
      "developedActivities": "Ejecucion de actividades didacticas y apoyo a estudiantes.",
      "evidenceLink": "https://drive.google.com/example/evidencia-2"
    }
  ],
  "deliveryDate": "2026-05-21"
}
```

Actualizar borrador o corregido:

```json
{
  "entries": [
    {
      "activityDate": "2026-05-27",
      "startTime": "14:00",
      "endTime": "16:15",
      "developedActivities": "Actividad corregida con mayor detalle y evidencia actualizada.",
      "evidenceLink": "https://drive.google.com/example/evidencia-corregida"
    }
  ],
  "deliveryDate": "2026-05-28"
}
```

Enviar al tutor:

`PATCH {{baseUrl}}/api/completed-activity-records/{{completedActivityRecordId}}/submit`

Revisar como tutor de practicas:

```json
{
  "approved": false,
  "generalInfoFeedback": "Corregir periodo academico y verificar cedula.",
  "activitiesFeedback": "Agregar mas detalle en las actividades desarrolladas.",
  "accreditationFeedback": "Revisar el total de horas ejecutadas.",
  "entryFeedback": [
    {
      "entryId": 1,
      "feedback": "La descripcion es muy general.",
      "suggestions": "Indicar curso, tema trabajado y resultado observado."
    },
    {
      "entryId": 2,
      "feedback": "El enlace de evidencia no abre.",
      "suggestions": "Compartir el archivo con permisos de lectura."
    }
  ]
}
```

Para aprobar:

```json
{
  "approved": true,
  "generalInfoFeedback": null,
  "activitiesFeedback": null,
  "accreditationFeedback": null,
  "entryFeedback": []
}
```

