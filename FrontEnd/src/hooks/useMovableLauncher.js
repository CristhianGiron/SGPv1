/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          useMovableLauncher.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Gestiona el estado y la integración de useMovableLauncher en la interfaz React.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export const LAUNCHER_POSITION_KEY = 'sgp-accessibility-position';
const SIZE = 50, MARGIN = 12, DRAG_THRESHOLD = 6;
const bounded = value => Math.min(1, Math.max(0, value));
function savedPosition() {
  try {
    const value = JSON.parse(localStorage.getItem(LAUNCHER_POSITION_KEY));
    return value?.version === 1 && ['x', 'y'].every(key => typeof value[key] === 'number' && Number.isFinite(value[key]) && value[key] >= 0 && value[key] <= 1)
      ? { x: value.x, y: value.y } : null;
  } catch { return null; }
}
function viewport() {
  const visible = window.visualViewport;
  return { left: visible?.offsetLeft || 0, top: visible?.offsetTop || 0, width: visible?.width || window.innerWidth, height: visible?.height || window.innerHeight };
}
function limits(view, element) {
  const css = element ? getComputedStyle(element) : null;
  const inset = side => Math.max(0, parseFloat(css?.getPropertyValue(`--aw-safe-${side}`)) || 0);
  const left = view.left + MARGIN + inset('left'), top = view.top + MARGIN + inset('top');
  return { left, top, width: Math.max(0, view.width - SIZE - MARGIN * 2 - inset('left') - inset('right')), height: Math.max(0, view.height - SIZE - MARGIN * 2 - inset('top') - inset('bottom')) };
}

