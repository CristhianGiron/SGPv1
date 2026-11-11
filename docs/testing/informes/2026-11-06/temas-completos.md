<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          temas-completos.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Temas con superficies y navegación propias.
-->

# Temas con superficies y navegación propias

Revisión del 6 de noviembre de 2026. Las paletas anteriores compartían el fondo, los paneles y el menú lateral azul fijo; el cambio se percibía principalmente en los acentos. Ahora cada una define superficies claras y oscuras, textos, bordes y navegación: Azul académico, Grafito y Verde pizarra. Los colores de estado y las claves de preferencias se conservan.

## Validación

- Compilación de producción correcta.
- 3 suites específicas de apariencia, preferencias y cuenta: **12 pruebas aprobadas**.
- Chrome con API simulada: **150 comprobaciones sin errores**, en 320, 390, 768 y 1440 px, con preferencia inicial clara y oscura.
- Se recorren las seis combinaciones de modo y paleta en cada resolución. Los valores calculados del fondo, superficie secundaria y navegación deben distinguir las tres paletas. Además se comprueba que los elementos renderizados de página, panel y menú lateral reciben los colores del tema.
- Se mide contraste de encabezados sobre fondo general, texto y texto secundario sobre panel, navegación y selección activa: mínimo 4.5:1 en los pares comprobados. No constituye una auditoría completa de accesibilidad.
- Se conserva la comprobación de modo automático, persistencia, teclado, texto al 200 % y convivencia con el panel de accesibilidad.

## Reproducción y capturas

Después de compilar el frontend:

```bash
node docs/testing/qa/browser-full-themes.cjs
```

La opción `--desktop` repite el recorrido de escritorio y guarda un resultado separado. Las capturas esperan el final de las transiciones.

- [Resultado completo](../../evidencias/temas-completos/resultado.json).
- Azul académico: [claro](../../evidencias/temas-completos/light-unl.png), [oscuro](../../evidencias/temas-completos/dark-unl.png).
- Grafito: [claro](../../evidencias/temas-completos/light-claro.png), [oscuro](../../evidencias/temas-completos/dark-claro.png).
- Verde pizarra: [claro](../../evidencias/temas-completos/light-bosque.png), [oscuro](../../evidencias/temas-completos/dark-bosque.png).

[Guía de cuenta y apariencia](../../../producto/apariencia-y-cuenta.md). [Volver a informes](../README.md).
