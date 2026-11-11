<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          cuentas.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Cuentas y perfiles.
-->

# Cuentas y perfiles

[Guía Postman y variables](../guia-postman.md) · Los ejemplos se ejecutan sobre un entorno de pruebas con cuentas del rol indicado.

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

