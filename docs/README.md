<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          README.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Documentación de SGPv1.
-->

# Documentación de SGPv1

Punto de entrada para comprender, ejecutar, probar y mantener el proyecto. La documentación se organiza por propósito; los informes fechados describen una ejecución y no sustituyen las guías del sistema.

## Por dónde comenzar

| Necesito… | Documento |
| --- | --- |
| Ejecutar el proyecto | [README del proyecto](../README.md) y [configuración de entornos](desarrollo/configuracion-entornos.md) |
| Comprender los flujos y permisos | [Documentación de producto](producto/README.md) |
| Consultar actores, requisitos y casos de uso | [Requisitos y artefactos](requisitos/README.md) |
| Consultar la bitácora académica en LaTeX y PDF | [Bitácora del proyecto](bitacora/README.md) |
| Probar endpoints en Postman | [Guía Postman](api/guia-postman.md) |
| Modificar el frontend | [Guía de desarrollo](desarrollo/frontend/guia-desarrollo.md) |
| Reproducir verificaciones o consultar resultados | [Pruebas y evidencias](testing/README.md) |
| Revisar la organización documental | [Criterios de mantenimiento](mantenimiento-documentacion.md) |

## Estructura

```text
docs/
├── api/                     Guía Postman y ejemplos por dominio
│   └── postman/documentos/  Formatos L.1–L.6
├── bitacora/                Bitácora académica en LaTeX y PDF
├── desarrollo/              Entornos y guías técnicas
├── herramientas/            Verificación documental sin acceso a red
├── producto/                Flujos, permisos y comportamiento de la interfaz
├── requisitos/              Especificación, catálogo y material fuente
└── testing/
    ├── datos/               Datos y carga de demostración
    ├── evidencias/          Resultados JSON de verificaciones
    ├── informes/            Revisiones agrupadas por fecha
    └── qa/                  Scripts reproducibles de validación
```

## Qué fuente consultar

- **Requisitos:** la [especificación Markdown](requisitos/especificacion.md) es el catálogo documental principal. El Excel es una representación tabular. Los PDF y las exportaciones históricas son material de referencia.
- **Comportamiento y permisos:** las guías de producto explican los flujos; los servicios y la seguridad del backend determinan el acceso efectivo.
- **Pruebas:** cada informe conserva sus resultados y límites originales. El [índice QA](testing/README.md) distingue las últimas verificaciones de los informes anteriores.
- **Prototipos:** [prototipos HTML/CSS](../prototipos-interfaces/README.md) son material de diseño separado del frontend React real.

No se deben interpretar ejemplos de cuentas, capturas o resultados de una instalación local como configuración de producción.

- [Entregas documentales congeladas](entregas/README.md).
