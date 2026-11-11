<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          catalogos.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Catálogos académicos y territoriales.
-->

# Catálogos académicos y territoriales

[Guía Postman y variables](../guia-postman.md) · Los ejemplos se ejecutan sobre un entorno de pruebas con cuentas del rol indicado.

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

