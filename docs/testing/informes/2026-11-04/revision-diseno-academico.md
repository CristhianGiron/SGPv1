<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          revision-diseno-academico.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Revisión de la interfaz académica.
-->

# Revisión de la interfaz académica

Fecha: 4 de noviembre de 2026.

## Resultado

Se actualizó la presentación compartida de navegación, encabezados, tarjetas, tablas, formularios, estados y diálogos. La identidad UNL utiliza los recursos originales y la configuración institucional existente. Los estilos nuevos se limitan a pantalla para conservar las reglas de impresión.

## Validación ejecutada

| Comprobación | Resultado |
| --- | --- |
| Pruebas React completas | 44 suites, 140 pruebas aprobadas |
| Compilación `CI=true npm run build` | Correcta |
| Revisión visual de cinco pantallas en cuatro anchos y dos temas, con interacciones adicionales | 70 comprobaciones, sin errores |
| Navegación por los roles configurados | 113 rutas y 3 interacciones, sin errores |
| Acceso institucional | 13 comprobaciones, sin errores |

Los anchos revisados son 320, 390, 768 y 1440 píxeles. La revisión incluye búsqueda con Ctrl+K, respeto del foco de los diálogos, menú móvil, contraste del texto de identidad del menú, listados, creación de usuarios y detección de desbordamiento horizontal. Las pruebas usan datos ficticios e interceptan las peticiones de API; no certifican datos ni conectividad del servidor real.

Durante la inspección se corrigieron el contraste de los textos de identidad en el menú móvil y un selector de redondeo que afectaba a bloques del menú. Las capturas finales corresponden a la compilación con esos ajustes.

[Galería de capturas](../../evidencias/diseno-academico/README.md) · [Resultados visuales](../../evidencias/diseno-academico/resultados.json) · [Criterio de diseño](../../../producto/diseno-academico.md).
