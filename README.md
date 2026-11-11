<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          README.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta SGPv1.
-->

# SGPv1

Sistema de gestión de prácticas académicas compuesto por una API Spring Boot y
una aplicación web React.

## Componentes

- [Backend](BackEnd/README.md): API REST, seguridad, persistencia y migraciones.
- [Guía de desarrollo frontend](docs/desarrollo/frontend/guia-desarrollo.md):
  interfaz web, autenticación, navegación y comandos de trabajo.
- [Índice de documentación](docs/README.md): requisitos, permisos, guías técnicas
  y artefactos relacionados.

## Primeros pasos

1. Configure los perfiles y la conexión de base de datos según la
   [guía de entornos](docs/desarrollo/configuracion-entornos.md).
2. Inicie la API desde `BackEnd` con `./mvnw spring-boot:run`.
3. Instale dependencias e inicie la interfaz desde `FrontEnd` con
   `npm install` y `npm start`.
4. Para probar endpoints, siga la [guía Postman](docs/api/guia-postman.md).

En desarrollo local, la interfaz usa el proxy para comunicarse con la API en
`http://localhost:8080`. Para cambiar a una IP compartida en la red local,
consulte la [guía de configuración de entornos](docs/desarrollo/configuracion-entornos.md).


## Documentación por tarea

- [Flujos y permisos del sistema](docs/producto/README.md).
- [Requisitos y artefactos](docs/requisitos/README.md).
- [API y Postman](docs/api/README.md).
- [Desarrollo y operación](docs/desarrollo/README.md).
- [Pruebas, informes y evidencias](docs/testing/README.md).

Los [prototipos HTML/CSS](prototipos-interfaces/README.md) se conservan como material de diseño independiente del frontend React.
