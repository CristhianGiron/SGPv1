# Guia Postman - SystemSGP API

## Ambiente

Crea un Environment en Postman con estas variables:

| Variable | Valor inicial |
| --- | --- |
| `baseUrl` | `http://localhost:8080` |
| `adminToken` | vacio |
| `directorToken` | vacio |
| `studentToken` | vacio |
| `accountId` | vacio |
| `institutionId` | vacio |
| `facultyId` | vacio |
| `careerId` | vacio |
| `academicCycleId` | vacio |
| `gradeId` | vacio |
| `subjectId` | vacio |
| `courseId` | vacio |
| `enrollmentId` | vacio |
| `practicePhotoId` | vacio |
| `provinceId` | vacio |
| `cantonId` | vacio |

Para endpoints protegidos usa `Authorization > Bearer Token`:

| Rol | Token |
| --- | --- |
| Admin | `{{adminToken}}` |
| Director de practicas | `{{directorToken}}` |
| Estudiante | `{{studentToken}}` |

## Login y Tokens

### Crear primer admin

Solo funciona si aun no existe ningun usuario con `ROLE_ADMIN`.

`POST {{baseUrl}}/api/bootstrap/admin`

Body `raw/json`:

```json
{
  "username": "admin",
  "password": "Admin12345",
  "names": "Admin",
  "lastNames": "Principal",
  "cedula": "1100000000",
  "institutionalEmail": "admin@sgp.local"
}
```

### Registrar estudiante publico

`POST {{baseUrl}}/api/auth/register`

Body `form-data`:

| Key | Type | Value |
| --- | --- | --- |
| `data` | Text | JSON de abajo |
| `file` | File | opcional |

`data`:

```json
{
  "username": "student01",
  "password": "Student12345",
  "names": "Estudiante",
  "lastNames": "Prueba",
  "cedula": "1100000001",
  "institutionalEmail": "student01@sgp.local",
  "phone": "0990000001",
  "address": "Loja",
  "academicCycleId": 1
}
```

En `Tests` puedes guardar el token:

```javascript
const json = pm.response.json();
pm.environment.set("studentToken", json.accessToken);
```

### Login

`POST {{baseUrl}}/api/auth/login`

Body `raw/json`:

```json
{
  "username": "admin",
  "password": "Admin12345"
}
```

Tests para admin:

```javascript
const json = pm.response.json();
pm.environment.set("adminToken", json.accessToken);
```

Tests para director:

```javascript
const json = pm.response.json();
pm.environment.set("directorToken", json.accessToken);
```

Tests para estudiante:

```javascript
const json = pm.response.json();
pm.environment.set("studentToken", json.accessToken);
```

## Cuentas

### Perfil autenticado

| Metodo | URL | Rol |
| --- | --- | --- |
| `GET` | `{{baseUrl}}/api/account/me` | Autenticado |
| `PATCH` | `{{baseUrl}}/api/account/me/password` | Autenticado |
| `PUT` | `{{baseUrl}}/api/account/me` | Autenticado |
| `GET` | `{{baseUrl}}/api/account/{{accountId}}/image` | Dueno o Admin |
| `GET` | `{{baseUrl}}/api/account?page=0&size=10` | Admin |
| `GET` | `{{baseUrl}}/api/account/search?username=&email=&names=&lastNames=&cedula=&role=` | Admin |

Cambiar password:

```json
{
  "currentPassword": "Student12345",
  "newPassword": "Student123456",
  "confirmPassword": "Student123456"
}
```

Actualizar perfil usa `form-data`:

| Key | Type | Value |
| --- | --- | --- |
| `data` | Text | `{"names":"Nuevo","lastNames":"Nombre","phone":"0991111111","address":"Loja"}` |
| `file` | File | opcional |

### Administracion de cuentas

Todos requieren `ROLE_ADMIN`.

