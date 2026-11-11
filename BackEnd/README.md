<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          README.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Backend de SGPv1.
-->

# Backend de SGPv1

API REST de SGPv1 implementada con Spring Boot y Maven. El proyecto requiere
Java 17; la configuración de perfiles y base de datos está centralizada en la
[guía de entornos](../docs/desarrollo/configuracion-entornos.md).

## Ejecución y pruebas

Desde `BackEnd`:

```bash
./mvnw spring-boot:run
./mvnw test
```

La API local se ejecuta en `http://localhost:8080`. Configure las variables de
conexión y seleccione el perfil requerido antes de iniciar el servicio.

## Documentación

- [Guía Postman de la API](../docs/api/guia-postman.md): autenticación, variables
  y secuencia de pruebas de endpoints.
- [Configuración de entornos](../docs/desarrollo/configuracion-entornos.md).
- [Documentación general](../docs/README.md).
