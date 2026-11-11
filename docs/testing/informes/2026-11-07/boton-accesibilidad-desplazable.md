<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          boton-accesibilidad-desplazable.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Botón de accesibilidad desplazable.
-->

# Botón de accesibilidad desplazable

Revisión del 7 de noviembre de 2026. El acceso de accesibilidad se puede arrastrar con mouse o dedo y mover con teclado. La posición personalizada se conserva como proporciones del área visible, para adaptarse al tamaño de ventana y orientación. El botón conserva su forma circular de 50×50 px y sus funciones de apertura.

## Comportamiento

- Un umbral de movimiento distingue el arrastre de un clic o toque. Soltar tras arrastrar no abre el panel.
- El toque táctil se reconoce al finalizar el gesto. Así funciona también inmediatamente después de un arrastre, cuando Chrome puede suprimir el clic de compatibilidad.
- El puntero se captura para conservar el arrastre al salir del botón. Los gestos cancelados vuelven a la posición previa.
- Las coordenadas se limitan al área visible, considerando sus bordes y las áreas seguras del dispositivo. Se recalculan al cambiar la ventana o el viewport visual.
- Las flechas mueven el botón 10 px; con Mayús, 40 px. Enter y espacio mantienen la apertura nativa.
- El panel se abre hacia la esquina correspondiente a la ubicación elegida y conserva sus límites de pantalla.
- **Restaurar posición del botón** elimina la preferencia de ubicación y recupera la separación inicial respecto a las acciones fijas del editor. Conserva los otros ajustes de accesibilidad.
- El almacenamiento bloqueado no impide mover el botón; el panel explica que la ubicación no se guardó.

## Verificación

- Compilación de producción correcta.
- Suite completa: **52 suites y 183 pruebas aprobadas**.
- Pruebas de arrastre frente a clic, gesto cancelado, restauración tras remontar, desplazamiento por teclado, límites, almacenamiento bloqueado, independencia de los ajustes y toque inmediatamente posterior al arrastre.
- **72 comprobaciones sin errores** en Chrome con entrada de mouse y táctil emulada: 320, 390 y 1440 px, modos claro y oscuro. Se comprueba persistencia al recargar, redimensionado a 280×480 px, límites, foco al cerrar, posición original y separación de las acciones del editor.
- Regresión del panel: **46 comprobaciones sin errores**, incluyendo texto al 200 %, filtros de color, lectura en voz alta simulada, teclado y diálogos anidados.

Los recorridos utilizan una API aislada y eventos táctiles emulados en Chrome, sin enviar datos al backend real. No sustituyen una prueba en teléfonos físicos ni una auditoría completa de accesibilidad.

## Reproducción y evidencia

Después de compilar `FrontEnd`:

```bash
node docs/testing/qa/browser-movable-accessibility.cjs
node docs/testing/qa/browser-accessibility-widget.cjs
```

- [Resultado de movimiento](../../evidencias/accesibilidad-movil/resultado.json).
- Botón reubicado: [móvil](../../evidencias/accesibilidad-movil/light-390-boton.png), [escritorio](../../evidencias/accesibilidad-movil/light-1440-boton.png).
- Panel reubicado: [móvil](../../evidencias/accesibilidad-movil/dark-390-panel.png), [escritorio](../../evidencias/accesibilidad-movil/dark-1440-panel.png).
- [Regresión de accesibilidad](../../evidencias/accesibilidad/resultado.json).
- [Guía de uso](../../../producto/accesibilidad.md).

[Volver a informes](../README.md).
