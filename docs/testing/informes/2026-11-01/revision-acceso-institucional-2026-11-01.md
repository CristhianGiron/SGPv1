<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          revision-acceso-institucional-2026-11-01.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Revisión del acceso institucional.
-->

# Revisión del acceso institucional

Fecha: 1 de noviembre de 2026. Revisión del frontend React con fixtures aislados de autenticación.

## Diseño y alcance

La página pública de acceso se reorganiza en encabezado institucional, contexto de facultad/carrera y formulario central compacto. Se utilizan siglas tipográficas y los nombres configurados por `InstitutionalContext`; no se fijan esos nombres en el componente. La pantalla mantiene modo claro/oscuro, ayuda, registro de estudiantes y controles de contraseña.

La referencia solicitada fue el [acceso SAC de la UNL](https://sac.unl.edu.ec/cas/login?service=https://estudiantes.unl.edu.ec/login). La consulta pública devolvió un bloqueo desde este entorno. La entrega es una propuesta clásica institucional, sin afirmar una reproducción visual exacta del portal.

## Comportamiento

- La autenticación utiliza el contrato existente de SGP mediante `/api/auth/login`.
- La contraseña admite mostrar/ocultar y aviso de Bloq Mayús.
- Durante la petición se deshabilita la edición y se evitan envíos repetidos.
- Los errores se presentan junto a los campos y permiten reintentar.
- El registro mantiene la ruta `register` y la ayuda conserva su diálogo accesible.
- La orientación de recuperación de acceso remite a la administración del sistema; el frontend actual no incluye un formulario público general para restablecer contraseñas.
- En portátiles de menor altura se reduce el espaciado; los tamaños pequeños conservan desplazamiento vertical para que los controles sigan accesibles.

## Verificación ejecutada

- Frontend: **133 pruebas en 42 suites**, todas aprobadas.
- `npm run build`: compilación optimizada correcta.
- Chrome: **10 vistas**, cinco tamaños (320, 390, 1024, 1366 y 1440 píxeles) y dos temas, sin desbordamiento horizontal observado.
- Interacciones: visibilidad de contraseña, ayuda y Escape, error de autenticación en línea, reintento satisfactorio, navegación al registro e identidad institucional configurable.
- Total del script: **13 comprobaciones sin errores**.

Reproducción desde `SGPv1`, con el frontend ya compilado:

```bash
node docs/testing/qa/browser-login-institucional.cjs
```

[Evidencia JSON](../../evidencias/evidencia-login-institucional.json). Capturas en `/tmp/sgp-login-institucional-*.png`.

Todas las llamadas API del recorrido se interceptan y usan datos simulados. La verificación no inicia sesión en el portal UNL ni comprueba credenciales de personas reales. Las pruebas de componentes comprueban además campos deshabilitados, prevención de solicitudes duplicadas y Bloq Mayús.

[Índice de pruebas](../../README.md) · [Experiencia de trabajo](../../../producto/experiencia-de-trabajo.md).
