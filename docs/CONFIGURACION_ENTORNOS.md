# Configuracion de entornos

Esta guia resume como levantar el SGP sin mezclar configuracion de desarrollo,
pruebas y produccion.

## Perfiles

- Sin perfil activo, Spring usa el perfil `dev` por defecto.
- En pruebas se usa el perfil `test`, con H2 en memoria.
- En produccion se debe usar `SPRING_PROFILES_ACTIVE=prod`.

## Desarrollo local

Por defecto el backend intenta conectarse a:

```text
jdbc:mysql://localhost:3306/sgp
```

Variables recomendadas para desarrollo:

```bash
export SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/sgp
export SPRING_DATASOURCE_USERNAME=cristhian
export SPRING_DATASOURCE_PASSWORD=1234
export SPRING_JPA_HIBERNATE_DDL_AUTO=update
export SPRING_JPA_OPEN_IN_VIEW=false
export SPRING_HIBERNATE_BATCH_FETCH_SIZE=50
export SPRING_SQL_INIT_MODE=never
export SPRING_FLYWAY_ENABLED=false
export SPRING_DEBUG=false
export SPRING_LOG_LEVEL=info
export SPRING_FRAMEWORK_LOG_LEVEL=info
export JWT_SECRET=dev-default-jwt-secret-please-change-this-32chars!
```

El dialecto de desarrollo queda definido en `application-dev.properties`:

```bash
export SPRING_JPA_HIBERNATE_DIALECT=org.hibernate.dialect.MySQLDialect
```

Si se usa MariaDB, cambiarlo a:

```bash
export SPRING_JPA_HIBERNATE_DIALECT=org.hibernate.dialect.MariaDBDialect
```

Si el sistema operativo define una variable generica `DEBUG`, Spring puede
interpretarla como modo debug. El backend normaliza valores no booleanos como
`DEBUG=release` a `debug=false`. Para activar debug real, usar `SPRING_DEBUG=true`
o ejecutar el backend con `--debug`.

## Produccion

En produccion no se debe usar `ddl-auto=update`. El perfil `prod` usa
`validate` y Flyway queda habilitado.

Las migraciones viven en `BackEnd/src/main/resources/db/migration`. En una base
limpia Flyway aplica primero `V1__baseline_schema.sql` y luego los cambios
incrementales. En una base historica no vacia, `baseline-on-migrate=true`
permite registrar el punto de partida antes de aplicar migraciones posteriores.

Variables minimas:

```bash
export SPRING_PROFILES_ACTIVE=prod
export SPRING_DATASOURCE_URL=jdbc:mysql://host:3306/sgp
export SPRING_DATASOURCE_USERNAME=usuario
export SPRING_DATASOURCE_PASSWORD=clave
export SPRING_JPA_HIBERNATE_DDL_AUTO=validate
export SPRING_JPA_OPEN_IN_VIEW=false
export SPRING_HIBERNATE_BATCH_FETCH_SIZE=50
export SPRING_SQL_INIT_MODE=never
export SPRING_FLYWAY_ENABLED=true
export SPRING_DEBUG=false
export SPRING_LOG_LEVEL=info
export SPRING_FRAMEWORK_LOG_LEVEL=info
export JWT_SECRET=una-clave-larga-y-segura
```

## Pruebas

Las pruebas usan `application-test.properties` y no dependen de MySQL local:

- Base H2 en memoria.
- `ddl-auto=create-drop`.
- Flyway deshabilitado.
- Seeders de datos base desactivados por `@Profile("!test")`.

Comando recomendado:

```bash
cd BackEnd
./mvnw test
```

## Error de dialecto

Si aparece un error como:

```text
Unable to determine Dialect without JDBC metadata
```

revisar dos cosas:

- Que el perfil activo sea correcto.
- Que `SPRING_JPA_HIBERNATE_DIALECT` tenga un valor compatible con la base.

Para MySQL:

```bash
export SPRING_JPA_HIBERNATE_DIALECT=org.hibernate.dialect.MySQLDialect
```

Para MariaDB:

```bash
export SPRING_JPA_HIBERNATE_DIALECT=org.hibernate.dialect.MariaDBDialect
```
