import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import { getPortalRoot } from '../../utils/portal';

const VIEWPORT_GAP = 12;
const MENU_GAP = 8;
const MIN_MENU_WIDTH = 192;
const MIN_VISIBLE_HEIGHT = 120;

export function ActionMenu({ actions, label = 'Acciones' }) {
  const [open, setOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState(getHiddenPopoverStyle());
  const ref = useRef(null);
  const popoverRef = useRef(null);
  const rafRef = useRef(null);
  const portalRoot = getPortalRoot();

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const target = event.target;
      const clickedTrigger = ref.current?.contains(target);
      const clickedPopover = popoverRef.current?.contains(target);

      if (!clickedTrigger && !clickedPopover) {
        setOpen(false);
      }
    };

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleOutsideClick);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPopoverStyle(getHiddenPopoverStyle());
      return undefined;
    }

    const updatePosition = () => {
      const trigger = ref.current;
      const popover = popoverRef.current;

      if (!trigger || !popover) {
        return;
      }

      const triggerRect = trigger.getBoundingClientRect();
      const triggerIsVisible =
        triggerRect.width > 0 &&
        triggerRect.height > 0 &&
        triggerRect.bottom >= 0 &&
        triggerRect.top <= window.innerHeight &&
        triggerRect.right >= 0 &&
        triggerRect.left <= window.innerWidth;

      if (!triggerIsVisible) {
        setOpen(false);
        return;
      }

      const nextPosition = getPopoverPosition(triggerRect, popover);

      setPopoverStyle(nextPosition.style);
    };

    const schedulePosition = () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = window.requestAnimationFrame(updatePosition);
    };

    updatePosition();
    window.addEventListener('resize', schedulePosition);
    window.addEventListener('scroll', schedulePosition, true);

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(schedulePosition)
      : null;

    if (resizeObserver && ref.current && popoverRef.current) {
      resizeObserver.observe(ref.current);
      resizeObserver.observe(popoverRef.current);
    }

    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
      resizeObserver?.disconnect();
      window.removeEventListener('resize', schedulePosition);
      window.removeEventListener('scroll', schedulePosition, true);
    };
  }, [open]);

  const handleAction = (action) => {
    setOpen(false);
    action.onClick?.();
  };

  return (
    <div className="relative z-auto inline-flex" ref={ref}>
      <button
        type="button"
        className="grid h-10 w-10 place-items-center rounded-full border border-[#529914] bg-transparent text-primary transition-colors hover:border-primary hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#529914]/35 dark:border-slate-600 dark:bg-surface dark:text-ink dark:hover:border-[#75c66a] dark:hover:bg-[#203026] dark:hover:text-[#bbf7d0]"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <MoreVertical aria-hidden="true" size={18} />
        <span className="sr-only">{label}</span>
      </button>

      {open &&
        portalRoot &&
        createPortal(
          <div
            ref={popoverRef}
            className="fixed z-[100000] max-w-[calc(100vw-1.5rem)] overflow-auto rounded-lg border border-[#c8d2cd] bg-white shadow-[0_18px_45px_rgba(19,40,24,0.12)] dark:border-slate-700 dark:bg-surface dark:text-ink"
            role="menu"
            aria-label={label}
            style={popoverStyle}
          >
            {actions.map((action, index) => (
              <button
                key={action.key ?? `${action.label}-${index}`}
                type="button"
                className="flex w-full items-center gap-3 bg-transparent px-4 py-3 text-left text-sm font-bold text-[#24342f] transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-transparent disabled:hover:text-[#24342f] dark:text-ink dark:hover:bg-[#203026] dark:hover:text-[#bbf7d0] dark:disabled:hover:text-ink"
                disabled={action.disabled}
                onClick={() => handleAction(action)}
              >
                {action.icon && <action.icon aria-hidden="true" size={16} />}
                <span>{action.label}</span>
              </button>
            ))}
          </div>,
          portalRoot
        )}
    </div>
  );
}

function getHiddenPopoverStyle() {
  return {
    left: 0,
    top: 0,
    visibility: 'hidden',
  };
}

function getPopoverPosition(triggerRect, popover) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const availableBelow = viewportHeight - triggerRect.bottom - MENU_GAP - VIEWPORT_GAP;
  const availableAbove = triggerRect.top - MENU_GAP - VIEWPORT_GAP;
  const naturalHeight = popover.scrollHeight || popover.offsetHeight || MIN_VISIBLE_HEIGHT;
  const naturalWidth = popover.offsetWidth || MIN_MENU_WIDTH;
  const placement = availableBelow >= naturalHeight || availableBelow >= availableAbove
    ? 'bottom'
    : 'top';
  const availableHeight = placement === 'bottom' ? availableBelow : availableAbove;
  const maxViewportHeight = Math.max(48, viewportHeight - VIEWPORT_GAP * 2);
  const maxViewportWidth = Math.max(48, viewportWidth - VIEWPORT_GAP * 2);
  const maxHeight = Math.min(maxViewportHeight, Math.max(MIN_VISIBLE_HEIGHT, availableHeight));
  const minWidth = Math.max(MIN_MENU_WIDTH, Math.ceil(triggerRect.width));
  const popoverWidth = Math.min(Math.max(naturalWidth, minWidth), maxViewportWidth);
  const popoverHeight = Math.min(naturalHeight, maxHeight);
  const topCandidate = placement === 'bottom'
    ? triggerRect.bottom + MENU_GAP
    : triggerRect.top - popoverHeight - MENU_GAP;

  const leftCandidates = [
    triggerRect.right - popoverWidth,
    triggerRect.left,
    triggerRect.left + triggerRect.width / 2 - popoverWidth / 2,
  ];
  const left = leftCandidates.find((candidate) => fitsHorizontally(candidate, popoverWidth, viewportWidth))
    ?? clamp(triggerRect.right - popoverWidth, VIEWPORT_GAP, viewportWidth - popoverWidth - VIEWPORT_GAP);

  return {
    style: {
      left: clamp(left, VIEWPORT_GAP, viewportWidth - popoverWidth - VIEWPORT_GAP),
      top: clamp(topCandidate, VIEWPORT_GAP, viewportHeight - popoverHeight - VIEWPORT_GAP),
      maxHeight,
      minWidth,
      visibility: 'visible',
    },
  };
}

function fitsHorizontally(left, width, viewportWidth) {
  return left >= VIEWPORT_GAP && left + width <= viewportWidth - VIEWPORT_GAP;
}

function clamp(value, min, max) {
  if (max < min) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}
