<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          portadas-y-logotipos.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Portadas de prácticas y logotipos institucionales.
-->

# Portadas de prácticas y logotipos institucionales

## Elección al crear

En **Gestionar paralelos y grupos → Crear paralelo** aparece **Portada opcional**, dentro del mismo formulario. Administración o dirección puede seleccionar una imagen, comprobar su vista previa y quitar la selección antes de guardar. La portada se comparte entre las prácticas de los estudiantes inscritos en ese paralelo.

En el formulario de creación de una universidad, escuela o colegio aparece **Logotipo institucional opcional**. El creador lo selecciona de la misma manera. Los formularios siguen funcionando sin imágenes.

El registro y la imagen se guardan en una misma transacción del servidor. Si falla la validación o la escritura, no se deja un paralelo o institución incompleto por una carga de imagen fallida. Las peticiones JSON existentes continúan admitidas.

## Visualización y cambios

- La portada aparece en el listado de paralelos, las tarjetas de prácticas y una franja en el encabezado de la práctica seleccionada.
- El logotipo aparece en la tabla institucional y junto al centro receptor en las tarjetas de prácticas.
- Si no hay imagen, se muestra una identificación gráfica predeterminada, conservando el nombre, la institución y el estado.
- Administración o dirección de la carrera correspondiente puede reemplazar o quitar una portada desde la gestión del paralelo.
- El logotipo puede reemplazarse desde **Editar institución**, o retirarse con **Quitar logotipo**. La gestión de universidades corresponde a administración; dirección conserva sus permisos de gestión de centros receptores.

Las imágenes no son evidencias de práctica ni adjuntos de los documentos; son recursos de identificación visual.

## Icono del sistema

El recurso vectorial [sgp-icon.svg](../../FrontEnd/public/sgp-icon.svg) identifica al SGP: el libro abierto representa la formación académica y la marca dorada, el seguimiento y cumplimiento de las prácticas. El azul `#12385B` y el dorado `#D8B55B` acompañan la identidad institucional de la UNL. Es un símbolo propio del sistema; el logotipo institucional sigue presente en el acceso y los documentos.

El mismo SVG se utiliza en el menú lateral y como favicon. El manifiesto incluye además versiones PNG de 192 y 512 píxeles; hay un icono Apple de 180 píxeles y un ICO con tamaños de 16 a 64 píxeles para compatibilidad. Las versiones rasterizadas se derivan del SVG original.

## Archivos y acceso

JPG y PNG, máximo 4 MB, 4096 píxeles por lado y 16 megapíxeles. El servidor comprueba el contenido real, dimensiones y posibilidad de decodificar la imagen, además del tipo declarado. Se conservan los bytes validados para preservar calidad y orientación JPEG en el navegador.

Las imágenes se guardan en `entity_images`, con referencias opcionales desde `courses` e `institutions`. Los DTO devuelven URLs versionadas, nunca datos binarios. Los originales quedan en el servidor y la respuesta usa tipo de imagen comprobado, `nosniff` y caché `no-store`.

Las portadas requieren autenticación y acceso al paralelo, al ciclo disponible para inscripción o a una práctica asignada/histórica propia. Los logotipos de instituciones activas son recursos de identificación disponibles para usuarios autenticados; este acceso no permite consultar ni modificar el catálogo institucional privado.

Las imágenes se cargan con la sesión del usuario, y sus URLs temporales se liberan al cambiar de vista. Cambiar de paralelo borra cualquier selección de reemplazo que todavía no se haya guardado.

## Esquema y API

La migración aditiva es `V14__entity_cover_and_logo_images.sql`. El entorno local actual utiliza actualización de esquema por Hibernate; las instalaciones con migraciones gestionadas deben incorporar estos cambios mediante su proceso habitual. Las referencias son anulables, por lo que los registros anteriores no necesitan una imagen.

- `POST /api/courses`: JSON existente, o multipart con parte `data` JSON e `image` opcional.
- `PUT /api/courses/{id}/cover`: multipart con parte `image`.
- `DELETE /api/courses/{id}/cover`: quita la portada.
- `GET /api/courses/{id}/cover`: entrega la imagen al usuario autorizado.
- `POST /api/institutions` y `PATCH /api/institutions/{id}`: JSON existente, o multipart con `data` JSON e `image` opcional.
- `GET /api/institutions/{id}/logo`: entrega el logotipo activo.
- `DELETE /api/institutions/{id}/logo`: quita el logotipo con permisos de gestión.

No se cargaron imágenes en los registros reales automáticamente: cada creador puede elegirlas desde su formulario.
