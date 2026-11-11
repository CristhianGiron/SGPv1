<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          configuracion-entornos.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Configuracion de entornos.
-->

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

## Compartir en la red local

El frontend detecta el host con el que se abrió en el navegador y usa ese mismo
host para conectarse al backend en el puerto `8080`. Para compartirlo con otros
dispositivos de la misma red:

1. Obtenga la IP local del equipo que ejecuta el sistema (por ejemplo,
   `192.168.1.50`).
2. Inicie el backend indicando esa IP como `SGP_HOST`:

   ```bash
   cd BackEnd
   SGP_HOST=192.168.1.50 ./mvnw spring-boot:run
   ```

3. Inicie el frontend desde otra terminal, escuchando en la red:

   ```bash
   cd FrontEnd
   HOST=0.0.0.0 npm start
   ```

4. Desde otro dispositivo de la misma red, abra
   `http://192.168.1.50:3000`.

Al cambiar de IP, solo hay que actualizar `SGP_HOST` al iniciar el backend y
abrir la nueva IP en el navegador. El frontend actualizará automáticamente la
dirección de la API y las notificaciones WebSocket. Si se cambian los puertos,
configure `FRONTEND_PORT` en el backend y `REACT_APP_API_PORT` en el frontend.
La red/firewall debe permitir el acceso a los puertos `3000` y `8080`. Este
procedimiento es para una red local; para exponer el sistema a Internet se
recomienda un dominio, HTTPS y un proxy inverso.

Variables recomendadas para desarrollo:

```bash
export SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/sgp
export SPRING_DATASOURCE_USERNAME=cristhian
export SPRING_DATASOURCE_PASSWORD=1234
export SPRING_JPA_HIBERNATE_DDL_AUTO=validate
export SPRING_JPA_OPEN_IN_VIEW=false
export SPRING_HIBERNATE_BATCH_FETCH_SIZE=50
export SPRING_SQL_INIT_MODE=never
export SPRING_FLYWAY_ENABLED=true
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

Flyway también gestiona el esquema de desarrollo. El baseline automático queda desactivado: una base heredada sin historial necesita una transición explícita y respaldada antes de arrancar. El perfil de pruebas mantiene H2 y `create-drop`.

## Produccion

En produccion no se debe usar `ddl-auto=update`. El perfil `prod` usa
`validate` y Flyway queda habilitado.

Las migraciones viven en `BackEnd/src/main/resources/db/migration` y forman una cadena única V1–V27. Spring Boot 4 usa `spring-boot-starter-flyway` junto con `flyway-mysql`; tener solamente `flyway-core` no activa su autoconfiguración.

La numeración conserva V2 (retroalimentación), V3 (formularios), V4 (eliminación de aprobación) y V12 (archivo). Las adiciones que colisionaban pasan a V17 (imágenes de interfaz), V18 y V19 (claves de tablas intermedias), y V20 (unicidad). Los scripts históricos conservados no se modifican.

El perfil productivo usa `baseline-on-migrate=false`: una base existente sin historial debe reconciliarse explícitamente antes del despliegue. Consultar `flyway_schema_history` y comparar versión, script y checksum con la cadena actual, especialmente si se aplicó la variante de imágenes como V12 o alguna variante de claves como V2/V3/V4. No ejecutar `repair`, renumerar registros históricos ni habilitar baseline automáticamente para ocultar una divergencia. Crear respaldo y un procedimiento específico para el historial encontrado. La transición local ejecutada el 9 de noviembre de 2026 se documenta en el [registro de aplicación](../testing/informes/2026-11-09/aplicacion-migraciones-local.md). Ese historial corresponde únicamente a esta instalación.

La comprobación aislada se ejecuta con `python3 docs/testing/qa/check-migrations-isolated.py`; requiere MariaDB instalado y crea tres bases en una instancia temporal. Comprueba las 27 migraciones, la actualización V20→V27 con inscripciones existentes, validación/repetición sin cambios y arranque automático con Flyway y `ddl-auto=validate`. El motor de esta prueba es MariaDB, con su driver y dialecto; una instalación MySQL debe validarse también con su versión y copia del esquema de destino.

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

## Pertenencias académicas desde V21

V21 crea `course_student_memberships` y conserva como pertenencias los vínculos estudiante/paralelo de las inscripciones existentes en estado PENDING, APPROVED o COMPLETED. No asigna paralelos por compartir ciclo ni concede pertenencia a partir de solicitudes rechazadas. Las asignaciones nuevas se gestionan desde dirección o administración.

La migración debe aplicarse mediante el historial Flyway antes de arrancar el código actualizado sobre un entorno existente. `ddl-auto=update` por sí solo puede crear la tabla, pero no ejecuta el traslado de datos de V21. El arranque por defecto habilita Flyway y usa Hibernate en modo `validate`; no usar `update` como sustituto de las migraciones. No active Flyway ni aplique SQL a una base con historial divergente sin reconciliar antes lo descrito en esta guía. La validación adjunta utiliza bases temporales, no modifica la instalación real.


## Incidencias, versiones y plazos

La [segunda etapa de gestión de prácticas](../testing/informes/2026-11-10/incidencias-versiones-plazos-etapa2.md) incorpora las migraciones V25–V27. La aplicación mantiene Flyway habilitado y Hibernate en `validate`; un backend antiguo no debe seguir escribiendo al actualizarlo a los estados nuevos.

Los avisos de plazos son internos. Configuración opcional:

```properties
app.practice.reminders-enabled=true
app.practice.reminders-initial-delay-ms=60000
app.practice.reminders-delay-ms=3600000
```

Las fechas límite se introducen e interpretan en `America/Guayaquil`. No se activa el planificador con el perfil `test`. Los PDF de versiones conservadas aumentan el tamaño de la base; la política de respaldos y capacidad de almacenamiento debe incluirlos.
