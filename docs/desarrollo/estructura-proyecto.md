<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          estructura-proyecto.md
  @fecha         2026-11-11 10:32:47
  @nota          Documenta Estructura y convenciones del proyecto.
-->

# Estructura y convenciones del proyecto

Estas son las convenciones adoptadas para mantener el SGP. Las raíces `BackEnd` y `FrontEnd` se conservan; Maven y React mantienen sus directorios de recursos convencionales.

## Frontend

```text
FrontEnd/src/
├── app/                     Aplicación y layout general
├── features/
│   ├── auth/                Sesión, acceso y registro
│   ├── accounts/            Cuentas, perfil y preferencias
│   ├── catalogs/            Catálogos y componentes CRUD
│   ├── courses/             Paralelos, estudiantes y ofertas
│   ├── institutions/        Instituciones y su espacio de trabajo
│   ├── practices/           Prácticas, archivo, incidencias y plazos
│   ├── documents/           Documentos y versiones
│   ├── practice-forms/      Entrevistas, observación y tabulación
│   ├── records/             Editor y consulta compartidos de registros
│   ├── schedules/           Jornadas, agenda y asistencia
│   ├── notifications/       Bandeja, campana y conexión de avisos
│   ├── evidence/            Evidencia fotográfica y visor
│   ├── reports/             Reportes
│   └── dashboard/           Inicio según rol
├── components/              Primitivas, accesibilidad y formularios compartidos
├── api/, contexts/, hooks/  Infraestructura transversal
├── config/, utils/
└── assets/, styles/
```

Cada funcionalidad contiene solo los subdirectorios que utiliza: `pages`, `components`, `context`, `hooks` o `model`. Los tests y estilos específicos acompañan al módulo que comprueban o presentan. Las utilidades específicas se mantienen dentro de su funcionalidad; solo las compartidas pertenecen a `utils/`.

| Elemento | Convención |
| --- | --- |
| Página React | `NombrePage.jsx`, con export del mismo nombre |
| Componente React | `PascalCase.jsx` |
| Hook | `useNombre.js`; `.jsx` cuando construye JSX |
| Utilidad o cliente sin JSX | `camelCase.js` |
| Prueba | `Nombre.test.js` o `Nombre.test.jsx`, según contenga JSX |
| Estilo específico | Mismo nombre base que el componente |
| Carpeta de funcionalidad | Minúsculas; varias palabras separadas por guion |

`EndpointConsole` es la entrada compartida de edición de registros. Su vista se encuentra en `console/EndpointModule.jsx`; estado y operaciones, en `console/useEndpointWorkspace.jsx`. La revisión, los filtros, las evidencias y las comprobaciones de completitud tienen módulos propios. `DataInspector` compone aprobación, cronología, tablas académicas y presentación del detalle. Sus exports públicos conservan la compatibilidad de sus consumidores.

## Backend

Se mantiene la organización por capas. Dentro de las capas se agrupan los dominios de incidencias (`practiceincident`), versiones documentales (`documentversion`), plazos (`practicedeadline`) y generación de PDF (`service/pdf`). Los DTO de los tres primeros permanecen bajo el contexto `dto/enrollment/`.

Los paquetes Java usan minúsculas y corresponden al directorio. Las clases y records usan PascalCase. Los DTO de operaciones usan nombres que expresan su propósito; se conservan las clases contenedoras de solicitudes relacionadas cuando ya definen un contrato claro.

`PdfExportService` conserva sus métodos públicos y records. Delega el dibujo a renderizadores separados, con primitivas comunes en `PdfLayoutSupport`. Las pruebas de formato están en `src/test/java/com/sgp/systemsgp/service/pdf/`; las regresiones que cruzan varios servicios permanecen en `service/` cuando requieren acceso de paquete.

No se renombraron tablas, entidades JPA, roles, estados, rutas HTTP ni claves JSON. Las migraciones continúan en `src/main/resources/db/migration/`: sus nombres y bytes son históricos y no se modifican para ajustar una convención visual.

## Documentación y entregas

- Las guías de producto y API describen el funcionamiento vigente.
- Los informes y sus evidencias conservan el contexto de la ejecución original, incluidas rutas y huellas históricas en JSON y logs.
- El [mapa de rutas trasladadas](reorganizacion-rutas.json) permite localizar las fuentes reorganizadas.
- Las copias autocontenidas de capturas se conservan si sustentan informes distintos. La igualdad de bytes no basta para eliminar una evidencia.
- Las entregas congeladas se guardan en `docs/entregas/`; sus fuentes editables siguen en su área documental.
- Las dependencias y resultados regenerables se excluyen de Git. Las dependencias de navegador pertenecen al [entorno propio de QA](../testing/qa/README.md).

[Desarrollo y operación](README.md). [Mantenimiento documental](../mantenimiento-documentacion.md).
