<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          pruebas-flujo.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Pruebas y recorrido de la API.
-->

# Pruebas y recorrido de la API

[Guía Postman y variables](../guia-postman.md) · Los ejemplos se ejecutan sobre un entorno de pruebas con cuentas del rol indicado.

## Scripts utiles de Postman

Guardar `id` desde respuesta directa:

```javascript
pm.environment.set("institutionId", pm.response.json().id);
```

Para grados, guardar el `id` de una escuela o colegio:

```javascript
pm.environment.set("schoolInstitutionId", pm.response.json().id);
```

Guardar `id` desde una respuesta paginada de Spring:

```javascript
const json = pm.response.json();
if (json.content && json.content.length > 0) {
  pm.environment.set("institutionId", json.content[0].id);
}
```

Guardar `id` desde una lista:

```javascript
const json = pm.response.json();
if (Array.isArray(json) && json.length > 0) {
  pm.environment.set("facultyId", json[0].id);
}
```


## Orden recomendado para probar flujo completo

1. Iniciar sesión con administración. La creación inicial de la primera cuenta depende de la configuración de instalación; no debe repetirse como preparación de cada prueba.
2. Consultar los valores institucionales predeterminados. Reutilizar los catálogos activos o preparar universidad, facultad, carrera y ciclo académico antes de registrar cuentas que dependan de ellos.
3. Preparar ubicaciones y la escuela o colegio receptor. No confundir la universidad de origen con la institución educativa de prácticas.
4. Crear las cuentas necesarias de dirección de prácticas, tutoría de prácticas, tutoría institucional y directora de institución, con su alcance correspondiente.
5. Crear un paralelo, asignar sus responsables y preparar los grupos que requiera el flujo.
6. Registrar o crear al estudiante con el ciclo académico adecuado. Autenticarlo, solicitar inscripción y aprobarla con la cuenta autorizada.
7. Crear y enviar el plan L.2 como estudiante. Revisarlo como tutor de prácticas y como director de prácticas de la carrera. Probar corrección, edición y reenvío antes de la aprobación definitiva.
8. Programar jornadas como tutor institucional y registrar las asistencias de sus períodos. Consultar como estudiante y, cuando corresponda, como directora de la institución mediante `/api/practice-schedules/institution-review`.
9. Crear el registro L.6 como estudiante, enviarlo y completar sus revisiones de tutoría de prácticas y dirección. Revisar observaciones por apartado y por fila.
10. Crear y enviar el informe L.1; completar la revisión de tutoría de prácticas y dirección.
11. Preparar L.3 como estudiante. Completar la sección institucional con la cuenta asignada y verificar las revisiones de tutoría de prácticas, tutoría institucional y dirección. Ambas tutorías por sí solas no completan su aprobación.
12. Registrar L.4 y L.5 con el tutor de prácticas asignado. Consultarlos como estudiante; no tratarlos como documentos con envío estudiantil.
13. Probar evidencias y consultas desde cada práctica, incluidos intentos de acceder a registros ajenos que el servidor debe rechazar.
14. Verificar conclusión y archivo con los roles y condiciones autorizados por el backend.

Para cuerpos de petición y endpoints exactos consulte la guía de cada formato. Los identificadores deben proceder de la instalación usada para la prueba. La numeración L.1–L.6 no impone una secuencia cronológica por sí sola.

Las cuentas de una ejecución histórica pueden haber cambiado. Use el [manifiesto y la guía de demostración](../../testing/datos/usuarios-demostracion.md) o cuentas de prueba preparadas para su entorno; esta guía no publica una contraseña administrativa local como valor vigente.

## Cuentas adicionales con escenarios de avance

Se cargaron 18 cuentas ficticias con prefijo `demo2026.` y contraseña de pruebas `DemoPracticas2026!`. Consulta los nombres, roles y etapas en [Usuarios de demostración](../../testing/datos/usuarios-demostracion.md). Los ejemplos incluyen solicitudes pendientes, planes en borrador, enviados, observados y aprobados, además de prácticas concluidas y archivadas.