| Metodo | URL |
| --- | --- |
| `POST` | `{{baseUrl}}/api/admin/accounts` |
| `PATCH` | `{{baseUrl}}/api/admin/accounts/{{accountId}}/disable` |
| `PATCH` | `{{baseUrl}}/api/admin/accounts/{{accountId}}/enable` |
| `PATCH` | `{{baseUrl}}/api/admin/accounts/{{accountId}}/lock` |
| `PATCH` | `{{baseUrl}}/api/admin/accounts/{{accountId}}/unlock` |
| `DELETE` | `{{baseUrl}}/api/admin/accounts/{{accountId}}` |
| `PATCH` | `{{baseUrl}}/api/admin/accounts/{{accountId}}/restore` |
| `PATCH` | `{{baseUrl}}/api/admin/accounts/{{accountId}}/academic-cycle/{{academicCycleId}}` |

Crear cuenta:

```json
{
  "username": "director01",
  "password": "Director12345",
  "names": "Director",
  "lastNames": "Practicas",
  "cedula": "1100000002",
  "institutionalEmail": "director01@sgp.local",
  "phone": "0990000002",
  "address": "Loja",
  "role": "ROLE_DIRECTOR_PRACTICAS",
  "academicCycleId": null,
  "institutionId": null
}
```

Roles validos:

```text
ROLE_ESTUDIANTE
ROLE_TUTOR_PRACTICAS
ROLE_TUTOR_ACADEMICO
ROLE_TUTOR_INSTITUCIONAL
ROLE_DIRECTORA_INSTITUCION
ROLE_DIRECTOR_PRACTICAS
ROLE_ADMIN
```

Para `ROLE_ESTUDIANTE`, `academicCycleId` es obligatorio. Para los demas roles debe ir `null` o no enviarse.

Para `ROLE_DIRECTORA_INSTITUCION`, `institutionId` es obligatorio y debe apuntar a una institucion activa de tipo `ESCUELA` o `COLEGIO`.

Crear directora de institucion:

```json
{
  "username": "directora.colegio",
  "password": "Directora12345",
  "names": "Mariela",
  "lastNames": "Rojas",
  "cedula": "1100000008",
  "institutionalEmail": "directora@colegio.local",
  "phone": "0990000008",
  "address": "Loja",
  "role": "ROLE_DIRECTORA_INSTITUCION",
  "academicCycleId": null,
  "institutionId": {{schoolInstitutionId}}
}
```

## Ubicaciones

| Metodo | URL | Rol |
| --- | --- | --- |
| `GET` | `{{baseUrl}}/api/locations/provinces` | Publico |
| `GET` | `{{baseUrl}}/api/locations/provinces/{{provinceId}}/cantons` | Publico |
| `GET` | `{{baseUrl}}/api/locations/cantons/{{cantonId}}/parishes` | Publico |
| `POST` | `{{baseUrl}}/api/locations/provinces` | Admin |
| `POST` | `{{baseUrl}}/api/locations/cantons` | Admin |
| `POST` | `{{baseUrl}}/api/locations/parishes` | Admin |

Crear provincia:

```json
{
  "code": "99",
  "name": "Provincia Test"
}
```

Crear canton:

```json
{
  "code": "9901",
  "name": "Canton Test",
  "provinceId": 1
}
```

Crear parroquia:

```json
{
  "code": "990101",
  "name": "Parroquia Test",
  "cantonId": 1
}
```

## Instituciones

Admin y Director de Practicas pueden gestionar instituciones. El borrado definitivo solo Admin.

| Metodo | URL |
| --- | --- |
| `POST` | `{{baseUrl}}/api/institutions` |
| `GET` | `{{baseUrl}}/api/institutions?page=0&size=10` |
| `GET` | `{{baseUrl}}/api/institutions/{{institutionId}}` |
| `GET` | `{{baseUrl}}/api/institutions/search?name=&code=&type=&support=&active=&agreementActive=&acceptsInterns=` |
| `PATCH` | `{{baseUrl}}/api/institutions/{{institutionId}}` |
| `PATCH` | `{{baseUrl}}/api/institutions/{{institutionId}}/disable` |
| `PATCH` | `{{baseUrl}}/api/institutions/{{institutionId}}/enable` |
| `DELETE` | `{{baseUrl}}/api/institutions/{{institutionId}}` |
| `PATCH` | `{{baseUrl}}/api/institutions/{{institutionId}}/restore` |
| `DELETE` | `{{baseUrl}}/api/institutions/{{institutionId}}/force` |

