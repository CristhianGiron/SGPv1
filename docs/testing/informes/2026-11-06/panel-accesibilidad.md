<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          panel-accesibilidad.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Botón y panel de accesibilidad — 2026-11-06.
-->

# Botón y panel de accesibilidad — 2026-11-06

## Resultado

Se rediseñó el botón con forma circular de 50×50 px, separación del borde, etiqueta al recibir foco o pasar el cursor e indicador de preferencias activas. El panel usa grupos claros, opciones con estado accesible, controles táctiles de al menos 44 px y cierre/restablecimiento siempre disponibles.

Se conservó la clave de preferencias del navegador y se añadieron validación de valores, recuperación de configuraciones anteriores y manejo de almacenamiento bloqueado. Los contrastes son mutuamente excluyentes. El tamaño del contenido llega al 200%, con escala visible. El panel incluye reducción de movimiento y lectura con pausa, continuación y detención cuando la API del navegador está disponible.

Los filtros de color utilizan una capa visual que no intercepta clics ni transforma los contenedores del sistema. Las preferencias visuales se limitan a pantalla. El panel mantiene sus colores y tipografía propios durante los ajustes.

La navegación por teclado comparte el control de foco con los diálogos del sistema. Se excluyen los diálogos ocultos. El menú móvil utiliza el mismo control de foco y bloqueo de desplazamiento: Escape cierra primero el panel de accesibilidad y después el menú, evitando cierres simultáneos o desplazamiento bloqueado al terminar.

## Verificación

- **50 suites y 167 pruebas frontend aprobadas**.
- Compilación de producción aprobada, con advertencias de lint tratadas como errores.
- **46 comprobaciones Chrome** en los modos claro y oscuro, con anchos de 320, 390, 768 y 1440 px. Las ventanas móviles usan 844 px de alto.
- Botón circular separado de las acciones documentales; panel dentro del viewport y sin desbordamiento horizontal.
- Texto al 200%, filtros combinados, modos excluyentes y controles del panel utilizables.
- Tab permanece dentro del panel; Escape devuelve el foco; los diálogos y menús que quedan debajo conservan su estado y su bloqueo de desplazamiento.
- Lectura del contenido principal, pausa, continuación y detención con una API de voz simulada. Se comprueba que no se lea el propio panel ni el menú oculto. Las pruebas unitarias cubren también la ausencia de la API. No se afirma haber probado todas las voces o motores de voz de sistemas operativos reales.
- Preferencias conservadas al remontar el componente, normalización de valores antiguos, restauración y almacenamiento bloqueado.
- **16 escenarios del editor** sin desbordamientos ni acciones cubiertas.
- **113 rutas y 3 interacciones de navegación**, sin errores de navegador.
- Inspección visual de las capturas móvil y escritorio, con la animación terminada antes de capturar.

## Evidencias

- [Mediciones del panel](../../evidencias/accesibilidad/resultado.json).
- [Panel móvil claro](../../evidencias/accesibilidad/light-390.png) y [oscuro](../../evidencias/accesibilidad/dark-390.png).
- [Panel de escritorio](../../evidencias/accesibilidad/light-1440.png).
- [Regresión del editor](../../evidencias/mejoras-ux/resultado.json).
- [Navegación por roles](../../evidencias/evidencia-qa-navegacion.json).

Reproducir las pruebas con `CI=true npm test -- --watchAll=false --runInBand` y `CI=true npm run build` desde `FrontEnd`; después ejecutar [browser-accessibility-widget.cjs](../../qa/browser-accessibility-widget.cjs), `browser-ux-improvements.cjs` y `browser-routes.cjs` desde la raíz. Los recorridos usan datos ficticios y no modifican la base real.

[Uso de las preferencias](../../../producto/accesibilidad.md) · [Índice QA](../README.md).
