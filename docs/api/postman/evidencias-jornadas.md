<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          evidencias-jornadas.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Evidencias, jornadas y asistencias.
-->

# Evidencias, jornadas y asistencias

[Guía Postman y variables](../guia-postman.md) · Los ejemplos se ejecutan sobre un entorno de pruebas con cuentas del rol indicado.

## Fotografias de Practicas

El estudiante sube fotografias como evidencia de sus practicas. Las imagenes se guardan en la base de datos como BLOB y se consultan mediante una URL de contenido protegida.

| Metodo | URL | Rol |
| --- | --- | --- |
| `POST` | `{{baseUrl}}/api/practice-photos` | Estudiante |
| `GET` | `{{baseUrl}}/api/practice-photos/me` | Estudiante |
| `GET` | `{{baseUrl}}/api/practice-photos/review` | Tutor de Practicas, Tutor Institucional, Director de Practicas o Admin |
| `GET` | `{{baseUrl}}/api/practice-photos/enrollment/{{enrollmentId}}` | Autenticado con acceso |
| `GET` | `{{baseUrl}}/api/practice-photos/{{practicePhotoId}}` | Autenticado con acceso |
| `GET` | `{{baseUrl}}/api/practice-photos/{{practicePhotoId}}/content` | Autenticado con acceso |

Reglas:

- Solo se puede subir fotografias para una inscripcion `APPROVED`.
- El estudiante solo puede subir fotografias de sus propias inscripciones.
- Pueden verlas el estudiante propietario, el tutor de practicas asignado al curso, el tutor institucional asignado al curso, el director de practicas y el admin.
- Formatos permitidos: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/heic`, `image/heif`.
- Tamano maximo por fotografia: `15MB`.
- Las listas devuelven metadatos y `contentUrl`; el binario real se obtiene desde `/content`.

Subir fotografia usa `form-data`:

| Key | Type | Value |
| --- | --- | --- |
| `enrollmentId` | Text | `{{enrollmentId}}` |
| `file` | File | fotografia |
| `description` | Text | opcional |
| `practiceDate` | Text | opcional, formato `YYYY-MM-DD` |

Tests para guardar el id:

```javascript
const json = pm.response.json();
pm.environment.set("practicePhotoId", json.id);
```


## Horario y Asistencias de Practicas

El tutor institucional asignado al curso carga el horario en el que el estudiante debe asistir a practicas. Desde ese horario registra las asistencias. El estudiante puede consultar su horario y sus asistencias.

| Metodo | URL | Rol |
| --- | --- | --- |
| `POST` | `{{baseUrl}}/api/practice-schedules` | Tutor Institucional |
| `GET` | `{{baseUrl}}/api/practice-schedules/me` | Estudiante |
| `GET` | `{{baseUrl}}/api/practice-schedules/managed` | Tutor Institucional |
| `GET` | `{{baseUrl}}/api/practice-schedules/institution-review` | Directora de Institucion |
| `GET` | `{{baseUrl}}/api/practice-schedules/{{practiceScheduleId}}` | Autenticado con acceso |
| `PUT` | `{{baseUrl}}/api/practice-schedules/{{practiceScheduleId}}` | Tutor Institucional asignado |
| `POST` | `{{baseUrl}}/api/practice-schedules/{{practiceScheduleId}}/attendances` | Tutor Institucional asignado |
| `PUT` | `{{baseUrl}}/api/practice-schedules/{{practiceScheduleId}}/attendances/{{attendanceId}}` | Tutor Institucional asignado |

Reglas:

- Solo se puede crear horario para una inscripcion `APPROVED`.
- Solo puede crear, editar horario y registrar asistencias el tutor institucional asignado al curso.
- La directora de institucion puede revisar los horarios y asistencias de los estudiantes de su escuela o colegio, solo lectura.
- El curso debe tener tutor institucional con institucion activa de tipo `ESCUELA` o `COLEGIO`.
- Solo puede existir un horario por inscripcion.
- El horario debe tener al menos un periodo.
- `dayOfWeek` usa valores Java: `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY`.
- La hora de fin debe ser posterior a la hora de inicio.
- Los periodos de un mismo dia no pueden solaparse.
- Si una asistencia se registra contra un `schedulePeriodId`, la fecha debe coincidir con el dia del periodo.
- Estados de asistencia: `PRESENT`, `ABSENT`, `LATE`, `JUSTIFIED`.
- Las asistencias `PRESENT` y `LATE` requieren hora de inicio y hora de fin.
- Si no se envia `totalMinutes`, el backend lo calcula con las horas enviadas.

Crear horario:

```json
{
  "enrollmentId": 1,
  "startDate": "2026-05-18",
  "endDate": "2026-08-28",
  "observations": "Horario aprobado por la institucion receptora.",
  "periods": [
    {
      "dayOfWeek": "MONDAY",
      "startTime": "08:00",
      "endTime": "12:00",
      "place": "Aula de septimo EGB",
      "notes": "Acompanamiento a docente tutor."
    },
    {
      "dayOfWeek": "WEDNESDAY",
      "startTime": "08:00",
      "endTime": "11:00",
      "place": "Laboratorio",
      "notes": "Apoyo en actividades planificadas."
    }
  ]
}
```

Actualizar horario:

```json
{
  "observations": "Horario ajustado por reunion institucional.",
  "periods": [
    {
      "dayOfWeek": "MONDAY",
      "startTime": "08:00",
      "endTime": "12:00",
      "place": "Aula de septimo EGB",
      "notes": "Acompanamiento a docente tutor."
    },
    {
      "dayOfWeek": "FRIDAY",
      "startTime": "09:00",
      "endTime": "12:00",
      "place": "Biblioteca",
      "notes": "Apoyo pedagogico."
    }
  ]
}
```

Registrar asistencia:

```json
{
  "schedulePeriodId": 1,
  "attendanceDate": "2026-05-18",
  "startTime": "08:05",
  "endTime": "12:00",
  "status": "LATE",
  "observations": "Ingreso con cinco minutos de retraso justificado."
}
```

Registrar inasistencia:

```json
{
  "schedulePeriodId": 1,
  "attendanceDate": "2026-05-25",
  "status": "ABSENT",
  "observations": "No asistio a la jornada programada."
}
```


## Integridad al registrar asistencia

Dos asistencias del mismo horario y fecha no pueden usar el mismo período ni solapar su franja horaria. La comprobación también se aplica sin `schedulePeriodId`, al registrar y al editar. Dos franjas contiguas se admiten. Repetir la misma solicitud devuelve error de dominio y no incrementa los minutos acumulados.

La escritura de asistencias y la edición del horario bloquean el registro del horario durante la transacción. La segunda solicitud simultánea debe volver a comprobar lo registrado antes de guardar. Los duplicados históricos no se eliminan automáticamente.
