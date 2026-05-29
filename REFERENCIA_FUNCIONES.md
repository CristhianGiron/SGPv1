# 🔧 REFERENCIA RÁPIDA DE FUNCIONES Y HOOKS

## 🎯 Hooks Principales (React)

### useAuth() - Acceso a Autenticación Global

**Ubicación:** `auth/AuthContext.jsx`

```javascript
import { useAuth } from '../auth/AuthContext';

function MyComponent() {
  const {
    token,           // String: JWT access token
    profile,         // Object: { names, lastNames, roles, email, ... }
    roles,           // Array: ['ROLE_ADMIN', 'ROLE_ESTUDIANTE', ...]
    auth,            // Object: { accessToken, refreshToken, username }
    loadingProfile,  // Boolean: true mientras carga perfil
    profileError,    // String: mensaje de error al cargar perfil
    
    login,           // Function(credentials) → Promise
    registerStudent, // Function({ data, file }) → Promise
    logout,          // Function() → void
    refreshProfile,  // Function() → Promise
    
    hasRole,         // Function(...roles) → Boolean
  } = useAuth();
}
```

**Ejemplos:**

```javascript
// Verificar si está autenticado
if (token) {
  console.log('Usuario autenticado');
}

// Verificar roles
if (hasRole('ROLE_ADMIN', 'ROLE_DIRECTOR_PRACTICAS')) {
  // Usuario tiene al menos uno de estos roles
  return <AdminPanel />;
}

// Hacer login
try {
  await login({ username: 'user', password: 'pass' });
  // Usuario está ahora autenticado
} catch (error) {
  console.error('Login falló:', error.message);
}

// Cerrar sesión
logout();  // Limpia tokens y perfil
```

---

### useHashRoute() - Obtener Ruta Actual

**Ubicación:** `utils/routes.js`

```javascript
import { useHashRoute } from '../utils/routes';

function MyComponent() {
  const route = useHashRoute();  // String: 'dashboard', 'courses', etc
  
  return <div>Estás en: {route}</div>;
}
```

**Ejemplo:**

```javascript
const route = useHashRoute();

if (route === 'dashboard') {
  return <DashboardContent />;
}

if (route === 'courses') {
  return <CoursesContent />;
}
```

---

## 📡 API Utilities

### apiRequest() - Llamadas HTTP

**Ubicación:** `api/client.jsx`

```javascript
import { apiRequest } from '../api/client';

// Sintaxis
const data = await apiRequest(path, options);
```

**Parámetros:**

| Param | Tipo | Descripción |
|-------|------|-------------|
| `path` | String | Ruta del endpoint (ej: '/api/courses') |
| `options.token` | String | JWT token para autenticación |
| `options.method` | String | HTTP method (GET, POST, PUT, DELETE, PATCH) |
| `options.body` | Object\|FormData | Datos a enviar |
| `options.headers` | Object | Headers adicionales |

**Ejemplos:**

```javascript
// GET - Obtener lista
const courses = await apiRequest('/api/courses', { token });

// GET con parámetros
const page = await apiRequest('/api/courses?page=0&size=10', { token });

// POST - Crear
const newCourse = await apiRequest('/api/courses', {
  token,
  method: 'POST',
  body: { name: 'Nuevo Curso', institution: 'ESPOL' }
});

// PUT - Actualizar
const updated = await apiRequest('/api/courses/123', {
  token,
  method: 'PUT',
  body: { name: 'Nombre Actualizado' }
});

// DELETE - Eliminar
await apiRequest('/api/courses/123', {
  token,
  method: 'DELETE'
});

// FormData - Upload con archivo
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('data', JSON.stringify({ name: 'Foto' }));

await apiRequest('/api/photos', {
  token,
  method: 'POST',
  body: formData  // FormData se envía tal cual
});

// Con errores
try {
  const data = await apiRequest('/api/courses', { token });
} catch (error) {
  console.error('Error:', error.message);
  // Error puede ser: "Error 404", "Usuario no autenticado", etc
}
```

---

### toQuery() - Construir Query String

**Ubicación:** `api/client.jsx`

```javascript
import { toQuery } from '../api/client';

// Convierte objeto a query string
const query = toQuery({ page: 0, size: 20, search: 'test' });
// Resultado: '?page=0&size=20&search=test'

// Uso en URL
const url = `/api/courses${toQuery({ page: 0, size: 10 })}`;
// Resultado: '/api/courses?page=0&size=10'

// Filtra valores vacíos
toQuery({ page: 0, search: '', city: 'Guayaquil' });
// Resultado: '?page=0&city=Guayaquil'  ← search no se incluye (está vacío)
```

