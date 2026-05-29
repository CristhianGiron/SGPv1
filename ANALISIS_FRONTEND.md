# 📊 ANÁLISIS COMPLETO - FRONTEND SYSTEMSGP

## 🎯 Descripción General

SystemSGP es una **plataforma web de gestión académica** construida con **React** que permite administrar:
- Inscripciones de estudiantes en cursos y prácticas
- Carga y gestión de evidencias/fotos de prácticas
- Administración de catálogos (cursos, horarios, ubicaciones, etc)
- Perfiles de usuarios con diferentes roles
- Control de acceso basado en roles (RBAC)

**Stack Técnico:**
- React (UI)
- Lucide React (iconos)
- Tailwind CSS (estilos)
- localStorage (persistencia local)
- Fetch API + JWT (autenticación)

---

## 🏗️ ARQUITECTURA GENERAL

### Estructura de Carpetas

```
src/
├── index.js                    # Punto de entrada de React
├── App.js                      # Componente raíz, gestor de rutas
├── App.css                     # Estilos globales
│
├── api/                        # Comunicación con backend
│   └── client.jsx             # Cliente HTTP con autenticación
│
├── auth/                       # Autenticación y almacenamiento
│   ├── AuthContext.jsx        # Contexto de autenticación (CORE)
│   └── storage.jsx            # Funciones de localStorage
│
├── config/                     # Configuraciones globales
│   ├── navigation.js          # Menú de navegación con roles
│   ├── endpointModules.js    # Módulos de endpoints
│   └── resources.js           # Configuración de recursos CRUD
│
├── layout/                     # Componentes de diseño
│   └── AppLayout.jsx          # Layout principal (header + sidebar)
│
├── pages/                      # Páginas/vistas principales
│   ├── LoginPage.jsx          # Autenticación
│   ├── DashboardPage.jsx      # Panel de control
│   ├── ProfilePage.jsx        # Perfil de usuario
│   ├── CoursesPage.jsx        # Cursos
│   ├── PhotosPage.jsx         # Fotos/evidencias
│   ├── DocumentsPage.jsx      # Documentos
│   ├── SchedulesPage.jsx      # Horarios
│   ├── InstitutionsPage.jsx   # Instituciones
│   ├── CatalogsPage.jsx       # Catálogos
│   ├── AccountsPage.jsx       # Gestión de cuentas
│   ├── LocationsPage.jsx      # Ubicaciones
│   └── RegisterStudentPage.jsx # Registro de estudiantes
│
├── components/                 # Componentes reutilizables
│   ├── ResourceCrud.jsx       # CRUD genérico (CREATE, READ, UPDATE, DELETE)
│   ├── DataInspector.jsx      # Inspector de datos (debug)
│   ├── EndpointConsole.jsx    # Consola de endpoints
│   ├── StructuredForm.jsx     # Formulario estructurado
│   ├── Avatar.jsx             # Avatar de usuario
│   │
│   └── ui/                    # Componentes de interfaz
│       ├── Alert.jsx          # Alertas de mensaje/error
│       ├── ActionBar.jsx      # Barra de botones
│       ├── DataTable.jsx      # Tabla de datos
│       ├── FormControls.jsx   # Inputs, selects, textareas
│       ├── PageHeader.jsx     # Header de página
│       ├── SectionCard.jsx    # Tarjeta de sección
│       ├── Skeleton.jsx       # Loading skeleton
│       ├── StatusBadge.jsx    # Badge de estado
│       └── EmptyState.jsx     # Estado vacío
│
└── utils/                      # Funciones utilitarias
    ├── routes.js              # Gestión de routing por hash
    └── format.js              # Formateo de datos (fechas, roles, etc)
```

---

## 🔄 FLUJOS PRINCIPALES

