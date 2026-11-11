<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          README.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta SGP · Estudio de interfaces.
-->

# SGP · Estudio de interfaces

Abre `index.html` directamente en tu navegador. No requiere instalación, servidor ni conexión a internet.

Esta carpeta es independiente de `FrontEnd` y `BackEnd`: contiene únicamente propuestas visuales en HTML y CSS y este documento. No modifica ni se conecta al sistema real. Los enlaces permiten recorrer las pantallas; los botones, filtros, campos, cargas y descargas son ilustrativos. Los campos se muestran en lectura y las listas deshabilitadas para evitar confundirlos con un formulario operativo.

## Contenido

- `index.html`: galería organizada en acceso, práctica, documentos y gestión.
- `cobertura.html`: matriz de los 26 casos de uso y sus fuentes.
- `pantallas/`: 34 pantallas independientes, algunas correspondientes a distintas vistas del mismo caso.
- `assets/estilos.css`: diseño compartido, adaptable a escritorio y móvil, con estilos de impresión.

## Criterio de diseño

Verde profundo, papel cálido, tipografía editorial y jerarquía clara. Acciones junto al contexto, estados con texto además de color, retroalimentación vinculada a la sección y con autor visible, y expedientes organizados por documento. Los datos, nombres de personas e instituciones son ficticios; las ilustraciones de aula están hechas con CSS y no son evidencias reales.

## Referencias y límites

Se toma la numeración CU-001 a CU-026 de `../docs/requisitos/especificacion.md`, junto con la navegación, páginas y módulos documentales del frontend. El diagrama `diagrama-casos-de-uso.puml` usa otra agrupación de 21 casos; no se altera ninguna de estas fuentes.

Son reinterpretaciones estáticas, no exportaciones exactas de React ni especificaciones de nuevos permisos. Cada pantalla representa un rol de ejemplo; la galería cruza roles solo para facilitar la revisión. La recuperación administrativa representa una función condicional, deshabilitada por defecto en el sistema. No se incluyen claves ni datos reales.