---

### apiBlob() - Descargar Archivos

**Ubicación:** `api/client.jsx`

```javascript
import { apiBlob } from '../api/client';

// Descargar y abrir/guardar archivo
const blob = await apiBlob('/api/photos/123/file', token);
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'foto.jpg';
link.click();
```

---

### unwrapPage() - Parsear Respuestas Paginadas

**Ubicación:** `api/client.jsx`

```javascript
import { unwrapPage } from '../api/client';

// El backend puede retornar:
// 1. Array directo: [item1, item2, ...]
// 2. Objeto paginado: { content: [...], totalElements: 100, ... }

const payload1 = [{ id: 1 }, { id: 2 }];
unwrapPage(payload1);  // → [{ id: 1 }, { id: 2 }]

const payload2 = { content: [{ id: 1 }], totalElements: 50 };
unwrapPage(payload2);  // → [{ id: 1 }]
```

---

## 📝 Funciones de Formato

**Ubicación:** `utils/format.js`

### joinText() - Unir Múltiples Strings

```javascript
import { joinText } from '../utils/format';

joinText('Juan', 'Pérez', null);  // → 'Juan Pérez'
joinText('Ana', '', 'María');      // → 'Ana María'
joinText(null, null);              // → ''
```

---

### formatRole() - Convertir Rol a Texto

```javascript
import { formatRole } from '../utils/format';

formatRole('ROLE_ADMIN');           // → 'Admin'
formatRole('ROLE_ESTUDIANTE');      // → 'Estudiante'
formatRole('ROLE_TUTOR_PRACTICAS'); // → 'Tutor Practicas'
```

---

### formatDate() - Fecha Localizada

```javascript
import { formatDate } from '../utils/format';

formatDate('2024-05-15T10:30:00');  // → '15 may 2024'
formatDate('2024-12-25');           // → '25 dic 2024'
formatDate(null);                   // → '-'
```

---

### formatDateTime() - Fecha y Hora

```javascript
import { formatDateTime } from '../utils/format';

formatDateTime('2024-05-15T14:30:00');  // → '15 may 2024 14:30'
formatDateTime('2024-12-25T09:00:00');  // → '25 dic 2024 09:00'
```

---

### formatBytes() - Tamaño de Archivo

```javascript
import { formatBytes } from '../utils/format';

formatBytes(512);           // → '512 B'
formatBytes(1024);          // → '1.0 KB'
formatBytes(1048576);       // → '1.0 MB'
formatBytes(1073741824);    // → '1.0 GB'
```

---

### formatEnum() - Convertir ENUM a Texto

```javascript
import { formatEnum } from '../utils/format';

formatEnum('ESTADO_ACTIVO');        // → 'Estado Activo'
formatEnum('TIPO_ESTUDIANTE');      // → 'Tipo Estudiante'
formatEnum(null);                   // → '-'
```

---

### labelFromKey() - Clave a Etiqueta

```javascript
import { labelFromKey } from '../utils/format';

labelFromKey('firstName');      // → 'First Name'
labelFromKey('email_address');  // → 'Email Address'
labelFromKey('ID');             // → 'I D'
```

---

### formatValue() - Formateo Genérico

```javascript
import { formatValue } from '../utils/format';

formatValue('2024-05-15', 'createdAt');  // → '15 may 2024'
formatValue('ACTIVO', 'status');        // → 'Activo'
formatValue(1024, 'fileSize');          // → '1.0 KB'
formatValue(null);                      // → '-'
```

---

### firstValue() - Obtener Primer Valor No Vacío

```javascript
import { firstValue } from '../utils/format';

const obj = { firstName: '', fullName: 'Juan Pérez', displayName: 'JP' };

firstValue(obj, ['firstName', 'fullName', 'displayName']);
// → 'Juan Pérez'  ← primera con valor

firstValue(obj, ['unknown']);
// → '-'  ← ninguna encontrada
```

---

## 🗂️ Funciones de Rutas

**Ubicación:** `utils/routes.js`

### getHashRoute() - Leer Ruta Actual

```javascript
import { getHashRoute } from '../utils/routes';

// Sin hook (síncrono)
const route = getHashRoute();  // 'dashboard', 'courses', etc
```

---

### setHashRoute() - Cambiar Ruta

```javascript
import { setHashRoute } from '../utils/routes';

// Cambiar a otra página
setHashRoute('courses');       // URL → /#/courses
setHashRoute('dashboard');     // URL → /#/dashboard

// Típicamente usado en botones del menú
<button onClick={() => setHashRoute('profile')}>
  Mi Perfil
</button>
```

---

## 🔐 Funciones de Storage