### 1️⃣ FLUJO DE AUTENTICACIÓN (Login → Dashboard)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. INICIO                                                   │
│    - Usuario abre la app                                   │
│    - React renderiza App.js                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│ 2. AUTHPROVIDER INICIALIZA                                 │
│    - Lee tokens de localStorage (getStoredAuth)            │
│    - Si existe token → carga perfil del usuario            │
│    - Si no existe → muestra LoginPage                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│ 3. USUARIO COMPLETA LOGIN                                  │
│    - Ingresa usuario y contraseña en LoginPage             │
│    - Llama a auth.login(credentials)                       │
│    - POST /api/auth/login ← [backend valida]              │
│    - Backend retorna accessToken + refreshToken           │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│ 4. TOKENS SE GUARDAN                                       │
│    - storeAuth() guarda tokens en localStorage             │
│    - setAuth() actualiza estado de React                   │
│    - AuthContext proporciona tokens a toda la app          │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│ 5. CARGA PERFIL DEL USUARIO                                │
│    - refreshProfile() se ejecuta automáticamente           │
│    - GET /api/account/me ← [backend obtiene del JWT]      │
│    - Retorna: nombres, roles, email, institución, etc     │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│ 6. RENDERIZA APP AUTENTICADA                               │
│    - App.js detecta que hay token                          │
│    - Renderiza AppLayout (header + sidebar + contenido)    │
│    - DashboardPage muestra estadísticas según roles        │
└─────────────────────────────────────────────────────────────┘
```

**Archivos Involucrados:**
- `LoginPage.jsx` → Interfaz de login
- `AuthContext.jsx` → Lógica de autenticación
- `storage.jsx` → Persistencia de tokens
- `api/client.jsx` → Comunicación HTTP
- `App.js` → Decisión de qué renderizar

---

### 2️⃣ FLUJO DE NAVEGACIÓN (Cambio de Página)

```
Usuario hace click en botón del menú
        │
        ▼
setHashRoute('courses')  [en nav-item]
        │
        ▼
