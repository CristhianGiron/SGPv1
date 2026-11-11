<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          revision-visual-ux.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Revisión visual y de UX — 2026-11-06.
-->

# Revisión visual y de UX — 2026-11-06

## Alcance

Revisión del código de los componentes compartidos, formularios, navegación y listados, y ocho escenarios actuales en Chrome: resumen de práctica pendiente y edición de L.2, en 390 y 1440 píxeles, modos claro y oscuro, con altura de ventana de 1000 píxeles y API simulada. Se contrastaron patrones de errores y accesibilidad con fuentes primarias. No se modificó el comportamiento de la aplicación durante esta revisión.

Los recorridos comprueban geometría; la evaluación de jerarquía visual es una valoración de diseño. Todavía debe contrastarse con estudiantes y tutores usando tareas reales.

## Hallazgo principal

La identidad institucional, los bordes, iconos y superficies ya son consistentes. La siguiente iteración debería acercar las acciones y los campos al usuario, reduciendo cabeceras repetidas, mensajes simultáneos y espacio vertical en móvil.

En el caso de prueba L.2, el primer `textarea` comienza a unos **1303 px** desde el inicio en escritorio y **1663 px** en móvil, fuera de la primera ventana de 1000 px. Antes aparecen la descarga del expediente, el contexto de la práctica, el encabezado documental, las pestañas, el encabezado de edición, una confirmación de carga, el estado y las instrucciones. Son mediciones del escenario ficticio; no representan todos los documentos ni todas las configuraciones reales.

El resumen de práctica pendiente mide **3487 px** en móvil y **1974 px** en escritorio. En el código, los cuatro indicadores se apilan en una columna por debajo de 640 px y los accesos tienen una altura mínima móvil de 150 px. El contraste entre el espacio ocupado y la cantidad de información sugiere una oportunidad clara de compactación.

## Prioridades propuestas

| Prioridad | Hallazgo | Cambio propuesto | Criterio de aceptación |
| --- | --- | --- | --- |
| Alta | Se acumulan varias cabeceras y mensajes antes de los campos. | Unificar contexto y título del documento, compactar las pestañas, convertir la explicación del autoguardado en ayuda desplegable y retirar confirmaciones rutinarias de carga. Mover la descarga del expediente al área de acciones de la práctica. | En los escenarios de prueba, el primer campo editable resulta visible en la primera ventana de escritorio y queda próximo al encabezado en móvil. |
| Alta | Las acciones del formulario quedan al final del contenido. | Una barra de acciones adaptada a la pantalla, con Guardar borrador como acción principal, vista previa secundaria y estado de guardado breve. | Guardar resulta accesible durante la edición, sin cubrir el último campo ni el teclado móvil. Evitar repetir la misma acción en varias barras visibles. |
| Alta | Falta un patrón uniforme de errores por campo. `Field` representa relaciones mediante un texto visual y `EntitySelect` no recibe una asociación accesible desde ese patrón. | Asociar etiquetas y controles, mensajes específicos bajo el campo, resumen de errores con enlaces y foco en el primer problema. Distinguir errores de datos y fallos del servicio. | Cada control tiene nombre accesible; el resumen dirige al campo correcto y conserva lo escrito. |
| Media | Indicadores y accesos ocupan mucho recorrido móvil. | Cuadrícula 2×2 para indicadores breves y filas compactas para accesos, manteniendo título, estado y destino. | Se reduce la altura respecto del escenario de 3487 px, con texto íntegro y objetivos táctiles cómodos. |
| Media | Los listados generales utilizan tablas anchas y muchas acciones de herramienta. | Presentación móvil con información esencial por registro, filtros agrupados y una acción primaria visible; conservar todas las columnas en escritorio. | Identificar un registro, conocer su estado y abrirlo sin depender de recorrer columnas horizontalmente. |
| Media | Hay tamaños de 10–11 px en navegación secundaria, encabezados de tabla y estados. | Revisar escala tipográfica, contraste de textos secundarios y paletas claro/oscuro. Proponer objetivos de 44×44 px para acciones táctiles frecuentes. | Medir los pares reales de colores, comprobar zoom, teclado y lectura en móvil. No inferir conformidad solo por la apariencia. |
| Media | La navegación distingue “Mis prácticas” e “Inscripción y prácticas”, con contexto repetido en varias zonas. | Usar etiquetas orientadas a tarea y una ruta contextual compacta: práctica, documento y estado. | En una prueba con usuarios se distingue dónde trabajar y dónde solicitar una inscripción, sin explicación externa. |

## Orden recomendado

Primero, simplificar la cabecera documental y acercar las acciones. Después, compactar el resumen móvil y mejorar la validación de campos. Finalmente, revisar listados, textos secundarios y navegación con el mismo lenguaje visual institucional.

Probar estas tareas con estudiantes y tutores: continuar un borrador, interpretar un estado observado, localizar una corrección, previsualizar el PDF y enviar a revisión. Registrar finalización, errores, retrocesos y solicitudes de ayuda antes y después de la iteración. Las comprobaciones técnicas de geometría deben acompañar esta validación de uso.

## Evidencias y referencias

- [Mediciones de los ocho escenarios](../../evidencias/revision-ux/resultado.json).
- [Edición L.2, escritorio](../../evidencias/revision-ux/light-form-1440.png).
- [Edición L.2, móvil](../../evidencias/revision-ux/light-form-390.png).
- [Resumen móvil](../../evidencias/revision-ux/light-pending-390.png).
- [GOV.UK: resumen de errores](https://design-system.service.gov.uk/components/error-summary/) y [errores junto al campo](https://design-system.service.gov.uk/components/error-message/): vincular el problema con la respuesta que puede corregir el usuario.
- [W3C: contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): 4.5:1 para texto normal y 3:1 para texto grande, con las excepciones del criterio.
- [W3C: tamaño mínimo de objetivos](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): el criterio AA establece 24×24 px o sus excepciones; 44×44 px es aquí una propuesta de comodidad para acciones frecuentes, no una descripción del mínimo AA.

[Diseño académico](../../../producto/diseno-academico.md) · [Índice de informes](../README.md).
