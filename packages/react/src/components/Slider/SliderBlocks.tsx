import type { PointerEvent, RefObject } from 'react';
import { element } from '../../system/toClasses';
import { blockAt, litBlocks } from './sliderMath';

interface SliderBlocksProps {
  count: number;
  /** How far along the range the value is, 0 to 1. */
  fraction: number;
  /** False when disabled or read-only: clicks do nothing. */
  canChange: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  /** The value block k (0 to count) stands for. */
  valueAt: (block: number) => number;
  onDragStart: () => void;
}

/**
 * Hand a new value to the range input as the browser would: set it, then fire input and change, so React's
 * onChange and any native listener run. Nothing fires when the value is the same.
 */
function setInputValue(input: HTMLInputElement, next: number): void {
  const text = String(next);
  if (input.value === text) return;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, text);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * The blocks variant's health bar: one block per step, lit up to the value, the block at the value marked
 * current. It takes clicks and drags itself, so a pointer on block k picks k, and hands the value to the input.
 */
export function SliderBlocks({ count, fraction, canChange, inputRef, valueAt, onDragStart }: SliderBlocksProps) {
  const lit = litBlocks(fraction, count);

  function pick(event: PointerEvent<HTMLSpanElement>) {
    const cells = event.currentTarget.children;
    const first = cells[0]!.getBoundingClientRect();
    const last = cells[cells.length - 1]!.getBoundingClientRect();
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    setInputValue(inputRef.current!, valueAt(blockAt(event.clientX, { first, last, rtl }, count)));
  }

  return (
    <span
      className={element('slider', 'blocks')}
      aria-hidden="true"
      onPointerDown={(event) => {
        if (!canChange || event.button > 0) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        inputRef.current!.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
        onDragStart();
        pick(event);
      }}
      onPointerMove={(event) => {
        if (canChange && event.currentTarget.hasPointerCapture?.(event.pointerId)) pick(event);
      }}
    >
      {Array.from({ length: count }, (_, index) => {
        const block = index + 1;
        const state = block < lit ? 'on' : block === lit ? 'current' : undefined;
        return <span key={block} className={element('slider', 'block')} data-state={state} />;
      })}
    </span>
  );
}
