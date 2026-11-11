<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          revision-portadas-logotipos-2026-11-01.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Portadas y logotipos opcionales — 2026-11-01.
-->

# Portadas y logotipos opcionales — 2026-11-01

> Informe de una ejecución específica. Sus conteos se conservan como evidencia histórica; consulte el [índice de pruebas](../../README.md) para localizar las revisiones posteriores.


Se implementó la elección de portada en el formulario de creación de paralelos y de logotipo en el de instituciones. Ambos admiten vista previa y selección opcional. Se muestran en tarjetas, encabezados y listados correspondientes; los registros anteriores conservan identificación predeterminada.

La creación con imagen utiliza multipart y una transacción compartida. Continúa admitiéndose JSON sin imagen. Se agregaron reemplazo y eliminación con permisos de gestión, lectura autorizada de portadas, lectura autenticada de logotipos activos y URLs versionadas. Los archivos se validan por tamaño, tipo real y declarado, dimensiones y decodificación completa. Se preserva el archivo validado para mantener calidad y orientación de imágenes JPEG.

## Validación

- Backend: 25 suites, 120 pruebas correctas, sin fallos, errores ni omitidas.
- Frontend: 27 suites, 95 pruebas correctas.
- Compilación de producción correcta.
- Chrome con API simulada: 102 rutas y 13 interacciones, sin errores JS ni desbordamientos detectados. Comprueba la carga autenticada de imágenes y la selección con vista previa en ambos formularios de creación.
- 67 contratos de documentos/jornadas sin rutas faltantes.
- `git diff --check` correcto.

Las nuevas pruebas verifican creación atómica, compatibilidad JSON sin imagen, lectura permitida y prohibida por ciclo/rol, reemplazo y eliminación, bloqueo de un director de otra carrera, imágenes vacías, demasiado grandes o de formato no permitido, contenido que no coincide con el MIME declarado y gestión autorizada del logotipo institucional. El frontend verifica payload multipart, validación de archivos, vista previa, quitar selección y liberación de URLs temporales.

Las pruebas del backend usan H2 con rollback; Chrome utiliza fixtures y no sube imágenes a registros reales. No se asignaron imágenes automáticamente a las prácticas existentes. La migración de esquema aditiva se entrega como V14; no se validó un despliegue de producción con Flyway.

- [Funcionamiento y API](../../../producto/portadas-y-logotipos.md).
- [Evidencia Chrome](../../evidencias/evidencia-qa-workspaces.json).
