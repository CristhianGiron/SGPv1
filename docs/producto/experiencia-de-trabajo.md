<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          experiencia-de-trabajo.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Experiencia de trabajo del usuario.
-->

# Experiencia de trabajo del usuario

## Acceso institucional

La página de acceso utiliza un encabezado institucional con nombre y siglas configurables, formulario central compacto y datos de facultad/carrera. Conserva usuario o correo, contraseña con control de visibilidad, registro público de estudiantes, ayuda y cambio entre modo claro y oscuro.

Las credenciales se validan con el flujo de autenticación del SGP. Los errores permanecen junto al formulario; durante el envío se bloquean solicitudes repetidas y edición de credenciales. La pantalla informa cuando Bloq Mayús está activado. Para recuperar acceso, la ayuda orienta a contactar a la administración del sistema.

## Resumen de una práctica

Al abrir una práctica, el resumen ofrece un siguiente paso según su estado y el rol: atender observaciones, continuar un borrador, preparar un documento o revisar registros pendientes. Las prácticas históricas se presentan para consulta. La recomendación no modifica las reglas del servidor.

Los indicadores distinguen documentos registrados, aprobados, observados y tiempo asistido. El avance por apartados no equivale a aprobar la práctica. Si una consulta falla, se muestra el alcance parcial y los valores desconocidos no se convierten en cero.

## Documentos y borradores

Los formularios documentales se organizan por pasos, con revisión final y opción de mostrar el formulario completo. Los pendientes de completitud se consultan dentro del formulario. Los datos precargados que falten requieren revisar la inscripción o la institución correspondiente.

Dentro de una práctica, el contexto se muestra de forma compacta y sus datos complementarios se consultan en **Datos de la práctica**. La descarga del expediente está en **Acciones de la práctica**. Las pestañas de detalle y edición comparten una franja con el estado del documento.

La barra **Acciones del documento** permanece al alcance durante la edición y reúne Guardar borrador, Guardar y ver PDF, el estado de la copia automática y la ayuda de guardado. En móvil, el lanzador de accesibilidad se desplaza por encima de esa barra. Los pasos pueden recorrerse horizontalmente cuando el espacio es reducido.

Los errores de validación de documentos incluyen un resumen con enlaces a los campos correspondientes y mensajes asociados al control. Si el error pertenece a otro paso, se muestra el formulario completo para poder corregirlo. Se conserva el texto escrito y al editar un dato se retira su error anterior; el servidor vuelve a validar al guardar. Los fallos de conexión o permisos mantienen su aviso general.

La copia automática se conserva en el navegador y, con sesión activa, **en el servidor**, separada por cuenta, práctica, módulo y registro. Tras una pausa al escribir aparece **Guardado en el servidor**. Se recupera mediante una acción expresa, también desde otro equipo, y no reemplaza por sí sola el contenido consultado. Esta copia privada no crea ni envía documentos académicos: **Guardar borrador** persiste la versión del documento que podrán consultar sus revisores. Los archivos adjuntos deben seleccionarse nuevamente al recuperar una copia.

Si otra pestaña o dispositivo cambió la copia del servidor, el autoguardado se detiene y ofrece recuperar esa versión o conservar explícitamente la copia local. Los errores de conexión se muestran y permiten reintentar. El control de versiones protege la copia automática; no modifica las reglas de edición de los documentos académicos.

La navegación con cambios sin guardar en el sistema puede solicitar confirmación. El almacenamiento local puede fallar; la pantalla debe informar ese fallo y permitir guardar mediante el flujo habitual.

### Vista previa y expediente

Los seis modelos L.1–L.6 ofrecen **Vista previa del PDF** desde el detalle. En el formulario, **Guardar y ver PDF** guarda primero los cambios y abre el PDF de esa versión. Todas las páginas llevan una franja **VISTA PREVIA - NO ES UN DOCUMENTO FINAL**. La vista previa respeta el acceso al documento y no modifica su estado. El L.3 puede previsualizarse sin membrete para detectar lo que falta; la descarga definitiva mantiene sus requisitos.

