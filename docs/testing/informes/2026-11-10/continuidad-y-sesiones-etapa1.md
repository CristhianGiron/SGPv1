<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          continuidad-y-sesiones-etapa1.md
  @fecha         2026-11-10 21:30:00
  @nota          Documenta Continuidad del trabajo y sesiones: primera etapa.
-->

# Continuidad del trabajo y sesiones: primera etapa

Fecha: 10 de noviembre de 2026. Implementación local iniciada a petición del usuario. Se atendieron los tres ajustes concretos priorizados: recuperación de planificación institucional, continuidad de entrevistas respondidas y sesiones revocables.

## Cambios funcionales

### Planificación institucional

Dirección de la carrera o el tutor de prácticas asignado puede devolver una planificación institucional enviada, con motivo obligatorio. El autor no puede devolverse su propia entrega. La operación exige una práctica operativa y conserva una copia de los datos y del PDF antes de habilitar la corrección. El tutor institucional recibe una notificación y puede corregir y reenviar utilizando el formulario existente.

La vista de planificación muestra las versiones conservadas, quién realizó la devolución, cuándo y por qué. Permite consultar el contenido y descargar el PDF de una versión previa, conservando separado el documento actual. Las operaciones de escritura se serializan sobre la planificación. La existencia de versiones enviadas impide borrar la planificación.

### Entrevistas

El listado del destinatario incluye entrevistas enviadas y respondidas dentro del mismo alcance. La interfaz separa pendientes e historial. Conservar una entrevista respondida no habilita responderla otra vez ni revela entrevistas de terceros. El espacio institucional conserva las relaciones obtenidas a partir de entrevistas ya respondidas.

### Sesiones

Las nuevas autenticaciones crean una sesión persistente. Los refresh tokens se almacenan como hash SHA-256, no en texto plano. Cada renovación rota el token; el anterior deja de admitirse. Los tokens incluyen identificador de sesión y versión de autenticación de la cuenta.

El cierre actual revoca esa sesión; «Cerrar todas mis sesiones», en el perfil, invalida los dispositivos de la propia cuenta. Cambiar o recuperar la contraseña y bloquear o desactivar la cuenta invalida los tokens emitidos anteriormente. Las peticiones HTTP, los handshakes y los envíos de notificaciones WebSocket comprueban la vigencia. El handshake no registra tokens ni sus protocolos/consulta sin redactar.

El cliente comparte una renovación entre peticiones concurrentes, reintenta una vez la petición con el token nuevo y sincroniza el estado de autenticación. Incluye descargas. Evita reutilizar la sesión de otra cuenta en peticiones antiguas, conserva la autenticación ante un fallo de red al renovar y limpia la sesión cuando el refresh es rechazado. Si no puede confirmar el cierre remoto, informa que solo se ha retirado el acceso del navegador.

## Compatibilidad y límites

Los access tokens previos, sin identificador de sesión, conservan compatibilidad mientras la cuenta esté en su versión inicial. No admiten renovación nueva. Cerrar uno de esos accesos revoca globalmente los tokens anteriores de la cuenta; un login posterior inicia una sesión identificable. La caducidad máxima de la sesión se mantiene ligada al primer refresh emitido.

La conservación de versiones de esta etapa corresponde a planificaciones institucionales devueltas. Quedan para las etapas siguientes el versionado general de documentos, incidencias, suspensión y reasignación, plazos y respaldos automáticos. Se mantiene el cierre académico manual con advertencias previamente acordado.

La migración V24 añade la versión de autenticación de cuentas, las sesiones y las revisiones de planificación. Se validó en MariaDB temporal. No se aplicó manualmente a la base de uso real durante esta etapa: Flyway la aplicará en el próximo arranque del backend actualizado. Las compilaciones y pruebas se ejecutaron desde una copia temporal para evitar que DevTools del backend abierto aplicase cambios durante las verificaciones.

## Verificación

- Suite backend: 225 casos, 223 aprobados y 2 omitidos por ser pruebas SQL optativas; sin fallos. Tras la última comprobación de vigencia al cerrar sesión, se repitieron las 11 pruebas de continuidad y sesiones, todas aprobadas.
- Migraciones SQL: 2 pruebas aprobadas por separado en MariaDB temporal, cadena hasta V24 y arranque con Hibernate en modo `validate`.
- Frontend: 58 suites y 206 pruebas aprobadas; nueva comprobación focalizada de las versiones y renovación tras el ajuste visual final.
- Compilación de producción del frontend correcta.
- Navegador: 12 comprobaciones con paquete compilado y API ficticia en 390 y 1440 px: renovación, devolución motivada, versión conservada, ausencia de desbordamiento en la planificación, historial del destinatario y cierre de todos los accesos.

La evidencia incluye verificaciones reales de Spring Security/MockMvc con H2 y, por separado, la interfaz con API simulada; no equivale a una sesión completa contra datos de operación. La compilación mantiene el aviso existente de Browserslist; algunas pruebas de componentes emiten avisos React `act` sin fallar.

[Evidencia y huellas de fuentes](../../evidencias/continuidad-sesiones-2026-11-10/resultados.json). Contratos: [autenticación](../../../api/postman/autenticacion.md), [planificaciones](../../../api/postman/planificaciones.md) y [formularios](../../../api/postman/formularios.md).