Crear universidad:

```json
{
  "code": "UNLTEST",
  "name": "Universidad Test",
  "type": "UNIVERSIDAD",
  "support": "PUBLICO",
  "address": "Loja",
  "phone": "0990000000",
  "email": "universidad@test.local",
  "website": "https://test.local",
  "agreementActive": true,
  "acceptsInterns": true,
  "provinceId": 1,
  "cantonId": 1,
  "parishId": 1,
  "regime": null,
  "modality": "PRESENCIAL",
  "educationLevels": null
}
```

Crear escuela o colegio: el `code` debe cumplir formato AMIE, por ejemplo `11H00001`, y puede enviar `educationLevels`: `["EGB","BGU"]`.

```json
{
  "code": "11H00001",
  "name": "Colegio Test",
  "type": "COLEGIO",
  "support": "PUBLICO",
  "address": "Loja",
  "phone": "0990000001",
  "email": "colegio@test.local",
  "website": "https://colegio-test.local",
  "agreementActive": true,
  "acceptsInterns": true,
  "provinceId": 1,
  "cantonId": 1,
  "parishId": 1,
  "regime": "SIERRA",
  "modality": "PRESENCIAL",
  "educationLevels": ["EGB", "BGU"]
}
```

## Facultades

Todos requieren Admin.

| Metodo | URL |
| --- | --- |
| `POST` | `{{baseUrl}}/api/faculties` |
| `GET` | `{{baseUrl}}/api/faculties` |
| `GET` | `{{baseUrl}}/api/faculties/{{facultyId}}` |
| `PUT` | `{{baseUrl}}/api/faculties/{{facultyId}}` |
| `DELETE` | `{{baseUrl}}/api/faculties/{{facultyId}}` |

Crear: `institutionId` debe pertenecer a una institución de tipo `UNIVERSIDAD`.

```json
{
  "name": "Facultad Test",
  "code": "FAC-TEST",
  "description": "Facultad de prueba",
  "institutionId": 1
}
```

## Carreras

Todos requieren Admin.

| Metodo | URL |
| --- | --- |
| `POST` | `{{baseUrl}}/api/careers` |
| `GET` | `{{baseUrl}}/api/careers` |
| `GET` | `{{baseUrl}}/api/careers/{{careerId}}` |
| `PUT` | `{{baseUrl}}/api/careers/{{careerId}}` |
| `PATCH` | `{{baseUrl}}/api/careers/{{careerId}}/disable` |
| `PATCH` | `{{baseUrl}}/api/careers/{{careerId}}/enable` |
| `DELETE` | `{{baseUrl}}/api/careers/{{careerId}}` |
| `PATCH` | `{{baseUrl}}/api/careers/{{careerId}}/restore` |
| `DELETE` | `{{baseUrl}}/api/careers/{{careerId}}/force` |

Crear:

```json
{
  "name": "Ingenieria Test",
  "code": "CAR-TEST",
  "description": "Carrera de prueba",
  "durationCycles": 10,
  "facultyId": 1
}
```

## Ciclos Academicos

Todos requieren Admin.

| Metodo | URL |
| --- | --- |
| `POST` | `{{baseUrl}}/api/academic-cycles` |
| `GET` | `{{baseUrl}}/api/academic-cycles` |
| `GET` | `{{baseUrl}}/api/academic-cycles/{{academicCycleId}}` |
| `PUT` | `{{baseUrl}}/api/academic-cycles/{{academicCycleId}}` |
| `PATCH` | `{{baseUrl}}/api/academic-cycles/{{academicCycleId}}/disable` |
| `PATCH` | `{{baseUrl}}/api/academic-cycles/{{academicCycleId}}/enable` |
| `DELETE` | `{{baseUrl}}/api/academic-cycles/{{academicCycleId}}` |
| `PATCH` | `{{baseUrl}}/api/academic-cycles/{{academicCycleId}}/restore` |
| `DELETE` | `{{baseUrl}}/api/academic-cycles/{{academicCycleId}}/force` |

Crear:

```json
{
  "name": "Primer Ciclo",
  "level": 1,
  "careerId": 1
}
```

## Grados

Todos requieren Admin.

