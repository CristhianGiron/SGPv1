<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          revision-barras-listados-2026-11-01.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Barras de búsqueda y acciones — 2026-11-01.
-->

# Barras de búsqueda y acciones — 2026-11-01

> Informe de una ejecución específica. Sus conteos se conservan como evidencia histórica; consulte el [índice de pruebas](../../README.md) para localizar las revisiones posteriores.


Se unificó la distribución de las acciones de listado mediante `ListToolbar`, compartido por `FilterPanel`, las tablas genéricas y los listados documentales.

- Documentos: crear/listar/enviados y otras bandejas comparten la barra con Buscar, Filtros y Limpiar; ya no quedan separados en el encabezado.
- Catálogos: Agregar y Actualizar pasan del encabezado de tarjeta a la barra de búsqueda de la tabla.
- Usuarios, instituciones, paralelos, archivo y evidencias usan la misma distribución mediante el panel de filtros compartido.
- Prácticas y estudiantes institucionales agrupan búsqueda, estado y acciones de actualización/gestión.
- Planificaciones, entrevistas y territorio trasladan las acciones de sus listados junto a la tabla. Las acciones propias de formularios y registros permanecen en su contexto.
- Las pestañas de navegación quedan separadas de la fila de búsqueda y acciones, evitando que compitan por el espacio.

La búsqueda tiene un máximo de 26 rem (416 px con la configuración actual) en escritorio y puede reducirse según el espacio disponible. Los controles comparten un mínimo de 44 px y se alinean por la parte inferior. En móvil, la búsqueda ocupa su fila y los botones se distribuyen en filas siguientes. La barra permanece disponible durante la carga de tablas vacías.

También se corrigió la etiqueta Filtros (0) que aparecía cuando solo estaba activa una búsqueda de texto; Limpiar sigue habilitado en ese caso.

## Verificación

- Frontend: 29 suites, 98 pruebas correctas.
- Compilación de producción correcta.
- Chrome con API simulada: 103 rutas, 13 interacciones y 46 comprobaciones geométricas de barras, sin errores detectados. En escritorio se comprobó el límite del buscador y la alineación de la base de los botones con la búsqueda.
- La revisión incluye una captura de L.6 con el botón Enviados en la barra de búsqueda y un registro de ejemplo.
- 67 contratos de documentos/jornadas sin rutas faltantes; `git diff --check` correcto.

Las nuevas regresiones comprueban agrupación y funcionamiento de búsqueda/limpieza/filtros, acciones disponibles durante la carga y la ubicación de Enviados en L.6. No se modificaron servicios, permisos ni datos del backend.

Evidencia de navegación y mediciones: [evidencia-qa-workspaces.json](../../evidencias/evidencia-qa-workspaces.json). Las comprobaciones de Chrome utilizan fixtures, sin conectarse a la API real.
