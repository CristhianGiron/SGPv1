<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          mantenimiento-documentacion.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Mantenimiento de la documentación.
-->

# Mantenimiento de la documentación

## Dónde escribir

| Contenido | Ubicación |
| --- | --- |
| Flujo o comportamiento de usuario | `docs/producto/` |
| Endpoint, autenticación o ejemplo de petición | `docs/api/postman/` |
| Preparación del entorno y uso de componentes | `docs/desarrollo/` |
| Requisitos, actores y casos de uso | `docs/requisitos/especificacion.md` |
| Informe de una ejecución | `docs/testing/informes/AAAA-MM-DD/` |
| Resultado JSON de verificaciones | `docs/testing/evidencias/` |
| Script de QA | `docs/testing/qa/` |
| Datos de demostración | `docs/testing/datos/` |

## Criterios de contenido

- Cada archivo debe tener un título principal, propósito claro y enlaces relativos a su guía de entrada y fuentes relevantes.
- Las guías describen comportamiento; los informes describen lo observado en una ejecución concreta. No actualice los conteos de una revisión antigua con resultados posteriores.
- Compruebe nombres de roles, recursos, estados y reglas con el código. Diferencie numeración de formatos institucionales de secuencia operativa.
- Mantenga un solo punto de referencia para cada tema. Enlace la guía correspondiente en lugar de duplicar su contenido en varios índices.
- Los ejemplos deben usar identificadores sustituibles y datos de prueba. No documente contraseñas locales cambiantes como si fueran credenciales universales.
- Cuando mueva un archivo, actualice enlaces, rutas de salida de scripts y referencias textuales. Los nombres de rutas API y las claves JSON no se traducen.
- La especificación Markdown es la fuente del catálogo; actualice sus representaciones tabulares y diagramas si cambia el contenido. No sobrescriba material fuente histórico.

## Comprobación

Desde la raíz `SGPv1`:

```bash
python3 docs/herramientas/verificar_documentacion.py
node docs/testing/qa/check-contracts.cjs
```

El primer comando comprueba archivos enlazados, títulos, bloques de código y correspondencia de las rutas documentadas en tablas con controladores. No ejecuta peticiones API ni demuestra permisos o validez de los cuerpos. El segundo comprueba contratos configurados en los módulos de interfaz y actualiza su evidencia.

[Volver al índice documental](README.md).

Las convenciones de nombres y las rutas actuales del código se describen en [estructura del proyecto](desarrollo/estructura-proyecto.md). Los paquetes de entrega se conservan con fecha en `docs/entregas/`.
