<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          colores-de-acciones.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Colores y significado de las acciones.
-->

# Colores y significado de las acciones

Las paletas institucionales conservan su identidad, pero el significado de las acciones es común a todas:

| Color | Significado | Ejemplos |
| --- | --- | --- |
| Azul | Crear, guardar, consultar o continuar | Guardar cambios, abrir práctica, enviar, descargar |
| Verde | Confirmar un resultado positivo o recuperar disponibilidad | Aprobar, activar, desbloquear, concluir |
| Ámbar | Revisar o cambiar un estado que merece atención | Revisar, corregir, archivar, reabrir |
| Rojo | Retirar información, denegar o restringir acceso | Eliminar, quitar, rechazar, bloquear, desactivar |
| Neutro | Navegación secundaria y cierre sin cambios | Volver, cancelar un diálogo |

Cancelar una inscripción es una acción destructiva y se declara explícitamente en rojo. Cancelar un diálogo mantiene un aspecto neutro.

`PrimaryButton` y `SecondaryButton` admiten `intent="info|success|warning|danger|neutral"`. `ActionMenu` acepta `intent` en cada acción. La intención explícita prevalece sobre la clasificación por el primer verbo de la etiqueta. Las acciones nuevas o ambiguas deben declarar su intención. `DangerButton` conserva rojo como valor predeterminado. Los diálogos de confirmación usan el tono de la advertencia o resultado indicado por el flujo.

Los botones principales tienen relleno; los secundarios usan fondo suave del mismo color. Los menús mantienen el significado del botón equivalente. El color acompaña siempre a texto e iconos; no reemplaza las etiquetas.

Los estados muestran su etiqueta y un punto del mismo color. Aprobación/presencia usan verde; envío, azul; pendientes/correcciones/atrasos, ámbar; rechazo/ausencia/bloqueo, rojo. El historial archivado sigue siendo neutro y las prácticas concluidas conservan violeta.

Las tarjetas de trabajo emplean fondos suavemente matizados, sombras discretas e iconos sobre piezas superpuestas, sin franja de borde: azul en prácticas, violeta en estructura académica/usuarios, verde azulado en centros receptores, ámbar en seguimiento y neutro en archivo. Esta identificación de áreas no representa un estado ni una cantidad de pendientes.

## Comprobación

`node docs/testing/qa/browser-action-colors.cjs` utiliza el CSS de producción para medir texto/fondo de los controles, en reposo y al pasar el puntero, con las tres paletas y ambos modos. También comprueba que los colores semánticos no cambien de una paleta a otra. Los resultados se guardan en `docs/testing/evidencias/evidencia-colores-acciones.json`.

Esta medición cubre los colores computados de las muestras de controles; no sustituye una auditoría de accesibilidad de todo el sistema.
