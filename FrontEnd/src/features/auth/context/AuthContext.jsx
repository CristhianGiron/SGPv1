/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          AuthContext.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente AuthContext de la interfaz del SGP.
 */

/**
 * AUTH CONTEXT - Gestión Global de Autenticación
 * 
 * Este archivo proporciona un contexto React que gestiona:
 * 1. Tokens de acceso (accessToken, refreshToken)
 * 2. Información del usuario (perfil, roles)
 * 3. Funciones de login, logout, registro
 * 4. Estado de carga del perfil
 * 
 * Se usa en toda la aplicación mediante el hook useAuth()
 * Todos los datos se persisten en localStorage para mantener sesión
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiRequest } from '../../../api/client';
import { clearStoredAuth, getStoredAuth, storeAuth } from '../authStorage';

// Crear el contexto que se proporciona a toda la aplicación
const AuthContext = createContext(null);

/**
 * AuthProvider - Proveedor de autenticación
 * Envuelve la aplicación y proporciona datos de autenticación a todos los componentes hijos
 */
export function AuthProvider({ children }) {
  // Estado de autenticación (tokens del usuario)
  const [auth, setAuth] = useState(() => getStoredAuth());
  // Perfil del usuario (nombres, roles, email, etc)
  const [profile, setProfile] = useState(null);
  // Indica si está cargando el perfil del backend
  const [loadingProfile, setLoadingProfile] = useState(false);
  // Errores al cargar el perfil
  const [profileError, setProfileError] = useState('');
  const [sessionNotice, setSessionNotice] = useState('');
  const profileRequest = useRef(0);
  useEffect(() => {
    const sync = () => setAuth(getStoredAuth());
    window.addEventListener('storage',sync);window.addEventListener('sgp-auth-changed',sync);
    return () => {window.removeEventListener('storage',sync);window.removeEventListener('sgp-auth-changed',sync);};
  }, []);

  // Extraer el token del estado de autenticación
  const token = auth?.accessToken || '';
  // Extraer los roles del perfil del usuario (para control de acceso)
  const roles = useMemo(() => profile?.roles || [], [profile]);

  /**
   * refreshProfile - Obtiene los datos del usuario desde el backend
   * Se ejecuta automáticamente cuando el token cambia
   * El backend obtiene los datos del token JWT
   */
  const refreshProfile = useCallback(async () => {
    const requestId = ++profileRequest.current;
    const owner = getStoredAuth()?.username;
    // Si no hay token, no hay usuario autenticado
    if (!token) {
      setProfile(null);
      return null;
    }

    setLoadingProfile(true);
    setProfileError('');

    try {
      // Llamada al backend para obtener datos del usuario
      const account = await apiRequest('/api/account/me', { token });
      if(requestId !== profileRequest.current || getStoredAuth()?.username !== owner) return null;
      setProfile(account);
      return account;
    } catch (error) {
      if(requestId !== profileRequest.current || getStoredAuth()?.username !== owner) return null;
      if ((error.status === 401 || error.status === 403) && getStoredAuth()?.accessToken === token) {
        clearStoredAuth();
        setAuth(null);
        setProfile(null);
      }

      setProfileError(error.message);
      return null;
    } finally {
      if(requestId === profileRequest.current) setLoadingProfile(false);
    }
  }, [token]);

  // Ejecutar refreshProfile cuando el token cambia (al montar o al hacer login)
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  /**
   * login - Autentica al usuario con credenciales (usuario/contraseña)
   * @param {Object} credentials - {username, password}
   * @returns {Object} Datos de autenticación con tokens
   */
  async function login(credentials) {
    setSessionNotice('');
    // Enviar credenciales al backend
    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: credentials,
    });
    // Preparar objeto con tokens y datos del usuario
    const nextAuth = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      username: response.username || credentials.username,
      passwordChangeRequired: response.passwordChangeRequired,
    };
    // Guardar en localStorage para persistencia
    storeAuth(nextAuth);
    // Actualizar estado
    setAuth(nextAuth);
    return nextAuth;
  }

  /**
   * registerStudent - Registra un nuevo estudiante
   * Maneja tanto datos JSON como un archivo (foto de perfil)
   * @param {Object} data - Datos del estudiante
   * @param {File} file - Archivo de foto del estudiante
   */
  async function registerStudent({ data, file }) {
  // Crear FormData para enviar JSON + archivo
  const formData = new FormData();
  // Agregar datos como JSON
  formData.append(
    'data',
    new Blob([JSON.stringify(data)], {
      type: 'application/json',
    })
  );
  // Agregar archivo si existe
  if (file) {
    formData.append('file', file);
  }
  // Enviar al backend
  const response = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
  // Preparar objeto de autenticación
  const nextAuth = {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    username: response.username || data.username,
    passwordChangeRequired: response.passwordChangeRequired,
  };
  // Si el registro fue exitoso, guardar autenticación
  if (response.accessToken) {
    storeAuth(nextAuth);
    setAuth(nextAuth);
  }
  return nextAuth;
}

  /**
   * logout - Cierra la sesión del usuario
   * Limpia todos los datos de autenticación y perfil
   */
  const clearLocalSession = useCallback(() => {
    clearStoredAuth();setAuth(null);setProfile(null);setProfileError('');
  }, []);
  const logout = useCallback(async () => {
    setSessionNotice('');
    try { const saved=getStoredAuth();if(saved?.accessToken) await apiRequest('/api/auth/logout',{token:saved.accessToken,method:'POST'}); }
    catch(error) { if(![401,403].includes(error.status)) setSessionNotice('Se cerró el acceso en este navegador, pero no se pudo confirmar el cierre en el servidor.'); }
    finally { clearLocalSession(); }
  }, [clearLocalSession]);
  const logoutAll = useCallback(async () => {
    const saved=getStoredAuth();
    await apiRequest('/api/auth/logout-all',{token:saved?.accessToken,method:'POST'});
    setSessionNotice('');clearLocalSession();
  }, [clearLocalSession]);

/**
 * Preparar el objeto value que se proporciona a través del contexto
 * Incluye estado, funciones, y helper como hasRole()
 */
const value = useMemo(
  () => ({
    auth,                           // Datos de autenticación (tokens)
    token,                          // Token de acceso actual
    profile,                        // Perfil del usuario
    roles,                          // Array de roles del usuario
    loadingProfile,                 // Estado de carga
    profileError,                   // Errores al cargar perfil
    login,                          // Función para login
    registerStudent,                // Función para registro
    logoutAll,
    sessionNotice,
    logout,                         // Función para logout
    refreshProfile,                 // Función para recargar perfil
    // Helper: verifica si el usuario tiene al menos uno de los roles
    hasRole: (...allowedRoles) => allowedRoles.some((role) => roles.includes(role)),
  }),
  [auth, token, profile, roles, loadingProfile, profileError, sessionNotice, refreshProfile, logout, logoutAll]
);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}
