<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          aplicacion-migraciones-local.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Aplicación de migraciones en la base local.
-->

# Aplicación de migraciones en la base local

Fecha: 9 de noviembre de 2026. Aplicación solicitada expresamente por el usuario sobre la base configurada `sgp`, en MariaDB local.

## Resultado

La base quedó en **V23**, con historial Flyway validado. Se conservaron las 14 inscripciones y todos los conteos de las tablas existentes. Las 14 inscripciones quedaron enlazadas a sus prácticas: se trasladaron 14 pertenencias académicas y se crearon 3 prácticas, una por paralelo anterior.

El backend comprobó el esquema con Hibernate en modo `validate`. El servicio local respondió HTTP 200 en `/api/public/institutional-defaults` después de reanudarlo.

## Estado encontrado y transición

La instalación no tenía `flyway_schema_history`. Hibernate había creado las tablas nuevas vacías, la columna `practice_id` sin enlaces y las columnas e índices nuevos, conservando también el índice antiguo que restringía al estudiante a una inscripción por paralelo. No bastaba con la creación automática de columnas: faltaba el traslado de datos.

Se comprobó que no había pertenencias contradictorias por ciclo, inscripciones sin estudiante/paralelo, inscripciones sin ciclo ni valores intermedios duplicados. Se ensayó la transición sobre una copia del respaldo en una instancia MariaDB temporal y se validó allí el arranque del backend.

Tras pausar brevemente el backend y verificar la ausencia de transacciones activas, se creó el respaldo definitivo. Solo se retiraron las estructuras nuevas vacías creadas parcialmente por Hibernate; no se eliminaron filas de negocio. Se registró un baseline explícito en V17 para el esquema heredado comprobado y se ejecutaron V18–V23 mediante Flyway. V18/V19 reconocieron las claves ya existentes y V20 no encontró duplicados que retirar. No se usó `repair` ni se cambiaron los scripts o checksums históricos.

| Versión | Tipo | Estado |
| --- | --- | --- |
| 17 | Baseline explícito del esquema heredado | Correcto |
| 18 | Clave de niveles educativos | Correcto |
| 19 | Clave de opciones de respuestas | Correcto |
| 20 | Unicidad de valores intermedios | Correcto |
| 21 | Pertenencia académica al paralelo | Correcto |
| 22 | Prácticas y asignación administrativa | Correcto |
| 23 | Un paralelo activo por ciclo | Correcto |

Las versiones anteriores al baseline no se presentan como migraciones ejecutadas: corresponden al esquema heredado comprobado. Este procedimiento es específico de la instalación encontrada y no debe repetirse automáticamente en otras bases.

## Respaldo y comprobaciones

Respaldo privado fuera del repositorio: `/home/cristhian/Escritorio/SGP/.backups/sgp-20261109-110126/before.sql`. Directorio con permisos 0700; archivo SQL con permisos 0600. Tamaño: 295675 bytes. SHA-256: `b56af39e9b9889555353a6d89558458a66df73037f4b8ab67b2c8f72b1bf63c8`. Los registros de ensayo, aplicación y validación se conservan en el directorio del respaldo. El volcado contiene datos de la aplicación y no se incorporó al repositorio.

Comprobaciones posteriores:

- 14/14 inscripciones con práctica coherente con su paralelo.
- 14/14 pertenencias activas con ciclo enlazado.
- 3 prácticas migradas.
- Retirado el índice antiguo estudiante/paralelo; la unicidad vigente es estudiante/práctica.
- Historial Flyway con las seis migraciones aplicadas correctamente y sin pendientes.
- Ninguna variación en el número de filas de las tablas de negocio existentes.
- Arranque con validación de esquema y respuesta HTTP 200 del backend local.

## Arranque posterior

Los valores predeterminados quedan en `spring.flyway.enabled=true`, `spring.jpa.hibernate.ddl-auto=validate` y `spring.flyway.baseline-on-migrate=false`. Así Hibernate no sustituye los traslados de datos de las migraciones. El perfil de pruebas conserva su configuración H2 independiente. Las variables de entorno pueden sobrescribir esos valores; la guía de entornos se actualizó para usar los valores de migración.

La verificación de arranque utiliza el perfil adicional `test` para evitar que los inicializadores inserten datos mientras se comprueba la base real. El backend habitual de desarrollo se reanudó y permanece accesible.