| Metodo | URL |
| --- | --- |
| `POST` | `{{baseUrl}}/api/grades` |
| `GET` | `{{baseUrl}}/api/grades` |
| `GET` | `{{baseUrl}}/api/grades/{{gradeId}}` |
| `PUT` | `{{baseUrl}}/api/grades/{{gradeId}}` |
| `DELETE` | `{{baseUrl}}/api/grades/{{gradeId}}` |

Crear: `institutionId` debe pertenecer a una institución de tipo `ESCUELA` o `COLEGIO`. Si usa una `UNIVERSIDAD`, la API responde `400 Bad Request`.

```json
{
  "name": "Primero BGU",
  "code": "1BGU-TEST",
  "level": 1,
  "institutionId": {{schoolInstitutionId}},
  "active": true
}
```

## Asignaturas

Todos requieren Admin.

| Metodo | URL |
| --- | --- |
| `POST` | `{{baseUrl}}/api/subjects` |
| `GET` | `{{baseUrl}}/api/subjects` |
| `GET` | `{{baseUrl}}/api/subjects/{{subjectId}}` |
| `PUT` | `{{baseUrl}}/api/subjects/{{subjectId}}` |
| `DELETE` | `{{baseUrl}}/api/subjects/{{subjectId}}` |

Crear asignatura universitaria:

```json
{
  "name": "Programacion Test",
  "code": "SUB-TEST",
  "description": "Asignatura de prueba",
  "credits": 4,
  "hours": 96,
  "academicCycleId": 1,
  "gradeId": null,
  "active": true
}
```

Crear asignatura escolar:

```json
{
  "name": "Matematica Test",
  "code": "MAT-TEST",
  "description": "Asignatura de prueba",
  "credits": null,
  "hours": 80,
  "academicCycleId": null,
  "gradeId": 1,
  "active": true
}
```

## Cursos y Practicas

Admin y Director de Practicas pueden gestionar cursos. El borrado definitivo solo Admin. La busqueda de cursos requiere cualquier usuario autenticado.

| Metodo | URL | Rol |
| --- | --- | --- |
| `POST` | `{{baseUrl}}/api/courses` | Admin o Director |
| `GET` | `{{baseUrl}}/api/courses` | Admin o Director |
| `GET` | `{{baseUrl}}/api/courses/{{courseId}}` | Admin o Director |
| `GET` | `{{baseUrl}}/api/courses/search?name=&active=&locked=&institutionalTutor=&academicTutor=&practiceTutor=` | Autenticado |
| `PATCH` | `{{baseUrl}}/api/courses/{{courseId}}/institutional-tutor/{{accountId}}` | Admin o Director |
| `PATCH` | `{{baseUrl}}/api/courses/{{courseId}}/academic-tutor/{{accountId}}` | Admin o Director |
| `PATCH` | `{{baseUrl}}/api/courses/{{courseId}}/practice-tutor/{{accountId}}` | Admin o Director |
| `PATCH` | `{{baseUrl}}/api/courses/{{courseId}}/disable` | Admin o Director |
| `PATCH` | `{{baseUrl}}/api/courses/{{courseId}}/enable` | Admin o Director |
| `PATCH` | `{{baseUrl}}/api/courses/{{courseId}}/lock` | Admin o Director |
| `PATCH` | `{{baseUrl}}/api/courses/{{courseId}}/unlock` | Admin o Director |
| `DELETE` | `{{baseUrl}}/api/courses/{{courseId}}` | Admin o Director |
| `PATCH` | `{{baseUrl}}/api/courses/{{courseId}}/restore` | Admin o Director |
| `DELETE` | `{{baseUrl}}/api/courses/{{courseId}}/force` | Admin |

Busqueda:

`GET {{baseUrl}}/api/courses/search?name=&active=&locked=&institutionalTutor=&academicTutor=&practiceTutor=`

Reglas de tutores:

- Tutor institucional: cuenta activa con rol `ROLE_TUTOR_INSTITUCIONAL`, institución activa de tipo `ESCUELA` o `COLEGIO`, convenio activo y acepta practicantes.
- Tutor académico: cuenta activa con rol `ROLE_TUTOR_ACADEMICO`, institución activa de tipo `UNIVERSIDAD` con código `UNL`.
- Tutor de prácticas: cuenta activa con rol `ROLE_TUTOR_PRACTICAS`, institución activa de tipo `UNIVERSIDAD` con código `UNL`.

