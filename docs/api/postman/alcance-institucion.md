<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          alcance-institucion.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Alcance institucional y archivos de portada.
-->

# Alcance institucional y archivos de portada

[Guía Postman y variables](../guia-postman.md) · Los ejemplos se ejecutan sobre un entorno de pruebas con cuentas del rol indicado.

## Alcance por rol y configuración institucional

- `GET /api/public/institutional-defaults` devuelve la universidad, facultad y carrera predeterminadas, con identificadores reales cuando están activas. Es público y no concede acceso a catálogos privados.
- El registro público acepta únicamente `ROLE_ESTUDIANTE` (o el rol omitido). Los roles del personal se provisionan desde administración; intentar registrar públicamente un tutor, director o administrador se rechaza.
- Los GET privados de facultades, carreras, ciclos y asignaturas filtran por el ámbito académico del director. Sus operaciones de escritura requieren administración.
- La búsqueda de paralelos también aplica el alcance del usuario. Los filtros no sustituyen ni amplían este alcance.
- Las búsquedas de tutores para asignación omiten datos personales de contacto e identificación cuando las ejecuta un usuario no administrador. Dirección solo encuentra tutores de prácticas de su universidad.

Consulta [Configuración institucional](../../producto/configuracion-institucional.md) para cambiar la instalación predeterminada o incorporar otras universidades sin modificar código.



## Portadas y logotipos elegidos en la creación

Los endpoints de creación de paralelos e instituciones conservan JSON y admiten alternativamente `multipart/form-data`:

| Parte | Tipo | Contenido |
| --- | --- | --- |
| `data` | `application/json` | El mismo DTO de creación utilizado en JSON |
| `image` | Archivo opcional | Imagen JPG o PNG de hasta 4 MB |

En Postman, utiliza Body → form-data y configura el Content-Type de `data` como `application/json`. Deja que Postman genere el encabezado multipart con su boundary. Para un paralelo, la URL es `POST {{baseUrl}}/api/courses`; para una institución, `POST {{baseUrl}}/api/institutions`.

Las respuestas añaden `coverImageUrl` o `logoImageUrl` cuando existe una imagen. Las prácticas devuelven `coverImageUrl` e `institutionLogoUrl`. Las URLs se consultan con el token de la sesión.

Para reemplazar una portada: `PUT /api/courses/{id}/cover`, parte `image`. Para quitarla: `DELETE /api/courses/{id}/cover`. El logotipo se reemplaza en la edición multipart de la institución y se quita mediante `DELETE /api/institutions/{id}/logo`.

Consulta [Portadas y logotipos](../../producto/portadas-y-logotipos.md) para permisos, límites y visualización.
