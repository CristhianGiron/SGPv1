<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          estructura-directorios.md
  @fecha         2026-11-11 10:20:24
  @nota          Documenta Revisión de estructura, nombres y organización.
-->

# Revisión de estructura, nombres y organización

Fecha: 11 de noviembre de 2026. Alcance: árbol actual de `SGPv1`, archivos versionados y archivos nuevos presentes en el directorio de trabajo. Se excluyeron `.git`, `node_modules`, `target`, `build` y cachés del inventario de contenido. No se movieron, renombraron ni eliminaron archivos de aplicación.

## Diagnóstico

La separación principal entre API, interfaz, documentación y prototipos es adecuada. No se encontró un problema estructural que por sí solo demuestre un fallo de ejecución. Los problemas principales afectan al mantenimiento, la reproducción de QA y la facilidad para encontrar las fuentes vigentes.

Inventario previo a añadir este informe: **1.271 archivos**, distribuidos en 460 del backend, 189 del frontend, 581 de documentación, 38 de prototipos y 3 archivos de raíz. Los conteos incluyen pruebas, configuraciones y recursos; no equivalen al número de componentes de aplicación.

```text
SGPv1/
├── BackEnd/                 API Spring Boot y pruebas Maven
│   ├── src/main/java/com/sgp/systemsgp/
│   │   ├── controller/
│   │   ├── dto/             Ya contiene subpaquetes por recurso
│   │   ├── model/
│   │   ├── repository/
│   │   ├── service/
│   │   └── ...
│   └── src/main/resources/  Configuración, branding, datos y Flyway
├── FrontEnd/
│   ├── public/
│   └── src/
│       ├── api/, auth/, contexts/, hooks/
│       ├── components/, config/, layout/, pages/
│       └── assets/, styles/, utils/
├── docs/
│   ├── api/, producto/, requisitos/, desarrollo/
│   ├── testing/             Datos, scripts, informes y evidencias
│   ├── bitacora/, herramientas/, metadatos/
│   └── bitacora.zip         Copia empaquetada de entrega
└── prototipos-interfaces/   Diseño estático independiente
```

## Hallazgos y recomendaciones

