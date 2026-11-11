/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          InstitutionalContext.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Gestiona el estado y la integración de InstitutionalContext en la interfaz React.
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import fallback from '../config/institutionalDefaults.json';

const InstitutionalContext = createContext(fallback);

export function InstitutionalProvider({ children }) {
  const [defaults, setDefaults] = useState(fallback);
  useEffect(() => {
    let active = true;
    apiRequest('/api/public/institutional-defaults').then((value) => {
      if (active && value && typeof value.universityName === 'string') setDefaults({ ...fallback, ...value });
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  return <InstitutionalContext.Provider value={defaults}>{children}</InstitutionalContext.Provider>;
}
export function useInstitutionalContext() { return useContext(InstitutionalContext); }
