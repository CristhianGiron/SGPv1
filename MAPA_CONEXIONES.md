# 🗺️ MAPA DE CONEXIONES - ARCHIVO POR ARCHIVO

## 📊 Diagrama de Dependencias Global

```
                          ┌─────────────────┐
                          │   index.html    │
                          │  (root DOM)     │
                          └────────┬────────┘
                                   │
                          ┌────────▼────────┐
                          │   index.js      │
                          │ (React entry)   │
                          └────────┬────────┘
                                   │
                          ┌────────▼─────────┐
                          │    App.js        │
                          │ (Root component) │
                          └────────┬─────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
   ┌────▼────────────┐   ┌────────▼────────┐   ┌────────────▼──┐
   │ AuthProvider    │   │   useHashRoute  │   │  PAGES map    │
   │ (AuthContext)   │   │  (utils/routes) │   │  (A, B, C...) │
   │                 │   │                 │   │               │
   └────┬────────────┘   └────────┬────────┘   └────────────┬──┘
        │                         │                         │
        │ proporciona:            │ retorna: 'dashboard'    │ mapea:
        │ - token                 │ 'courses', etc          │ route → Component
        │ - profile               │                         │
        │ - roles                 │                         │
        │ - login/logout          │                         │
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │
                          ┌───────▼──────────┐
                          │   AppLayout      │
                          │ (Header + Sidebar│
                          │  + Content)      │
                          └───────┬──────────┘
                                  │
                    ┌─────────────────────────┐
                    │    Current Page         │
                    │  (Page component)       │
                    │ DashboardPage,          │
                    │ CoursesPage, etc        │
                    └─────────────────────────┘
```

---

## 🔗 CONEXIONES DETALLADAS

### 1. Index.js → App.js

**Archivo: index.js**
```javascript
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

**Lo que hace:**
- Obtiene el elemento `<div id="root">` del HTML
- Renderiza el componente `<App />` ahí
- Es el punto de entrada de React

**Se conecta con:**
- `App.js` ← importa y renderiza

---

### 2. App.js Orquestación Central

**Archivo: App.js**
```javascript
import { AuthProvider, useAuth } from './auth/AuthContext';
import { useHashRoute } from './utils/routes';
import { NAV_ITEMS, canAccess } from './config/navigation';
import { AppLayout } from './layout/AppLayout';
import { PAGES } from './config/pages';  // Dashboard, Courses, etc

function AppShell() {
  const route = useHashRoute();              // ← De utils/routes
  const { token, roles } = useAuth();        // ← De auth/AuthContext
  
  // Decidir qué mostrar
  if (!token) return <LoginPage />;
  
  const navItem = NAV_ITEMS.find(i => i.id === route);
  const safeRoute = navItem && canAccess(navItem, roles) ? route : 'dashboard';
  const Page = PAGES[safeRoute] || DashboardPage;
  
  return (
    <AppLayout route={safeRoute}>
      <Page />
    </AppLayout>
  );
}

