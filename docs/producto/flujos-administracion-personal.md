<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          flujos-administracion-personal.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Flujos de administración y personal.
-->

# Flujos de administración y personal

El inicio **Mi trabajo** presenta tareas según el rol. El estudiante conserva su entrada por prácticas.

- Administración: estructura académica, centros receptores, usuarios, paralelos y grupos, archivo y seguimiento.
- Dirección: consulta de su estructura académica, centros receptores, gestión de paralelos y seguimiento de su carrera.
- Tutoría de prácticas: sus paralelos/estudiantes, gestión de grupos y bandejas de seguimiento.
- Tutoría institucional: sus estudiantes y pendientes asignados.
- Dirección institucional: selecciona un estudiante a partir de sus entrevistas y jornadas autorizadas y después abre el apartado de esa práctica.

## Catálogos con contexto

**Universidad → facultad → carrera → ciclos → asignaturas.**

**Centro receptor → grado → paralelos/asignaturas.**

Los listados muestran los hijos de la selección actual. Al agregar o editar, los padres seleccionados se conservan como campos de consulta y se fijan también en el payload. El recorrido comprueba que los padres indicados en la URL pertenezcan a la misma jerarquía antes de montar el formulario. Los enlaces de la ruta permiten volver a los niveles anteriores y las selecciones sobreviven a una recarga mediante parámetros de URL.

El menú entra a la estructura completa; los enlaces antiguos a catálogos individuales continúan siendo compatibles. El director mantiene consulta de la estructura académica sin controles de escritura. La configuración de grados y asignaturas de centros receptores corresponde a administración.

## Usuarios

**Tipo de usuario → listado filtrado → cuenta → acciones de acceso.**

El detalle presenta datos de la cuenta seleccionada y sus opciones de activación/bloqueo con confirmación. El alta adopta como rol inicial el tipo elegido; administración puede cambiarlo según corresponda. Las cantidades indican cuentas cargadas en el listado, no un censo global si existen más registros que el tamaño de página.

## Dirección institucional

La lista de estudiantes se construye únicamente con las entrevistas y jornadas que ya devuelve la API para esta cuenta. Una práctica aparece cuando tiene alguno de esos registros; no se le concede acceso al catálogo general de prácticas. Los apartados filtran por identificador de inscripción, evitando mezclar estudiantes con el mismo nombre.

## Validación

Pruebas de alcance entre padres, creación con padre fijado, selección de roles/cuentas y tareas por rol; recorridos Chrome con API simulada de las jerarquías y asignaciones institucionales. La autorización del servidor se mantiene.

Los usuarios y escenarios locales se describen en [Usuarios de demostración](../testing/datos/usuarios-demostracion.md).

## Estudiantes de cada paralelo

En Gestión del paralelo, administración y dirección de la carrera mantienen **Estudiantes que pertenecen al paralelo**. Primero asignan la pertenencia académica; después el estudiante puede solicitar su práctica mientras las inscripciones estén abiertas. El listado admite retirar o restaurar la pertenencia sin eliminar el expediente del estudiante.

Una persona puede pertenecer a distintos paralelos y ciclos de su carrera y desarrollar sus prácticas simultáneamente. No se cambia su ciclo principal para permitirlo ni se reutiliza una solicitud aprobada como una autorización general para todos los paralelos del ciclo.
