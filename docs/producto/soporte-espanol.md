<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          soporte-espanol.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Caracteres en español.
-->

# Caracteres en español

La interfaz, las solicitudes JSON y las respuestas HTTP usan UTF-8. Los textos visibles incluyen tildes, ñ, ü y signos de apertura; los identificadores de la API y los valores de enumeraciones conservan sus contratos originales.

## Documentos PDF

La exportación normaliza el texto a Unicode NFC antes de medirlo y dibujarlo. Esto permite exportar tanto «evaluación» escrita normalmente como la misma palabra pegada desde un editor que separa la letra y su acento. Se conservan los días MIÉRCOLES y SÁBADO, los nombres propios y la puntuación española, además de comillas tipográficas, guiones y puntos suspensivos.

Las fuentes estándar del PDF cubren estos caracteres; este soporte no incluye alfabetos arbitrarios ni emojis.

## Configuración y datos

- Maven compila las fuentes y recursos de texto en UTF-8.
- Spring usa `spring.servlet.encoding.*` para el texto HTTP y UTF-8 para los scripts SQL.
- Las conexiones MySQL de los perfiles `dev` y `prod` declaran `characterEncoding=UTF-8` y `connectionCollation=utf8mb4_unicode_ci`.
- Los nombres institucionales predeterminados de `application.properties` usan escapes Unicode: su lectura no depende de que el cargador interprete los bytes como UTF-8 o ISO-8859-1. La codificación HTTP es una configuración distinta.
- Al iniciar el servidor con la inicialización institucional habilitada, se reparan nombres de universidad, facultad y carrera que coincidan exactamente con versiones de los valores configurados mal decodificadas como ISO-8859-1 o Windows-1252 (hasta dos veces). Se conservan los identificadores, las relaciones y los nombres personalizados. No se reactivan registros inactivos o eliminados.
- No se cambia automáticamente la codificación de tablas existentes ni se reescriben otros datos previamente dañados.

## Comprobación

Las pruebas del cliente comprueban JSON, formularios con imágenes y búsquedas. Las pruebas de integración comprueban guardar y recuperar preguntas y nombres en español mediante HTTP y persistencia H2. Las pruebas de exportación extraen el texto de PDF verticales y horizontales, incluidos acentos pegados en formato descompuesto. La configuración de conexión no equivale a una validación del esquema de una base MySQL externa.

La regresión de nombres institucionales comprueba además el enlace real de `application.properties`, la respuesta de `/api/public/institutional-defaults` y la reparación persistida de los valores sembrados anteriormente. Para aplicar la corrección a un proceso que ya estaba ejecutándose, reiniciar el backend y recargar el navegador.

[Volver a producto](README.md).
