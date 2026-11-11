<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          reorganizacion-aplicada.md
  @fecha         2026-11-11 10:36:39
  @nota          Documenta Reorganización aplicada al proyecto.
-->

# Reorganización aplicada al proyecto

Fecha: 11 de noviembre de 2026. Se aplica la revisión de [estructura y nombres](estructura-directorios.md) conservando los flujos de asignación administrativa, trabajo del estudiante y autorización del backend.

## Cambios realizados

### Frontend por funcionalidad

Las páginas, componentes específicos, estilos y pruebas ahora se agrupan en `FrontEnd/src/features/`. Las áreas son acceso, cuentas, catálogos, paralelos, instituciones, prácticas, documentos, entrevistas/observación, edición compartida de registros, jornadas, notificaciones, evidencias, reportes e inicio.

`app/` reúne la composición general y el layout. Los controles visuales reutilizables permanecen en `components/ui/`, y los formularios compartidos, en `components/forms/`. El menú de cuenta y las preferencias acompañan a cuentas; la agenda acompaña a jornadas. La autenticación y las notificaciones conservan sus contextos/hooks en su funcionalidad.

Se adoptan las [convenciones del proyecto](../../../desarrollo/estructura-proyecto.md): componentes y páginas en PascalCase, páginas con sufijo `Page`, utilidades sin JSX con extensión `.js` y tests junto a sus fuentes. El registro se llama `RegisterStudentPage.jsx`, coincidiendo con su componente exportado. El paquete npm se identifica como `sgp-frontend`.

### División de responsabilidades

| Entrada pública | Líneas antes | Líneas después | Responsabilidades separadas |
| --- | --- | --- | --- |
| `EndpointConsole.jsx` | 3.262 | 99 | Coordinación de módulos, estado y operaciones, vista, revisión, filtros, completitud y selección de evidencias |
| `DataInspector.jsx` | 1.591 | 129 | Aprobaciones, cronología, tablas académicas y presentación del detalle |
| `PracticeFormsPage.jsx` | 1.949 | 649 | Constructor, detalle/respuestas, tabulación y gráficos, configuración y construcción de payloads |
| `PdfExportService.java` | 3.080 | 303 | Renderizadores de actividades cumplidas, seguimiento, evaluación y documento general; primitivas de diseño compartidas |

Los números incluyen las cabeceras institucionales de cada entrada. La reducción corresponde a código distribuido en módulos con propósito propio, no a funcionalidad eliminada. No se impone un máximo arbitrario de líneas al resto de los servicios o vistas.

`EndpointConsole` conserva su export público y coordina `console/EndpointModule.jsx` con `console/useEndpointWorkspace.jsx`. Los módulos derivados se importan de forma explícita; se comprobó que su separación no introduce ciclos entre ellos. `DataInspector` mantiene los exports usados por sus consumidores. Los métodos públicos y records de `PdfExportService` permanecen disponibles en su paquete nuevo.

### Backend

Se agrupan incidencias (`practiceincident`), versiones (`documentversion`) y plazos (`practicedeadline`) dentro de las capas correspondientes. Los DTO conservan su pertenencia al contexto de asignación en `dto/enrollment/`. La generación PDF ocupa `service/pdf/`; sus pruebas de representación, `src/test/java/.../service/pdf/`.

Se actualizaron imports, nombres cualificados y sondas documentales. Las pruebas que cruzan varios servicios permanecen en el paquete de servicios cuando necesitan su acceso de paquete, sin ampliar métodos internos únicamente para facilitar un traslado.

Las entidades conservan nombres de tabla y contratos de persistencia. Las migraciones SQL no cambiaron de ubicación ni de contenido. El nombre y la descripción del módulo Maven identifican ahora al backend del SGP.

### Herramientas e índices

- QA tiene un manifiesto y lockfile propios en `docs/testing/qa/`, con Puppeteer declarado e instalación reproducible mediante `npm ci`.
- `runtime.cjs` comparte la ubicación del build y del ejecutable Chrome. Todos los scripts de navegador y el capturador de bitácora usan esa configuración.
- El verificador de contratos recorre subdirectorios de controladores; el verificador documental también los reconoce y excluye dependencias instaladas.
- Los índices de informes y paquetes de evidencias incluyen las entregas recientes. Se actualizaron las guías de desarrollo y ejemplos de imports.
- El [mapa de rutas](../../../desarrollo/reorganizacion-rutas.json) registra el destino de las fuentes trasladadas. Las huellas y rutas guardadas en evidencias históricas conservan su significado original.
- El ZIP original de la bitácora se trasladó, byte a byte, a `docs/entregas/bitacora-proyecto-2026-11-10.zip`, con su carácter de entrega congelada documentado.
- Las capturas duplicadas que sustentan informes autocontenidos y las copias del logotipo necesarias para cada construcción se conservan. Se documentó su política de mantenimiento en lugar de deduplicar por igualdad de bytes.
- Las cabeceras mantienen únicamente a Cristhian; el índice de metadatos refleja las rutas nuevas. Los auxiliares regenerables de LaTeX quedan excluidos de Git.

## Validación

| Comprobación | Resultado |
| --- | --- |
| Backend completo | 252 casos: 250 aprobados y 2 optativos de MariaDB omitidos en esa ejecución; cero fallos y errores |
| MariaDB temporal, por separado | 2 pruebas aprobadas; esquema V27, actualización desde V20 y arranque del backend con sus consultas |
| Frontend | 59 suites y 212 pruebas aprobadas |
| Compilación de producción | Correcta |
| Chrome con API simulada | 36 comprobaciones: 18 de incidencias/versiones/plazos, 12 de sesiones/entrevistas/continuidad y 6 de borradores/PDF/expediente |
| Instalación de QA desde lockfile | `npm ci` con caché sin conexión: correcta |
| Contratos estáticos | 68 combinaciones comprobadas, sin rutas ausentes |
| Organización | Destinos del mapa existentes, paquetes Java correspondientes a sus directorios y migraciones versionadas sin cambios de bytes |
| Documentación y cabeceras | Verificadas; sin errores de enlaces, cabeceras ni espacios finales |

La [evidencia de esta reorganización](../../evidencias/estructura-organizacion-2026-11-11/resultados.json) incluye los registros y huellas de fuentes. Los recorridos de navegador utilizan datos ficticios; no equivalen a una sesión contra la base operativa. Las pruebas del backend se ejecutaron desde una copia temporal para evitar que DevTools recargase y migrase la instalación abierta. No se modificó la base operativa durante esta reorganización.

Persisten avisos de Browserslist antiguo, algunos avisos React `act` en pruebas aprobadas y advertencias de dependencias del backend ya presentes. No se actualizaron bibliotecas funcionales para reorganizar las fuentes.

[Índice de informes](../README.md). [Guía del entorno QA](../../qa/README.md).
