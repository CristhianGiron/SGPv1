<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          README.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Pruebas, evidencias y demostración.
-->

# Pruebas, evidencias y demostración

## Cómo consultar los resultados

La [auditoría integral del 7 de noviembre de 2026](informes/2026-11-07/auditoria-integral.md) incluye el recorrido por pantallas y pestañas, pruebas del backend y diez hallazgos reproducidos. Consulte su matriz de cobertura y sus límites antes de interpretar los resultados generales.

- [Índice de informes fechados](informes/README.md): revisiones, alcance y límites de cada ejecución.
- [Evidencias JSON](evidencias/README.md): salidas reproducibles de los scripts.
- [Usuarios y escenarios de demostración](datos/usuarios-demostracion.md): datos locales y preparación de ejemplos.

La revisión histórica del [acceso institucional](informes/2026-11-01/revision-acceso-institucional-2026-11-01.md) registra 133 pruebas frontend y diez vistas de escritorio/móvil con ambos temas, mediante fixtures. La revisión de [bandeja, agenda y diálogos](informes/2026-11-01/revision-bandeja-agenda-dialogos-2026-11-01.md): 128 pruebas frontend y 103 rutas de seis roles con fixtures. El [informe de experiencia por práctica](informes/2026-11-01/revision-experiencia-practicas-2026-11-01.md) registra 121 pruebas de backend de esa entrega. Estos números son resultados documentados, no una ejecución realizada cada vez que se reorganizan los archivos.

Los informes del 26 de octubre y las revisiones anteriores del 1 de noviembre conservan sus conteos originales. Consulte cada alcance antes de comparar resultados.

## Ejecutar pruebas de código

Desde `SGPv1/FrontEnd`:

```bash
CI=true npm test -- --watchAll=false --runInBand
npm run build
```

Desde `SGPv1/BackEnd`:

```bash
./mvnw -q test
```

El backend utiliza el perfil de pruebas H2 según su configuración de test. Las pruebas con persistencia H2, los servicios simulados y el navegador con fixtures tienen alcances distintos; no certifican una instalación productiva.

## Ejecutar comprobaciones de interfaz

Desde `SGPv1`, después de instalar el [entorno de QA](qa/README.md) y compilar el frontend:

| Comando | Qué revisa |
| --- | --- |
| `node docs/testing/qa/check-contracts.cjs` | Correspondencia estática de módulos con controladores |
| `node docs/testing/qa/browser-workspaces.cjs` | Navegación de seis roles y barras de listados |
| `node docs/testing/qa/browser-practice-experience.cjs` | Resumen, borradores, revisión de tutoría y agenda |
| `node docs/testing/qa/browser-login-institucional.cjs` | Acceso, errores, registro, ayuda, identidad configurable y ambos temas |
| `node docs/testing/qa/browser-inbox-agenda.cjs` | Notificaciones, agenda, teclado y presentación adaptable |
| `node docs/testing/qa/browser-workflow-cards.cjs` | Tarjetas de navegación |
| `node docs/testing/qa/browser-action-colors.cjs` | Contraste de acciones y paletas |
| `node docs/testing/qa/browser-routes.cjs` | Matriz de navegación complementaria |

Los scripts Chrome usan el frontend compilado. Instale sus dependencias con `npm ci --prefix docs/testing/qa`; el [entorno de QA](qa/README.md) describe Node, Chrome y las variables de configuración. Las peticiones API se simulan en estos recorridos. Consulte la cabecera de cada script para sus fixtures y salidas.

Los resultados JSON se escriben en `evidencias/`; las capturas se generan en `/tmp`. Las evidencias se pueden sobrescribir al repetir el script, mientras que los informes fechados conservan el contexto de una revisión.

[Volver al índice documental](../README.md).
