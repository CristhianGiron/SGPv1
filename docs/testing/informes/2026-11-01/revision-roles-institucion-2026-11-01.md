<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          revision-roles-institucion-2026-11-01.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Revisión de roles y configuración institucional — 2026-11-01.
-->

# Revisión de roles y configuración institucional — 2026-11-01

> Informe de una ejecución específica. Sus conteos se conservan como evidencia histórica; consulte el [índice de pruebas](../../README.md) para localizar las revisiones posteriores.


## Cambios verificados

- Catálogos académicos: administración mantiene el catálogo global; dirección consulta solo su jerarquía. Escrituras restringidas también con autorización de métodos del backend.
- Universidades: dirección no puede modificar su universidad ni consultar otras por identificador o filtros. Se conserva el directorio compartido de escuelas/colegios receptores.
- Paralelos: estudiantes buscan dentro de su ciclo activo; tutores de prácticas, dentro de sus asignaciones. Los filtros de texto no amplían el alcance. La carrera principal del paralelo prevalece sobre la referencia antigua por asignatura.
- Selección de cuentas: dirección encuentra tutores de su universidad; las respuestas para asignación omiten datos personales de contacto e identificación. Administración conserva su consulta completa.
- Registro público: solo estudiantes; los roles del personal se crean desde administración.
- Interfaz: navegación, ayudas y descripciones por rol; catálogos de dirección sin controles de escritura; concluir/reabrir reservado a dirección; gestión de jornadas reservada a tutoría institucional; supervisores de planificaciones sin formulario de creación; perfil con datos comprensibles en lugar del objeto técnico de cuenta.
- Pendientes: entrevistas asignadas para tutoras institucionales/directoras; acceso a su bandeja correspondiente. Se eliminó el indicador sin utilidad de sesión activa.
- Instalación inicial: UNL, Facultad de la Educación, el Arte y la Comunicación y Pedagogía de las Ciencias Experimentales - Informática. Inicialización idempotente, sin reactivar registros deshabilitados ni crear usuarios/ciclos. Configurable mediante variables de entorno.
- Registro y formularios de administración utilizan valores iniciales de la configuración, conservando otras universidades y las decisiones del usuario.

## Evidencia de ejecución

| Verificación | Resultado |
| --- | --- |
| Backend `./mvnw -q test` | 24 suites, 110 pruebas, 0 errores/fallos/omitidas |
| Frontend `CI=true npm test -- --watchAll=false --runInBand` | 19 suites, 39 pruebas correctas |
| Frontend `npm run build` | Compilación correcta |
| `node docs/testing/qa/check-contracts.cjs` | 67 contratos de documentos/jornadas, sin rutas faltantes |
| Chrome, seis roles | 102 rutas y 3 interacciones, sin errores JS ni desbordamientos detectados |
| `git diff --check` | Sin errores de formato |

Las nuevas pruebas incluyen creación institucional repetida, reutilización de registros antiguos, respeto a desactivaciones, coexistencia de otra jerarquía, inicialización deshabilitada, consultas/escrituras prohibidas entre universidades, registro público de personal rechazado, datos mínimos en búsquedas, catálogos sin controles indebidos y cambio de universidad en el registro.

Las pruebas de integración usan H2 con transacciones revertidas. Las pruebas de Chrome usan respuestas de API simuladas y no demuestran autorización contra una instalación desplegada; esta se comprueba en las pruebas HTTP con Spring Security. No se modificó la base de datos real durante esta revisión. El inicializador se ejecutará en el siguiente arranque normal del backend.

Esto documenta la cobertura ejecutada, sin afirmar ausencia absoluta de defectos. No se probó despliegue productivo ni envío de correos externos. La compilación muestra un aviso informativo de antigüedad de Browserslist.

## Referencias

- [Matriz de permisos](../../../producto/permisos-practicas.md).
- [Configuración y ampliación institucional](../../../producto/configuracion-institucional.md).
- [Evidencia de navegación](../../evidencias/evidencia-qa-navegacion.json).
- Pruebas nuevas: `InstitutionalDefaultsServiceTest`, `RoleSeparationIntegrationTest`, `ResourceCrud.test.jsx`, `roleExperience.test.js`, `RegisterPublic.test.jsx` y ampliación de `DidacticPlansPage.test.jsx`.
