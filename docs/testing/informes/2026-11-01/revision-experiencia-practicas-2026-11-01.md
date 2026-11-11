<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          revision-experiencia-practicas-2026-11-01.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Experiencia de trabajo por práctica.
-->

# Experiencia de trabajo por práctica

> Informe de una ejecución específica. Sus conteos se conservan como evidencia histórica; consulte el [índice de pruebas](../../README.md) para localizar las revisiones posteriores.


Cambios implementados en el frontend React y un endpoint de lectura en el backend. Los prototipos HTML no se modificaron.

## Recorrido

1. Abrir una práctica desde **Mis prácticas** o desde el paralelo correspondiente.
2. El resumen ofrece **Tu siguiente paso**, con prioridad para observaciones recibidas, borradores o revisiones pendientes según el rol. Una práctica histórica ofrece consulta.
3. Consultar documentos visibles, tiempo realmente asistido, próximas jornadas e historial. Los eventos anteriores se despliegan bajo demanda.
4. Los documentos se completan mediante pasos y revisión final. **Ver formulario completo** permite trabajar con todos los campos visibles a la vez.
5. Los tutores consultan el contenido junto a la retroalimentación, organizada en apartados desplegables. En móvil ambas secciones se apilan.
6. **Jornadas y asistencias** ofrece agenda semanal y conserva la gestión o tabla de registros. Dirección de institución usa su endpoint específico.
7. Los listados paginan resultados. En los listados con filtros se pueden elegir columnas y guardar vistas de filtros en **Mis vistas de filtros**. Las acciones permanecen visibles y al menos una columna de datos debe conservarse.

## Persistencia y precisión

- La copia automática es **local al navegador**, separada por cuenta, módulo, práctica y registro. Cubre documentos, planificaciones y constructores de entrevistas/fichas. Nunca se presenta como guardado en el servidor.
- Recuperar requiere una acción expresa; la copia no reemplaza automáticamente datos recién consultados. Un guardado satisfactorio en el servidor elimina la copia correspondiente. Los PDF deben seleccionarse otra vez después de recuperar el texto.
- Hay advertencia ante navegación con cambios pendientes, incluida navegación por hash, y al cerrar o recargar la página. Si el navegador impide almacenar datos se muestra el error.
- Las vistas de filtros también son locales y se separan por cuenta y sección/práctica. Las preferencias no amplían permisos ni consultan endpoints adicionales.
- El progreso expresa apartados con registros, **no aprobación de la práctica**. Las ausencias justificadas no suman minutos asistidos. Una consulta fallida produce un resumen parcial con valores no disponibles; no se interpreta como ausencia de documentos.
- La agenda presenta jornadas reales, dentro de las fechas de vigencia. No inventa plazos de entrega.
- El historial combina fechas disponibles de documentos con eventos persistidos de conclusión, reapertura y archivo. Los documentos existentes aportan sus últimas fechas; esto no reconstruye revisiones antiguas que nunca se almacenaron.
- `GET /api/enrollments/{id}/history` exige autenticación, un rol admitido y pertenencia/asignación autorizada a la práctica. No introduce nuevas tablas ni modifica registros existentes.
- Las prácticas sin portada no reservan un bloque decorativo vacío. La guía de completitud permanece dentro del formulario, con pendientes desplegables.

## Validación

- Frontend: 115 pruebas en 36 suites de pruebas de componentes y utilidades, incluyendo recuperación, separación por cuenta, fallos de almacenamiento, navegación cancelada, pasos, filtros, columnas, paginación y resumen parcial.
- Backend: 121 pruebas, incluyendo acceso al historial propio/asignado, rechazo de prácticas ajenas y acceso anónimo.
- Producción: `npm run build`.
- Contratos de documentos/jornadas: 67 combinaciones de método/ruta compatibles.
- Navegador: `node docs/testing/qa/browser-workspaces.cjs` verifica 103 rutas, 13 interacciones y 46 barras de listados de seis roles con fixtures aislados.
- Flujos nuevos: `node docs/testing/qa/browser-practice-experience.cjs` verifica recuperación tras recarga, resumen parcial, agenda y tabla alternativa, revisión de ambos tutores y fuente autorizada de dirección de institución. Incluye geometría de escritorio y móvil.

Evidencias reproducibles: [evidencia-experiencia-practicas.json](../../evidencias/evidencia-experiencia-practicas.json), [evidencia-qa-workspaces.json](../../evidencias/evidencia-qa-workspaces.json). Los scripts de navegador interceptan todas las llamadas API; no validan la autorización del backend real ni escriben en su base de datos. La autorización se verifica con las pruebas de integración H2.
