import { useEffect, useEffectEvent, useRef } from 'react';

/**
 * Modal/sheet accessibility:
 *  - Escape closes (WCAG "escape routes" rule)
 *  - Tab cycles inside the dialog (focus trap)
 *  - Focus moves to the dialog on open, returns to the trigger on close
 *  - role="dialog" + aria-modal so screen readers announce it as one unit
 *
 * Usage:
 *   const ref = useModalA11y(isOpen, onClose);
 *   <div ref={ref} role="dialog" aria-modal="true" aria-label="Quick order">
 */
export function useModalA11y<T extends HTMLElement>(
  isOpen: boolean,
  onClose: () => void
) {
  const ref = useRef<T | null>(null);
  const close = useEffectEvent(onClose);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const nativeRoot = ref.current;
    const projectedRoot = () => {
      const id = nativeRoot?.closest<HTMLElement>('[data-svg-root-id]')?.dataset.svgRootId;
      return (id ? document.getElementById(id) : null) ?? nativeRoot;
    };
    const root = projectedRoot();
    if (!root) return;
    const hidden: HTMLElement[] = [];
    // Inert sibling branches while leaving the dialog and its ancestors usable.
    for (let branch: HTMLElement = root; branch.parentElement; branch = branch.parentElement) {
      for (const sibling of Array.from(branch.parentElement.children)) {
        if (sibling !== branch && sibling instanceof HTMLElement && !sibling.inert) {
          sibling.inert = true;
          hidden.push(sibling);
        }
      }
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Move focus into the dialog so SR/keyboard users land inside it
    const focusables = root?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = Array.from(focusables ?? []).find(el => !el.matches(':disabled') && el.tabIndex >= 0 && el.getClientRects().length > 0);
    root.tabIndex = -1;
    (firstFocusable ?? root).focus();

    const onKeyDown = (e: KeyboardEvent) => {
      const root = projectedRoot();
      if (!root) return;
      if (root.closest('[inert]')) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
        return;
      }
      if (e.key === 'Tab' && root) {
        const items = Array.from(
          root.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter(el => !el.matches(':disabled') && el.tabIndex >= 0 && el.getClientRects().length > 0);
        if (items.length === 0) { e.preventDefault(); root.focus(); return; }
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      hidden.forEach(el => { el.inert = false; });
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  return ref;
}
