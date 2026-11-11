<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          README.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Documentos de prácticas: referencia de API.
-->

# Documentos de prácticas: referencia de API

Cada archivo reúne reglas, endpoints y ejemplos del formato correspondiente. La numeración identifica formatos institucionales; la secuencia operativa puede comenzar por el plan L.2 antes de los informes de actividades.

| Formato | Recurso API | Guía |
| --- | --- | --- |
| L.1. Informe de actividades cumplidas | `/api/practice-reports` | [Informe de actividades](01-informe-actividades.md) |
| L.2. Plan de actividades | `/api/activity-plans` | [Plan de actividades](02-plan-actividades.md) |
| L.3. Informe de tutor institucional | `/api/final-reports` | [Informe de tutor institucional](03-informe-tutor-institucional.md) |
| L.4. Evaluación de actividades | `/api/activity-evaluations` | [Evaluación](04-evaluacion-actividades.md) |
| L.5. Reporte de seguimiento | `/api/practice-follow-up-reports` | [Seguimiento](05-seguimiento.md) |
| L.6. Registro de actividades cumplidas | `/api/completed-activity-records` | [Registro de actividades](06-registro-actividades.md) |

L.1, L.2, L.3 y L.6 tienen envío y revisión. L.4 y L.5 son registros de tutoría; no se debe trasladarles automáticamente el flujo de envío de los otros documentos.

La revisión de L.1, L.2 y L.6 requiere las aprobaciones de tutoría de prácticas y dirección. L.3 requiere tutoría de prácticas, tutoría institucional y dirección. Las rutas de revisión y las asignaciones del usuario se verifican en el backend.

[Variables y autenticación](../../guia-postman.md) · [Permisos por rol](../../../producto/permisos-practicas.md).
