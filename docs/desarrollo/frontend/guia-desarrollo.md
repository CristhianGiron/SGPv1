<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          guia-desarrollo.md
  @fecha         2026-11-09 11:08:16
  @nota          Documenta Guía de desarrollo del frontend.
-->

# Guía de desarrollo del frontend

## Alcance

El frontend es una aplicación React que consume la API de Spring Boot. La
aplicación centraliza autenticación, navegación por hash, control de acceso de
interfaz y componentes reutilizables para sus módulos.

## Inicio local

Desde `FrontEnd`:

```bash
npm install
npm start
```

En localhost, el servidor de desarrollo usa el proxy de `http://localhost:8080`.
Al abrir el frontend desde otra IP, el cliente usa esa misma IP para llegar al
backend en el puerto `8080`. Para compartir la aplicación en la red local,
consulte la [configuración de entornos](../configuracion-entornos.md). Inicie
primero el backend y prepare la base de datos y el perfil.

La guía Postman para probar la API está en
[docs/api/guia-postman.md](../../api/guia-postman.md).

Comandos disponibles:

```bash
npm test
npm run build
```

## Mapa del código

| Área | Responsabilidad |
| --- | --- |
| `src/App.js` | Composición principal, sesión y selección de página |
| `src/auth/` | Contexto de autenticación y persistencia de credenciales |
| `src/api/` | Cliente HTTP usado por las páginas y componentes |
| `src/config/` | Navegación, páginas, módulos de endpoints y recursos |
| `src/pages/` | Vistas y flujos de cada módulo |
| `src/components/` | Componentes de dominio y CRUD reutilizable |
| `src/components/ui/` | Controles visuales compartidos |
| `src/layout/` | Estructura visual común |
| `src/utils/` | Rutas, formato e indicadores de dominio |
| `src/contexts/` | Contexto de práctica e institución |
| `src/hooks/` | Borradores, notificaciones, temas y manejo de diálogos |

Para los nombres y firmas de hooks, funciones y componentes, consulte la
[referencia de funciones](referencia-funciones.md).

## Flujos principales

### Sesión y permisos

1. El contexto de autenticación recupera las credenciales almacenadas.
2. Al iniciar sesión, el cliente API envía las credenciales al backend y conserva
   la respuesta de autenticación.
3. El perfil y los roles determinan las opciones de navegación y el contenido
   permitido en la interfaz.
4. El backend sigue siendo responsable de autorizar cada solicitud; ocultar una
   opción en el frontend no reemplaza las reglas del servidor.

### Navegación y carga de datos

La ruta se representa en el hash del navegador. La aplicación resuelve la página
correspondiente y la presenta dentro del layout común. Las páginas consumen el
cliente API, muestran estados de carga/error y actualizan la vista tras una
operación satisfactoria.

En los módulos configurados para CRUD reutilizable, los metadatos de recursos
definen rutas y campos; las páginas específicas se encargan de los flujos que no
encajan en ese patrón.

## Añadir o modificar una página

1. Implementar la vista en `src/pages/`.
2. Registrar la ruta y el componente en la configuración central de páginas.
3. Configurar su entrada de menú y roles en `src/config/navigation.js`.
4. Si corresponde, definir el recurso en `src/config/resources.js` o el módulo
   de endpoints correspondiente.
5. Reutilizar el cliente API, el contexto de autenticación y los componentes UI
   existentes.
6. Validar navegación con y sin los roles previstos, errores de API y estados
   vacíos/cargando.

Los roles de interfaz deben reflejar el alcance documentado en
[permisos de prácticas](../../producto/permisos-practicas.md); no se deben
inferir permisos nuevos a partir de la visibilidad del menú.

## Diagnóstico

- Use la consola del navegador para revisar errores de renderizado y solicitudes.
- Compruebe que el backend esté disponible en el puerto esperado y que la ruta
  solicitada sea correcta.
- Revise el token y el perfil mediante el flujo normal de autenticación; no
  publique credenciales o tokens en logs, capturas ni documentación.
- Use `DataInspector` o `EndpointConsole` solo si el módulo los incluye y el caso
  requiere inspección; no los trate como sustitutos de pruebas automatizadas.

## Referencias relacionadas

- [Referencia de funciones frontend](referencia-funciones.md)
- [Guía Postman de la API](../../api/guia-postman.md)
- [Configuración de entornos](../configuracion-entornos.md)
- [Índice general](../../README.md)

## Componentes de los flujos recientes

Consulte [componentes de experiencia](componentes-experiencia.md) antes de modificar contexto de práctica, formularios guiados, borradores, agenda, bandeja o diálogos. El comportamiento de usuario se explica en [experiencia de trabajo](../../producto/experiencia-de-trabajo.md).