function App() {
  return (
    <AuthProvider>              {/* ← Proporciona autenticación */}
      <AppShell />
    </AuthProvider>
  );
}
```

**Se conecta con:**
- `auth/AuthContext.jsx` → `AuthProvider` y `useAuth()`
- `utils/routes.js` → `useHashRoute()`
- `config/navigation.js` → `NAV_ITEMS`, `canAccess()`
- `layout/AppLayout.jsx` → Layout principal
- `pages/*Page.jsx` → Páginas individuales

**Diagrama de flujo:**
```
App.js obtiene:
  ├─ route (de useHashRoute)
  │   └─ Consulta URL hash (#/dashboard, etc)
  │
  ├─ token + roles (de useAuth)
  │   └─ Del contexto de autenticación
  │
  ├─ verifica:
  │   ├─ ¿Hay token? (¿Autenticado?)
  │   ├─ ¿Tiene rol? (¿Acceso a ruta?)
  │   └─ ¿Existe componente Page?
  │
  └─ renderiza:
      ├─ Si no autenticado → LoginPage
      └─ Si autenticado → AppLayout + Page
```

---

### 3. AuthContext.jsx - El Core

**Archivo: auth/AuthContext.jsx**
```
EXPORTA:
  ├─ AuthProvider (componente)
  │   ├─ Lee tokens de localStorage
  │   ├─ Llama /api/account/me para obtener perfil
  │   ├─ Proporciona contexto a toda la app
  │   └─ Mantiene sincronizado con backend
  │
  ├─ useAuth (hook)
  │   └─ Devuelve: { token, profile, roles, login, logout, ... }
  │
  └─ Métodos:
      ├─ login(credentials) → POST /api/auth/login
      ├─ registerStudent(data, file) → POST /api/auth/register
      ├─ logout() → Limpia todo
      └─ refreshProfile() → GET /api/account/me

IMPORTA:
  ├─ api/client.jsx → apiRequest()
  ├─ auth/storage.jsx → storeAuth, getStoredAuth, clearStoredAuth
  └─ React hooks → useState, useContext, useCallback, etc

PROPORCIONA A TODA LA APP:
  const { token, profile, roles, login, logout } = useAuth();
```

**Diagrama de secuencia:**

```
1. App monta
   └─ AuthProvider inicializa
      ├─ getStoredAuth() ← localStorage
      │   └─ Si existe token → continuar con ese
      │   └─ Si no → null
      │
      ├─ useEffect → refreshProfile()
      │   ├─ Si hay token → GET /api/account/me
      │   │   └─ Backend devuelve { names, roles, ... }
      │   │   └─ setProfile(data)
      │   └─ Si no hay token → setProfile(null)
      │
      └─ Proporciona contexto con datos actuales
         ├─ Apps del árbol pueden hacer useAuth()
         └─ Acceden a { token, profile, roles, ... }

2. Usuario hace login (en LoginPage)
   └─ Llama auth.login({ username, password })
      ├─ POST /api/auth/login
      │   └─ Backend valida y devuelve tokens
      ├─ storeAuth() → guardar en localStorage
      ├─ setAuth(tokens) → actualizar estado
      ├─ useEffect detecta nuevo token
      │   └─ Ejecuta refreshProfile()
      │       └─ GET /api/account/me
      │           └─ Obtiene roles y datos del usuario
      └─ App.js detecta que hay token
         └─ Renderiza AppLayout + página

3. Usuario hace logout
   └─ Llama auth.logout()
      ├─ clearStoredAuth() → eliminar de localStorage
      ├─ setAuth(null) → limpiar estado
      └─ App.js detecta no hay token
         └─ Renderiza LoginPage
```

---

### 4. AppLayout.jsx - Estructura Visual

**Archivo: layout/AppLayout.jsx**

```
RECIBE:
  ├─ route: String (ruta actual: 'dashboard', 'courses', etc)
  └─ children: Component (página a mostrar)

IMPORTA:
  ├─ auth/AuthContext.jsx → useAuth()
  ├─ config/navigation.js → NAV_ITEMS, canAccess()
  ├─ utils/routes.js → setHashRoute
  ├─ utils/format.js → formatRole, joinText
  └─ components/Avatar.jsx → mostrar foto del usuario

ESTRUCTURA VISUAL:
  ┌────────────────────────────────────────────┐
  │          HEADER                            │
  │  [Logo]  [Título página]  [Usuario] [Salir]
  ├─────────────┬──────────────────────────────┤
  │             │                              │
  │  SIDEBAR    │  CONTENIDO (children)        │
  │             │                              │
  │ • Dashboard │  Renderiza la página actual  │
  │ • Courses   │  (DashboardPage, CoursesPage,│
  │ • Photos    │   etc según route)           │
  │ • Docs      │                              │
  │             │                              │
  │ [Perfil]    │                              │
  │             │                              │
  └─────────────┴──────────────────────────────┘

FUNCIONALIDADES:
  ├─ Obtiene roles del usuario
  ├─ Filtra NAV_ITEMS según roles
  ├─ Marca item activo según route
  ├─ Botón de logout llama auth.logout()
  ├─ Click en item llama setHashRoute(itemId)
  │   └─ URL cambia → useHashRoute() detecta
  │       └─ App.js re-renderiza con nueva página
  └─ Muestra avatar y nombre del usuario
```

---

### 5. ResourceCrud.jsx - El CRUD Genérico

**Archivo: components/ResourceCrud.jsx**

```
RECIBE:
  resource: {
    id: String (identificador único)
    title: String (título de la sección)
    listPath: String (endpoint para listar)
    createPath: String (endpoint para crear)
    updatePath: Function(id) → String
    deletePath: Function(id) → String
    fields: Array (campos del formulario)
    columns: Array (columnas de la tabla)
    actions: Array (botones adicionales)
  }

FLUJO INTERNO:

  1. MONTA
     └─ useEffect
        ├─ loadRows()
        │   ├─ GET resource.listPath
        │   ├─ unwrapPage(response)
        │   └─ setRows(data)
        │
        └─ Renderiza: Tabs [Registros] [Crear]

  2. VISTA: LISTA (lista de registros)
     └─ <DataTable rows={rows} columns={columns} />
        └─ Cada fila tiene botones:
           ├─ Editar → startEdit(row)
           ├─ Eliminar → handleDelete()
           └─ Acciones personalizadas → runAction(action, row)

  3. VISTA: FORMULARIO (crear o editar)
     └─ <Form onSubmit={handleSubmit}>
        ├─ Itera resource.fields
        ├─ Genera <Input>, <Select>, <Textarea>, etc
        ├─ onChange → setField(name, value)
        └─ onSubmit → handleSubmit()
           ├─ cleanPayload(resource.fields, form)
           ├─ POST (crear) o PUT (actualizar)
           ├─ loadRows() para refrescar lista
           ├─ resetForm()
           └─ activeView = 'list'

IMPORTA:
  ├─ api/client.jsx → apiRequest, unwrapPage
  ├─ auth/AuthContext.jsx → useAuth (para obtener token)
  ├─ components/ui/* → DataTable, FormControls, Alert, etc
  └─ React hooks → useState, useEffect

EXPORTA:
  └─ Componente que envuelve cualquier recurso
     (Cursos, Fotos, Documentos, etc)
```

**Ejemplo de uso:**

```javascript
// En CoursesPage.jsx
import { ResourceCrud } from '../components/ResourceCrud';

function CoursesPage() {
  return (
    <ResourceCrud 
      resource={{
        id: 'courses',
        title: 'Cursos',
        listPath: '/api/courses',
        createPath: '/api/courses',
        updatePath: (id) => `/api/courses/${id}`,
        deletePath: (id) => `/api/courses/${id}`,
        fields: [
          { key: 'name', type: 'text', label: 'Nombre' },
          { key: 'institution', type: 'select', label: 'Institución', 
            options: [...] },
        ],
        columns: [
          { key: 'name', header: 'Nombre' },
          { key: 'institution', header: 'Institución' },
        ],
        actions: [
          { label: 'Aprobar', path: (row) => `/api/courses/${row.id}/approve`,
            method: 'PATCH' },
        ]
      }}
    />
  );
}
```

---

### 6. api/client.jsx - Puente con Backend

**Archivo: api/client.jsx**

```
FLUJO DE UNA PETICIÓN:

  1. INICIAR
     await apiRequest('/api/courses', { token, method: 'GET' })
              │
              ▼
  2. CONSTRUIR
     ├─ buildUrl(path)
     │   ├─ Si path comienza con http → retornar tal cual
     │   └─ Si no → prepend API_BASE
     │       └─ API_BASE viene de process.env.REACT_APP_API_BASE_URL
     │
     └─ requestHeaders
         ├─ Si hay token → Authorization: Bearer {token}
         └─ Content-Type: application/json (si hay body)

  3. EJECUTAR
     const response = await fetch(url, config)
         │
         ▼ (red)
     BACKEND recibe solicitud con:
       ├─ Headers con token JWT
       ├─ Body en JSON
       └─ Valida y procesa

         │
         ▼ (respuesta)
     response = {
       status: 200 o 404 o 500,
       headers: { content-type: 'application/json', ... },
       body: {...}
     }

  4. PROCESAR
     ├─ readResponse(response)
     │   ├─ Si content-type === 'application/json'
     │   │   └─ response.json() → Object
     │   └─ Si no → response.text() → String
     │
     └─ if (!response.ok)
         └─ throw Error(errorMessage(payload, fallback))

  5. RETORNAR
     return payload  ← Al componente que lo llamó

FUNCIONES EXPORTADAS:

  ├─ apiRequest(path, options)
  │   └─ Para GET, POST, PUT, DELETE, PATCH
  │
  ├─ apiBlob(path, token)
  │   └─ Para descargar archivos
  │
  ├─ toQuery(params)
  │   └─ {page: 0, size: 10} → '?page=0&size=10'
  │
  └─ unwrapPage(payload)
      └─ [{...}] o {content: [{...}]} → [{...}]
```

---

### 7. utils/routes.js - Sistema de Rutas

**Archivo: utils/routes.js**

```
FLUJO DE NAVEGACIÓN:

  1. USUARIO HACE CLICK
     <button onClick={() => setHashRoute('courses')}>
                                    │
                                    ▼
  2. setHashRoute('courses')
     window.location.hash = 'courses'
                │
                ├─ URL cambia: /#/courses
                └─ Dispara evento: 'hashchange'
                        │
                        ▼
  3. Listener captura evento
     window.addEventListener('hashchange', handleHashChange)
                │
                ▼
  4. handleHashChange()
     setRoute(getHashRoute())
                │
                ├─ Lee window.location.hash
                ├─ Extrae 'courses'
                ├─ Actualiza estado de React
                └─ Componente que usa useHashRoute() re-renderiza
                        │
                        ▼
  5. App.js detecta cambio
     const route = useHashRoute()  // → 'courses'
                │
                ├─ Encuentra CoursesPaage en PAGES['courses']
                └─ Renderiza <CoursesPage />
                        │
                        ▼
  6. USUARIO VE NUEVA PÁGINA

EXPORTA:

  ├─ getHashRoute()
  │   └─ Lee URL actual sin hook (síncrono)
  │       window.location.hash.replace(/^#\/?/, '') → 'dashboard'
  │
  ├─ setHashRoute(route)
  │   └─ Cambia URL sin recargar página
  │       window.location.hash = route
  │
  └─ useHashRoute()
      └─ Hook que se suscribe a cambios
          return [route, setRoute]
```

---

### 8. config/navigation.js - Menú y Permisos

**Archivo: config/navigation.js**

```
EXPORTA:

  ├─ NAV_ITEMS
  │   └─ Array de items del menú:
  │       ├─ id: 'dashboard' (identificador para rutas)
  │       ├─ label: 'Inicio' (texto a mostrar)
  │       ├─ Icon: Home (componente de lucide-react)
  │       └─ roles: [] (roles permitidos)
  │
  └─ canAccess(item, roles)
      └─ Verifica si usuario puede acceder
          ├─ Si item.roles está vacío → true
          └─ Si usuario tiene algún rol en item.roles → true

USO EN APPLAYOUT:

  const visibleItems = NAV_ITEMS.filter(item => 
    canAccess(item, userRoles)
  )
  // Solo muestra items que el usuario pueda acceder

USO EN APP.JS:

  const navItem = NAV_ITEMS.find(i => i.id === route)
  const safeRoute = navItem && canAccess(navItem, roles) 
    ? route 
    : 'dashboard'
  // Si intenta acceder a ruta no autorizada → redirige a dashboard
```

---

### 9. Pages - Las Vistas

**Ejemplo: pages/CoursesPage.jsx**

```
ESTRUCTURA:
  ┌─────────────────────────────────────┐
  │ CoursesPage()                       │
  │                                     │
  │ 1. Importa hooks                    │
  │    ├─ useAuth() (token, roles)      │
  │    └─ useState (datos locales)      │
  │                                     │
  │ 2. Define resource config           │
  │    ├─ listPath, createPath, etc     │
  │    ├─ fields (formulario)           │
  │    └─ columns (tabla)               │
  │                                     │
  │ 3. Renderiza                        │
  │    ├─ PageHeader (título)           │
  │    └─ ResourceCrud (componente CRUD)│
  │        └─ Maneja todo el CRUD       │
  │           automáticamente           │
  │                                     │
  └─────────────────────────────────────┘

FLUJO:
  1. App.js renderiza <CoursesPage />
     ├─ CoursesPage monta
     ├─ Define resource con endpoints
     └─ Renderiza <ResourceCrud resource={...} />
  
  2. ResourceCrud toma control
     ├─ useEffect → carga lista
     └─ Maneja todo el CRUD
         ├─ Ver lista
         ├─ Crear nuevo
         ├─ Editar existente
         ├─ Eliminar
         └─ Acciones personalizadas
```

---

## 🔄 EJEMPLO COMPLETO: Usuario Edita un Curso

```
PASO 1: CLICK EN "EDITAR"
┌─────────────────────────────────────────┐
│ Usuario ve tabla con cursos             │
│ Hace click en botón "Editar" de un curso│
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│ ResourceCrud.jsx                        │
│ onClick → startEdit(row)                │
│   ├─ setSelectedId(row.id)              │
│   ├─ setForm(fromRow(row))              │
│   ├─ setActiveView('form')              │
│   └─ Componente re-renderiza            │
└──────────────────┬──────────────────────┘
                   │
PASO 2: MOSTRAR FORMULARIO
┌──────────────────▼──────────────────────┐
│ ResourceCrud renderiza <form>           │
│ ├─ Fields pre-llenados con datos        │
│ ├─ Inputs: name, institution, etc       │
│ └─ Botones: Guardar, Cancelar           │
└──────────────────┬──────────────────────┘
                   │
PASO 3: USUARIO MODIFICA Y GUARDA
┌──────────────────▼──────────────────────┐
│ Usuario cambia "name" field             │
│ onChange → setField('name', newValue)   │
│   └─ Estado React actualizado           │
│                                         │
│ Usuario hace click en "Guardar"         │
│ onSubmit → handleSubmit(event)          │
└──────────────────┬──────────────────────┘
                   │
PASO 4: VALIDAR Y PREPARAR DATOS
┌──────────────────▼──────────────────────┐
│ handleSubmit()                          │
│   ├─ event.preventDefault()             │
│   ├─ setSaving(true)                    │
│   ├─ body = cleanPayload(...)           │
│   │   └─ { name: 'Nuevo nombre', ... }  │
│   └─ setPrepared(body)                  │
└──────────────────┬──────────────────────┘
                   │
PASO 5: LLAMAR API
┌──────────────────▼──────────────────────┐
│ await apiRequest(                       │
│   '/api/courses/123',                   │
│   {                                     │
│     method: 'PUT',                      │
│     token: 'eyJh...',                   │
│     body: { name: 'Nuevo nombre' }      │
│   }                                     │
│ )                                       │
│                                         │
│ api/client.jsx:                         │
│   ├─ buildUrl('/api/courses/123')       │
│   ├─ Agrega Authorization header        │
│   ├─ fetch PUT request                  │
│   └─ readResponse (JSON)                │
└──────────────────┬──────────────────────┘
                   │
         [RED INTERNET]
                   │
PASO 6: BACKEND PROCESA
┌──────────────────▼──────────────────────┐
│ Spring Boot Backend                     │
│   ├─ @PutMapping('/courses/{id}')       │
│   ├─ Valida token JWT                   │
│   ├─ Busca curso con id = 123           │
│   ├─ Actualiza campos                   │
│   ├─ Guarda en BD                       │
│   └─ Retorna curso actualizado          │
│                                         │
│ Response: {                             │
│   status: 200,                          │
│   body: {                               │
│     id: 123,                            │
│     name: 'Nuevo nombre',               │
│     ...                                 │
│   }                                     │
│ }                                       │
└──────────────────┬──────────────────────┘
                   │
PASO 7: FRONTEND RECIBE RESPUESTA
┌──────────────────▼──────────────────────┐
│ apiRequest retorna:                     │
│ {                                       │
│   id: 123,                              │
│   name: 'Nuevo nombre',                 │
│   ...                                   │
│ }                                       │
└──────────────────┬──────────────────────┘
                   │
PASO 8: ACTUALIZAR UI
┌──────────────────▼──────────────────────┐
│ handleSubmit() continúa:                │
│   ├─ resetForm()                        │
│   ├─ loadRows()  ← RECARGA LISTA        │
│   │   ├─ GET /api/courses               │
│   │   ├─ Recibe array actualizado       │
│   │   └─ setRows(data)                  │
│   ├─ setMessage('Actualizado')          │
│   ├─ setActiveView('list')              │
│   └─ setSaving(false)                   │
│                                         │
│ Componente re-renderiza                 │
│   ├─ Mostrar Alert: 'Actualizado' ✓     │
│   ├─ Cambiar a vista LIST               │
│   └─ DataTable muestra datos nuevos     │
└──────────────────┬──────────────────────┘
                   │
PASO 9: RESULTADO FINAL
┌──────────────────▼──────────────────────┐
│ Usuario ve:                             │
│ ✓ Mensaje "Actualizado"                 │
│ ✓ Tabla con el curso modificado         │
│ ✓ Nombre ahora es "Nuevo nombre"        │
│                                         │
│ Sesión guardada en localStorage         │
│ Datos nuevos en BD del backend          │
└─────────────────────────────────────────┘
```

---

## 📈 Jerarquía de Componentes

```
App
├─ AuthProvider
│  ├─ AppShell
│  │  ├─ LoginPage  (si no hay token)
│  │  ├─ AppLayout  (si hay token)
│  │  │  ├─ Header
│  │  │  │  ├─ Logo + Título
│  │  │  │  └─ Usuario + Botón Salir
│  │  │  ├─ Sidebar
│  │  │  │  ├─ NavItems (menú)
│  │  │  │  └─ ProfileCard
│  │  │  └─ Page (children)
│  │  │     ├─ DashboardPage
│  │  │     │  ├─ PageHeader
│  │  │     │  ├─ Alert (si hay error)
│  │  │     │  └─ Stats cards
│  │  │     ├─ CoursesPage
│  │  │     │  ├─ PageHeader
│  │  │     │  └─ ResourceCrud
│  │  │     │     ├─ Tabs (List/Form)
│  │  │     │     ├─ DataTable
│  │  │     │     │  ├─ TableHeader
│  │  │     │     │  ├─ TableRows
│  │  │     │     │  └─ ActionButtons
│  │  │     │     └─ Form
│  │  │     │        ├─ Field
│  │  │     │        │  └─ Input/Select/Textarea
│  │  │     │        └─ SubmitButton
│  │  │     ├─ PhotosPage
│  │  │     ├─ DocumentsPage
│  │  │     └─ ... más páginas
│  │  └─ LoginPage
│  │     ├─ FormCard
│  │     ├─ UsernameInput
│  │     ├─ PasswordInput
│  │     └─ LoginButton
│  └─ RegisterStudentPage
│     ├─ Form
│     ├─ FileUpload
│     └─ RegisterButton
```

---

**Última actualización:** 16 de mayo de 2026
