import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { AnimationEvent, DialogHTMLAttributes, MouseEvent, PointerEvent, ReactNode, SyntheticEvent } from 'react';
import { SIZES } from '../../system/axes';
import type { Size } from '../../system/axes';
import { element, toClasses } from '../../system/toClasses';
import { composeRefs } from '../../system/Slot';
import { DialogContext } from './DialogContext';
import type { DialogContextValue, DialogPart } from './DialogContext';

export interface DialogProps extends Omit<DialogHTMLAttributes<HTMLDialogElement>, 'open' | 'onClose' | 'onCancel' | 'color'> {
  /** Whether the dialog is open. Dialog is controlled: keep this in state. */
  open: boolean;
  /** Called with false when the person asks to close: Esc, the ×, a DialogClose, or a click on the dimmed page. */
  onOpenChange: (open: boolean) => void;
  /** An alertdialog (a confirmation): a click on the dimmed page does not close it. Esc and × still do. */
  alert?: boolean;
  /** Width: sm 320px, md 420px, lg 560px. Class: `bit-{size}`. */
  size?: Size;
  /** DialogHeader, DialogBody and DialogFooter. */
  children: ReactNode;
}

type Phase = 'closed' | 'opening' | 'open' | 'closing';

/** The CSS animation names (dialog.css) this component waits for. */
const OPEN_ANIMATION = 'bit-dialog-open';
const CLOSE_ANIMATION = 'bit-dialog-close';
/** How long a close waits for its fold-in before closing anyway (an animation that never ends, a background tab). */
const CLOSE_FALLBACK_MS = 600;

/** True when motion is reduced, or when the browser can't say, so nothing animates. */
function reducedMotion(): boolean {
  return typeof window.matchMedia !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** True when a pointer position lies outside a box: on a modal dialog, that is the dimmed backdrop. */
function outside(point: { clientX: number; clientY: number }, box: DOMRect): boolean {
  return point.clientX < box.left || point.clientX > box.right || point.clientY < box.top || point.clientY > box.bottom;
}

/**
 * A modal dialog on the native <dialog> and showModal(): the browser puts it in the top layer, makes the
 * page behind inert and handles Esc. Dialog adds the Retro window look, the fold-out and fold-in, focus on
 * a [data-autofocus] element, focus back to the opener, and closing on a backdrop click (not for `alert`).
 */
export const Dialog = forwardRef<HTMLDialogElement, DialogProps>(function Dialog(
  { open, onOpenChange, alert = false, size = 'md', className, children, onClick, onPointerDown, onAnimationEnd, ...rest },
  ref,
) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const setRef = useMemo(() => composeRefs(ref, dialogRef), [ref]);
  const titleId = useId();
  const bodyId = useId();
  const [parts, setParts] = useState<Readonly<Record<DialogPart, boolean>>>({ header: false, body: false });
  const [phase, setPhase] = useState<Phase>('closed');
  const returnTo = useRef<HTMLElement | null>(null);
  const downOnBackdrop = useRef(false);
  const expectedClose = useRef(false);
  const fallback = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const requestClose = useCallback(() => onOpenChange(false), [onOpenChange]);

  /** Focus the opener again, unless focus has already gone somewhere else on the page. */
  const restoreFocus = useCallback(() => {
    const target = returnTo.current;
    returnTo.current = null;
    const active = document.activeElement;
    const lost = active === null || active === document.body || dialogRef.current?.contains(active) === true;
    if (target?.isConnected && lost) target.focus();
  }, []);

  const finishClose = useCallback(() => {
    clearTimeout(fallback.current);
    const dialog = dialogRef.current;
    if (dialog?.open) {
      expectedClose.current = true;
      dialog.close();
    }
    setPhase('closed');
    restoreFocus();
  }, [restoreFocus]);

  useEffect(() => {
    const dialog = dialogRef.current!;
    if (open) {
      clearTimeout(fallback.current);
      if (!dialog.open) {
        returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        dialog.showModal();
        const header = dialog.querySelector<HTMLElement>(`.${element('dialog', 'header')}`);
        if (header) dialog.style.setProperty('--_bit-dialog-bar', `${header.offsetHeight}px`);
        dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
      }
      setPhase(reducedMotion() ? 'open' : 'opening');
      return;
    }
    if (!dialog.open) return;
    if (reducedMotion()) {
      finishClose();
      return;
    }
    setPhase('closing');
    fallback.current = setTimeout(finishClose, CLOSE_FALLBACK_MS);
  }, [open, finishClose]);

  // Unmounting while open must not leave the page inert.
  useEffect(() => {
    const dialog = dialogRef.current;
    const timers = fallback;
    return () => {
      clearTimeout(timers.current);
      if (dialog?.open) dialog.close();
    };
  }, []);

  const register = useCallback((part: DialogPart) => {
    setParts((current) => ({ ...current, [part]: true }));
    return () => setParts((current) => ({ ...current, [part]: false }));
  }, []);

  const context = useMemo<DialogContextValue>(() => ({ titleId, bodyId, close: requestClose, register }), [titleId, bodyId, requestClose, register]);

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    // Esc: the browser would close at once, skipping the fold-in and our state. Ask instead.
    event.preventDefault();
    requestClose();
  }

  function handleClose() {
    if (expectedClose.current) {
      expectedClose.current = false;
      return;
    }
    // The browser closed it itself (it may refuse to cancel a repeated Esc): catch up.
    clearTimeout(fallback.current);
    setPhase('closed');
    restoreFocus();
    if (open) onOpenChange(false);
  }

  function handlePointerDown(event: PointerEvent<HTMLDialogElement>) {
    onPointerDown?.(event);
    downOnBackdrop.current = event.target === event.currentTarget && outside(event, event.currentTarget.getBoundingClientRect());
  }

  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    onClick?.(event);
    const startedOnBackdrop = downOnBackdrop.current;
    downOnBackdrop.current = false;
    if (alert || !startedOnBackdrop || event.target !== event.currentTarget) return;
    if (outside(event, event.currentTarget.getBoundingClientRect())) requestClose();
  }

  function handleAnimationEnd(event: AnimationEvent<HTMLDialogElement>) {
    onAnimationEnd?.(event);
    if (event.target !== event.currentTarget) return;
    if (phase === 'closing' && event.animationName === CLOSE_ANIMATION) finishClose();
    else if (phase === 'opening' && event.animationName === OPEN_ANIMATION) setPhase('open');
  }

  return (
    <DialogContext.Provider value={context}>
      <dialog
        ref={setRef}
        className={toClasses('dialog', [{ name: 'size', allowed: SIZES, value: size }], className)}
        role={alert ? 'alertdialog' : undefined}
        aria-labelledby={parts.header ? titleId : undefined}
        aria-describedby={parts.body ? bodyId : undefined}
        data-state={phase === 'closed' ? undefined : phase}
        {...rest}
        onCancel={handleCancel}
        onClose={handleClose}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        onAnimationEnd={handleAnimationEnd}
      >
        {children}
      </dialog>
    </DialogContext.Provider>
  );
});
