<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          revision-flujo-practicas-2026-11-01.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Validación del flujo por práctica — 2026-11-01.
-->

# Validación del flujo por práctica — 2026-11-01

> Informe de una ejecución específica. Sus conteos se conservan como evidencia histórica; consulte el [índice de pruebas](../../README.md) para localizar las revisiones posteriores.


La entrada del sistema cambia de un panel de módulos a prácticas y asignaciones. Estudiantes abren una práctica; tutores y dirección abren un paralelo y después la práctica del estudiante. La directora de institución recibe una entrada con sus tareas institucionales. El resumen de indicadores permanece accesible a supervisores.

Los módulos operativos comparten el contexto de la práctica seleccionada: documentos, evidencias, entrevistas, observaciones, planificaciones y jornadas. El menú principal conserva los accesos generales y administrativos por rol; los enlaces antiguos siguen disponibles para notificaciones y marcadores.

## Resultado

- Frontend: 21 suites, 60 pruebas correctas.
- Compilación de producción correcta, sin advertencias de ESLint. Browserslist informa que sus datos de navegadores tienen seis meses de antigüedad.
- Chrome con respuestas simuladas: 78 rutas y 10 interacciones para los seis roles; sin errores de JavaScript ni desbordamientos horizontales detectados.
- 67 contratos de documentos/jornadas comprobados sin rutas faltantes.
- `git diff --check` correcto.

Las pruebas verifican selección de prácticas, apertura de paralelos/estudiantes, selección de documentos, filtrado por identificador de práctica en todos los recursos operativos, rechazo local de envíos con otra inscripción, rechazo de detalles de otra práctica, ocultación de creación/carga/borrado en consulta histórica, rechazo de secciones ajenas al rol y prácticas desconocidas. Se corrigió un desbordamiento transitorio de la barra superior al cambiar a anchura móvil.

La autorización del servidor se mantiene. El contexto del frontend delimita el trabajo dentro de resultados ya autorizados; no sustituye los permisos del backend. Este cambio no modificó entidades, datos ni endpoints del backend. La navegación de Chrome utiliza fixtures aislados, no una sesión contra datos de producción.

## Reproducción y evidencia

Desde `FrontEnd`: `CI=true npm test -- --watchAll=false --runInBand` y `npm run build`.

Desde la raíz del repositorio: `node docs/testing/qa/browser-workspaces.cjs` y `node docs/testing/qa/check-contracts.cjs`.

- [Resultados de Chrome](../../evidencias/evidencia-qa-workspaces.json).
- [Guía del flujo](../../../producto/flujo-por-practica.md).
