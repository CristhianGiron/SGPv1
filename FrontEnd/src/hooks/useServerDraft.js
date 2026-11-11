/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          useServerDraft.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Gestiona el estado y la integración de useServerDraft en la interfaz React.
 */

import { useEffect, useRef, useState } from 'react';
import { apiRequest } from '../api/client';

// A private working copy; it never submits or changes an academic document's status.
export function useServerDraft(scope, token, enabled, onRestore, onSynced) {
  const current = useRef(null);
  const callbacks = useRef({ onRestore, onSynced });
  callbacks.current = { onRestore, onSynced };
  const [state, setState] = useState({ status: '', recovery: null, conflict: false });
  useEffect(() => {
    if (!enabled || !token) { current.current = null; setState({ status: '', recovery: null, conflict: false }); return undefined; }
    const ctx = { active: true, revision: 0, ready: false, blocked: false, value: null, generation: 0, enqueued: -1, chain: Promise.resolve(), timer: null };
    current.current = ctx;
    const path = `/api/drafts/${encodeURIComponent(scope)}`;
    const show = update => { if (ctx.active) setState(old => ({ ...old, ...update })); };
    const accept = snapshot => {
      if (!snapshot || !Number.isInteger(snapshot.revision)) throw new Error('Respuesta de borrador inválida');
      ctx.revision = snapshot.revision; ctx.ready = true;
      const recovery = snapshot.content ? { value: JSON.parse(snapshot.content), savedAt: snapshot.savedAt, source: 'server' } : null;
      ctx.blocked = Boolean(recovery);
      show({ recovery });
      return recovery;
    };
    ctx.load = async (forceChoice = false) => {
      try {
        const snapshot = await apiRequest(path, { token });
        if (!ctx.active) return;
        const recovery = accept(snapshot);
        if (forceChoice) ctx.blocked = true;
        show({ conflict: forceChoice, status: recovery ? 'Hay un borrador en el servidor. Elige qué versión utilizar antes de guardar.'
          : forceChoice ? 'La copia del servidor fue retirada desde otro dispositivo. Conservamos tu texto local; elige si deseas volver a guardarlo.' : '' });
        if (ctx.value && !recovery && !forceChoice) ctx.schedule();
      } catch { show({ status: 'No se pudo consultar el autoguardado. Tu copia local sigue disponible. Reintenta la conexión.' }); }
    };
    ctx.queue = content => {
      const generation = ctx.generation;
      const serialized = content === null ? null : JSON.stringify(ctx.value);
      ctx.enqueued = generation;
      ctx.chain = ctx.chain.catch(() => {}).then(async () => {
        if (!ctx.ready) await ctx.initial;
        if (!ctx.ready || ctx.blocked) return;
        show({ status: content === null ? 'Limpiando copia del servidor…' : 'Guardando en el servidor…' });
        try {
          const result = await apiRequest(path, { method: 'PUT', token, body: { revision: ctx.revision, content: serialized } });
          ctx.revision = result.revision;
          if (ctx.active && generation === ctx.generation) {
            show({ status: content === null ? '' : 'Guardado en el servidor', recovery: null });
            if (content !== null) callbacks.current.onSynced?.();
          }
        } catch (error) {
          if (error.status === 409) {
            ctx.blocked = true;
            show({ conflict: true, status: 'El borrador cambió en otra pestaña o dispositivo. Consulta las versiones antes de continuar.' });
            await ctx.load(true);
          } else show({ status: 'No se pudo guardar en el servidor. Conservamos la copia local; reintenta la conexión.' });
        }
      });
      return ctx.chain;
    };
    ctx.schedule = () => {
      clearTimeout(ctx.timer);
      if (!ctx.ready || ctx.blocked || !ctx.value) return;
      show({ status: 'Cambios pendientes de autoguardado…' });
      ctx.timer = setTimeout(() => ctx.queue('save'), 1200);
    };
    setState({ status: 'Consultando borrador del servidor…', recovery: null, conflict: false });
    ctx.initial = ctx.load();
    return () => {
      ctx.active = false; clearTimeout(ctx.timer);
      if (ctx.value && ctx.ready && !ctx.blocked && ctx.enqueued !== ctx.generation) ctx.queue('save');
    };
  }, [scope, token, enabled]);

  return {
    ...state,
    change(value) { const ctx = current.current; if (!ctx) return; ctx.value = value; ctx.generation++; ctx.schedule(); },
    clear() { const ctx = current.current; if (!ctx) return; clearTimeout(ctx.timer); ctx.value = null; ctx.generation++; return ctx.queue(null); },
    recover() {
      const ctx = current.current;
      if (ctx && state.recovery) {
        ctx.blocked = false; ctx.value = state.recovery.value; ctx.generation++;
        setState({ status: 'Borrador del servidor recuperado', recovery: null, conflict: false });
        callbacks.current.onRestore(ctx.value); callbacks.current.onSynced?.();
      }
    },
    useCurrent(value) {
      const ctx = current.current; if (!ctx || !value) return;
      ctx.blocked = false; ctx.value = value; ctx.generation++;
      setState({ status: 'Guardando la versión elegida…', recovery: null, conflict: false }); ctx.schedule();
    },
    retry() { const ctx = current.current; if (ctx) { if (!ctx.ready || ctx.blocked) ctx.load(ctx.blocked); else ctx.schedule(); } },
  };
}
