<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          README.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Desarrollo y operación.
-->

# Desarrollo y operación

## Preparación del entorno

1. Consulte [configuración de entornos](configuracion-entornos.md) y seleccione el perfil.
2. Ejecute el [backend](../../BackEnd/README.md).
3. Ejecute el frontend con la [guía de desarrollo](frontend/guia-desarrollo.md).
4. Pruebe la API mediante la [guía Postman](../api/guia-postman.md).

La sección de producción de la guía de entornos identifica limitaciones pendientes de las migraciones; ejecutar pruebas H2 no valida una migración de MySQL en producción.

## Referencias del frontend

- [Guía de desarrollo](frontend/guia-desarrollo.md): estructura, permisos y extensión de páginas.
- [Referencia de funciones](frontend/referencia-funciones.md): hooks, cliente HTTP, formato y componentes.
- [Componentes de experiencia de usuario](frontend/componentes-experiencia.md): contexto de práctica, borradores, agenda, bandeja y diálogos.

## Verificación

- [Pruebas y resultados](../testing/README.md).
- [Mantenimiento documental](../mantenimiento-documentacion.md).

[Volver al índice documental](../README.md).

- [Estructura y convenciones del proyecto](estructura-proyecto.md).
