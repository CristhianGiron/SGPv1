<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          README.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Cabeceras institucionales del SGP.
-->

# Cabeceras institucionales del SGP

Los archivos propios que admiten comentarios incluyen la institución, carrera, asignatura, docente, proyecto, Cristhian Hipólito Girón Chamba con su correo institucional, nombre real del archivo, fecha y notas sobre su función. La sintaxis se adapta a Java, JavaScript/JSX, CSS, HTML/XML, Markdown, Python, propiedades, Docker y PlantUML.

La fecha identifica la incorporación de esta documentación, en la zona `America/Guayaquil`; no representa necesariamente la fecha original de creación del archivo. Las notas describen la responsabilidad del archivo y no sustituyen la documentación detallada de permisos o validaciones.

El [índice completo](cabeceras-archivos.json) contiene los mismos datos académicos compartidos y el registro individual de todos los archivos del proyecto incluidos por Git, tanto seguidos como nuevos no ignorados. Incluye sus rutas, fecha y notas. Para archivos con cabecera registra la huella del contenido fuera de la cabecera; para los demás registra la huella íntegra. El propio índice omite su huella para evitar una referencia circular.

Los siguientes recursos conservan sus bytes originales y reciben sus metadatos en el índice:

- JSON y datos CSV, que no admiten comentarios sin alterar su formato.
- Imágenes, PDF, hojas de cálculo y otros binarios.
- Registros y evidencias de pruebas, cuyo contenido debe conservarse.
- Migraciones Flyway ya publicadas/aplicadas, para preservar sus checksums.
- Herramientas generadas de terceros, como Maven Wrapper, que conservan su contenido y licencia.

Las dependencias, compilaciones, cachés, archivos eliminados y contenido de Git quedan fuera del inventario de archivos propios.

Comprobar la cobertura sin escribir:

```bash
python3 docs/herramientas/actualizar_cabeceras.py
```

Actualizar cabeceras e índice al incorporar archivos propios:

```bash
python3 docs/herramientas/actualizar_cabeceras.py --aplicar
```

El actualizador conserva los prólogos de XML, HTML, Python y PlantUML, los permisos de ejecución y los finales de línea del contenido. Las notas especiales de cada módulo pueden mantenerse en el diccionario `SPECIAL` del actualizador; los demás archivos se describen según su tipo y responsabilidad.
