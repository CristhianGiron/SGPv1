<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          usuarios-demostracion.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Usuarios de demostración cargados.
-->

# Usuarios de demostración cargados

Datos ficticios cargados mediante la API local el 1 de noviembre de 2026. No corresponden a personas reales.

**Contraseña de las 18 cuentas:** `DemoPracticas2026!`

La tabla con **usuario, correo y contraseña de cada cuenta** está en la [guía Postman](../../api/guia-postman.md#usuarios-de-prueba-usuarios-correos-y-contraseñas).

Los usuarios anteriores se conservaron. Los nuevos registros utilizan el prefijo `demo2026.` y el centro receptor **Unidad Educativa Mirador de Loja — Demostración**. Los 12 estudiantes se distribuyen entre dos paralelos de Informática, con tutores de prácticas e institucionales asignados. No se crearon administradores adicionales.

| Nombre | Usuario | Rol | Escenario |
| --- | --- | --- | --- |
| Antonella María Carrión Delgado | `demo2026.antonella.carrion` | Estudiante | Práctica concluida |
| Camila Alejandra Espinosa Rojas | `demo2026.camila.espinosa` | Estudiante | Práctica activa |
| Daniela Belén Villavicencio Ruiz | `demo2026.daniela.villavicencio` | Estudiante | Plan en borrador |
| David Francisco Alvarado Zambrano | `demo2026.david.alvarado` | Estudiante | Práctica archivada |
| Emilio Alejandro Aguirre Castillo | `demo2026.emilio.aguirre` | Estudiante | Plan con observaciones |
| Gabriel Esteban Romero Pardo | `demo2026.gabriel.romero` | Estudiante | Plan aprobado |
| Isabela Fernanda Samaniego León | `demo2026.isabela.samaniego` | Estudiante | Plan enviado |
| Mateo Andrés Ortega Salazar | `demo2026.mateo.ortega` | Estudiante | Solicitud pendiente |
| Nicolás Sebastián Pineda Torres | `demo2026.nicolas.pineda` | Estudiante | Práctica activa |
| Sebastián David Maldonado Vélez | `demo2026.sebastian.maldonado` | Estudiante | Plan en borrador |
| Sofía Gabriela Quezada Moreno | `demo2026.sofia.quezada` | Estudiante | Plan aprobado |
| Valentina Isabel Jaramillo Cueva | `demo2026.valentina.jaramillo` | Estudiante | Solicitud pendiente |
| Andrés Mauricio Córdova Molina | `demo2026.andres.cordova` | Tutor de prácticas | Personal asignado a los paralelos o al colegio de demostración |
| Elena Rocío Benítez Palacios | `demo2026.elena.benitez` | Tutor institucional | Personal asignado a los paralelos o al colegio de demostración |
| Javier Eduardo Ríos Valdivieso | `demo2026.javier.rios` | Tutor institucional | Personal asignado a los paralelos o al colegio de demostración |
| Marcela Patricia Vélez Samaniego | `demo2026.marcela.velez` | Directora de prácticas | Personal asignado a los paralelos o al colegio de demostración |
| Paola Cristina Salinas Cabrera | `demo2026.paola.salinas` | Tutor de prácticas | Personal asignado a los paralelos o al colegio de demostración |
| Teresa Elizabeth Cabrera Ríos | `demo2026.teresa.cabrera` | Directora de institución | Personal asignado a los paralelos o al colegio de demostración |

## Qué puedes explorar

- Dos solicitudes pendientes de aprobación.
- Ocho prácticas activas con distintos niveles de documentación.
- Dos planes en borrador, uno enviado, uno con observaciones y cuatro aprobados.
- Una práctica concluida y otra archivada, ambas con documentación aprobada.
- Jornadas, asistencias y atrasos en las prácticas aprobadas, con cantidades distintas de registros.
- Entrevistas en borrador o enviadas a tutoría institucional y dirección del colegio.

Los escenarios de conclusión representan el estado de la práctica y la aprobación de su plan de actividades; no se inventó una certificación de todos los documentos de cierre. Puedes continuar los demás formularios desde cada práctica.

## Volver a ejecutar la carga

El script `cargar_demostracion.py` necesita Python con `requests` instalado. Lee `SGP_DEMO_ADMIN_USER` y `SGP_DEMO_ADMIN_PASSWORD` del entorno, o puedes solicitar esta última en la terminal sin dejarla en el historial:

```bash
read -rsp 'Contraseña del administrador local: ' SGP_DEMO_ADMIN_PASSWORD
export SGP_DEMO_ADMIN_PASSWORD
python3 docs/testing/datos/cargar_demostracion.py
unset SGP_DEMO_ADMIN_PASSWORD
```

La URL inicial es `http://localhost:8080`; `SGP_DEMO_URL` permite cambiar el puerto local. Solo se admiten direcciones de bucle local. `SGP_DEMO_PASSWORD` permite definir la clave inicial de las cuentas de ejemplo antes de su primera carga.

La carga reutiliza los registros de demostración y no restablece contraseñas ni edita cuentas ajenas. Valida las coincidencias de nombre y rol antes de reutilizar cuentas. Si se interrumpe, puede continuarse sin duplicar las solicitudes y planes creados. Respeta los límites de autenticación y operaciones devolviendo esperas cuando la API responde 429; una carga completa puede tardar varios minutos.

`usuarios-demostracion.json` registra los identificadores y estados devueltos por la API, sin tokens ni credenciales administrativas. El campo `created` cuenta únicamente las cuentas creadas en la última ejecución; las cuentas listadas son el conjunto completo de demostración.
