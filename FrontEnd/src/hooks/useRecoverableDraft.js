/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          useRecoverableDraft.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Gestiona el estado y la integración de useRecoverableDraft en la interfaz React.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../features/auth/context/AuthContext';
import { useServerDraft } from './useServerDraft';

// Keys contain account and document scope, never credentials or tokens.
export function useRecoverableDraft(scope, onRestore, enabled = true) {
  const { profile, token } = useAuth();
  const owner = profile?.id ?? profile?.username;
  const key = owner == null ? null : `sgp:draft:v1:${owner}:${scope}`;
  const latest = useRef(null), dirty = useRef(false), restore = useRef(onRestore);
  restore.current = onRestore;
  const [recovery, setRecovery] = useState(null);
  const [status, setStatus] = useState('');
  const server = useServerDraft(scope, token, enabled && owner != null, value => {
    restore.current(value); latest.current = value; setRecovery(null);
    if (key) { try { localStorage.setItem(key, JSON.stringify({version:1,savedAt:new Date().toISOString(),value})); } catch {} }
  }, () => { dirty.current = false; });
  const persist = useCallback(() => {
    if (!key || !dirty.current) return;
    try {
      const saved = { version:1, savedAt:new Date().toISOString(), value:latest.current };
      localStorage.setItem(key, JSON.stringify(saved));
      setStatus('Guardado automáticamente en este navegador. Usa Guardar borrador para enviarlo al sistema.');
    } catch {
      setStatus('No se pudo guardar en este navegador. Guarda el borrador en el sistema antes de salir.');
    }
  }, [key]);
  useEffect(() => {
    dirty.current = false; latest.current = null; setStatus(''); setRecovery(null);
    if (!key) return undefined;
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      if (saved?.version === 1 && saved.value && typeof saved.value === 'object') setRecovery(saved);
    } catch { /* Invalid or disabled storage must not block the form. */ }
    return () => {
      if (dirty.current) {
        try { localStorage.setItem(key, JSON.stringify({version:1, savedAt:new Date().toISOString(), value:latest.current})); } catch { /* The visible warning already covers storage failure. */ }
      }
    };
  }, [key]);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!dirty.current) return undefined;
    const timer = setTimeout(persist, 700);
    return () => clearTimeout(timer);
  }, [revision, persist]);
  useEffect(() => {
    if (!enabled) return undefined;
    const beforeUnload = event => { if (dirty.current) { persist(); event.preventDefault(); event.returnValue = ''; } };
    const beforeNavigate = event => {
      if (!dirty.current) return;
      persist();
      if (!window.confirm('Tienes cambios sin guardar en el sistema. El borrador se conserva en este navegador si el almacenamiento está disponible. ¿Quieres salir?')) event.preventDefault();
    };
    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('sgp-before-navigate', beforeNavigate);
    return () => { window.removeEventListener('beforeunload', beforeUnload); window.removeEventListener('sgp-before-navigate', beforeNavigate); };
  }, [enabled, persist]);
  const change = value => {
    latest.current = value; dirty.current = true;
    server.change(value);
    // Persist synchronously too: switching document tabs can unmount before the debounce.
    if (key) { try { localStorage.setItem(key, JSON.stringify({version:1,savedAt:new Date().toISOString(),value})); } catch { /* Retried with visible status after debounce. */ } }
    setRecovery(null); setStatus(key ? 'Guardando copia en este navegador…' : 'Guarda el borrador en el sistema para conservar tus cambios.'); setRevision(value => value+1);
  };
  const discard = () => { if (key) { try { localStorage.removeItem(key); } catch {} } setRecovery(null); setStatus(''); dirty.current = false; };
  return { recovery: server.recovery || recovery, status: server.status || status, change,
    discard: () => { discard(); server.clear(); },
    markClean: () => { discard(); server.clear(); },
    retry: token ? server.retry : null,
    useCurrent: (server.recovery || server.conflict) && (latest.current || recovery?.value) ? () => {
      const value = latest.current || recovery?.value;
      restore.current(value); change(value); server.useCurrent(value);
    } : null,
    recover:() => { if (server.recovery) server.recover(); else if (recovery) { restore.current(recovery.value); change(recovery.value); } },
  };
}