Crear:

```json
{
  "name": "Curso Practicas Test",
  "description": "Curso de prueba",
  "capacity": 30,
  "startDate": "2026-05-13T08:00:00",
  "endDate": "2026-06-13T17:00:00",
  "subjectId": 1
}
```

## Inscripciones

| Metodo | URL | Rol |
| --- | --- | --- |
| `POST` | `{{baseUrl}}/api/courses/{{courseId}}/enroll` | Estudiante |
| `PATCH` | `{{baseUrl}}/api/enrollments/{{enrollmentId}}/approve` | Admin o Director |
| `PATCH` | `{{baseUrl}}/api/enrollments/{{enrollmentId}}/reject` | Admin o Director |
| `DELETE` | `{{baseUrl}}/api/enrollments/{{enrollmentId}}` | Estudiante propietario |
| `GET` | `{{baseUrl}}/api/courses/{{courseId}}/enrollments` | Admin o Director |
| `GET` | `{{baseUrl}}/api/enrollments/me` | Estudiante |

Regla de ciclo: el estudiante solo puede matricularse si su cuenta tiene `academicCycleId` y coincide con el ciclo académico de la asignatura del curso. Si el curso no tiene asignatura/ciclo o el estudiante pertenece a otro ciclo, la API rechaza la matrícula.

Regla de estado: solo las inscripciones `PENDING` pueden aprobarse o rechazarse.

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
| `PATCH` | `{{baseUrl}}/api/activity-plans/{{activityPlanId}}/review` | Tutor de Practicas asignado |

Reglas:

- Solo se puede crear un plan para una inscripción `APPROVED`.
- La institución educativa debe ser `ESCUELA` o `COLEGIO`.
- Si el curso tiene tutor institucional, la institución educativa del plan debe coincidir con la institución de ese tutor.
- El estudiante puede editar planes en estado `DRAFT` o `NEEDS_CORRECTION`.
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
| `PATCH` | `{{baseUrl}}/api/practice-reports/{{practiceReportId}}/review` | Tutor de Practicas asignado |

Reglas:

- Solo se puede crear un informe para una inscripción `APPROVED`.
- La institución educativa debe ser `ESCUELA` o `COLEGIO`.
- Si el curso tiene tutor institucional, la institución educativa del informe debe coincidir con la institución de ese tutor.
- El estudiante puede editar informes en estado `DRAFT` o `NEEDS_CORRECTION`.
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

## Informes Finales

El estudiante llena la informacion general, antecedentes, objetivo, actividades y aprobacion del informe final. Las conclusiones y recomendaciones las llena el tutor institucional asignado al curso. El informe solo queda `APPROVED` cuando el tutor de practicas y el tutor institucional lo aprueban.

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
| `PATCH` | `{{baseUrl}}/api/final-reports/{{finalReportId}}/submit` | Estudiante propietario |
| `PATCH` | `{{baseUrl}}/api/final-reports/{{finalReportId}}/institutional-section` | Tutor Institucional asignado |
| `PATCH` | `{{baseUrl}}/api/final-reports/{{finalReportId}}/practice-review` | Tutor de Practicas asignado |
| `PATCH` | `{{baseUrl}}/api/final-reports/{{finalReportId}}/institutional-review` | Tutor Institucional asignado |

Reglas:

- Solo se puede crear un informe final para una inscripcion `APPROVED`.
- El curso debe tener tutor institucional asignado.
- La institucion educativa debe ser `ESCUELA` o `COLEGIO`.
- Si el curso tiene tutor institucional, la institucion educativa del informe debe coincidir con la institucion de ese tutor.
- El estudiante no llena conclusiones ni recomendaciones.
- El tutor institucional llena conclusiones y recomendaciones cuando el informe ya fue enviado.
- El tutor de practicas y el tutor institucional pueden dejar retroalimentacion por apartado.
- Si cualquiera de los dos tutores rechaza, el informe vuelve a `NEEDS_CORRECTION`.
- El informe final queda `APPROVED` solo cuando ambos tutores aprueban.

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