window.location.hash = 'courses'  [URL cambia a /#/courses]
        │
        ▼
window.addEventListener('hashchange')
        │
        ▼
useHashRoute() detecta cambio
        │
        ▼
Componente se re-renderiza
        │
        ▼
useHashRoute() retorna 'courses'
        │
        ▼
App.js: const route = useHashRoute()
        │
        ▼
PAGES[route] = CoursesPage
        │
        ▼
Renderiza <CoursesPage />
```

**Archivos Involucrados:**
- `utils/routes.js` → Gestión de hash
- `App.js` → Selector de página
- `config/navigation.js` → Items del menú

---

### 3️⃣ FLUJO DE CRUD (Ver, Crear, Editar, Eliminar)

```
┌─────────────────────────────────────────────┐
│ COMPONENTE PÁGINA (ej: CoursesPage)        │
│ <ResourceCrud resource={courseResource} /> │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│ RESOURCECRUD MONTA                         │
│ useEffect → loadRows()                     │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│ CARGAR LISTA                               │
│ GET /api/courses                           │
│ ← Array de cursos                          │
│ setRows(data)                              │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│ MOSTRAR TABLA                              │
│ <DataTable rows={rows} columns={columns}   │
│ Botones: Editar, Eliminar, Acciones       │
└──────────────┬──────────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
   ┌────▼─────┐  ┌───▼────┐
   │EDITAR     │  │ELIMINAR│
   │           │  │        │
   │startEdit()│  │handler │
   │Mostrar    │  │Delete()│
   │formulario │  │        │
   └───────────┘  └────────┘
        │ [Usuario completa forma]
        │ handleSubmit()
        │
    ┌───▼──────────────┐
    │ PUT /api/courses │
    │ id: 1            │
    │ { name, ... }    │
    └────────────────┬─┘
                     │
            ┌────────▼────────┐
            │ setMessage OK   │
            │ resetForm()     │
            │ loadRows()      │
            │ Vista = 'list'  │
            └─────────────────┘
```

**Archivos Involucrados:**
- `components/ResourceCrud.jsx` → Lógica CRUD
- `pages/*Page.jsx` → Configuración de recurso
- `api/client.jsx` → Llamadas HTTP
- `components/ui/DataTable.jsx` → Tabla
- `components/ui/FormControls.jsx` → Formulario

---

## 📡 FLUJOS DE DATOS (Data Flow)

### Backend → Frontend

```
BACKEND (Java/Spring)
    │
    ├─ GET /api/courses
    │   └─ Retorna: [{id, name, institution, ...}, ...]
    │
    ├─ POST /api/auth/login
    │   └─ Retorna: {accessToken, refreshToken}
    │
    ├─ GET /api/account/me
    │   └─ Retorna: {names, lastNames, roles: [ROLE_ADMIN], ...}
    │
    └─ DELETE /api/courses/{id}
       └─ Retorna: {success: true}
           │
           ▼
       FRONTEND (React)
           │
           ├─ apiRequest() recibe respuesta
           │   │
           │   ├─ readResponse() parsea JSON o texto
           │   │
           │   ├─ if !response.ok → lanza Error
           │   │
           │   └─ return payload
           │       │
           │       ▼
           │   Estado React (useState)
           │       │
           │       ├─ setRows(data)
           │       ├─ setProfile(data)
           │       ├─ setMessage("Actualizado")
           │       │
           │       ▼
           │   RENDER COMPONENTE
           │       │
           │       └─ Usuario ve cambios en UI
```

---

## 🔐 SISTEMA DE ROLES Y PERMISOS

### Roles Disponibles

```javascript
// En backend se definen roles como ROLE_X
ROLE_ESTUDIANTE              // Estudiantes
ROLE_ADMIN                   // Administradores
ROLE_TUTOR_PRACTICAS        // Tutores de prácticas
ROLE_TUTOR_INSTITUCIONAL    // Tutores de institución
ROLE_DIRECTOR_PRACTICAS     // Director de prácticas
ROLE_DIRECTORA_INSTITUCION  // Directora institución
```

### Control de Acceso en Navegación

```javascript
// en config/navigation.js
export const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Inicio',
    Icon: Home,
    roles: []  // ← Vacío = disponible para TODOS
  },
  {
    id: 'courses',
    label: 'Cursos',
    Icon: GraduationCap,
    roles: ['ROLE_ESTUDIANTE', 'ROLE_ADMIN', 'ROLE_DIRECTOR_PRACTICAS']
    // ↑ Solo estos roles pueden ver este menú
  }
]

// Verificación en AppLayout.jsx
const visibleItems = NAV_ITEMS.filter(item => canAccess(item, roles))

// Función canAccess en navigation.js
export function canAccess(item, roles) {
  if (!item.roles.length) return true;  // Sin restricción
  return item.roles.some(role => roles.includes(role));  // Algún rol coincide
}
```

### Control en Componentes

```javascript
// Dentro de un componente
const { hasRole } = useAuth();

if (hasRole('ROLE_ADMIN')) {
  return <AdminPanel />;
}

if (hasRole('ROLE_ESTUDIANTE', 'ROLE_TUTOR_PRACTICAS')) {
  return <StudentPanel />;
}

return <DefaultPanel />;
```

---

## 🔌 CONEXIÓN API → FRONTEND

### Cómo Se Conectan los Archivos

#### Paso 1: Iniciar Petición

```javascript
// En CoursesPage.jsx
import { apiRequest } from '../api/client';
import { useAuth } from '../auth/AuthContext';

function CoursesPage() {
  const { token } = useAuth();  // ← Obtiene token del contexto
  
  useEffect(() => {
    const data = await apiRequest('/api/courses', { token });
    // ↑ Llama a apiRequest en client.jsx
  }, [token]);
}
```

#### Paso 2: apiRequest Ejecuta

```javascript
// En api/client.jsx
export async function apiRequest(path, options = {}) {
  const { token, body, headers = {}, ...fetchOptions } = options;
  const requestHeaders = { ...headers };
  
  // Agregar autenticación
  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
    // ↑ El backend valida este token
  }
  
  // Construir URL
  const response = await fetch(buildUrl(path), config);
  // ↑ buildUrl() agrega API_BASE al path
  
  // Parsear respuesta
  const payload = await readResponse(response);
  
  // Validar
  if (!response.ok) {
    throw new Error(errorMessage(payload, `Error ${response.status}`));
  }
  
  return payload;  // ← Retorna datos al componente
}
```

#### Paso 3: Componente Recibe Datos

```javascript
// De vuelta en CoursesPage.jsx
const data = await apiRequest('/api/courses', { token });
// data = [{ id: 1, name: "Curso 1", ... }, ...]
setCourses(data);  // ← Actualiza estado

// Componente se re-renderiza con nuevos datos
return (
  <ResourceCrud 
    resource={courseResource}
    rows={courses}
  />
);
```

---

## 📊 INTERCONEXIONES DE ARCHIVOS

```
index.js
  ↓ renderiza
  ↓
App.js
  ├─ usa → AuthProvider (auth/AuthContext.jsx)
  ├─ usa → useHashRoute (utils/routes.js)
  ├─ usa → canAccess, NAV_ITEMS (config/navigation.js)
  ├─ usa → AppLayout (layout/AppLayout.jsx)
  └─ renderiza → Pages (pages/*Page.jsx)
       │
       ├─ DashboardPage
       │   ├─ usa → useAuth() (auth/AuthContext.jsx)
       │   ├─ usa → apiRequest() (api/client.jsx)
       │   └─ renderiza → SectionCard (components/ui/SectionCard.jsx)
       │
       ├─ CoursesPage, PhotosPage, etc
       │   ├─ usa → ResourceCrud (components/ResourceCrud.jsx)
       │   │   ├─ usa → apiRequest() (api/client.jsx)
       │   │   ├─ usa → useAuth() (auth/AuthContext.jsx)
       │   │   └─ renderiza → DataTable, FormControls, etc
       │   │       └─ ubicados en components/ui/
       │   └─ usa → formatRole(), formatDate(), etc (utils/format.js)
       │
       └─ LoginPage
           ├─ usa → useAuth() para login() (auth/AuthContext.jsx)
           │   └─ usa → apiRequest('/api/auth/login') (api/client.jsx)
           │       └─ usa → storeAuth() (auth/storage.jsx)
           └─ renderiza → Alert, Input, etc (components/ui/)

AuthContext.jsx
  ├─ usa → apiRequest() (api/client.jsx)
  ├─ usa → storeAuth, getStoredAuth, clearStoredAuth (auth/storage.jsx)
  └─ proporciona → useAuth() hook global
      └─ disponible en cualquier componente

AppLayout.jsx
  ├─ usa → useAuth() (auth/AuthContext.jsx)
  ├─ usa → NAV_ITEMS, canAccess (config/navigation.js)
  ├─ usa → setHashRoute, useHashRoute (utils/routes.js)
  ├─ usa → formatRole, joinText (utils/format.js)
  └─ renderiza → Avatar (components/Avatar.jsx)
```

---

## 🎨 COMPONENTES REUTILIZABLES (UI)

### Alert.jsx - Mostrar Mensajes

```javascript
import { Alert } from '../components/ui/Alert';

// Éxito (verde)
<Alert tone="success">Registro guardado</Alert>

// Error (rojo)
<Alert tone="error">Error al guardar</Alert>

// Info (azul)
<Alert tone="info">Por favor espera</Alert>
```

### DataTable.jsx - Tablas de Datos

```javascript
import { DataTable } from '../components/ui/DataTable';

<DataTable 
  rows={[
    { id: 1, name: 'Curso 1' },
    { id: 2, name: 'Curso 2' }
  ]}
  columns={[
    { key: 'name', header: 'Nombre' },
    { key: 'actions', header: 'Acciones', render: (row) => (...) }
  ]}
/>
```

### FormControls.jsx - Inputs de Formulario

```javascript
import { Field, Input, Select, Textarea } from '../components/ui/FormControls';

<form>
  <Field label="Nombre">
    <Input 
      value={form.name}
      onChange={(e) => setField('name', e.target.value)}
      placeholder="Ingrese nombre"
    />
  </Field>
  
  <Field label="Tipo">
    <Select value={form.type} onChange={(e) => setField('type', e.target.value)}>
      <option value="TIPO_A">Tipo A</option>
      <option value="TIPO_B">Tipo B</option>
    </Select>
  </Field>
</form>
```

### SectionCard.jsx - Tarjeta de Contenido

```javascript
import { SectionCard } from '../components/ui/SectionCard';

<SectionCard title="Mis Cursos" action={<button>Crear</button>}>
  <p>Contenido aquí</p>
</SectionCard>
```

---

## 🔧 UTILIDADES IMPORTANTES

### formatRole() - Formatear Roles para UI

```javascript
import { formatRole } from '../utils/format';

const role = 'ROLE_ADMIN';
formatRole(role);  // → 'Admin'

const role2 = 'ROLE_ESTUDIANTE';
formatRole(role2);  // → 'Estudiante'
```

### formatDate() y formatDateTime() - Fechas Localizadas

```javascript
import { formatDate, formatDateTime } from '../utils/format';

formatDate('2024-05-15T10:30:00');      // → '15 may 2024'
formatDateTime('2024-05-15T10:30:00');  // → '15 may 2024 10:30'
```

### toQuery() - Parámetros de URL

```javascript
import { toQuery } from '../api/client';

toQuery({ page: 0, size: 10, search: 'test' })
// → '?page=0&size=10&search=test'

// Uso:
const url = `/api/courses${toQuery({ page: 0, size: 20 })}`;
// → '/api/courses?page=0&size=20'
```

---

## 🚀 FLUJO COMPLETO: Ejemplo Práctico

### Objetivo: Un usuario edita un curso

```
1. Usuario navega a #/courses
   └─ setHashRoute('courses') en AppLayout.jsx

2. App.js detecta route='courses'
   └─ Renderiza <CoursesPage />

3. CoursesPage.jsx monta
   └─ Renderiza <ResourceCrud resource={courseResource} />

4. ResourceCrud monta
   └─ useEffect → loadRows()
      └─ apiRequest('/api/courses', { token })
         └─ fetch con Authorization: Bearer {token}
            └─ Backend valida token y retorna array de cursos
               └─ setRows(data)
                  └─ <DataTable rows={rows} /> renderiza tabla

5. Usuario hace click en botón EDITAR
   └─ onClick: startEdit(row)
      └─ setSelectedId(row.id)
      └─ setForm(fromRow(resource.fields, row))
      └─ setActiveView('form')
         └─ Renderiza formulario con datos precargados

6. Usuario modifica campos
   └─ onChange: setField('name', newValue)
      └─ setForm({ ...form, name: newValue })
         └─ Componente re-renderiza con nuevos valores

7. Usuario hace click en GUARDAR
   └─ onSubmit: handleSubmit()
      └─ body = cleanPayload(resource.fields, form)
      └─ apiRequest(resource.updatePath(selectedId), {
           method: 'PUT',
           token,
           body
         })
         └─ fetch PUT /api/courses/1 con body JSON
            └─ Backend valida y guarda cambios
               └─ Retorna curso actualizado
                  └─ resetForm()
                  └─ loadRows()
                  └─ setActiveView('list')
                     └─ Renderiza tabla actualizada
                        └─ Usuario ve cambios ✓
```

---

## 🐛 DEBUGGING

### DataInspector.jsx - Ver Estado de Componente

```javascript
import { DataInspector } from '../components/DataInspector';

// Ver estado interno
<DataInspector data={form} />
// Muestra: JSON formateado del estado
```

### EndpointConsole.jsx - Probar Endpoints

```javascript
import { EndpointConsole } from '../components/EndpointConsole';

// Consola para hacer peticiones HTTP manualmente
<EndpointConsole />
// Permite escribir endpoints y ver respuestas
```

### console.log() en Navegador

```javascript
// Ver autenticación actual
const { token, profile, roles } = useAuth();
console.log({ token, profile, roles });

// Ver ruta actual
const route = useHashRoute();
console.log('Ruta:', route);
```

---

## 📋 CHECKLIST: Agregar Nueva Página

1. **Crear página en `pages/NewPage.jsx`**
   - Importar `useAuth`, `apiRequest`
   - Usar `ResourceCrud` para CRUD genérico

2. **Agregar a `App.js` PAGES**
   ```javascript
   const PAGES = {
     // ...
     newpage: NewPage,
   }
   ```

3. **Agregar a `config/navigation.js` NAV_ITEMS**
   ```javascript
   {
     id: 'newpage',
     label: 'Nueva Página',
     Icon: SomeIcon,
     roles: ['ROLE_ADMIN']
   }
   ```

4. **Configurar recurso (si usa CRUD)**
   - Definir `listPath`, `createPath`, `updatePath`, `deletePath`
   - Definir `fields` (columnas del formulario)
   - Definir `columns` (columnas de tabla)

5. **¡Listo!** La página está disponible en `/#/newpage`

---

## 📝 RESUMEN

El frontend de SystemSGP es una aplicación React bien estructurada que:

✅ Usa **React Context API** para autenticación global  
✅ Implementa **hash routing** para navegación sin servidor  
✅ Controla acceso basado en **roles (RBAC)**  
✅ Tiene **componentes reutilizables** para CRUD genérico  
✅ Persiste datos en **localStorage**  
✅ Comunica con backend mediante **JWT tokens**  
✅ Usa **Tailwind CSS** para estilos responsive  
✅ Organiza código en carpetas por responsabilidad  

**Archivos Clave:**
- `AuthContext.jsx` - El corazón de la autenticación
- `api/client.jsx` - Puente con el backend
- `ResourceCrud.jsx` - Componente CRUD genérico
- `App.js` - Enrutamiento y selección de página
- `AppLayout.jsx` - Estructura visual principal

---

**Última actualización:** 16 de mayo de 2026
