<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          autenticacion.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Autenticación y tokens.
-->

# Autenticación y tokens

[Guía Postman y variables](../guia-postman.md) · Los ejemplos se ejecutan sobre un entorno de pruebas con cuentas del rol indicado.

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



## Sesiones revocables y renovación

Las autenticaciones nuevas crean una sesión persistente. El backend conserva únicamente el hash del token de renovación. Los tokens emitidos incluyen identificador de sesión y versión de autenticación de la cuenta.

| Método | Ruta | Uso |
| --- | --- | --- |
| POST | `/api/auth/refresh` | Renovar con `{ "refreshToken": "..." }`; devuelve un nuevo par y retira la validez del refresh anterior |
| POST | `/api/auth/logout` | Con Bearer accessToken, revocar la sesión actual |
| POST | `/api/auth/logout-all` | Con Bearer accessToken, revocar todas las sesiones de la propia cuenta |

La renovación exige firma, caducidad, tipo de token, coincidencia del hash, cuenta habilitada y sesión vigente. Cambiar o recuperar la contraseña, bloquear o desactivar una cuenta invalida los tokens anteriores mediante su versión de autenticación. Las consultas y notificaciones WebSocket comprueban también la revocación; los tokens no se registran en el log del handshake.

El frontend comparte una única renovación entre peticiones simultáneas, reintenta una vez la operación y actualiza el estado de sesión. Una respuesta tardía no debe reutilizar las credenciales de otra cuenta que haya iniciado sesión. Un error de red durante la renovación conserva la autenticación para permitir reintento; un refresh rechazado la elimina.

Los access tokens anteriores a este cambio se aceptan mientras su cuenta conserve la versión inicial. No admiten renovación mediante el nuevo endpoint; su cierre se trata como revocación global al no incluir identificador de sesión. Después del siguiente login se utiliza el flujo nuevo.