**Ubicación:** `auth/storage.jsx`

### getStoredAuth() - Obtener Tokens Guardados

```javascript
import { getStoredAuth } from '../auth/storage';

// Obtener tokens guardados en localStorage
const auth = getStoredAuth();
// Resultado: { accessToken: '...', refreshToken: '...', username: '...' }
// O: null si no existen
```

---

### storeAuth() - Guardar Tokens

```javascript
import { storeAuth } from '../auth/storage';

// Guardar tokens después de login
storeAuth({
  accessToken: 'eyJhbGc...',
  refreshToken: 'eyJhbGc...',
  username: 'juan.perez'
});
```

---

### clearStoredAuth() - Limpiar Tokens

```javascript
import { clearStoredAuth } from '../auth/storage';

// Eliminar tokens al hacer logout
clearStoredAuth();
```

---

## 🎛️ Funciones de Navegación

**Ubicación:** `config/navigation.js`

### canAccess() - Verificar Acceso

```javascript
import { canAccess, NAV_ITEMS } from '../config/navigation';

const item = NAV_ITEMS.find(i => i.id === 'admin-panel');
const roles = ['ROLE_ESTUDIANTE'];

canAccess(item, roles);  // → true o false

// Uso en componentes
const visibleItems = NAV_ITEMS.filter(item => 
  canAccess(item, userRoles)
);
```

---

## 📦 Componentes UI

### Alert

```javascript
<Alert tone="success">Guardado exitosamente</Alert>
<Alert tone="error">Error al guardar</Alert>
<Alert tone="info">Cargando...</Alert>
```

### SectionCard

```javascript
<SectionCard 
  title="Mis Cursos"
  action={<button>Crear Nuevo</button>}
>
  Contenido aquí
</SectionCard>
```

### DataTable

```javascript
<DataTable
  rows={data}
  columns={[
    { key: 'name', header: 'Nombre' },
    { key: 'email', header: 'Email' },
    { 
      key: 'actions',
      header: 'Acciones',
      render: (row) => <button>Editar</button>
    }
  ]}
  loading={isLoading}
/>
```

### FormControls

```javascript
<Field label="Nombre Completo">
  <Input 
    value={name}
    onChange={(e) => setName(e.target.value)}
    placeholder="Ingrese nombre"
  />
</Field>

<Field label="País">
  <Select value={country} onChange={(e) => setCountry(e.target.value)}>
    <option value="">Seleccione</option>
    <option value="EC">Ecuador</option>
    <option value="PE">Perú</option>
  </Select>
</Field>

<Field label="Descripción">
  <Textarea 
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    rows="4"
  />
</Field>
```

---

## 🚀 Patrones Comunes

### Pattern 1: Cargar Datos en useEffect

```javascript
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { apiRequest } from '../api/client';

function MyComponent() {
  const { token } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const response = await apiRequest('/api/endpoint', { token });
        if (isMounted) {
          setData(response);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => { isMounted = false; };  // Cleanup
  }, [token]);

  if (loading) return <div>Cargando...</div>;
  if (error) return <Alert tone="error">{error}</Alert>;
  
  return <div>{data}</div>;
}
```

---

### Pattern 2: Formulario Controlado

```javascript
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { apiRequest } from '../api/client';
import { PrimaryButton } from '../components/ui/ActionBar';
import { Input, Field } from '../components/ui/FormControls';
import { Alert } from '../components/ui/Alert';

function MyForm() {
  const { token } = useAuth();
  const [form, setForm] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await apiRequest('/api/users', {
        token,
        method: 'POST',
        body: form
      });
      setMessage('Usuario creado exitosamente');
      setForm({ name: '', email: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}
      
      <Field label="Nombre">
        <Input
          value={form.name}
          onChange={(e) => setField('name', e.target.value)}
        />
      </Field>

      <Field label="Email">
        <Input
          type="email"
          value={form.email}
          onChange={(e) => setField('email', e.target.value)}
        />
      </Field>

      <PrimaryButton type="submit" loading={loading}>
        Guardar
      </PrimaryButton>
    </form>
  );
}
```

---

### Pattern 3: Condicional por Rol

```javascript
import { useAuth } from '../auth/AuthContext';

function MyComponent() {
  const { hasRole, roles } = useAuth();

  if (hasRole('ROLE_ADMIN')) {
    return <AdminPanel />;
  }

  if (hasRole('ROLE_ESTUDIANTE', 'ROLE_TUTOR_PRACTICAS')) {
    return <UserPanel />;
  }

  return <div>No tienes acceso</div>;
}
```

---

**Última actualización:** 16 de mayo de 2026