Desde una práctica, **Descargar expediente** genera un ZIP con los PDF definitivos disponibles para el rol, las evidencias almacenadas de esa inscripción y `00-INDICE.txt`. El índice señala documentos sin registrar, pendientes de aprobación o no disponibles. L.4 y L.5 siguen sus reglas de exportación sin aprobación. Los documentos privados de otros roles y las evidencias de otras prácticas no se incorporan. No se descargan enlaces externos. El límite acumulado de archivos es 64 MB; si se supera, se informa que las evidencias deben descargarse por separado.

## Revisión de tutoría

El documento y la retroalimentación se muestran juntos en escritorio; en móvil se apilan. Los apartados de retroalimentación se despliegan cuando se necesitan. Enviar recomendaciones y aprobar son acciones distintas y siguen los permisos y estados del documento.

## Agenda y asistencia

La agenda permite consultar semanas, alternar entre semana y lista y buscar por estudiante, paralelo o lugar cuando hay varias programaciones. El día actual se destaca. La tabla de jornadas y asistencias sigue disponible.

Cada asistencia se asocia a su período programado. Una jornada pasada sin asistencia registrada se etiqueta como **Sin registro de asistencia**, sin convertirla automáticamente en falta. Solo presencia y atraso con minutos válidos suman tiempo asistido. Las jornadas ya terminadas hoy no se presentan como próximas.

## Interpretación de entrevistas

En **Entrevistas → Ver → Interpretación**, cada pregunta respondida conserva la respuesta y el análisis cualitativo escrito por el estudiante. Las preguntas de opción única, selección múltiple, sí/no, escala y número incluyen también un resumen cuantitativo con gráfico, frecuencias y porcentajes. El selector **Tipo de gráfico** permite alternar entre barras y pastel para esa pregunta; se propone pastel para opción única y sí/no, y barras para selección múltiple, escalas y números.

La selección múltiple calcula los porcentajes sobre el total de selecciones y lo indica junto al gráfico. Las preguntas numéricas conservan promedio, mínimo y máximo, incluido el cero. Los datos corresponden a las respuestas del formulario seleccionado; no se combinan entrevistas diferentes. Las preguntas abiertas mantienen la interpretación escrita y no reciben un gráfico numérico.

Solo el estudiante propietario puede guardar el análisis. Guardarlo conserva la pestaña y los otros análisis que todavía está redactando. Las personas con acceso de consulta pueden leer el análisis y visualizar los gráficos. Al imprimir desde **Interpretación**, los gráficos se incluyen junto con el contenido; el selector de gráfico queda fuera de la impresión.

## Notificaciones

La bandeja separa **Sin leer**, **Todas** y **Leídas**. Permite buscar por título o mensaje, agrupa por fecha y muestra más resultados bajo demanda. El marcado masivo requiere confirmación. Si falla el marcado individual, se informa el error y se permite reintentar antes de navegar. Publicar avisos sigue reservado a administración.

## Listados y teclado

Los listados pueden paginar resultados y, cuando tienen filtros, permiten elegir columnas y guardar vistas locales por cuenta y sección/práctica. Las acciones se mantienen accesibles aunque se oculten columnas.

Por debajo de 640 px, los listados compartidos muestran registros con nombre o título, estado, datos principales y acciones. Los datos adicionales se despliegan mediante **Más datos del registro**. Al pasar de móvil a escritorio se conservan los filtros y la página, y vuelve la presentación en tabla. Los indicadores breves del resumen de práctica usan dos columnas en móvil y los accesos tienen una presentación más compacta.

Los diálogos conservan el foco al escribir. Tab y Mayús+Tab recorren el diálogo superior; Escape cierra esa ventana. Al cerrar una confirmación anidada, el formulario inferior mantiene su bloqueo de desplazamiento.

[Flujo por práctica](flujo-por-practica.md) · [Evidencias de verificación](../testing/README.md).