| ID | Prioridad | Evidencia actual | Efecto y recomendación |
| --- | --- | --- | --- |
| E01 | Media | `docs/testing/qa/` contiene 26 scripts `browser-*.cjs`. Por ejemplo, `browser-routes.cjs` y `browser-practice-governance.cjs` requieren `FrontEnd/node_modules/puppeteer-core`. El paquete no figura en `FrontEnd/package.json` ni en su lockfile. | Una instalación desde los manifiestos no garantiza poder ejecutar estos scripts. Definir un entorno de QA con dependencias propias y bloqueadas, documentar su instalación y resolver Puppeteer desde ese entorno. Mantener los scripts bajo `docs/testing/qa/` es válido; su ubicación no es el defecto. |
| E02 | Media | `docs/testing/informes/README.md` llega hasta el 8 de noviembre y omite informes existentes de los días 9 y 10. El índice de evidencias enumera ocho salidas y no las nuevas carpetas. | La documentación nueva existe, pero los puntos de entrada no la muestran. Mantener índices completos, distinguir resultados históricos de los actuales y enlazar cada entrega con sus evidencias y generadores. No actualizar los conteos de informes antiguos. |
| E03 | Media | Backend: `model/` tiene 59 archivos; `service/`, 52; `repository/`, 42; `controller/`, 40. Los DTO ya están repartidos por recurso. | La estructura por capas es válida, pero la navegación se vuelve costosa. Añadir subpaquetes por dominio dentro de las capas que más crecen y reflejarlos en las pruebas; empezar por incidencias, versiones y plazos. No es necesario migrar todo a otra arquitectura. |
| E04 | Media | Frontend: `pages/` contiene 42 archivos, incluidos tests y CSS. `components/` mezcla componentes reutilizables con `CourseRoster`, `PracticeOfferingsPanel`, `PracticeOverview`, `EndpointConsole` y otros componentes ligados a funcionalidades. | Agrupar las funcionalidades grandes en `features/` y dejar en `components/` lo realmente compartido. Mantener los tests junto al código que comprueban. Evitar una carpeta adicional para cada archivo pequeño. |
| E05 | Media | `EndpointConsole.jsx` tiene 3.262 líneas; `PracticeFormsPage.jsx`, 1.949; `DataInspector.jsx`, 1.591. En backend, `PdfExportService.java` tiene 3.080 y `FinalReportService.java`, 1.646. | Cambiar carpetas no reduce estas responsabilidades. Separar vistas, operaciones y renderizado por formato o recurso, manteniendo una fachada donde sea útil. La longitud es una señal para inspeccionar responsabilidades, no una prueba automática de código incorrecto. |
| E06 | Baja | `RegisterPublic.jsx` está en `pages/`, mientras que la mayoría de las páginas usan el sufijo `Page`. `auth/storage.jsx`, `api/client.jsx` y `hooks/useNotifications.jsx` no contienen JSX. | Unificar páginas como `PublicRegistrationPage.jsx` y usar `.js` para módulos sin JSX. Cambiar también imports, mocks, pruebas, documentación y cabeceras. Las extensiones actuales funcionan: es una mejora de claridad. |
| E07 | Baja | Los DTO de incidencias, versiones y plazos están juntos en `dto/enrollment/`, que tiene 11 archivos. También conviven nombres como `CreateCourseRequest` y `PracticeDeadlineRequest`, y una clase contenedora `PracticeIncidentRequests`. | No es incorrecto que pertenezcan al contexto de una asignación; conviene definir un criterio consistente al crecer. Propuesta: subpaquetes `enrollment/incident`, `enrollment/documentversion`, `enrollment/deadline`, y nombres de solicitudes según operación cuando haya varias. |
| E08 | Baja | `components/ui/` incluye `AccountMenu` con perfil, roles y autenticación, y `AgendaView` con jornadas y asistencias de prácticas. | La carpeta mezcla primitivas visuales y componentes de aplicación. Mantener allí botones, campos, diálogos y tablas; ubicar cuenta y agenda con sus funcionalidades o en componentes compartidos de aplicación. |
| E09 | Baja | Se encontraron 55 grupos de archivos idénticos, equivalentes a 56 copias adicionales y aproximadamente 4,46 MiB. Gran parte son capturas copiadas entre auditorías. Las evidencias suman 431 archivos y unos 33,59 MiB. | Es duplicación de almacenamiento, no una prueba de código duplicado. Antes de deduplicar, revisar los enlaces de cada informe y la necesidad de conservar un paquete autocontenido de evidencia. Definir una convención de nombres que incluya fecha y propósito para nuevas ejecuciones. |
| E10 | Baja | `docs/bitacora.zip` contiene 20 archivos y 4 entradas de directorio. Catorce archivos coinciden byte a byte con `docs/bitacora/`; seis difieren por cabeceras institucionales añadidas a las fuentes sueltas. | Aclarar si el ZIP es una entrega congelada o un artefacto regenerable. Si es una entrega, nombrarlo con fecha o versión y documentar cómo se genera; si es regenerable, evitar mantener dos fuentes editables. No se comprobó una divergencia funcional entre estas copias. |
| E11 | Baja | `FrontEnd/package.json` se identifica como `front`; el artefacto Maven se llama `systemsgp` y su nombre y descripción están vacíos. Las carpetas principales usan `BackEnd` y `FrontEnd`. | Dar identidad explícita al paquete frontend, por ejemplo `sgp-frontend`, y completar metadatos del backend. Las mayúsculas de las carpetas son coherentes entre sí; cambiarlas a `backend` y `frontend` es opcional y debe ser un cambio separado por sus numerosas referencias. |

## Duplicaciones que tienen una explicación

- El logotipo aparece en los recursos del backend, en los assets del frontend y en las imágenes de la bitácora. Cada construcción consume sus propios recursos. Conservar estas copias es razonable; si cambia la identidad institucional, conviene comprobarlas juntas.
- La captura `docs/bitacora/imagenes/interfaz-login.png` coincide con `docs/testing/evidencias/diseno-academico/light-1440-login.png`: una ilustra el documento académico y la otra conserva evidencia de QA.
- Las sondas Java de `docs/testing/qa/probes/` están fuera de la suite Maven de forma deliberada. Los informes explican que reproducen diagnósticos históricos; no deben trasladarse indiscriminadamente a `src/test/java/` como aceptación actual.
- Las pruebas React junto a sus componentes son una organización válida; su presencia no convierte una carpeta en desordenada.
- Los diagramas de login en requisitos y en la bitácora tienen audiencias y grados de detalle distintos. Conviene enlazarlos y explicar su alcance, en lugar de asumir que uno sobra.

## Qué está bien y debe conservarse

