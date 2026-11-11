/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeWorkspaceContext.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente PracticeWorkspaceContext de la interfaz del SGP.
 */

import { createContext, useCallback, useContext } from 'react';
import { apiRequest } from '../../../api/client';
import { DOCUMENT_MODULES, SCHEDULE_MODULES } from '../../../config/endpointModules';

export const PracticeWorkspaceContext = createContext(null);
export const usePracticeWorkspace = () => useContext(PracticeWorkspaceContext);
const resources = new Set([...DOCUMENT_MODULES, ...SCHEDULE_MODULES].map(module => module.listPath.split('/')[2]).concat(['didactic-plans', 'practice-photos', 'practice-forms']));
const same = (a, b) => a != null && b != null && String(a) === String(b);

// This narrows already authorized server results for the selected workspace.
// Server authorization remains the source of access permissions.
export function scopePracticePayload(path, payload, practice) {
  if (!practice) return payload;
  const segments = path.split('?')[0].split('/').filter(Boolean);
  const resource = segments[1];
  // History event IDs are not enrollment IDs; authorization is enforced by its endpoint.
  if (resource === 'enrollments' && segments[3] === 'history') return payload;
  if (resource !== 'enrollments' && !resources.has(resource)) return payload;
  const matches = row => resource === 'enrollments'
    ? same(row.id, practice.id)
    : same(row.enrollmentId ?? row.enrollment?.id, practice.id);
  if (Array.isArray(payload)) return payload.filter(matches);
  if (payload && Array.isArray(payload.content)) {
    const content = payload.content.filter(matches);
    return { ...payload, content, totalElements: content.length, totalPages: content.length ? 1 : 0 };
  }
  if (payload?.enrollmentId != null && !same(payload.enrollmentId, practice.id)) {
    throw new Error('Este registro pertenece a otra práctica. Vuelve al listado de prácticas para abrirlo.');
  }
  return payload;
}

export function usePracticeRequest() {
  const practice = usePracticeWorkspace();
  return useCallback(async (path, options = {}) => {
    const method = (options.method || 'GET').toUpperCase();
    if (practice && method !== 'GET') {
      const enrollmentId = options.body?.enrollmentId ?? options.body?.get?.('enrollmentId');
      if (enrollmentId != null && !same(enrollmentId, practice.id)) {
        throw new Error('Selecciona la práctica actual para guardar este registro.');
      }
      if ((practice.status !== 'APPROVED' || practice.archived || practice.courseActive === false) && ['POST', 'PUT', 'DELETE'].includes(method)) {
        throw new Error('Esta práctica está disponible para consulta. No permite nuevos registros ni ediciones operativas.');
      }
    }
    const payload = await apiRequest(path, options);
    return method === 'GET' ? scopePracticePayload(path, payload, practice) : payload;
  }, [practice]);
}
