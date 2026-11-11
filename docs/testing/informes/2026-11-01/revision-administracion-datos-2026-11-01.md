<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          revision-administracion-datos-2026-11-01.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Administración, personal y datos de demostración — 2026-11-01.
-->

# Administración, personal y datos de demostración — 2026-11-01

> Informe de una ejecución específica. Sus conteos se conservan como evidencia histórica; consulte el [índice de pruebas](../../README.md) para localizar las revisiones posteriores.


## Resultados

- 18 cuentas ficticias añadidas a la API local: 12 estudiantes, 2 tutores de prácticas, 2 tutores institucionales, 1 directora de prácticas y 1 directora de institución. Las cuentas anteriores se conservaron.
- Colegio receptor nuevo, grado y paralelos institucionales nuevos, dos paralelos universitarios y sus grupos asignados.
- Prácticas: 2 solicitudes pendientes, 8 aprobadas/activas y 2 concluidas, una de ellas archivada.
- Planes: 2 borradores, 1 enviado, 1 con observaciones y 4 aprobados. Se añadieron jornadas, asistencias y entrevistas con distintos avances.
- Administración y personal disponen de entradas por tareas, navegación jerárquica en catálogos y selección de cuenta antes de acciones de acceso. Dirección institucional trabaja por estudiante dentro de sus asignaciones.

## Comprobaciones

- Frontend: 25 suites, 74 pruebas correctas; compilación de producción correcta.
- Backend: 24 suites, 111 pruebas correctas, sin errores ni pruebas omitidas.
- Chrome con API simulada: 100 rutas y 11 interacciones, sin errores JS ni desbordamientos detectados. Incluye catálogos por contexto, selección de cuenta, prácticas y asignaciones institucionales.
- 67 contratos de documentos/jornadas sin rutas faltantes; `git diff --check` correcto.
- API local: búsquedas de cuentas y paralelos sin filtros devuelven HTTP 200 después de corregir el desempaquetado de Boolean nulos en dos condiciones ternarias. Se añadió una regresión HTTP para administración y dirección.
- Inicio de sesión y estados comprobados de forma independiente en cinco de las cuentas nuevas: solicitud pendiente, plan enviado, práctica archivada, tutoría institucional y dirección del colegio. Las otras cuentas se autenticaron durante la propia carga.

La carga respetó los límites de autenticación y de cambio de contraseña del servidor. Se interrumpió y continuó durante la preparación; el manifiesto refleja el conjunto completo y el contador `created` solamente la última ejecución. Los registros nuevos se gestionaron mediante endpoints autorizados, sin SQL directo ni restablecimientos de cuentas existentes.

La revisión automática inicialmente rechazó usar una credencial administrativa localizada en un temporal. La carga se realizó después de que el usuario autorizó explícitamente usar ese administrador local. El script reutilizable exige la credencial mediante entorno y no imprime tokens ni claves administrativas.

## Evidencia

- [Usuarios y acceso de demostración](../../datos/usuarios-demostracion.md).
- [Manifiesto de cuentas y estados](../../datos/usuarios-demostracion.json).
- [Verificación de acceso y bandejas](../../datos/verificacion-usuarios.json).
- [Recorridos Chrome](../../evidencias/evidencia-qa-workspaces.json).
- [Flujos de administración y personal](../../../producto/flujos-administracion-personal.md).

Chrome usa datos simulados; la carga y la comprobación de cuentas se hicieron contra la API local real. No se realizó una validación contra producción ni una certificación completa del expediente de cierre de cada práctica.
