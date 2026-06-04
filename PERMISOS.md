# Matriz de permisos de prácticas

Regla base:

- `ROLE_ADMIN`: acceso global de administración.
- `ROLE_DIRECTOR_PRACTICAS`: acceso a prácticas de su carrera.
- `ROLE_TUTOR_PRACTICAS`: acceso a prácticas de sus paralelos asignados.
- `ROLE_TUTOR_INSTITUCIONAL`: acceso a prácticas de sus grupos o asignación institucional.
- `ROLE_DIRECTORA_INSTITUCION`: acceso a registros vinculados a su institución educativa.
- `ROLE_ESTUDIANTE`: acceso solo a sus prácticas y registros.

Estados de práctica:

- `PENDING`: solicitud pendiente; no habilita creación de registros de práctica.
- `APPROVED`: práctica activa; habilita creación y edición operativa.
- `COMPLETED`: práctica concluida; habilita consulta histórica y revisión, no creación operativa.
- `archived = true`: práctica concluida enviada al archivo histórico; sigue siendo consultable desde el archivo.

| Módulo | Estudiante | Tutor institucional | Directora institución | Tutor prácticas | Director prácticas | Admin |
| --- | --- | --- | --- | --- | --- | --- |
| Paralelos e inscripciones | Solicita y consulta lo suyo | Consulta prácticas asignadas | - | Gestiona sus paralelos | Gestiona su carrera | Global |
| Archivo de prácticas | Consulta historial propio | Consulta prácticas asignadas | - | Concluye/archiva sus paralelos | Concluye/archiva su carrera | Global |
| Evidencias | Crea en práctica activa y consulta lo suyo | Consulta asignadas | - | Consulta sus paralelos | Consulta su carrera | Global |
| Fichas y entrevistas | Crea, responde si aplica, interpreta lo suyo | Responde/consulta asignadas | Responde/consulta asignadas | Consulta sus paralelos | Consulta su carrera | Global |
| Planificaciones didácticas | Crea adaptada y ve la institucional de su práctica | Crea institucional y recomienda la del estudiante asignado | - | Recomienda la del estudiante en sus paralelos | Recomienda la del estudiante en su carrera | Recomienda global |
| Jornadas y asistencias | Consulta lo suyo | Crea y registra asistencia en asignadas | Consulta su institución | Consulta sus paralelos | Consulta su carrera | Global |
| Documentos de práctica | Crea/edita en práctica activa, consulta históricos propios | Según módulo institucional | Según módulo institucional | Revisa sus paralelos | Revisa su carrera | Global |

Notas:

- Las planificaciones creadas por la tutora institucional solo son visibles para la autora y el estudiante de la práctica.
- Las planificaciones creadas por estudiantes son visibles para roles superiores dentro de su alcance y pueden recibir recomendaciones.
- Crear o subir nuevos registros debe depender de una práctica `APPROVED`; consultar histórico debe permitir `COMPLETED`.
