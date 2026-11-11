<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          README.md
  @fecha         2026-11-10 21:24:04
  @nota          Documenta Bitácora del proyecto SGP.
-->

# Bitácora del proyecto SGP

Documento académico con portada institucional, índice, contexto, ocho actores, 74 requisitos funcionales, 13 no funcionales, 26 casos de uso,
seis diagramas de casos de uso por rol, trazabilidad, cuatro capturas de interfaces,
cuatro secuencias resumidas (acceso, asignación, revisión y cierre con archivo)
y tres algoritmos comentados con fragmentos del código real.

- [Fuente editable en LaTeX](bitacora-proyecto.tex).
- [PDF de consulta](bitacora-proyecto.pdf).

Autor: Cristhian Hipólito Girón Chamba.

La edición 1.2 del 10 de noviembre de 2026 documenta las actividades, interfaces,
algoritmos y secuencias principales del proyecto. Distingue las reglas históricas del catálogo y la decisión
posterior de asignación administrativa de prácticas; también registra la diferencia
de numeración del diagrama general de casos de uso. No sustituye una aceptación funcional contra la instalación real.

## Compilación

Desde esta carpeta, ejecutar dos veces:

```bash
pdflatex -interaction=nonstopmode -halt-on-error bitacora-proyecto.tex
pdflatex -interaction=nonstopmode -halt-on-error bitacora-proyecto.tex
```

Para usar Overleaf, subir `bitacora-proyecto.tex` y la carpeta `imagenes/`,
conservando esa estructura, y seleccionar pdfLaTeX. Las imágenes se incluyen
desde esa carpeta con rutas relativas; se mantienen junto al documento. Las cuatro secuencias
permanecen en formato vectorial dentro del archivo; sus fuentes editables están
en `diagramas/`. No requiere PlantUML,
conexión de red ni `shell-escape`. Utiliza paquetes habituales
de TeX Live y Latin Modern. Activa Babel en español si está instalado; en una
instalación básica conserva los títulos en español sin depender de ese idioma.

Los seis diagramas por rol se conservan sin modificaciones en `imagenes/`.
Sus acciones son material de referencia y deben contrastarse con las diferencias
documentales registradas en la bitácora.

## Capturas y procedencia

Se eligen cuatro pantallas para ilustrar el recorrido principal, en dos páginas.
Las tres capturas nuevas usan el frontend compilado y API ficticia; no acceden a
la base real ni prueban conectividad con el backend. Se contrae el menú usando
su control de interfaz para mostrar el contenido completo.

| Archivo en `imagenes/` | Procedencia |
| --- | --- |
| `interfaz-login.png` | Copia íntegra de `../testing/evidencias/diseno-academico/light-1440-login.png`, revisión del 4 de noviembre de 2026 |
| `interfaz-asignacion.png` | Personal autorizado, asignación confirmada con estudiante ficticio; 10 de noviembre de 2026 |
| `interfaz-mis-practicas.png` | Estudiante, lista de prácticas habilitadas; 10 de noviembre de 2026 |
| `interfaz-resumen-practica.png` | Estudiante, resumen y seguimiento documental; 10 de noviembre de 2026 |

El script [capturar-interfaces.cjs](herramientas/capturar-interfaces.cjs) adapta
`../testing/qa/browser-staff-practice-assignment.cjs` a un escritorio de 1440 px.
Conserva ocho comprobaciones del recorrido, guarda las tres capturas y registra
sus resultados en [capturas-verificacion.json](capturas-verificacion.json).

Para reproducir desde `SGPv1/FrontEnd`, compilar con
`BUILD_PATH=/tmp/sgp-bitacora-build npm run build`. Desde esta carpeta, ejecutar:

```bash
SGP_QA_BUILD_PATH=/tmp/sgp-bitacora-build node herramientas/capturar-interfaces.cjs
```

Requiere las dependencias locales del frontend y Chrome. El acceso conserva su
captura histórica y no se regenera con este script.

## Secuencias y mantenimiento

Se incluyen solo cuatro modelos de síntesis. Las llamadas internas se agrupan y
las alternativas principales se describen al pie para evitar fichas extensas.
Las fuentes PlantUML de `diagramas/` son editables; el detalle original del login
sigue en `../requisitos/artefactos/diagrama-secuencia-login.puml`.

La asignación se contrasta con `PracticeOfferingController` y
`EnrollmentService.assignStudent`; el envío/revisión del plan de actividades con
`ActivityPlanController` y `ActivityPlanService.submit/review`; el cierre y archivo
con `EnrollmentController` y `EnrollmentService.complete/archive`. El plan de
actividades ejemplifica la revisión: otros documentos pueden tener etapas propias.

Para actualizarlo, revisar el catálogo y las relaciones contra `../requisitos/especificacion.md`. Si cambia un flujo,
actualizar tanto su PlantUML como la figura de LaTeX. Después, recompilar el PDF
dos veces para actualizar índice, figuras y paginación.

[Volver al índice documental](../README.md).

## Portada y algoritmos

La portada utiliza el logotipo original UNL de
`../../FrontEnd/src/assets/branding/unl-logo.png`, copiado sin modificar en
`imagenes/unl-logo.png`, sobre fondo blanco. El título y los datos académicos
se organizan en bloques con azul institucional y detalles dorados.

Los tres algoritmos ilustrados son las transiciones de revisión documental,
el solapamiento de asistencias y el control de revisiones de borradores.
Los extractos están incluidos en el LaTeX, con numeración de líneas de origen
y explicaciones breves. Se usa el paquete `listings`, sin `shell-escape`.
Al modificarlos, contrastar con los archivos Java y actualizar sus referencias.

La [entrega ZIP del 10 de noviembre](../entregas/bitacora-proyecto-2026-11-10.zip) se conserva como paquete histórico; las fuentes de esta carpeta pueden contener cambios posteriores.