- No se encontraron archivos vacíos, directorios vacíos ni colisiones de rutas al ignorar mayúsculas y minúsculas dentro del inventario examinado.
- Los paquetes declarados en los archivos Java de `src/main/java` corresponden a sus directorios.
- Git no tiene versionados `node_modules`, `target`, `build` ni `__pycache__`.
- Las migraciones están reunidas en `BackEnd/src/main/resources/db/migration/` con versiones V1–V27 y sin versiones repetidas. No se propone renombrarlas, moverlas ni cambiar sus bytes para homogeneizar nombres.
- Los recursos del backend, perfiles de configuración, recursos públicos y fuentes del frontend ocupan ubicaciones convencionales para sus herramientas.
- La documentación distingue producto, API, requisitos, desarrollo y QA. Los prototipos están separados del frontend operativo y explican su carácter ilustrativo.
- La mezcla de inglés técnico en código y español en documentación no constituye por sí misma un defecto. Traducir nombres de API, modelos y tablas supondría un cambio funcional mucho mayor que esta revisión.

## Árbol sugerido para una reorganización gradual

Es una propuesta de destino, no el árbol ya aplicado. Se preservan los nombres actuales de las raíces para reducir cambios de rutas.

```text
BackEnd/src/main/java/com/sgp/systemsgp/
├── controller/enrollment/{incident,documentversion,deadline}/
├── service/enrollment/{incident,documentversion,deadline}/
├── dto/enrollment/{incident,documentversion,deadline}/
├── model/enrollment/{incident,documentversion,deadline}/
├── repository/enrollment/{incident,documentversion,deadline}/
└── ... capas y dominios restantes, migrados solo cuando sea útil

FrontEnd/src/
├── app/                        Composición y navegación general
├── features/
│   ├── auth/                   Acceso y registro
│   ├── accounts/               Perfil y menú de cuenta
│   ├── courses/                Paralelos, roster y asignaciones
│   ├── practices/              Espacio de trabajo, incidencias y plazos
│   ├── documents/              Formularios, versiones y PDF
│   └── schedules/              Agenda, jornadas y asistencia
├── components/ui/              Primitivas visuales compartidas
├── api/, hooks/, utils/        Solo lo transversal
└── assets/, styles/

docs/testing/
├── qa/                         Scripts y entorno reproducible de QA
├── datos/
├── informes/AAAA-MM-DD/        Informe de cada ejecución
└── evidencias/<tema>-AAAA-MM-DD/
```

No conviene crear todos estos directorios vacíos por anticipado. Mover primero una funcionalidad completa, actualizar sus referencias y comprobarla antes de continuar. En Java, revisar además nombres cualificados, imports estáticos, consultas que usen clases por nombre, pruebas y cualquier configuración de escaneo.

## Orden recomendado

1. **Documentación y reproducción:** completar índices, declarar dependencias de QA y unificar la configuración de ubicación del build. Actualmente unos scripts usan `FrontEnd/build` y otros rutas temporales distintas con `SGP_QA_BUILD_PATH`.
2. **Nombres locales:** corregir nombres y extensiones puntuales en un cambio independiente, con imports, mocks y cabeceras actualizados.
3. **Frontend por funcionalidad:** empezar por incidencias, plazos y versiones; después extraer los bloques grandes de documentos y consola de operaciones.
4. **Backend por dominio:** comenzar por los paquetes nuevos y mantener las migraciones SQL en su ubicación actual.
5. **Archivo documental:** decidir la política de entregas ZIP y evidencias autocontenidas antes de deduplicar capturas.

El directorio padre de `SGPv1` contiene además `archivos-corregidos/` con muestras PDF y un ZIP. Está fuera de la raíz Git comprobada; no se contó como código ni como duplicado eliminable del repositorio. Conviene decidir si es material externo de entrega o una referencia que deba documentarse desde los requisitos. No se inspeccionó el contenido de respaldos privados.

## Verificación y límites

Se inspeccionaron rutas, tamaños, número de líneas, manifiestos, imports representativos, declaraciones de paquetes Java, referencias documentales y contenidos del ZIP. Los duplicados se identificaron por SHA-256 del archivo completo. Los tamaños indicados son del contenido actual, no del historial Git ni del espacio ocupado por dependencias.

El verificador documental previo a este informe comprobó 90 archivos Markdown, 540 enlaces locales y 202 rutas documentadas, sin errores ni migraciones duplicadas. La validez de los enlaces no demuestra que un índice esté completo: E02 es una omisión de navegación, no un enlace roto.

No se ejecutaron las suites funcionales para esta revisión de organización; no se modificó código ejecutable. Las mejoras propuestas requieren sus propias verificaciones al aplicarse. Este inventario tampoco certifica que todos los archivos estén en uso: no se eliminó contenido a partir de nombres, tamaños o igualdad de bytes.

[Volver al índice de informes](../README.md). Criterios de mantenimiento en la [guía documental](../../../mantenimiento-documentacion.md).

La aplicación posterior de estas recomendaciones se documenta en [reorganización aplicada](reorganizacion-aplicada.md). Los conteos y ubicaciones de este diagnóstico describen el árbol anterior a esa aplicación.
