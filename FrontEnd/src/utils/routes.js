/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          routes.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Proporciona las funciones de routes utilizadas por la interfaz del SGP.
 */

/**
 * ROUTES UTILS - Gestión de enrutamiento por hash
 * 
 * Este sistema usa routing basado en hash (#) que permite:
 * - Navegación sin recargar la página
 * - No requiere configuración en servidor web
 * - Compatible con hosting estático
 * 
 * Ejemplos de rutas:
 *   /#/dashboard
 *   /#/courses
 *   /#/profile
 *   / (por defecto va a #/dashboard)
 */

import { useEffect, useRef, useState } from 'react';

/**
 * getHashRoute - Lee la ruta actual del hash en la URL
 * Remueve el # y / al inicio
 * Si está vacío, retorna 'dashboard' como default
 * 
 * @returns {string} La ruta actual (ej: 'dashboard', 'courses', 'profile')
 */
export function getHashRoute() {
  const route = window.location.hash.replace(/^#\/?/, '');
  return route || 'dashboard';
}

/**
 * setHashRoute - Cambia la ruta actual en la URL
 * Esta función actualiza la URL sin recargar la página
 * 
 * @param {string} route - Nueva ruta (ej: 'dashboard', 'courses')
 * 
 * Ejemplo:
 *   setHashRoute('courses')  // URL cambia a /#/courses
 */
let approvedRoute = null;

export function setHashRoute(route) {
  if (getHashRoute() === String(route).replace(/^#\/?/, '')) return;
  if (!window.dispatchEvent(new Event('sgp-before-navigate', { cancelable: true }))) return;
  approvedRoute = String(route).replace(/^#\/?/, '');
  window.location.hash = route;
}

export function getRouteSegments(route) {
  return String(route || '')
    .split('?')[0]
    .split('/')
    .filter(Boolean);
}

export function getBaseRoute(route) {
  return getRouteSegments(route)[0] || 'dashboard';
}

export function getNestedRoute(route) {
  return getRouteSegments(route).slice(1).join('/');
}

/**
 * useHashRoute - Hook React para obtener y seguir cambios en la ruta
 * Cada vez que la ruta cambia (por browser back/forward o setHashRoute),
 * el componente se re-renderiza con la nueva ruta
 * 
 * @returns {string} La ruta actual
 * 
 * Ejemplo de uso en componente:
 *   function MyComponent() {
 *     const route = useHashRoute();
 *     return <div>Actual route: {route}</div>
 *   }
 */
export function useHashRoute() {
  const [route, setRoute] = useState(getHashRoute);
  const previousRoute = useRef(route);

  // Escuchar cambios en el hash de la URL (navegación con browser back/forward)
  useEffect(() => {
    function handleHashChange() {
      const next = getHashRoute();
      if (next === previousRoute.current) return;
      if (approvedRoute !== next && !window.dispatchEvent(new Event('sgp-before-navigate', { cancelable: true }))) {
        window.history.replaceState(null, '', `#/${previousRoute.current}`);
        return;
      }
      approvedRoute = null;
      previousRoute.current = next;
      setRoute(next);
    }

    // Agregar listener para eventos de cambio de hash
    window.addEventListener('hashchange', handleHashChange);
    // Limpiar listener al desmontar componente
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return route;
}
