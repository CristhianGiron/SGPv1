<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          diseno-academico.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Interfaz académica: diseño general.
-->

# Interfaz académica: diseño general

La actualización del 4 de noviembre de 2026 aplica un criterio visual compartido a la navegación, las páginas de gestión, los formularios, las tablas, los documentos, las entrevistas y las ventanas de diálogo. Los controles mantienen sus nombres, permisos y flujos.

## Criterio visual

- Navegación en azul tinta, con grupos discretos y una señal dorada para la ubicación activa. La identidad institucional usa la configuración existente; el logo UNL conserva el archivo original y solo aparece para esa universidad.
- Superficies claras, bordes finos y elevación moderada. El contenido tiene prioridad sobre fondos decorativos y colores de categoría.
- Encabezados de página más definidos, descripciones de ancho limitado y espaciado consistente. Se mantiene la pila de fuentes local del sistema, sin descargar fuentes externas.
- Tarjetas de acceso con iconos uniformes; tablas con encabezados neutros, filas legibles y números alineados; campos y botones con radios y alturas consistentes.
- Los colores de éxito, advertencia y error conservan su significado. Se mantienen los temas claro/oscuro y las tres paletas de acento disponibles.
- El acceso conserva el campus, el logo, el encabezado azul y la separación dorada solicitados previamente. Se actualizan el espaciado y los controles del formulario.

Las referencias de criterio son la [jerarquía y legibilidad de HarvardSites](https://designsystem.harvardsites.harvard.edu/typography-options) y la [consistencia de identidad en el entorno académico de Stanford](https://identity.stanford.edu/digital/web-design/). No se utilizan sus marcas ni se replica una aplicación suya.

## Navegación y accesibilidad

El [panel de accesibilidad](accesibilidad.md) se abre desde un botón circular con indicador de preferencias. Sus grupos de tamaño, contraste, lectura y navegación se adaptan al móvil y permiten recorrido completo por teclado, cierre con Escape y restauración de preferencias. El panel comparte el control de foco con los diálogos y el menú móvil.

La iteración de UX del 6 de noviembre compacta el contexto de práctica y los encabezados documentales, desplaza las instrucciones a ayuda desplegable y reúne las acciones del editor en una barra con espacio propio. Los listados usan una presentación de registros en móvil y tablas en escritorio. Los textos secundarios y estados tienen tamaños revisados; los enlaces del modo oscuro utilizan el acento claro para conservar contraste sobre paneles oscuros. El acceso del estudiante a la gestión de solicitudes se denomina **Inscripciones**.

La búsqueda de pantallas puede abrirse con **Ctrl+K** o **Cmd+K**. El campo recibe el foco y Escape cierra la búsqueda. El atajo no interrumpe un diálogo modal abierto. Continúan disponibles el menú móvil, el menú contraíble, el enlace para saltar al contenido, la navegación de teclado y los estados de foco.

La capa visual `FrontEnd/src/styles/academic.css` se limita a pantalla: las reglas de impresión de documentos y entrevistas se conservan. Las transiciones respetan la preferencia de movimiento reducido.

## Comprobación

- Pruebas de los componentes y páginas existentes, con cobertura adicional del atajo de búsqueda.
- Compilación de producción con las advertencias de lint tratadas como errores.
- `node docs/testing/qa/browser-academic-design.cjs`: recorre cinco pantallas en 320, 390, 768 y 1440 píxeles, en ambos temas; comprueba desbordamiento, búsqueda de teclado, menú móvil y contraste del texto de identidad en el menú. Usa un servidor local con respuestas ficticias y bloquea conexiones externas.
- `node docs/testing/qa/browser-login-institucional.cjs`: conserva las comprobaciones del acceso, identidad, errores, reintento, registro, temas y adaptación a pantallas pequeñas.

Las capturas y resultados de la revisión general están en [evidencias de diseño académico](../testing/evidencias/diseno-academico/resultados.json). Los datos de las capturas son ficticios; no representan registros reales.

## Geometría y transiciones

Los avatares mantienen proporción 1:1 y no se comprimen en contenedores flexibles, tanto con fotografías como con iniciales. Su recorte circular y `object-fit: cover` conservan la forma sin depender del tamaño de la imagen original.

Las tarjetas resaltan mediante borde, color y sombra interior. No cambian su tamaño ni se desplazan al pasar el cursor, evitando recortes dentro de secciones con `overflow` limitado. El selector de evidencias sigue el mismo criterio.

Los avisos compartidos ocupan su propio espacio dentro de cada sección y ajustan el texto al ancho disponible. Los mensajes informativos, advertencias y errores permanecen hasta cerrarlos; las confirmaciones de éxito se ocultan automáticamente a los tres segundos. Cada aviso mantiene su icono y botón de cierre sin comprimirse. El contenido interior de las tarjetas permite mostrar los bordes, sombras e indicadores de foco de sus hijos; las tablas conservan sus áreas de desplazamiento.

Los menús de acciones abiertos en un diálogo se montan dentro de la capa de ese diálogo, por encima del panel y dentro de su límite de navegación por teclado.

[Regresión de recortes y avisos](../testing/evidencias/avisos-recortes/resultado.json): 24 escenarios en Chrome, con solicitudes pendientes, formularios documentales y errores extensos, en ambos temas y anchos de 360, 390, 768 y 1440 píxeles.

El panel lateral y los márgenes del contenido y de la barra superior comparten duración y curva de transición. Las etiquetas conservan un ancho estable, se desvanecen al contraer y permanecen en el DOM para evitar saltos por reacomodo de texto. Los submenús animan su altura; el contenido oculto queda fuera de la navegación de teclado mediante `inert`. La preferencia de movimiento reducido desactiva estas transiciones.

`node docs/testing/qa/browser-motion-regressions.cjs` mide los avatares en filas con poco espacio, la geometría de las tarjetas antes y después de hover, los límites de los iconos y la sincronización del menú durante cada fotograma. Usa nombres largos, imágenes ficticias, ambos temas y tamaños móvil/escritorio. Las capturas se toman después de medir para evitar que la captura de página completa altere el estado del navegador. [Resultados y capturas](../testing/evidencias/movimiento-interfaz/README.md).
