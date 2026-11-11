<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          correcciones-auditoria.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Correcciones de la auditoría integral.
-->

# Correcciones de la auditoría integral

Fecha: 7 de noviembre de 2026.

Se implementaron correcciones para los diez hallazgos reproducidos en la [auditoría integral](auditoria-integral.md). La evidencia original se conserva; las comprobaciones posteriores se guardan en [correcciones-2026-11-07](../../evidencias/correcciones-2026-11-07/).

| Hallazgo | Cambio aplicado | Comprobación |
| --- | --- | --- |
| F01 | Cadena única V1–V20, integración Flyway de Spring Boot 4 y baseline productivo explícito | Migraciones en MariaDB temporal y arranque con validación estricta del esquema |
| F02 | Regla común de escritura: inscripción aprobada, sin archivo y paralelo activo. Aplicada en documentos L, planificaciones, entrevistas/observaciones, evidencias, horarios y asistencia, incluidas sus revisiones | Regresiones HTTP de rechazo en archivo; pruebas existentes de servicios y permisos |
| F03 | La misma regla impide crear y modificar registros académicos con el paralelo inactivo | Creación de planificación en paralelo inactivo devuelve HTTP 400 |
| F04 | Se exige que la asistencia esté dentro de las fechas del horario, tanto al registrar como al editar | Fecha fuera del intervalo devuelve HTTP 400 |
| F05 | Se comprueba el contenido independientemente del MIME declarado; JPEG/PNG se decodifican con límite de píxeles, WebP/HEIF se comprueban como contenedores | Texto disfrazado de imagen y MIME incorrecto rechazados; JPEG/PNG reales admitidos |
| F06 | Se distinguen campos omitidos y campos enviados explícitamente como null; se preserva cero en el formulario | Borrado de períodos, semanas y fechas; conservación de campos omitidos y aceptación de cero |
| F07 | Carga completa de páginas para cuentas, instituciones, paralelos, pertenencias de perfil y selectores/catálogos; se mantienen filtros y autorización | Persona 205 aparece en búsqueda a 390 y 1440 px; pruebas de paginación y fallo de páginas posteriores |
| F08 | La posición predeterminada de accesibilidad evita avisos y acciones fijas al desplazarse o cambiar la página; la posición elegida por el usuario conserva prioridad | 24 combinaciones de avisos, formularios, tamaños y temas sin recortes |
| F09 | Visor con nombre accesible, foco contenido, restauración de foco, Escape por nivel y bloqueo de desplazamiento compartido | Foto → accesibilidad → Escape conserva la foto; segundo Escape cierra y desbloquea, en móvil y escritorio |
| F10 | ResourceInput propaga la asociación entre etiqueta y control, también en casillas y relaciones | 132 estados contextuales de pantallas/modales, sin entradas sin nombre accesible |

## Validación y alcance

| Verificación final | Resultado |
| --- | --- |
| Backend, ejecución normal | 158 pruebas aprobadas, 0 fallos; 1 prueba SQL optativa omitida |
| Prueba SQL optativa | Aprobada por separado: 20 migraciones, validación, segunda ejecución sin cambios y arranque automático desde otra base vacía |
| Frontend | 187 pruebas aprobadas en 53 suites |
| Build de producción | Aprobado |
| Avisos y recortes | 24 comprobaciones aprobadas |
| Botón móvil de accesibilidad | 72 comprobaciones aprobadas |
| Visor y diálogos anidados | Aprobado a 390 y 1440 px, con restauración de foco y desplazamiento |
| Búsqueda de registro 205 | Aprobada a 390 y 1440 px |
| Contextos de pantallas/modales | 132 estados, 0 errores y 0 controles sin nombre accesible |

Los resultados se adjuntan en `backend-pruebas.json`, `backend-pruebas.log`, `frontend-pruebas.log`, `frontend-build.log`, `migraciones-mariadb.log`, `contextos-modales.json`, `visor-modales.json`, `limite-listados.json`, `clipping/resultado.json` y `accesibilidad-movil/resultado.json` dentro de la carpeta de evidencia enlazada arriba.

Las pruebas de backend usan H2 y transacciones de prueba. La prueba SQL adicional utiliza una instancia MariaDB temporal y eliminada al terminar. Las comprobaciones visuales ejecutan el build de producción en Chrome con API simulada, en tamaños móviles y de escritorio. No se ejecutaron migraciones ni modificaciones sobre los datos reales.

La validación de JPEG/PNG incluye decodificación; para WebP/HEIF el JDK no dispone de decodificador y se validan estructura, tipo y límites del contenedor. Esto rechaza texto u otros formatos camuflados, pero no equivale a comprobar íntegramente sus códecs. Las posiciones personalizadas del botón de accesibilidad permanecen bajo control del usuario y pueden superponerse al contenido.

Antes de desplegar sobre una base existente hay que comparar su historial Flyway con la numeración descrita en [configuración de entornos](../../../desarrollo/configuracion-entornos.md). La prueba de base vacía no demuestra compatibilidad automática con historiales divergentes ni sustituye una prueba con una copia del esquema real. El test de arranque SQL usa el dialecto de MariaDB; la configuración productiva MySQL se mantiene.

## Reproducción

Desde la raíz del proyecto:

```bash
cd FrontEnd
CI=true npm test -- --watchAll=false --runInBand
npm run build
```

Desde `BackEnd`: `./mvnw test`. La clase `MigrationChainMariaDbTest` se omite en este comando; se ejecuta mediante `python3 docs/testing/qa/check-migrations-isolated.py` desde la raíz.

Los scripts `browser-modal-audit.cjs`, `browser-audit-data-cases.cjs` y `browser-clipping-regressions.cjs` de `docs/testing/qa/` verifican los defectos concretos. `browser-screen-audit.cjs --contexts` y `browser-movable-accessibility.cjs` aceptan `SGP_QA_OUTPUT` para conservar la evidencia histórica.
