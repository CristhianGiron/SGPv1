# 🎨 CHEAT SHEET - FRONTEND SYSTEMSGP EN 2 MINUTOS

## 🏃 INICIO RÁPIDO

### ¿Qué hace el frontend?
Aplicación React para gestionar prácticas académicas con:
- ✅ Login/Registro
- ✅ Menú dinámico según rol
- ✅ CRUD genérico para cualquier recurso
- ✅ Búsqueda y filtrado

### ¿Dónde empezar?
1. `index.js` ← Punto de entrada
2. `App.js` ← Orquestación
3. `auth/AuthContext.jsx` ← Autenticación
4. `components/ResourceCrud.jsx` ← CRUD

---

## 🧠 CONCEPTOS CLAVE EN 30 SEGUNDOS

| Concepto | Ubicación | Qué Hace |
|----------|-----------|----------|
| **AuthProvider** | `auth/AuthContext.jsx` | Maneja tokens globalmente |
| **useAuth()** | `auth/AuthContext.jsx` | Hook para acceder a auth |
| **apiRequest()** | `api/client.jsx` | Llamadas HTTP con JWT |
| **useHashRoute()** | `utils/routes.js` | Lee/escucha ruta actual |
| **ResourceCrud** | `components/ResourceCrud.jsx` | CRUD genérico (C,R,U,D) |
| **AppLayout** | `layout/AppLayout.jsx` | Header + Sidebar + Página |
| **NAV_ITEMS** | `config/navigation.js` | Menú con control de roles |

---

## 🔄 FLUJOS EN DIAGRAMAS

### Flow 1: Login
```
Usuario escribe credenciales
        ↓
auth.login(username, password)
        ↓
POST /api/auth/login
        ↓
Backend retorna tokens
        ↓
storeAuth(localStorage)
        ↓
refreshProfile() → GET /api/account/me
        ↓
Obtiene roles
        ↓
App muestra AppLayout + Dashboard
```

### Flow 2: Cambiar Página
```
Click menú "Cursos"
        ↓
setHashRoute('courses')
        ↓
URL → /#/courses
        ↓
useHashRoute() detecta
        ↓
App.js selecciona CoursesPage
        ↓
Renderiza <CoursesPage />
```

### Flow 3: Guardar Registro (CRUD)
```
Usuario completa formulario
        ↓
onClick: "Guardar"
        ↓
handleSubmit()
        ↓
PUT /api/courses/123 con datos
        ↓
Backend actualiza
        ↓
loadRows() recarga lista
        ↓
Tabla muestra datos nuevos
```

---

## 🔐 ROLES Y PERMISOS

### Roles Disponibles
```
ROLE_ESTUDIANTE             ← Estudiantes
ROLE_ADMIN                  ← Administradores
ROLE_TUTOR_PRACTICAS        ← Tutores prácticas
ROLE_TUTOR_INSTITUCIONAL    ← Tutores institución
ROLE_DIRECTOR_PRACTICAS     ← Director prácticas
ROLE_DIRECTORA_INSTITUCION  ← Directora institución
```

### Control de Acceso
```javascript
// En config/navigation.js
{
  id: 'courses',
  label: 'Cursos',
  roles: ['ROLE_ADMIN', 'ROLE_ESTUDIANTE']  // ← Solo estos ven este menú
}

// En componentes
const { hasRole } = useAuth();
if (hasRole('ROLE_ADMIN')) {
  return <AdminPanel />;
}
```

---

## 📁 CARPETAS IMPORTANTES

```
src/
├── index.js                    # Entrada
├── App.js                      # Orquestación ⭐
├── api/client.jsx             # HTTP + JWT ⭐
├── auth/AuthContext.jsx        # Auth global ⭐
├── auth/storage.jsx            # localStorage
├── layout/AppLayout.jsx        # Layout principal
├── config/
│   ├── navigation.js           # Menú + roles
│   └── resources.js            # Config de recursos
├── pages/
│   ├── LoginPage.jsx           # Login
│   ├── DashboardPage.jsx       # Dashboard
│   ├── CoursesPage.jsx         # Cursos
│   └── ...más páginas
├── components/
│   ├── ResourceCrud.jsx        # CRUD genérico ⭐
│   ├── Avatar.jsx
│   └── ui/                     # Componentes UI
│       ├── DataTable.jsx       # Tablas
│       ├── FormControls.jsx    # Inputs
│       ├── Alert.jsx           # Alertas
│       └── ...más componentes
└── utils/
    ├── routes.js               # Hash routing
    └── format.js               # Formateo de datos
```

⭐ = Archivos críticos / Empezar aquí

---

## ⚡ SNIPPETS COMUNES

### Acceder a Autenticación
```javascript
import { useAuth } from '../auth/AuthContext';

function MyComponent() {
  const { token, profile, roles, hasRole, logout } = useAuth();
  
  if (hasRole('ROLE_ADMIN')) {
    return <AdminPanel />;
  }
}
```

### Hacer Petición HTTP
```javascript
import { apiRequest } from '../api/client';
import { useAuth } from '../auth/AuthContext';

function MyComponent() {
  const { token } = useAuth();
  
  const data = await apiRequest('/api/courses', { token });
  // Para POST: { token, method: 'POST', body: {...} }
  // Para PUT: { token, method: 'PUT', body: {...} }
}
```

### Cambiar de Página
```javascript
import { setHashRoute } from '../utils/routes';

<button onClick={() => setHashRoute('courses')}>
  Ir a Cursos
</button>
```

