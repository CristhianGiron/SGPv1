<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          informe-interacciones-interfaz.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Revisión de interacciones y animaciones de la interfaz.
-->

# Revisión de interacciones y animaciones de la interfaz

> Informe de una ejecución específica. Sus conteos se conservan como evidencia histórica; consulte el [índice de pruebas](../../README.md) para localizar las revisiones posteriores.


**Fecha:** 2026-10-26  
**Alcance:** navegación, menú móvil, modales, búsqueda, tema y movimiento reducido  
**Resultado:** se identificaron seis problemas reproducibles, se corrigieron y se verificaron con Playwright.

## Resumen de pruebas

Se usó Playwright con Chromium headless contra la aplicación local. La ejecución exploratoria inicial ejecutó ocho escenarios:

- 2 aprobados: búsqueda global con navegación y cambio/persistencia de tema y paleta.
- 6 fallidos: cierre del menú móvil, scroll del fondo, scroll/foco del modal y movimiento reducido.

Los seis fallos se reprodujeron con interacción real de navegador y no eran errores del selector de prueba. El comando fue:

```bash
cd /home/cristhian/.copilot/session-state/21b6c13d-a30b-4dfa-ae13-c058545c3a44/qa
npx playwright test --config=playwright.config.cjs tests/interface-interactions.spec.cjs
```

Resultado inicial: código de salida 1, 2 aprobados y 6 fallidos.

## Hallazgos

| # | Severidad | Hallazgo | Evidencia |
|---|---|---|---|
| 1 | Media | El menú lateral móvil no se cierra con `Escape`. | Al abrir el diálogo “Menu principal” y pulsar Escape, sigue visible tras 10 s. [AppLayout.jsx](../../../../FrontEnd/src/app/layout/AppLayout.jsx) |
| 2 | Media | Pulsar el backdrop fuera del menú no lo cierra. | En viewport de 768 px, el clic en la zona oscura exterior al panel deja el diálogo abierto. [AppLayout.jsx](../../../../FrontEnd/src/app/layout/AppLayout.jsx) |
| 3 | Media | El menú móvil no bloquea el desplazamiento de la página subyacente. | Con el menú abierto, `overflow` calculado de `body` y `html` sigue siendo `visible`. [AppLayout.jsx](../../../../FrontEnd/src/app/layout/AppLayout.jsx) |
| 4 | Media | Los modales generales no bloquean el scroll de fondo. | En el modal “Filtrar fotografías”, `overflow` de `body` y `html` permanece `visible`. La vista ampliada de evidencias sí implementa este bloqueo, por lo que el comportamiento es inconsistente entre overlays. [Modal.jsx](../../../../FrontEnd/src/components/ui/Modal.jsx) y [PhotosPage.jsx](../../../../FrontEnd/src/features/evidence/pages/PhotosPage.jsx) |
| 5 | Media | Los modales no mueven el foco al diálogo al abrirse. | Al abrir “Filtrar fotografías”, el foco permanece fuera del elemento `role="dialog"`. Esto dificulta el uso por teclado y tecnologías de asistencia, pese a que el diálogo declara `aria-modal="true"`. [Modal.jsx](../../../../FrontEnd/src/components/ui/Modal.jsx) |
| 6 | Baja | La animación del menú móvil ignora la preferencia de movimiento reducido. | Con `prefers-reduced-motion: reduce`, el menú conserva `transition-duration: 0.2s`. La regla CSS actual solo desactiva algunas transiciones de tarjetas. [index.css](../../../../FrontEnd/src/index.css) y [AppLayout.jsx](../../../../FrontEnd/src/app/layout/AppLayout.jsx) |

## Correcciones aplicadas y verificación

- El menú móvil ahora se cierra con Escape y al pulsar sobre el backdrop; también bloquea el scroll del fondo durante su apertura.
- Los modales compartidos bloquean el scroll de fondo, enfocan el diálogo al abrirse y devuelven el foco al elemento anterior al cerrarse; un clic sobre el backdrop los cierra.
- Se añadió una regla global para reducir animaciones, transiciones y desplazamiento suave cuando se activa `prefers-reduced-motion`.

Resultados posteriores a las correcciones:

| Verificación | Resultado |
|---|---|
| Pruebas focalizadas de interacción | 8/8 aprobadas, código 0 |
| Suite completa Playwright | 16/16 aprobadas, código 0 |
| Pruebas frontend | 7 suites, 12 pruebas aprobadas, código 0 |
| Build de producción frontend | Compilación correcta, código 0 |

No fue necesario cambiar endpoints ni datos de la base de datos.

## Interacciones que pasaron

- La búsqueda global enfoca el campo, permite buscar “entrevistas”, navega a esa pantalla y cierra su estado desplegado.
- El menú de perfil cambia tanto la paleta como el modo claro/oscuro y persiste ambas opciones en `localStorage`.
- La vista ampliada de evidencias bloquea el scroll de `body` y `html`, cierra con Escape y restaura los valores previos al desmontarse.

## Cobertura y límites

La ronda se centró en controles globales de alto uso y overlays; no representa una prueba exhaustiva de cada botón de cada módulo. Los flujos Playwright completos sí añadieron registros de prueba de planificación, entrevista y ficha de observación asociados a la inscripción 3; estos se conservaron. La prueba focalizada está en el harness aislado de la sesión:

- [interface-interactions.spec.cjs](../../../../../../../.copilot/session-state/21b6c13d-a30b-4dfa-ae13-c058545c3a44/qa/tests/interface-interactions.spec.cjs)

## Recomendación

El cierre de menú, scroll de fondo, foco de diálogo y movimiento reducido quedaron corregidos y verificados. Se recomienda mantener estas pruebas en las futuras rondas de regresión y ampliar gradualmente la cobertura de interacciones de cada módulo.
