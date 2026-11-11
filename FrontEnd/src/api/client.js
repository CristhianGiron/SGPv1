/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          client.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Proporciona las funciones de client utilizadas por la interfaz del SGP.
 */

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

import { getStoredAuth, storeAuth, clearStoredAuth } from '../features/auth/authStorage';
let refreshInFlight = null;
function sessionId(token) {
  try { return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).sid || null; }
  catch { return null; }
}
function sameSession(token, auth) {
  return auth && (token === auth.accessToken || (sessionId(token) && sessionId(token) === sessionId(auth.accessToken)));
}
async function renewSession() {
  if (refreshInFlight) return refreshInFlight;
  const starting = getStoredAuth();
  if (!starting?.refreshToken) return null;
  refreshInFlight = (async () => {
    const response = await fetch(buildUrl('/api/auth/refresh'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: starting.refreshToken }) });
    const payload = await readResponse(response);
    const current = getStoredAuth();
    if (current?.refreshToken !== starting.refreshToken) {
      return sameSession(starting.accessToken, current) ? current : null;
    }
    if (!response.ok) {
      if ([401,403].includes(response.status)) clearStoredAuth();
      const error = new Error(errorMessage(payload,'No se pudo renovar la sesión'));
      error.status = response.status; throw error;
    }
    if (!payload?.accessToken || !payload?.refreshToken) throw new Error('Respuesta de renovación incompleta');
    const renewed = { ...starting, ...payload }; storeAuth(renewed); return renewed;
  })().finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}
async function authenticatedFetch(path, config, token) {
  const original = getStoredAuth();
  let response = await fetch(buildUrl(path), config);
  if (response.status !== 401 || !token || !path.startsWith('/api/')
      || ['/api/auth/login','/api/auth/register','/api/auth/refresh'].includes(path) || !sameSession(token,original)) return response;
  let current = getStoredAuth();
  if (!sameSession(token,current)) return response;
  if (current.accessToken === token) current = await renewSession();
  if (!current || !sameSession(token,current)) return response;
  return fetch(buildUrl(path), { ...config, headers: { ...config.headers, Authorization: `Bearer ${current.accessToken}` } });
}

function defaultApiBase() {
  if (
    typeof window === 'undefined'
    || process.env.NODE_ENV !== 'development'
    || ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ) {
    return '';
  }

  const apiOrigin = new URL(window.location.origin);
  apiOrigin.port = process.env.REACT_APP_API_PORT || '8080';
  return apiOrigin.origin;
}

const API_BASE = (process.env.REACT_APP_API_BASE_URL || defaultApiBase()).replace(/\/$/, '');

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

export function apiUrl(path) {
  return buildUrl(path);
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
    requestHeaders['Content-Type'] = 'application/json; charset=UTF-8';
    config.body = JSON.stringify(body);  // Otros datos se convierten a JSON
  }

  // Realizar la petición fetch
  const response = await authenticatedFetch(path, config, token);
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
  const response = await authenticatedFetch(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }, token);

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
