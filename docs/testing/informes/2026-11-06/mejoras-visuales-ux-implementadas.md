<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          mejoras-visuales-ux-implementadas.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Mejoras visuales y de UX implementadas — 2026-11-06.
-->

# Mejoras visuales y de UX implementadas — 2026-11-06

## Resultado

Se implementaron las prioridades de la [revisión visual y de UX](revision-visual-ux.md): contexto documental compacto, acciones de guardado al alcance, errores asociados a campos, resumen móvil más corto, listados adaptables y legibilidad revisada.

- La práctica conserva una ruta compacta, datos desplegables y un menú de acciones que incluye la descarga del expediente. El encabezado del documento concentra el título y la ayuda.
- La edición reúne las acciones en una barra sticky, fuera del contenedor de la tarjeta, con espacio propio y estado de autoguardado. El control de accesibilidad queda por encima de la barra en móvil.
- Los datos de completitud y la ayuda de guardado son desplegables; las confirmaciones rutinarias de carga ya no ocupan una alerta sobre los campos.
- Los errores DTO conservan el mensaje general y añaden un mapa por rutas de campo, incluidos elementos de colecciones. El cliente documental muestra resumen enlazado, nombres accesibles y descripción del error en el control. Se conserva el contenido y se revela el formulario completo cuando se necesita corregir otro paso.
- Los indicadores móviles se distribuyen en dos columnas; los accesos tienen menor altura.
- Los listados compartidos presentan registros en móvil y tablas en escritorio, conservando filtros, paginación y acciones. Los campos adicionales se despliegan bajo demanda.
- Se revisaron tamaños de encabezados de tabla, estados y textos secundarios, y se corrigió el contraste de enlaces en modo oscuro. La navegación de estudiantes distingue **Inscripciones** de **Mis prácticas**.

## Comparación medida

Escenarios con los mismos datos ficticios del L.2 y del resumen de práctica pendiente, en ventanas de 1000 px de alto. El primer campo medido es un `textarea`; la posición es su distancia desde el inicio de la página, no un tiempo de tarea.

| Medida | Antes | Después |
| --- | --- | --- |
| Primer campo del L.2, 1440 px de ancho | 1303 px | 701 px |
| Primer campo del L.2, 390 px de ancho | 1663 px | 754 px |
| Altura del resumen pendiente, 390 px | 3487 px | 2883 px |

La reducción del espacio anterior al primer campo es aproximadamente del 46% en escritorio y del 55% en móvil para estos escenarios. Una copia pendiente de recuperar o un error añaden deliberadamente información antes de continuar la edición.

## Verificación

- **49 suites y 158 pruebas frontend aprobadas**.
- **142 pruebas backend aprobadas**, incluida la respuesta de validación con rutas de campos y preguntas anidadas.
- Compilación de producción aprobada.
- **16 escenarios Chrome** de práctica pendiente y formulario, ambos temas, anchos de 360, 390, 768 y 1440 px. Se verifica ausencia de desbordamiento, espacio de edición visible, acciones sin cubrir y separación del control de accesibilidad.
- Validación HTTP simulada en Chrome: se conserva el texto, el enlace del resumen mueve el foco al campo y editarlo retira su error anterior.
- Muestras de contraste de encabezados, cuerpo, texto secundario y enlaces sobre paneles en las tres paletas y ambos temas: mínimo observado **5.12:1**. Es una comprobación de esas muestras, no una certificación de toda la interfaz.
- **6 escenarios de listados**: búsqueda y apertura de cuenta en móvil y escritorio, ambos temas.
- **6 comprobaciones del flujo documental**: autoguardado, recuperación entre contextos aislados, conflicto de edición, PDF previo, geometría móvil y expediente.
- **113 rutas de roles y 3 interacciones de navegación**, sin errores de navegador.
- Revisión visual de la edición móvil y validación documental sin errores.

Los navegadores usan API simulada; las autorizaciones y la persistencia se comprueban mediante las pruebas de integración H2. La validación con estudiantes y tutores en tareas reales sigue siendo el siguiente paso para medir la usabilidad percibida.

## Evidencias

- [Mediciones del editor y contraste](../../evidencias/mejoras-ux/resultado.json).
- [Editor móvil](../../evidencias/mejoras-ux/light-form-390.png) y [escritorio](../../evidencias/mejoras-ux/light-form-1440.png).
- [Listados: resultados](../../evidencias/mejoras-ux/listados.json) y [captura móvil](../../evidencias/mejoras-ux/listado-light-390.png).
- [Recorrido documental](../../evidencias/borradores-pdf-expediente/resultado.json).
- [Navegación por roles](../../evidencias/evidencia-qa-navegacion.json).

Scripts: [editor y contraste](../../qa/browser-ux-improvements.cjs), [listados](../../qa/browser-mobile-records.cjs), [borradores/PDF/expediente](../../qa/browser-drafts-preview-archive.cjs) y [rutas](../../qa/browser-routes.cjs).

[Experiencia de trabajo](../../../producto/experiencia-de-trabajo.md) · [Diseño académico](../../../producto/diseno-academico.md) · [Índice QA](../README.md).
