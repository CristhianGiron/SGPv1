<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          configuracion-institucional.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Institución predeterminada y ampliación.
-->

# Institución predeterminada y ampliación

La instalación utiliza inicialmente:

- Universidad Nacional de Loja (UNL).
- Facultad de la Educación, el Arte y la Comunicación.
- Pedagogía de las Ciencias Experimentales - Informática.

Al iniciar el backend en un perfil distinto de `test`, el inicializador crea los registros que falten. Reutiliza coincidencias por código o nombre normalizado dentro de su jerarquía, conserva las instituciones existentes y no reactiva registros desactivados o eliminados. Un código ocupado por una jerarquía incompatible produce un error explícito de configuración. La ejecución es idempotente.

No se crean usuarios, periodos ni ciclos ficticios. Administración debe definir ciclos activos en la carrera antes de que los estudiantes puedan registrarse. Cada ciclo público requiere universidad, facultad y carrera activas y no eliminadas.

El endpoint público `GET /api/public/institutional-defaults` proporciona nombres e identificadores efectivos. React lo utiliza para la identidad de la instalación y los valores iniciales de formularios. El registro preselecciona esta jerarquía solo si tiene ciclos disponibles, permite cambiar de universidad y exige elegir el ciclo. Las selecciones realizadas por el usuario se conservan. La afiliación y los permisos de las cuentas existentes no se cambian automáticamente.

## Agregar universidades, facultades y carreras

1. Como administrador, abre **Estructura académica** y crea una universidad.
2. Crea sus facultades y carreras con las relaciones correspondientes.
3. Define ciclos activos y asigna carreras y ciclos a las cuentas que corresponda.
4. Las opciones disponibles se incorporan al registro por universidad, facultad y carrera. No es necesario modificar código ni cambiar el predeterminado de la instalación.

Para cambiar también la identidad predeterminada, configura en el entorno del backend:

| Variable | Valor inicial |
| --- | --- |
| `SGP_UNIVERSITY_CODE` | `UNL` |
| `SGP_UNIVERSITY_NAME` | `Universidad Nacional de Loja` |
| `SGP_FACULTY_CODE` | `UNL-FEAC` |
| `SGP_FACULTY_NAME` | `Facultad de la Educación, el Arte y la Comunicación` |
| `SGP_CAREER_CODE` | `UNL-PCEI` |
| `SGP_CAREER_NAME` | `Pedagogía de las Ciencias Experimentales - Informática` |
| `SGP_SEED_INSTITUTIONAL_DEFAULTS` | `true` |

Reinicia el backend después de cambiar estas variables. `false` desactiva la creación automática, manteniendo la consulta de la jerarquía configurada si ya existe. El frontend contiene los nombres iniciales como respaldo visual si no puede cargar el endpoint; estos valores de respaldo están en `FrontEnd/src/config/institutionalDefaults.json` y no asignan permisos ni identificadores.

Los controles de acceso operan sobre los vínculos de cada cuenta y práctica, no sobre nombres institucionales ni IDs fijos. El director consulta su ámbito académico; administración mantiene el catálogo global. Esta estructura admite varias universidades dentro de una misma instalación; no constituye aislamiento completo entre inquilinos, pues los centros receptores son compartidos y administración tiene alcance global.
