<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          avisos-tarjetas-recortes.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Avisos y tarjetas sin recortes — 2026-11-06.
-->

# Avisos y tarjetas sin recortes — 2026-11-06

## Cambios

El componente `Alert` usaba posición fija y un índice de capa alto desde el interior de las secciones. Sus avisos podían coincidir entre sí o quedar recortados por contenedores y por la barra superior. Ahora se muestran en el flujo de su sección, con texto adaptable y espacio reservado. Los avisos informativos y advertencias conservan sus acciones hasta que el usuario los cierra. Las confirmaciones de éxito mantienen el cierre automático.

Se eliminó el recorte general del cuerpo interior de `SectionCard`, que podía cortar sombras, bordes y focos de sus hijos. Los límites de tablas y áreas de desplazamiento siguen controlados por sus propios componentes.

Los menús de acciones abiertos en un diálogo se montan en su capa y quedan dentro del recorrido de foco. Se comprobó mediante interacción con el componente compartido.

## Validación

- Frontend: 48 suites y 155 pruebas aprobadas.
- Compilación de producción aprobada.
- 24 escenarios Chrome: solicitud pendiente con su acción, formulario dentro de tarjetas y error con una referencia extensa; modos claro y oscuro, anchos de 360, 390, 768 y 1440 píxeles.
- Las mediciones verifican bordes cubiertos mediante `elementFromPoint`, recorte por ancestros, solapamiento entre avisos y desbordamiento horizontal.
- 48 comprobaciones adicionales de avatares, hover de tarjetas, transiciones del menú lateral y movimiento reducido, sin errores.
- Revisión visual de la captura móvil del aviso de solicitud pendiente.

Los recorridos del navegador utilizan API simulada y datos ficticios. No se modificaron servicios ni datos del backend.

## Evidencias

- [Script de regresión](../../qa/browser-clipping-regressions.cjs).
- [Mediciones de los 24 escenarios](../../evidencias/avisos-recortes/resultado.json).
- [Solicitud pendiente en móvil](../../evidencias/avisos-recortes/light-pending-390.png).
- [Formulario en escritorio](../../evidencias/avisos-recortes/light-form-1440.png).
- [Mediciones de movimiento](../../evidencias/movimiento-interfaz/resultados.json).

Reproducir con `CI=true npm test -- --watchAll=false --runInBand` y `CI=true npm run build` en `FrontEnd`. Después, desde la raíz: `node docs/testing/qa/browser-clipping-regressions.cjs` y `node docs/testing/qa/browser-motion-regressions.cjs`.

[Diseño académico](../../../producto/diseno-academico.md) · [Índice de informes](../README.md).
