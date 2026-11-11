<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          componentes-experiencia.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Componentes de experiencia de usuario.
-->

# Componentes de experiencia de usuario

Referencia para modificar los flujos recientes sin perder contexto de práctica, recuperación de trabajo o accesibilidad. Las rutas de esta página se refieren a `FrontEnd/src/`.

## Contexto y acceso

| Elemento | Ubicación | Uso |
| --- | --- | --- |
| `PracticeWorkspacePage` | `pages/PracticeWorkspacePage.jsx` | Selecciona práctica y apartado, verifica disponibilidad y monta el contenido |
| `usePracticeWorkspace()` | `contexts/PracticeWorkspaceContext.jsx` | Devuelve la práctica seleccionada o `null` fuera de ese contexto |
| `usePracticeRequest()` | `contexts/PracticeWorkspaceContext.jsx` | Filtra resultados al contexto y comprueba el `enrollmentId` de operaciones |
| `PracticeOverview` | `components/PracticeOverview.jsx` | Carga indicadores, siguiente paso, próximas jornadas e historial |
| `practiceExperience` | `utils/practiceExperience.js` | Selección de fuentes autorizadas, recomendaciones y eventos |

El filtro de contexto no es autorización. Los servicios del backend siguen comprobando rol, asignación y alcance. Los identificadores de un evento de historial no deben confundirse con identificadores de inscripción.

## Formularios y recuperación

`GuidedForm` recibe las mismas propiedades principales de `StructuredForm`: `value`, `onChange`, `hiddenFields`, `readOnlyFields`, `relations` y `customFields`. Agrupa claves visibles por pasos y conserva el objeto completo al cambiar de paso. La revisión final deshabilita la edición; el guardado usa los permisos y validaciones del módulo.

`useRecoverableDraft(scope, onRestore, enabled)` retorna `recovery`, `status`, `change`, `recover`, `discard` y `markClean`. La clave combina cuenta y alcance suministrado. Incluya práctica, módulo y registro en ese alcance.

- Llame `change(nextValue)` ante cambios del usuario, no ante cada carga inicial del servidor.
- Use `DraftRecovery` para mostrar recuperación y estado de la copia local.
- Llame `markClean()` después de que el servidor confirme el guardado.
- Deshabilite edición y recuperación mientras se guarda para evitar que una respuesta anterior borre cambios más recientes.
- No incluya tokens, contraseñas ni objetos `File` en el borrador. Los adjuntos requieren selección posterior.

La copia es local al navegador. No debe describirse como sincronización o guardado automático en el servidor.

## Agenda e indicadores

`AgendaView({ schedules, compact })` recibe programaciones autorizadas. La vista completa ofrece semana/lista y búsqueda cuando existen varias programaciones. La vista compacta muestra próximas jornadas y limita el detalle.

`weeklyEntries` respeta fechas de vigencia y día de la semana; asocia asistencia mediante `schedulePeriodId`. `upcomingJornadas` excluye períodos ya terminados hoy. `summarizeAttendances` suma minutos válidos de presencia y atraso; las ausencias justificadas no suman tiempo asistido.

Una consulta fallida debe mantenerse diferenciada de una lista vacía o un indicador en cero.

## Bandeja y navegación

`NotificationsPage` combina `useNotifications`, `inboxNotifications` y `groupInboxByDate`. La campana comparte el hook y el componente `NotificationItem`. El backend determina qué avisos pertenecen a la cuenta.

`setHashRoute` y `useHashRoute` gestionan el cambio de ruta y permiten cancelar la navegación con trabajo pendiente mediante `sgp-before-navigate`. La navegación interna debe reutilizar esta utilidad para mantener el comportamiento esperado.

## Diálogos, listados y estados vacíos

- `Modal` y `ConfirmModal` utilizan `useDialogFocus`. El callback de cierre puede cambiar sin reiniciar el foco; la ventana superior controla Tab/Escape y el bloqueo de desplazamiento se cuenta entre ventanas anidadas.
- `ListToolbar` mantiene búsqueda y acciones en una fila adaptable.
- `DataTable` pagina resultados; los listados con filtros permiten seleccionar columnas y guardar vistas de filtros. Las columnas disponibles provienen de la configuración autorizada, no de preferencias guardadas.
- `EmptyState` acepta `text`, `title`, `action` e `icon`. Use una acción pertinente, como limpiar búsqueda o consultar otra vista.
- `Alert` es un aviso flotante. Las instrucciones extensas o permanentes del formulario deben permanecer dentro del contenido de la página.

## Comprobar cambios

Ejecute pruebas de componentes y `npm run build` desde `FrontEnd`. Para cambios compartidos de contexto, agenda o diálogos, consulte los scripts de regresión en el [índice QA](../../testing/README.md). Las capturas y los fixtures no validan permisos del backend.

[Guía de desarrollo](guia-desarrollo.md) · [Referencia general](referencia-funciones.md) · [Comportamiento de usuario](../../producto/experiencia-de-trabajo.md).
