<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          cuenta-apariencia.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Cuenta, perfil y apariencia — 2026-11-06.
-->

# Cuenta, perfil y apariencia — 2026-11-06

El menú de cuenta agrupa identidad, roles, acceso al perfil, apariencia y cierre de sesión. La apariencia diferencia modo claro/oscuro/sistema de la paleta. Las preferencias existentes mantienen sus claves y valores válidos. El estado compartido evita que distintos controles sobrescriban la elección y permite seguir los cambios del dispositivo y de otras pestañas.

## Verificación

- Compilación de producción del frontend correcta.
- Suite completa: **51 suites y 173 pruebas aprobadas**.
- Regresión del panel de accesibilidad: **46 comprobaciones en Chrome sin errores**.
- Validador documental: sin errores en 364 enlaces locales.
- Chrome con API simulada: **126 comprobaciones sin errores**, en 320, 390, 768 y 1440 px, con preferencia inicial clara y oscura.
- Se comprobaron geometría de avatares, límites del panel, controles de cierre y sesión visibles, texto al 200 %, navegación por teclado, foco y desbloqueo de desplazamiento, apertura desde navegación móvil y acceso al perfil.
- Se comprobaron modo automático, independencia del modo explícito frente al dispositivo, selección de paletas, persistencia al recargar y convivencia con ajustes de accesibilidad.
- Las pruebas unitarias incluyen almacenamiento bloqueado y recuperación, sincronización entre controles y eventos de otras pestañas, seguimiento del dispositivo y acciones explícitas de perfil y salida.

Los fixtures incluyen nombre y correo largos con caracteres españoles y varios roles. Estas comprobaciones no sustituyen pruebas con usuarios, lectores de pantalla o múltiples navegadores; no constituyen una certificación de accesibilidad.

## Reproducción y evidencia

Desde la raíz del repositorio, después de compilar `FrontEnd`:

```bash
node docs/testing/qa/browser-account-appearance.cjs
```

- [Resultado estructurado](../../evidencias/cuenta-apariencia/resultado.json).
- [Móvil claro](../../evidencias/cuenta-apariencia/light-390.png).
- [Móvil oscuro](../../evidencias/cuenta-apariencia/dark-390.png).
- [Escritorio claro](../../evidencias/cuenta-apariencia/light-1440.png).
- [Escritorio oscuro](../../evidencias/cuenta-apariencia/dark-1440.png).
- [Guía del usuario](../../../producto/apariencia-y-cuenta.md).

[Volver a informes](../README.md).
