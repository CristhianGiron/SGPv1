<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          informe-validacion-funcional-ui.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Informe de validación funcional y de interfaz.
-->

# Informe de validación funcional y de interfaz

> Informe de una ejecución específica. Sus conteos se conservan como evidencia histórica; consulte el [índice de pruebas](../../README.md) para localizar las revisiones posteriores.


**Generado:** 2026-10-26  
**Proyecto:** SGPv1  
**Resultado general:** PASS

## Resumen

| Capa | Estado | Código de salida | Resultado |
|---|---|---:|---|
| Aplicación local | PASS | n/a | Interfaz y API locales disponibles para las pruebas |
| Backend | PASS | 0 | 19 suites, 81 pruebas, 0 fallos, 0 errores, 0 omitidas |
| Frontend | PASS | 0 | 7 suites, 12 pruebas, 0 fallos |
| Playwright | PASS | 0 | 8 pruebas, 8 aprobadas |

## Alcance

### Matriz de interfaz por rol

Se recorrieron 62 combinaciones de rutas y roles para estos seis perfiles: administrador, estudiante, tutor de prácticas, director de prácticas, tutor institucional y director de institución. La matriz cubre entrevistas, fichas de observación, paralelos y archivo de prácticas, planificaciones didácticas, documentos permitidos por rol, horarios, instituciones/universidades, seguimiento, usuarios, territorio y evidencias.

Para cada ruta se comprobó que apareciera el encabezado esperado. Durante el recorrido se vigilaron errores JavaScript no capturados y respuestas HTTP 5xx. La matriz terminó sin errores de navegador ni respuestas 5xx. Se confirmó, además, que el horario del estudiante se presenta como **“Mis jornadas”** y el de los demás roles como **“Jornadas y asistencias”**.

También se comprobó que:

- El estudiante no obtiene la pantalla de administración de usuarios al intentar abrir su ruta.
- El formulario de acceso informa el rechazo de credenciales inválidas.

### Flujos funcionales de API

- **Planificación didáctica:** creación de borrador, envío, recomendación del tutor, corrección y reenvío; se verificó la lectura posterior.
- **Entrevista:** creación y envío por el estudiante, asignación al tutor institucional, respuesta del tutor e interpretación del estudiante; se verificó el resultado guardado.
- **Ficha de observación:** creación, envío, respuesta del estudiante y lectura posterior de la respuesta.
- **Autorización:** solicitud sin token rechazada con HTTP 401 y acceso del estudiante a la bandeja administrativa rechazado con HTTP 403.

Los flujos crearon o actualizaron registros de prueba asociados a la inscripción 3; los registros no se eliminaron.

## Evidencia y comandos

### Backend

```bash
cd SGPv1/BackEnd && mvn test -q
```

Resultado: código 0; 19 suites y 81 pruebas, sin fallos, errores ni omisiones.

### Frontend

```bash
cd SGPv1/FrontEnd && CI=true npm test -- --watchAll=false --runInBand
```

Resultado: código 0; 7 suites y 12 pruebas aprobadas.

### Playwright

```bash
cd /home/cristhian/.copilot/session-state/21b6c13d-a30b-4dfa-ae13-c058545c3a44/qa && npx playwright test --config=playwright.config.cjs
```

Resultado: código 0; 8 pruebas aprobadas. La ejecución final cubrió los flujos API de planificación, entrevista y ficha de observación, además de navegación por roles, acceso restringido y rechazo de credenciales inválidas.

Las credenciales de prueba se leyeron localmente de la guía Postman. El harness conserva los tokens solo durante la ejecución, con permisos restringidos, y los elimina en el teardown.

## Ajuste aplicado a la matriz

La prueba de navegación visita muchas rutas para los seis roles en una misma ejecución. El timeout predeterminado de 45 segundos podía expirar durante ese recorrido, aunque las pantallas fueran correctas. Se aumentó a 120 segundos en la configuración aislada de Playwright. La matriz completa pasó con la configuración predeterminada resultante.

La expectativa de títulos por rol se conserva explícita, incluida la diferencia de encabezado en horarios. No fue necesario modificar código de producción.

## Entorno y límites

- Node.js: disponible (v22.22.3).
- Playwright: disponible (v1.64.1); pruebas de navegador ejecutadas en Chromium headless.
- Docker: no disponible; no se validó contra infraestructura efímera administrada por Docker.
- Se probaron los servicios locales ya disponibles. Los resultados no sustituyen una validación de despliegue ni garantizan ausencia de defectos fuera de las rutas y flujos cubiertos.
- El setup de autenticación puede esperar 62 segundos ante HTTP 429 por el límite local de inicios de sesión; no afectó el resultado.

## Hallazgos

No quedaron fallos de prueba ni defectos reproducibles dentro del alcance ejecutado. La falla previa de la matriz fue un timeout global del test al recorrer las rutas; con el margen corregido, la matriz pasó completa. No se reporta como defecto de la aplicación.

## Veredicto

```text
environment:
  docker: UNAVAILABLE — docker info no disponible
  node: AVAILABLE — v22.22.3
  playwright: AVAILABLE — v1.64.1, Chromium headless
  infra-tier: UNVERIFIED — no se inició infraestructura Docker para esta validación
  browser-tier: PRIMARY(Playwright) — matriz ejecutada por los seis roles
startup: PASS — servicios locales UI/API respondieron durante las pruebas
integration: PASS — exit_code: 0, 81 tests, 0 failed, 0 skipped (backend); 12 tests, 0 failed (frontend)
e2e: PASS — exit_code: 0, 8 passed, 0 failed; flujos de roles, permisos, autenticación, planificación, entrevista y ficha
overall: PASS — todas las pruebas ejecutadas terminaron con código 0
```
