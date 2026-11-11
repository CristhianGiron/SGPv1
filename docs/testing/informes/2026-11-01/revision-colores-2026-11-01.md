<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          revision-colores-2026-11-01.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Colores de acciones — 2026-11-01.
-->

# Colores de acciones — 2026-11-01

> Informe de una ejecución específica. Sus conteos se conservan como evidencia histórica; consulte el [índice de pruebas](../../README.md) para localizar las revisiones posteriores.


Se aplicaron intenciones compartidas a botones, menús y confirmaciones: azul para operaciones de registro/consulta, verde para resultados positivos, ámbar para revisión y cambios de estado, rojo para eliminación y restricción de acceso. Las acciones ambiguas admiten una intención explícita; cancelar una inscripción se distingue de cerrar un diálogo.

Se añadieron acentos por área a las tarjetas de trabajo, franjas por estado a las prácticas y un indicador junto al texto de los estados. Atrasos y faltas justificadas tienen su color y etiqueta correspondientes. Las paletas institucionales no cambian el significado de las acciones.

Validación ejecutada:

- 26 suites frontend, 92 pruebas correctas.
- Compilación de producción correcta.
- 144 comprobaciones de colores computados en Chrome: cuatro intenciones, tres variantes de control, tres paletas, dos modos y estados normal/hover. Contraste mínimo medido 5,2:1. También se verificó identidad de los colores de acción entre paletas.
- 100 rutas y 11 interacciones de navegación en Chrome con fixtures aislados, sin errores JS ni desbordamientos detectados.
- `git diff --check` correcto.

Las muestras de contraste evalúan texto/fondo de controles con CSS de producción. No constituyen una auditoría completa de accesibilidad. Las pruebas de navegación utilizan datos simulados y no escriben en la API ni en la base local.

- [Reglas de color](../../../producto/colores-de-acciones.md).
- [Resultados de contraste](../../evidencias/evidencia-colores-acciones.json).
- [Recorridos de pantallas](../../evidencias/evidencia-qa-workspaces.json).
