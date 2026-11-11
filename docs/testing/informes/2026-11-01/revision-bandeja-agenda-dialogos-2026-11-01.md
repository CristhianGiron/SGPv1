<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          revision-bandeja-agenda-dialogos-2026-11-01.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Mejoras de bandeja, agenda y diálogos.
-->

# Mejoras de bandeja, agenda y diálogos

> Informe de una ejecución específica. Sus conteos se conservan como evidencia histórica; consulte el [índice de pruebas](../../README.md) para localizar las revisiones posteriores.


Se revisaron las pantallas React y componentes compartidos. Esta entrega se concentra en información pendiente, programación semanal y uso de formularios con teclado. No cambia el backend ni los permisos por rol.

## Cambios

- **Notificaciones:** bandeja con pestañas Sin leer/Todas/Leídas, búsqueda por título y contenido sin distinguir acentos, agrupación por fecha y carga progresiva de veinte avisos. El estado vacío permite limpiar la búsqueda o consultar lo leído. Actualizar y marcar todo como leído comparten la barra de búsqueda; el envío de avisos sigue reservado a administración.
- **Acciones de notificación:** se bloquea el doble clic mientras se procesa una notificación, se informa del fallo y se puede reintentar. La página y la campana no navegan si falla el marcado como leído. Los títulos largos se ajustan al ancho disponible y las fechas inválidas no muestran texto técnico.
- **Agenda:** presentación semanal o en lista, búsqueda por estudiante/paralelo/lugar, horarios ordenados, día actual destacado y estados de asistencia con sus colores semánticos. Cada asistencia corresponde exclusivamente a su período programado. Una jornada pasada sin registro se muestra como tal; no se interpreta automáticamente como falta. El resumen de próximas jornadas omite períodos ya terminados hoy. Se contemplan semanas que cruzan de año.
- **Diálogos y confirmaciones:** escribir no reinicia el foco cuando cambia el callback del formulario. Tab y Mayús+Tab permanecen en el diálogo superior. Escape cierra únicamente la ventana superior. Al cerrarla se recupera el foco anterior y el bloqueo de desplazamiento se conserva mientras haya otra ventana abierta. Los títulos de los diálogos tienen identificadores únicos.
- **Estados vacíos:** componente compartido con título, explicación, icono contextual y acción opcional; se mantiene la compatibilidad con las pantallas existentes.

## Verificación

- Pruebas de componentes y utilidades: filtros de bandeja, agrupación por fechas, permisos de anuncio, reintento tras fallo, marcado masivo confirmado, asociación de asistencia, cambio de vista de agenda, próximos períodos y manejo de foco/diálogos anidados.
- Compilación optimizada del frontend.
- `docs/testing/qa/browser-inbox-agenda.cjs`: revisión de bandeja, agenda, búsqueda, marcado masivo y escritura en diálogos; capturas de escritorio, móvil y modo oscuro. Todas las peticiones API y WebSocket están simuladas.
- `docs/testing/qa/browser-practice-experience.cjs`: regresión de los flujos existentes de resumen, borradores, tutoría y agenda.
- `docs/testing/qa/browser-workspaces.cjs`: navegación y barras de listados de los seis roles.

La revisión de navegador utiliza fixtures locales y no envía avisos ni modifica datos del sistema real. Las preferencias de presentación de agenda y los filtros se conservan durante el uso de la pantalla; no modifican la programación ni la asistencia.

Resultado de esta entrega: **128 pruebas frontend en 40 suites aprobadas**, compilación de producción correcta, **103 rutas de seis roles**, 13 interacciones y 46 comprobaciones de barras de listados sin errores. Las 11 comprobaciones de regresión de la experiencia de prácticas y las 8 comprobaciones de bandeja/agenda también finalizaron sin errores.

Evidencias: [evidencia-bandeja-agenda.json](../../evidencias/evidencia-bandeja-agenda.json), [evidencia-experiencia-practicas.json](../../evidencias/evidencia-experiencia-practicas.json) y [evidencia-qa-workspaces.json](../../evidencias/evidencia-qa-workspaces.json). Las capturas de la ejecución se guardan en `/tmp/sgp-bandeja-*.png` y `/tmp/sgp-agenda-*.png`.