### CRUD Genérico
```javascript
import { ResourceCrud } from '../components/ResourceCrud';

<ResourceCrud resource={{
  listPath: '/api/courses',
  createPath: '/api/courses',
  updatePath: (id) => `/api/courses/${id}`,
  deletePath: (id) => `/api/courses/${id}`,
  fields: [
    { key: 'name', type: 'text', label: 'Nombre' },
  ],
  columns: [
    { key: 'name', header: 'Nombre' },
  ]
}} />
```

---

## 🐛 DEBUGGING RÁPIDO

### Ver Autenticación
```javascript
const { token, profile, roles } = useAuth();
console.log({ token, profile, roles });
```

### Ver Ruta Actual
```javascript
const route = useHashRoute();
console.log('Ruta:', route);
```

### Probar Endpoint
```javascript
// En consola del navegador
fetch('/api/courses', {
  headers: { 'Authorization': `Bearer ${yourToken}` }
})
.then(r => r.json())
.then(data => console.log(data))
```

---

## 📊 COMPARACIÓN CONCEPTUAL

| Elemento | Similar A | Ubicación |
|----------|-----------|-----------|
| **AuthProvider** | Session Manager | `auth/AuthContext.jsx` |
| **useAuth()** | Get Current User | `auth/AuthContext.jsx` |
| **apiRequest()** | HTTP Client | `api/client.jsx` |
| **useHashRoute()** | Location Hook | `utils/routes.js` |
| **NAV_ITEMS** | Menu Configuration | `config/navigation.js` |
| **ResourceCrud** | Data Table + CRUD | `components/ResourceCrud.jsx` |
| **AppLayout** | Master Page | `layout/AppLayout.jsx` |

---

## 🎯 CHECKLIST: AGREGAR PÁGINA NUEVA

- [ ] Crear `pages/MyPage.jsx`
- [ ] Definir recurso config (endpoints, campos, columnas)
- [ ] Importar `ResourceCrud`
- [ ] Renderizar `<ResourceCrud resource={...} />`
- [ ] Agregar a `App.js` en `PAGES` map
- [ ] Agregar a `config/navigation.js` en `NAV_ITEMS`
- [ ] Asignar rol necesario en `roles: []`
- [ ] ¡Listo! Accesible en `/#/mypage`

---

## 📞 CONEXIONES PRINCIPALES

```
index.js
   ↓
App.js
   ├─ AuthProvider ← Auth Global
   ├─ useHashRoute ← Qué página mostrar
   ├─ AppLayout ← Estructura visual
   └─ Page ← Página actual
       ├─ DashboardPage
       ├─ CoursesPage
       │  ├─ ResourceCrud
       │  │  ├─ apiRequest (GET, POST, PUT, DELETE)
       │  │  ├─ useAuth (token para peticiones)
       │  │  └─ DataTable + Form
       │  └─ useAuth
       └─ LoginPage
          ├─ useAuth (login function)
          ├─ apiRequest (POST /api/auth/login)
          └─ storeAuth (guardar tokens)
```

---

## 🚀 FLUJO COMPLETO EN CÓDIGO

```javascript
// 1. USUARIO ACCEDE SITIO
// index.js → <App /> monta

// 2. APP.JS VERIFICA AUTH
function App() {
  return <AuthProvider><AppShell /></AuthProvider>;
}

// 3. AUTHPROVIDER CARGA DATOS
// ├─ getStoredAuth() ← localStorage
// ├─ refreshProfile() ← GET /api/account/me
// └─ Proporciona contexto global

// 4. APPSHELL DECIDE QUÉ MOSTRAR
function AppShell() {
  const { token } = useAuth();
  const route = useHashRoute();
  
  if (!token) return <LoginPage />;  // No autenticado
  
  const Page = PAGES[route];
  return <AppLayout><Page /></AppLayout>;  // Autenticado
}

// 5. PÁGINA USA COMPONENTS
function CoursesPage() {
  return (
    <ResourceCrud resource={courseResource} />
  );
}

// 6. RESOURCECRUD MANEJA TODO
// ├─ useEffect → cargar datos
// ├─ Mostrar tabla
// ├─ Formulario para editar
// └─ Peticiones HTTP automáticas

// 7. USUARIO HACE CAMBIOS
// ├─ Click → Estado actualiza
// ├─ apiRequest → Backend
// ├─ loadRows() → Recarga datos
// └─ UI se actualiza ✓

// 8. CAMBIAR PÁGINA
// onClick: setHashRoute('profile')
// ├─ URL → /#/profile
// ├─ useHashRoute() detecta
// └─ App.js renderiza ProfilePage
```

---

## 🎁 BONUS: VARIABLES DE ENTORNO

```env
# .env.local
REACT_APP_API_BASE_URL=http://localhost:8080
# Usado por: api/client.jsx para buildUrl()
# Si no existe: usa proxy local
```

---

## 📚 DOCUMENTOS DISPONIBLES

| Documento | Qué Contiene | Tamaño |
|-----------|-------------|--------|
| **ANALISIS_FRONTEND.md** | Arquitectura + Flujos completos | 12KB |
| **REFERENCIA_FUNCIONES.md** | Todos los hooks y funciones | 14KB |
| **MAPA_CONEXIONES.md** | Cómo conectan archivos | 15KB |
| **COMENTARIOS EN CÓDIGO** | Explicaciones inline | Distribuido |

---

## ⏱️ TIEMPO DE LECTURA

- Este cheat sheet: **2 minutos** ← Rápido
- REFERENCIA_FUNCIONES.md: **10 minutos** ← Útil
- MAPA_CONEXIONES.md: **15 minutos** ← Detallado
- ANALISIS_FRONTEND.md: **20 minutos** ← Completo
- Total: **~1 hora** para entender todo el frontend

---

**💡 Pro Tip:** Empieza con este cheat sheet, luego consulta REFERENCIA_FUNCIONES cuando necesites usar una función específica.

**Última actualización:** 16 de mayo de 2026
