/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          storage.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Gestiona el estado y la integración de storage en la interfaz React.
 */

/**
 * STORAGE - Gestión de almacenamiento local (localStorage)
 * 
 * Proporciona funciones para persistir datos de autenticación en el navegador
 * Permite que la sesión se mantenga incluso al cerrar y abrir el navegador
 * 
 * Los datos se guardan en localStorage bajo la clave: 'sgp-auth'
 * Estructura guardada: { accessToken, refreshToken, username }
 */

const AUTH_STORAGE_KEY = 'sgp-auth';

/**
 * getStoredAuth - Obtiene los datos de autenticación guardados en localStorage
 * @returns {Object|null} Objeto de autenticación o null si no existe
 */
export function getStoredAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY));
  } catch (error) {
    return null;
  }
}

/**
 * storeAuth - Guarda datos de autenticación en localStorage
 * Se ejecuta después de login o registro exitoso
 * @param {Object} auth - Objeto con { accessToken, refreshToken, username }
 */
export function storeAuth(auth) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  window.dispatchEvent(new Event("sgp-auth-changed"));
}

/**
 * clearStoredAuth - Elimina todos los datos de autenticación de localStorage
 * Se ejecuta cuando el usuario hace logout
 */
export function clearStoredAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event("sgp-auth-changed"));
}
