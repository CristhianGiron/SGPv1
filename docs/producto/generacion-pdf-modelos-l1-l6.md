<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          generacion-pdf-modelos-l1-l6.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Generación de PDF según los modelos L.1–L.6.
-->

# Generación de PDF según los modelos L.1–L.6

Comparación realizada con los seis PDF facilitados el 4 de noviembre de 2026. Sus nombres, cédulas, textos narrativos, fechas y calificaciones son ejemplos: no se incorporan como datos de estudiantes del sistema.

## Formato

Los seis modelos cuentan también con [vista previa y descarga del expediente](experiencia-de-trabajo.md#vista-previa-y-expediente). La vista previa lleva una marca y puede consultarse antes de aprobar; la descarga definitiva mantiene los requisitos del documento correspondiente.

- **L.1 y L.2:** portada con el logo original de la UNL, facultad, carrera, titulación, recuadro gris, estudiante, tutor asignado, ciclo y período. Las páginas interiores llevan el encabezado institucional pequeño. La información general se divide entre estudiante e institución; presentación y objetivos tienen secciones independientes. L.1 incluye metodología, actividades, conclusiones, recomendaciones y elaboración/aprobación. L.2 incluye actividades, cronograma horizontal, recursos y legalización.
- **L.3:** sin portada UNL. Utiliza exclusivamente el membrete que se adjunta al propio informe. Conserva información general, antecedentes, objetivo, actividades, conclusiones, recomendaciones, fecha y firma del tutor institucional. El membrete se repite al cambiar de página.
- **L.4–L.6:** páginas A4 horizontales, encabezado UNL, datos de práctica, tablas y firmas. L.4 mantiene la escala alto/medio/bajo; L.5 incluye observaciones; L.6 incorpora la fotografía y el enlace de las evidencias JPG/PNG almacenadas en el sistema para esa inscripción.
- Las actividades extensas continúan en otra página y repiten los encabezados necesarios. El cronograma ajusta la altura al contenido y distribuye más de 18 semanas en bloques de columnas.

La maquetación reproduce la estructura de los modelos; la cantidad de páginas y el ajuste de texto dependen del contenido real. Se mantienen las fuentes estándar del generador, por lo que pueden existir diferencias tipográficas respecto de las fuentes incrustadas en los originales.

## Revisión de los datos requeridos

Esta es una auditoría del recorrido de los datos por formularios, API, entidades y exportación. No certifica que todos los registros existentes de la base de datos estén completos.

| Documento / dato del modelo | Fuente dentro del sistema | Resultado |
| --- | --- | --- |
| Todos: nombres, cédula, correo y teléfono del estudiante | Persona de la cuenta; los documentos conservan los datos personales copiados al crearlos/actualizarlos | Ya se obtenían; se conectaron a la información general de los PDF correspondientes. |
| Todos: ciclo | Ciclo del paralelo o su asignatura; ciclo de la cuenta como último recurso | Corregido: se estaba imprimiendo el nombre del paralelo en el lugar del ciclo. |
| L.1, L.2, L.4–L.6: período académico | Fechas de inicio y fin del paralelo | Corregido: en L.4–L.6 se estaba copiando el nombre del ciclo como período. Los clientes antiguos pueden enviar el período si faltan las fechas del paralelo. |
| L.1–L.3: carrera y titulación | Carrera del ciclo; nuevo campo `degreeTitle` en la gestión de carreras | La carrera existía; la titulación no se almacenaba de forma independiente. Ahora puede registrarse y aparece en la información general. |
| L.1, L.2: tutor académico y asignatura de su firma | Tutor de prácticas y asignatura del paralelo | Se usa el tutor asignado y la asignatura real; no se confunde con el último usuario revisor/director. |
| L.1–L.3, L.6: tutor institucional | Tutor del grupo de la inscripción, con compatibilidad para asignaciones antiguas del paralelo | Se usa la asignación de la práctica. |
| L.1–L.3: institución, AMIE y dirección | Datos institucionales copiados en el documento | Ya se obtenían. |
| L.1–L.3: parroquia, cantón, provincia, niveles educativos, sostenimiento; régimen y modalidad donde corresponda | Catálogo de instituciones | Existían, pero se omitían al exportar. Ahora se incluyen. Estos datos complementarios se consultan al generar el PDF. |
| L.2: número de docentes y estudiantes | Catálogo de la institución | Existían y se incluyen en el PDF. |
| L.2: misión, visión y valores | Datos institucionales copiados al plan | Ya se obtenían; se integraron en la información general del modelo. |
| L.2: unidad curricular, asignatura, proyecto integrador y tipo de práctica | Datos del paralelo/asignatura copiados al plan | Ya se obtenían; se incorpora también la denominación de la asignatura, omitida antes. |
| L.1 y L.2: presentación, objetivo general y específicos | Formularios y objetivos del paralelo copiados al documento | Se exportan en secciones independientes, con sus valores reales. |
| L.1: metodología, conclusiones y recomendaciones | Formulario L.1 | Ya se obtenían. Se presentan como párrafos y viñetas. |
| L.1–L.3: semanas, fechas y actividades | Filas semanales del documento y calendario del paralelo | Ya se obtenían; se corrigió el desbordamiento de filas extensas. |
| L.2: cronograma y recursos legales, humanos, tecnológicos y físicos | Formulario L.2 | Ya se obtenían; cronograma horizontal y filas de altura variable. |
| L.3: membrete | Imagen adjuntada por quien completa el formulario L.3 | No existía. Añadido a creación/edición y a la sección que completa el tutor institucional. |
| L.3: horas realizadas | Total de minutos del L.6 de la misma inscripción; el tutor puede registrar o ajustar horas y minutos | No se exportaban. Ahora se muestran y el total se conserva al aprobar. No se usan las horas de supervisión del L.5. |
| L.3: fecha del informe | Campo nuevo en el formulario institucional; fecha de aprobación como alternativa al exportar | Antes solo se imprimía una línea vacía. |
| L.3: conclusiones y recomendaciones | Sección del tutor institucional | Ya se obtenían. Al abrir el formulario se cargan los valores guardados, sin sustituirlos por ejemplos. |
| L.4: tipo de práctica, modalidad, criterios, niveles, puntajes, horas, porcentaje y fecha | Formulario L.4 y datos del paralelo | Ya se obtenían. El formulario propone cuatro criterios generales y cuatro específicos adaptables, sin precalificar. |
| L.5: fecha de visita, inicio, fin, duración, actividades supervisadas y total | Sesiones del formulario L.5; duraciones calculadas | Ya se obtenían. Se mantiene el total de supervisión separado de las horas de práctica. |
| L.5: observaciones | Campo `observations` de cada sesión | Existía en API y entidad, pero no estaba en el formulario. Ahora puede completarse. |
| L.6: fecha, inicio, fin, minutos, actividades, total, fecha de entrega y firmantes | Formulario L.6 y asignación de tutores | Ya se obtenían. |
| L.6: imagen y enlace de evidencia | Fotografías de la misma inscripción y enlace guardado en cada actividad | Antes se imprimía solo el enlace. Ahora las imágenes JPG/PNG del sistema también se incrustan. Los enlaces externos y formatos no compatibles conservan el enlace. No se descargan archivos de direcciones externas al exportar. |
| Tratamientos profesionales de ejemplo, como «Lic.» o «Mgtr.» | No existe un campo independiente en Persona | No se inventan ni se deducen del rol; se imprime el nombre registrado. |
| Firmas manuscritas y sellos | Espacios de legalización en los PDF | No se obtienen imágenes de firmas ni se presenta la aprobación del sistema como firma electrónica. Se conservan los espacios del modelo. |

Es necesario completar los catálogos reales (especialmente titulación, ubicación y características institucionales, asignatura y fechas del paralelo). Que el campo exista no implica que un registro antiguo tenga valor. Los textos del modelo no sustituyen información faltante.

## Membrete del L.3

El selector está en el formulario del estudiante y en **Acciones → Guardar comentarios institucionales** del tutor institucional. Permite elegir una imagen JPG/PNG, previsualizarla, guardar junto con los datos y reemplazarla mientras el informe sea editable. Máximo 4 MB, 4096 píxeles por lado y 16 megapíxeles; se valida el contenido real en el servidor. No se usa el logotipo del catálogo de instituciones como sustituto del membrete.

La aprobación requiere un membrete y un total de horas, además de las conclusiones y recomendaciones que ya exigía el flujo. Los informes antiguos ya aprobados que no tengan membrete ofrecen al tutor **Adjuntar membrete al L.3 aprobado**: permite completar esa imagen una sola vez sin modificar el contenido ni las decisiones de aprobación. El membrete solo puede consultarse con permiso para ver el informe.

API compatible con JSON y multipart:

- `POST /api/final-reports`: multipart con `data` JSON e `image` opcional.
- `PUT /api/final-reports/{id}`: multipart con `data` JSON e `image` opcional.
- `PATCH /api/final-reports/{id}/institutional-section`: JSON existente o multipart con `data` e `image` opcional. Añade `completedHours`, `completedMinutes` (0–59) y `reportDate`.
- `GET /api/final-reports/{id}/letterhead`: imagen con autorización del documento y caché `no-store`.
- `PUT /api/final-reports/{id}/letterhead`: multipart con `image`; únicamente para el tutor asignado de un informe aprobado antiguo que todavía no tenga membrete.

Los PDF originales facilitados por el usuario permanecen sin cambios. Las muestras de revisión usan datos ficticios.

## Esquema y comprobación

La migración aditiva `V15__final_report_letterhead.sql` agrega la referencia al membrete, minutos realizados, fecha del L.3 y titulación de la carrera. El entorno local con `ddl-auto=update` incorpora las columnas al iniciar el servidor; las instalaciones con migraciones gestionadas deben aplicar V14 antes de V15 por la tabla de imágenes.

La verificación cubre los servicios de los seis documentos, los endpoints documentales, carga multipart en el formulario, validación de imágenes, almacenamiento y reemplazo del membrete, acceso de otro estudiante, y PDF extensos. Las pruebas de maquetación verifican que el texto permanezca dentro de la página, que los marcadores finales no se pierdan y que el período académico permanezca en la portada. Para generar muestras ficticias puede ejecutarse `PdfReferenceLayoutTest` con la propiedad `pdf.preview.dir` apuntando al directorio de salida deseado.
