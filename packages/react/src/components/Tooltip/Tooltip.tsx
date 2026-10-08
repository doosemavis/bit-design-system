import { Children, cloneElement, isValidElement, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ReactElement, ReactNode, Ref } from 'react';
import { composeRefs, mergeProps } from '../../system/Slot';
import { useTooltipLayer } from './useTooltipLayer';

/** How long the bubble outlasts the pointer leaving, in ms: time to cross the gap onto the bubble. */
const HIDE_DELAY_MS = 100;

export interface TooltipProps {
  /** What the bubble says: a short label or hint. Keep it to a line or two of plain text. */
  content: ReactNode;
  /** The trigger: one element that takes focus and pointer events (a Button, a Link). It keeps its own props, handlers and ref. */
  children: ReactElement;
  /**
   * Show or hide the bubble from the parent, which then owns it: hover and focus no longer open it, and
   * Esc does nothing (the parent closes it). Default: the Tooltip owns it.
   */
  open?: boolean;
  /**
   * Point the trigger's `aria-describedby` at the bubble, joined to any it already has. Turn it off when
   * the bubble only repeats the trigger's name. Default: true.
   */
  describe?: boolean;
}

/**
 * A short label for a trigger, shown on hover and focus in an inverse bubble above it (below when there
 * is no room), in the top layer. Esc closes it; the pointer may rest on the bubble. Class: `bit-tooltip` on the bubble.
 */
export function Tooltip({ content, children, open: openProp, describe = true }: TooltipProps) {
  const trigger = Children.toArray(children).find(isValidElement) as ReactElement<Record<string, unknown>> | undefined;
  if (!trigger) throw new Error('bit Tooltip: children must be one element (the trigger)');

  const id = useId();
  const [own, setOwn] = useState(false);
  // Empty content means no bubble at all (but the trigger keeps its place in the tree, so it keeps focus).
  const empty = content === undefined || content === null || content === false || content === '';
  const open = (openProp ?? own) && !empty;
  const triggerRef = useRef<HTMLElement | null>(null);
  const bubbleRef = useRef<HTMLSpanElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const cancel = useCallback(() => clearTimeout(timer.current), []);
  const show = useCallback(() => {
    cancel();
    setOwn(true);
  }, [cancel]);
  const hide = useCallback(() => {
    cancel();
    setOwn(false);
  }, [cancel]);
  const hideSoon = useCallback(() => {
    cancel();
    timer.current = setTimeout(() => setOwn(false), HIDE_DELAY_MS);
  }, [cancel]);
  useEffect(() => cancel, [cancel]);

  // Esc closes an open bubble before anything else hears it (a Dialog behind it stays open). Only a
  // bubble the Tooltip owns: when the parent owns `open`, Esc is left alone, since it couldn't close it.
  const owned = openProp === undefined;
  useEffect(() => {
    if (!owned || !open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      hide();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [owned, open, hide]);

  const contentKey = typeof content === 'string' || typeof content === 'number' ? String(content) : '';
  useTooltipLayer(open, triggerRef, bubbleRef, contentKey);

  const childProps = trigger.props;
  const childRef = childProps.ref as Ref<HTMLElement> | undefined;
  const ref = useMemo(() => composeRefs<HTMLElement>(triggerRef, childRef), [childRef]);
  const described = [childProps['aria-describedby'], describe && !empty ? id : undefined].filter(Boolean).join(' ');
  const merged = mergeProps(
    { onPointerEnter: show, onFocus: show, onPointerLeave: hideSoon, onBlur: hide },
    childProps,
  );

  return (
    <>
      {cloneElement(trigger, { ...merged, ref, 'aria-describedby': described || undefined })}
      {empty ? null : (
        <span ref={bubbleRef} id={id} role="tooltip" className="bit-tooltip" hidden={!open} onPointerEnter={show} onPointerLeave={hideSoon}>
          {content}
        </span>
      )}
    </>
  );
}
