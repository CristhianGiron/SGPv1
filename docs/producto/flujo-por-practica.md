<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          flujo-por-practica.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Navegación por práctica y asignación.
-->

# Navegación por práctica y asignación

El sistema inicia desde el trabajo del usuario. Los módulos operativos se encuentran dentro de una práctica, con un encabezado que conserva el paralelo, estudiante según rol, institución, grupo, tutores y estado.

## Estudiante

1. Al iniciar sesión ve **Mis prácticas**, con las solicitudes y prácticas actuales.
2. Selecciona **Abrir práctica** en una tarjeta.
3. El resumen ofrece los apartados habilitados para su rol: documentos y evaluación, evidencias, entrevistas, observaciones, planificaciones y jornadas/asistencias. Los documentos se agrupan en un acceso que permite elegir el formulario correspondiente.
4. Abre un apartado desde las tarjetas o **Ir a un apartado**. Los listados y las opciones de inscripción se restringen a esa práctica.
5. Regresa al resumen o al listado desde la ruta visible en el encabezado. La opción **Historial** permite abrir prácticas concluidas o archivadas para consulta.

**Solicitar nueva práctica** lleva al flujo de inscripción existente. Las solicitudes pendientes no permiten crear registros operativos; su aviso permite volver a gestionar la solicitud. La tabla de inscripciones también incluye **Abrir práctica**.

## Tutoría, dirección y administración

- Tutores de prácticas y dirección abren un paralelo, después la práctica del estudiante y finalmente el apartado correspondiente. La lista proviene del endpoint de prácticas autorizado para la cuenta.
- Tutoría institucional entra a sus estudiantes asignados, organizados por paralelo, y abre su práctica para atender las entrevistas, informes, planificaciones o jornadas que su rol permite.
- La directora de institución dispone de una entrada **Mi institución** con entrevistas asignadas y jornadas institucionales. Se conservan sus permisos existentes, sin abrirle el catálogo general de prácticas.
- Administración conserva gestión académica, cuentas y archivo global; dirección y tutoría conservan las herramientas de paralelos y grupos correspondientes. **Resumen de seguimiento** mantiene el panel de indicadores para los roles supervisores.

El menú global ya no presenta cada módulo de práctica como una entrada independiente. El perfil, las notificaciones, la gestión de inscripciones/paralelos y la administración conservan sus entradas según rol. Los enlaces anteriores a módulos siguen siendo válidos para compatibilidad con notificaciones y marcadores.

## Rutas y comportamiento

- `#/practices`: listado.
- `#/practices/7`: resumen de la práctica con identificador 7, si pertenece al alcance del usuario.
- `#/practices/7/photos`: evidencias de esa práctica.
- `#/practices/7/documents/activity-plans`: plan de actividades de esa práctica.

Los enlaces conservan el contexto al recargar o navegar con el historial del navegador. Una práctica desconocida o fuera de la lista autorizada presenta un estado de no disponibilidad y no monta los módulos operativos.

`PracticeWorkspaceContext` limita los resultados ya autorizados de la API y comprueba que los formularios no envíen otro `enrollmentId`. Esta selección es un filtro de trabajo en la interfaz; la autorización del servidor permanece vigente. No se agregaron permisos ni se modificó la base de datos para esta navegación.

En prácticas no operativas se ocultan creación de documentos, carga/borrado de fotografías, creación/edición de planificaciones y creación/duplicación de entrevistas. Las operaciones de revisión que el servidor permita siguen sujetas a sus permisos y estados.

## Validación

- `CI=true npm test -- --watchAll=false --runInBand`: pruebas generales y pruebas de flujo/contexto.
- `npm run build`: compilación.
- `node docs/testing/qa/browser-workspaces.cjs`: navegación en Chrome con API simulada; verifica selección real de tarjetas, apartados por rol, aislamiento de evidencias, historial, práctica desconocida y anchura móvil.

La evidencia de Chrome se guarda en `docs/testing/evidencias/evidencia-qa-workspaces.json`. Las pruebas con datos simulados no sustituyen una aceptación operativa con datos de una instalación desplegada.