Completar conclusiones y recomendaciones como tutor institucional:

```json
{
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
- Si el curso tiene tutor institucional, la institucion receptora debe coincidir con la institucion de ese tutor.
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
- Si el curso tiene tutor institucional, la institucion receptora debe coincidir con la institucion de ese tutor.
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
| `PATCH` | `{{baseUrl}}/api/completed-activity-records/{{completedActivityRecordId}}/review` | Tutor de Practicas asignado |

Reglas:

- Solo se puede crear un registro para una inscripcion `APPROVED`.
- El estudiante propietario llena y edita el registro mientras este en `DRAFT` o `NEEDS_CORRECTION`.
- Solo puede existir un registro de actividades cumplidas por inscripcion.
- La institucion educativa receptora debe ser `ESCUELA` o `COLEGIO`.
- Si el curso tiene tutor institucional, la institucion receptora debe coincidir con la institucion de ese tutor.
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

## Scripts utiles de Postman

Guardar `id` desde respuesta directa:

```javascript
pm.environment.set("institutionId", pm.response.json().id);
```

Para grados, guardar el `id` de una escuela o colegio:

```javascript
pm.environment.set("schoolInstitutionId", pm.response.json().id);
```

Guardar `id` desde una respuesta paginada de Spring:

```javascript
const json = pm.response.json();
if (json.content && json.content.length > 0) {
  pm.environment.set("institutionId", json.content[0].id);
}
```

Guardar `id` desde una lista:

```javascript
const json = pm.response.json();
if (Array.isArray(json) && json.length > 0) {
  pm.environment.set("facultyId", json[0].id);
}
```

## Orden recomendado para probar flujo completo

1. Crear primer admin o iniciar sesion con un admin existente.
2. Crear usuario Director de Practicas desde `/api/admin/accounts`.
3. Crear usuario Tutor Institucional, Tutor Academico y Tutor Practicas desde `/api/admin/accounts`.
4. Registrar o crear estudiante con `academicCycleId`.
5. Consultar ubicaciones publicas y guardar `provinceId`, `cantonId`, `parishId`.
6. Crear institucion.
7. Crear facultad, carrera y ciclo academico.
8. Crear asignatura.
9. Crear curso.
10. Asignar tutores al curso.
11. Iniciar sesion como estudiante e inscribirse.
12. Iniciar sesion como admin/director y aprobar la inscripcion.
13. Iniciar sesion como estudiante, crear el plan de actividades y enviarlo.
14. Iniciar sesion como tutor de practicas, revisar el plan y aprobarlo o solicitar correcciones.
15. Iniciar sesion como estudiante, crear el informe de practicas y enviarlo.
16. Iniciar sesion como tutor de practicas, revisar el informe y aprobarlo o solicitar correcciones.
17. Iniciar sesion como estudiante, crear el informe final y enviarlo.
18. Iniciar sesion como tutor institucional, completar conclusiones y recomendaciones.
19. Iniciar sesion como tutor de practicas y tutor institucional, revisar el informe final hasta aprobarlo o pedir correcciones.
20. Iniciar sesion como tutor de practicas, crear la evaluacion de actividades realizadas.
21. Iniciar sesion como estudiante y consultar la evaluacion desde `/api/activity-evaluations/me`.
22. Iniciar sesion como tutor de practicas, crear el reporte de seguimiento.
23. Iniciar sesion como estudiante y consultar el seguimiento desde `/api/practice-follow-up-reports/me`.
24. Iniciar sesion como estudiante, crear el registro de actividades cumplidas y enviarlo.
25. Iniciar sesion como tutor de practicas, revisar el registro y aprobarlo o solicitar correcciones por apartado y por fila.
26. Iniciar sesion como tutor institucional, crear el horario de practicas del estudiante.
27. Registrar asistencias desde `/api/practice-schedules/{{practiceScheduleId}}/attendances`.
28. Iniciar sesion como estudiante y consultar su horario/asistencias desde `/api/practice-schedules/me`.
29. Iniciar sesion como directora de institucion y revisar los registros desde `/api/practice-schedules/institution-review`.
