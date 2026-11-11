<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          accesibilidad.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Preferencias de accesibilidad.
-->

# Preferencias de accesibilidad

El botón circular de accesibilidad comienza en la esquina inferior izquierda, con separación del borde y de las acciones del editor. Puedes arrastrarlo con el mouse o el dedo para colocarlo en otro lugar. Su icono tiene un área de 50×50 px y un indicador muestra los ajustes activos o la lectura en curso. Al pasar el cursor o darle foco aparece la etiqueta **Accesibilidad**.

## Mover el botón

Un clic o toque abre las herramientas. Arrastrar el botón cambia su posición sin abrirlas. La posición se guarda en este navegador y se adapta al cambiar el tamaño de la ventana o la orientación, manteniendo el botón dentro del área visible. El panel se abre hacia la esquina correspondiente a la posición elegida.

También puedes enfocar el botón con Tab y usar las flechas del teclado. Con Mayús y flechas se mueve más rápido; Enter o espacio abre las herramientas. En el panel, **Posición del botón → Restaurar posición del botón** devuelve la ubicación original sin borrar los demás ajustes. La ubicación original vuelve a respetar las acciones fijas del editor en móvil.

## Panel

El panel agrupa las preferencias en tamaño, contraste, lectura y navegación. En móvil se adapta al ancho disponible y permite desplazar sus opciones, manteniendo visibles el encabezado, el cierre y **Restablecer ajustes**. Los controles principales tienen áreas táctiles de al menos 44 px de alto.

- Tamaño del contenido entre 80% y 200%, con porcentaje visible y controles para aumentar y disminuir.
- Contraste original, alto contraste, fondo claro o colores invertidos. Solo un modo de contraste puede estar activo a la vez.
- Fuente legible, enlaces subrayados, escala de grises y reducción de movimiento mediante interruptores con estado accesible.
- Lectura en voz alta, con velocidad, pausa, continuación y detención cuando el navegador dispone de estas funciones. Lee la selección de texto o el contenido principal; si hay otro diálogo abierto, usa ese diálogo. La disponibilidad de voces depende del navegador y del sistema operativo.

Los filtros de color se aplican mediante una capa visual sin interceptar clics. Así se conserva la posición de los menús y controles fijos. El panel mantiene sus colores legibles durante los ajustes. Las preferencias de pantalla no modifican la maquetación de impresión.

## Teclado y preferencias

Al abrir el panel, el foco permanece dentro de él. Escape y el botón de cierre devuelven el foco al botón de accesibilidad o al diálogo que estaba abierto. Los diálogos ocultos no participan en el recorrido. La animación respeta la preferencia de movimiento reducido del dispositivo y el ajuste del panel.

Las preferencias se guardan en el navegador con la clave existente `accessibility-widget-settings`. Se conservan las configuraciones anteriores; los valores fuera de rango se limitan y los contrastes incompatibles se normalizan. Si el almacenamiento está bloqueado, los controles siguen funcionando durante la sesión y el panel informa que no pudo guardar.

La posición se conserva por separado en `sgp-accessibility-position`, como proporciones de la pantalla. Si no se puede guardar, el cambio permanece durante la sesión y se informa en el panel.

Restablecer detiene la lectura y devuelve los valores predeterminados, manteniendo el panel abierto para comprobar el resultado.

[Diseño académico](diseno-academico.md) · [Experiencia de trabajo](experiencia-de-trabajo.md).
