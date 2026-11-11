<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          contexto-y-tablas.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Formularios y tablas según el contexto.
-->

# Formularios y tablas según el contexto

El sistema evita pedir decisiones que ya están determinadas por la pantalla actual. Los datos siguen formando parte del registro y de su envío al servidor.

## Formularios

- Dentro de una práctica, evidencias, documentos, jornadas y planificaciones conservan automáticamente esa práctica. No se muestra un selector para cambiar a otra.
- En la vista general se mantiene la selección cuando hay varias prácticas disponibles. En documentos, elegir una permite continuar el formulario; una única inscripción aprobada se asigna automáticamente.
- En entrevistas y observaciones se evita repetir el contexto académico ya visible. Las observaciones no preguntan quién responde, porque corresponde al estudiante. Si una entrevista solo tiene una persona habilitada para responder, se muestra su nombre; cuando hay varias se mantiene el selector.
- En los catálogos abiertos desde una universidad, facultad, carrera, ciclo o institución, la jerarquía seleccionada se conserva al guardar. El diálogo explica dónde se creará el registro y omite los campos del contexto fijo.
- En los selectores de entidades, las listas pequeñas utilizan un solo desplegable. La búsqueda adicional aparece con más de seis opciones. Una relación obligatoria con una sola opción se completa automáticamente y muestra el valor asignado. Las relaciones opcionales conservan la posibilidad de no elegir ninguna.

## Tablas

La presentación depende del trabajo que se realiza, no de cuántas veces se repite un valor en los resultados:

| Vista | Información principal | Información complementaria |
| --- | --- | --- |
| Práctica seleccionada | Documento o registro, estado y acciones autorizadas | Fechas de creación y otros datos secundarios; estudiante y paralelo ya aparecen en el contexto |
| Registros propios del estudiante | Registro, paralelo cuando hay varias prácticas, estado y acciones | Se omite la columna que repite al propio estudiante |
| Revisión global de tutores y dirección | Estudiante, paralelo, registro, estado y acciones | Fechas de auditoría en «Más datos» |
| Planificaciones | Título, paralelo fuera de una práctica, estado; autor y estudiante para revisión | Autor de la planificación en la vista del estudiante |
| Asistencia | Fecha, jornada prevista, registro, estado y tiempo | Día de la semana y observaciones |
| Archivo de prácticas | Paralelo, estudiante para supervisores, grupo, estado y situación de archivo | Tutores y fechas; los resúmenes agrupados conservan los totales |
| Catálogos académicos | Nombre, código, estado y acciones según permisos | Se omite la jerarquía del padre ya seleccionado |
| Usuarios | Usuario, nombre, estado y acceso al detalle | El rol permanece cuando ayuda a distinguir cuentas; las cuentas con roles adicionales siguen mostrándolos |

**Más datos** abre información complementaria sin cambiar el registro. En las tablas con configuración de columnas se pueden volver a mostrar los campos secundarios. Los campos eliminados por contexto no reaparecen en esa configuración. En móvil se conserva el formato de registros con sus acciones.

Las colecciones dentro del detalle de un documento mantienen la información adicional en «Más datos» y conservan visibles los campos de retroalimentación necesarios para revisar. Los identificadores técnicos no se utilizan como columnas principales.

Los filtros sin alternativas se omiten; las elecciones de filtrado ya activas siguen pudiendo limpiarse. Los colores de estado y las acciones disponibles conservan los permisos existentes.

[Validación](../testing/informes/2026-11-07/contexto-y-tablas.md). [Volver a producto](README.md).