export function useMovableLauncher(trigger, container, ready, onActivate) {
  const [position, setPosition] = useState(savedPosition);
  const [view, setView] = useState(viewport);
  const [dragging, setDragging] = useState(false);
  const [storageNotice, setStorageNotice] = useState('');
  const [automatic, setAutomatic] = useState(null);
  const current = useRef(position), gesture = useRef(null), suppressClick = useRef(false);
  const activate = useRef(onActivate); activate.current = onActivate;
  current.current = position;
  useLayoutEffect(() => { if (ready) setView(viewport()); }, [ready]);
  useEffect(() => {
    const cancel = () => {
      if (!gesture.current) return;
      const original = gesture.current.original;
      gesture.current = null; current.current = original; setPosition(original); setDragging(false);
    };
    window.addEventListener('blur', cancel);
    return () => window.removeEventListener('blur', cancel);
  }, []);

  useEffect(() => {
    const update = () => setView(viewport());
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, []);
  // Only the default placement avoids notices automatically; a user's saved
  // position stays under their control. Re-evaluate while scrolling or loading.
  useEffect(() => {
    if (!ready || position) { setAutomatic(null); return undefined; }
    let frame;
    const update = () => {
      frame = undefined;
      if (gesture.current) return;
      const element = container.current;
      if (!element) return;
      const visible = viewport(), bounds = limits(visible, element);
      const css = getComputedStyle(element), rootCss = getComputedStyle(document.documentElement);
      const safeBottom = parseFloat(css.getPropertyValue('--aw-safe-bottom')) || 0;
      const font = parseFloat(rootCss.fontSize) || 16;
      const footer = document.querySelector('.sgp-editor-actions');
      const bottom = visible.width < 1024 && footer
        ? (parseFloat(rootCss.getPropertyValue('--sgp-editor-actions-height')) || footer.getBoundingClientRect().height)
            + Math.max(1.75 * font, safeBottom + .75 * font)
        : Math.max(16, safeBottom);
      const origin = { left: visible.left + 16, top: visible.top + visible.height - SIZE - bottom };
      const obstacles = [...document.querySelectorAll('.sgp-alert, .sgp-editor-actions, .sgp-app-topbar')]
        .filter(node => !node.closest('[hidden],[inert],[aria-hidden="true"]') && node.getClientRects().length)
        .map(node => node.getBoundingClientRect());
      const blocked = point => obstacles.some(rect => point.left < rect.right + 4 && point.left + SIZE > rect.left - 4
        && point.top < rect.bottom + 4 && point.top + SIZE > rect.top - 4);
      let next = null;
      if (blocked(origin)) {
        const header = document.querySelector('.sgp-app-topbar')?.getBoundingClientRect();
        const top = Math.min(bounds.top + bounds.height, Math.max(bounds.top, (header?.bottom || visible.top) + MARGIN));
        const candidates = [
          { left: bounds.left + bounds.width, top: origin.top },
          { left: bounds.left, top }, { left: bounds.left + bounds.width, top },
          { left: bounds.left, top: bounds.top + bounds.height / 2 },
          { left: bounds.left + bounds.width, top: bounds.top + bounds.height / 2 },
        ];
        next = candidates.filter(point => !blocked(point)).sort((a, b) =>
          Math.hypot(a.left - origin.left, a.top - origin.top) - Math.hypot(b.left - origin.left, b.top - origin.top))[0] || null;
      }
      setAutomatic(previous => previous?.left === next?.left && previous?.top === next?.top ? previous : next);
    };
    const schedule = () => { if (frame === undefined) frame = requestAnimationFrame(update); };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('scroll', schedule);
    schedule();
    return () => {
      observer.disconnect(); cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule, true); window.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('resize', schedule); window.visualViewport?.removeEventListener('scroll', schedule);
    };
  }, [ready, position, container]);
  function assign(next) { current.current = next; setPosition(next); }
  function save(next) {
    try {
      if (next) localStorage.setItem(LAUNCHER_POSITION_KEY, JSON.stringify({ version: 1, ...next }));
      else localStorage.removeItem(LAUNCHER_POSITION_KEY);
      setStorageNotice('');
    } catch { setStorageNotice('La posición se aplicó durante esta sesión; no se pudo guardar en el navegador.'); }
  }
  function move(left, top) {
    const bounds = limits(viewport(), container.current);
    const next = { x: bounds.width ? bounded((left - bounds.left) / bounds.width) : 0, y: bounds.height ? bounded((top - bounds.top) / bounds.height) : 0 };
    assign(next); return next;
  }
  function onPointerDown(event) {
    if (event.isPrimary === false || event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    suppressClick.current = false;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top, moved: false, original: current.current };
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Normal clicks still work without capture. */ }
  }
  function onPointerMove(event) {
    const drag = gesture.current;
    if (!drag || drag.id !== event.pointerId) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < DRAG_THRESHOLD) return;
    drag.moved = true; suppressClick.current = true; setDragging(true);
    event.preventDefault(); move(event.clientX - drag.offsetX, event.clientY - drag.offsetY);
  }
  function finish(event, cancel = false) {
    const drag = gesture.current;
    if (!drag || drag.id !== event.pointerId) return;
    gesture.current = null; setDragging(false);
    if (drag.moved) {
      if (cancel) assign(drag.original);
      else save(current.current);
    }
    // The browser releases capture after pointerup/cancel. Releasing it here can
    // suppress the compatibility click generated by a touch tap.
    return !cancel && !drag.moved && event.pointerType === 'touch';
  }
  function onKeyDown(event) {
    if (event.key === 'Escape' && gesture.current) {
      assign(gesture.current.original); gesture.current = null; setDragging(false); event.preventDefault(); return;
    }
    const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
    if (!direction || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    const bounds = limits(viewport(), container.current);
    const rect = current.current ? { left: bounds.left + current.current.x * bounds.width, top: bounds.top + current.current.y * bounds.height } : trigger.current.getBoundingClientRect();
    const step = event.shiftKey ? 40 : 10;
    save(move(rect.left + direction[0] * step, rect.top + direction[1] * step));
  }
  const bounds = limits(view, container.current);
  return {
    positioned: Boolean(position), automatic: Boolean(automatic && !position), dragging, storageNotice,
    style: position ? { left: bounds.left + position.x * bounds.width, top: bounds.top + position.y * bounds.height, bottom: 'auto' } : automatic ? { ...automatic, bottom: 'auto' } : undefined,
    panelStyle: position ? { justifyContent: position.x > .5 ? 'flex-end' : 'flex-start', alignItems: position.y < .5 ? 'flex-start' : 'flex-end' } : undefined,
    tooltipLeft: Boolean(position && position.x > .5),
    resetPosition() { assign(null); save(null); },
    shouldOpen(event) {
      if (suppressClick.current && event.detail !== 0) { suppressClick.current = false; event.preventDefault(); return false; }
      return true;
    },
    handlers: { onPointerDown, onPointerMove, onPointerUp: event => {
      if (finish(event)) {
        // Touch browsers can suppress compatibility clicks immediately after a drag.
        // A completed tap activates directly; any later synthetic click is ignored.
        suppressClick.current = true; activate.current?.();
      }
    }, onPointerCancel: event => finish(event, true), onLostPointerCapture: event => finish(event), onKeyDown },
  };
}
