<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          contexto-y-tablas.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Formularios y tablas según contexto y usuario.
-->

# Formularios y tablas según contexto y usuario

Revisión del 7 de noviembre de 2026. Los formularios utilizan la práctica o jerarquía académica seleccionada. Las tablas reducen las columnas repetidas y presentan los datos secundarios mediante un diálogo. La vista global de revisión mantiene las identidades necesarias para distinguir registros.

## Alcance

Se aplica una política compartida a `DataTable`, con uso explícito de registros propios y contexto adicional. Dentro de una práctica se eliminan las columnas de estudiante y paralelo. Las fechas de creación, actualización, inscripción y archivo pasan a datos complementarios; cada módulo puede declarar otros campos secundarios. El selector de columnas permite recuperar esas columnas, manteniendo fuera las del contexto fijo.

Se adaptaron documentos y jornadas, planificaciones, entrevistas y observaciones, catálogos académicos, cursos e inscripciones, usuarios, instituciones, asistencia, archivo y colecciones de detalle. En los formularios de práctica se preserva la asociación enviada al servidor. Los selectores genéricos diferencian relaciones obligatorias de opcionales y eliminan la búsqueda adicional para listas pequeñas.

## Resultados

- Compilación de producción correcta.
- Suite completa: **52 suites y 178 pruebas aprobadas**.
- Pruebas de contexto: controles ocultos conservan la práctica enviada, catálogos conservan el padre al guardar, las relaciones opcionales siguen sin selección automática, las vistas globales mantienen las identidades y las columnas complementarias pueden volver a mostrarse.
- **38 comprobaciones sin errores** en Chrome con API simulada, móvil de 390 px y escritorio de 1440 px: estudiantes, tutores de prácticas, tutores institucionales y administración. Se verifica selección múltiple, asignación automática, conservación del ID en el guardado de planificación, columnas según contexto, consulta de datos secundarios, recuperación del foco, desplazamiento y ausencia de desbordamiento de página.
- Regresión de espacios de trabajo: **103 rutas de seis roles**, **13 interacciones** y **46 comprobaciones de barras de herramientas**, sin errores. Incluye filtrado de prácticas ajenas, prácticas históricas, rutas inexistentes y gestión de catálogos.

Los datos de navegador están simulados: estas comprobaciones no validan la autorización del servidor ni sustituyen la revisión con usuarios reales. No se modificaron endpoints ni permisos del backend en esta iteración.

## Reproducción

Después de compilar el frontend:

```bash
node docs/testing/qa/browser-contextual-records.cjs
node docs/testing/qa/browser-workspaces.cjs
```

- [Resultados de contexto](../../evidencias/contexto-y-tablas/resultado.json).
- [Regresión de espacios de trabajo](../../evidencias/evidencia-qa-workspaces.json).
- Más datos: [móvil](../../evidencias/contexto-y-tablas/datos-390.png), [escritorio](../../evidencias/contexto-y-tablas/datos-1440.png).
- Catálogo con contexto: [móvil](../../evidencias/contexto-y-tablas/catalogo-390.png), [escritorio](../../evidencias/contexto-y-tablas/catalogo-1440.png).
- Documento con contexto: [móvil](../../evidencias/contexto-y-tablas/documento-390.png), [escritorio](../../evidencias/contexto-y-tablas/documento-1440.png).

[Guía de producto](../../../producto/contexto-y-tablas.md). [Volver a informes](../README.md).
