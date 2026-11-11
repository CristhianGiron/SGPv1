<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          apariencia-y-cuenta.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Cuenta y apariencia.
-->

# Cuenta y apariencia

El avatar de la barra superior abre **Cuenta y preferencias**, tanto en escritorio como en móvil. El panel organiza el nombre, correo y roles de la cuenta, el acceso a **Mi perfil**, las preferencias de apariencia y, al final, **Cerrar sesión**. La navegación móvil ofrece también **Cuenta y apariencia**.

## Modo de pantalla y paleta

Son decisiones independientes:

- **Claro** y **Oscuro** mantienen la elección aunque cambie el dispositivo.
- **Sistema** sigue la preferencia clara u oscura del dispositivo. Es el valor inicial cuando no hay una elección guardada.
- Las paletas **Azul académico**, **Grafito** y **Verde pizarra** muestran una vista previa y funcionan con cualquiera de los modos. Cada una cambia el fondo general, las superficies, los bordes, las cabeceras de tablas y la navegación lateral, además de los acentos. Azul académico utiliza tonos azulados; Grafito, grises ligeramente violáceos; Verde pizarra, verdes naturales. Los estados de error, advertencia y éxito conservan su significado.

Los cambios se aplican al instante, se guardan en el navegador y se sincronizan entre controles y pestañas. Se conservan las elecciones previas válidas. Si el navegador impide guardar, la selección continúa durante la sesión y el panel informa de ello.

## Interacción y accesibilidad

El panel permite navegación con teclado: Tab permanece dentro, Escape cierra y devuelve el foco al botón de apertura. Pulsar fuera también cierra. El contenido central puede desplazarse sin perder el cierre ni la acción de sesión. Las opciones de modo y paleta utilizan grupos de botones de radio nativos.

Los ajustes de accesibilidad se conservan al cambiar la apariencia. Cuando un ajuste de contraste o de color está activo, el panel explica que modifica los colores mostrados. Las herramientas de accesibilidad pueden abrirse sobre este panel y cerrarse sin cerrar la cuenta.

[Resultados de QA](../testing/informes/2026-11-06/cuenta-apariencia.md).

[Volver a producto](README.md).
