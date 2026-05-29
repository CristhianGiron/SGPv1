/**
 * API CLIENT - Cliente HTTP para comunicación con el backend
 * 
 * Proporciona funciones para:
 * 1. Realizar peticiones HTTP (GET, POST, PUT, DELETE, PATCH)
 * 2. Manejar autenticación con tokens JWT
 * 3. Convertir respuestas según tipo de contenido
 * 4. Formatear parámetros de consulta
 * 5. Descargar archivos (blob)
 * 
 * Todas las peticiones incluyen automáticamente el token en el header Authorization
 */

// Obtener URL base de la API desde variables de entorno
// Si no existe, usar string vacío (proxy local)
const API_BASE = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '');

/**
 * buildUrl - Construye URL completa para la petición
 * Si la ruta ya es URL absoluta, la retorna tal cual
 * Si no, la prepend con la base de la API
 */
function buildUrl(path) {
  if (path.startsWith('http')) {
    return path;
  }

  return `${API_BASE}${path}`;
}

/**
 * readResponse - Procesa la respuesta del servidor
 * Si es JSON, la parsea; si es texto, la retorna como string
 */
function readResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

/**
 * errorMessage - Extrae mensaje de error de la respuesta del servidor
 * @param {*} payload - Datos devueltos por el servidor
 * @param {string} fallback - Mensaje por defecto si no hay error específico
 */
function errorMessage(payload, fallback) {
  if (payload && typeof payload === 'object' && payload.message) {
    return payload.message;
  }

  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  return fallback;
}

function normalizeMessage(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function isAccessDeniedMessage(value) {
  const message = normalizeMessage(value);

  if (!message) {
    return false;
  }

  return message.includes('acceso denegado')
    || message.includes('access denied')
    || message === 'forbidden'
    || message === 'error 403'
    || message.includes('status=403')
    || message.includes('status 403')
    || message.includes('http 403');
}

export function isAccessDeniedError(error) {
  return Boolean(error?.accessDenied || error?.status === 403 || isAccessDeniedMessage(error?.message));
}

/**
 * apiRequest - Función principal para hacer peticiones HTTP
 * 
 * @param {string} path - Ruta relativa o absoluta del endpoint
 * @param {Object} options - Opciones de la petición
 *   - token: Token JWT para autenticación
 *   - body: Datos a enviar (objeto o FormData)
 *   - method: Método HTTP (GET, POST, PUT, DELETE, PATCH)
 *   - headers: Headers adicionales
 *   - ...otros parámetros de fetch
 * 
 * @returns {Promise} Respuesta parseada del servidor
 * @throws {Error} Si la respuesta no es OK (status >= 400)
 * 
 * Ejemplo:
 *   const data = await apiRequest('/api/courses', { token, method: 'GET' })
 *   const created = await apiRequest('/api/courses', { 
 *     token, 
 *     method: 'POST', 
 *     body: { name: 'Curso 1' } 
 *   })
 */
export async function apiRequest(path, options = {}) {
  const { token, body, headers = {}, ...fetchOptions } = options;
  const requestHeaders = { ...headers };
  const config = {
    ...fetchOptions,
    headers: requestHeaders,
  };

  // Agregar token JWT en el header si existe
  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  // Preparar body según su tipo
  if (body instanceof FormData) {
    config.body = body;  // FormData se envía tal cual (no JSONify)
  } else if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
    config.body = JSON.stringify(body);  // Otros datos se convierten a JSON
  }

  // Realizar la petición fetch
  const response = await fetch(buildUrl(path), config);
  const payload = await readResponse(response);

  // Si hay error, lanzar excepción con mensaje descriptivo
  if (!response.ok) {
    const message = errorMessage(payload, `Error ${response.status}`);
    const requestError = new Error(message);
    requestError.status = response.status;
    requestError.payload = payload;
    requestError.accessDenied = response.status === 403 || isAccessDeniedMessage(message);
    throw requestError;
  }

  return payload;
}

/**
 * apiBlob - Descarga un archivo desde el servidor
 * Usado para descargar fotos, documentos, etc
 * 
 * @param {string} path - Ruta del archivo
 * @param {string} token - Token de autenticación
 * @returns {Promise<Blob>} Archivo en formato blob
 */
export async function apiBlob(path, token) {
  const response = await fetch(buildUrl(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const payload = await readResponse(response);
    const message = errorMessage(payload, `Error ${response.status}`);
    const requestError = new Error(message);
    requestError.status = response.status;
    requestError.payload = payload;
    requestError.accessDenied = response.status === 403 || isAccessDeniedMessage(message);
    throw requestError;
  }

  return response.blob();
}

/**
 * getApiBaseLabel - Retorna el label de la URL base para mostrar en UI
 * Útil para debugging y ver desde dónde se están haciendo las peticiones
 */
export function getApiBaseLabel() {
  return API_BASE || 'proxy local';
}

export function getApiBaseUrl() {
  return API_BASE;
}

/**
 * toQuery - Convierte un objeto a query string para URLs
 * Filtra valores vacíos, null, undefined
 * 
 * Ejemplo:
 *   toQuery({ page: 0, size: 10, search: 'test' })
 *   // Retorna: '?page=0&size=10&search=test'
 * 
 * @param {Object} params - Objeto con parámetros
 * @returns {string} Query string listo para usar en URL
 */
export function toQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * unwrapPage - Extrae el array de datos de una respuesta paginada
 * Maneja dos casos:
 * 1. Array directo: [item1, item2, ...]
 * 2. Objeto con paginación: { content: [...], totalElements: 10, ... }
 * 
 * @param {Array|Object} payload - Respuesta del servidor
 * @returns {Array} Array de items
 */
export function unwrapPage(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload?.content && Array.isArray(payload.content)) {
    return payload.content;
  }

  return [];
}
