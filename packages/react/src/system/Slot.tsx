import { Children, cloneElement, forwardRef, isValidElement } from 'react';
import type { CSSProperties, HTMLAttributes, ReactElement, ReactNode, Ref, RefObject } from 'react';

export interface SlotProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

type AnyProps = Record<string, unknown>;
type ChildProps = AnyProps & { className?: string; style?: CSSProperties; ref?: Ref<HTMLElement> };

const HANDLER = /^on[A-Z]/;

/** The single element child, or a clear error. A string, a number, nothing, or two children all throw. */
function onlyElement(children: ReactNode): ReactElement<ChildProps> {
  const items = Children.toArray(children);
  const [first] = items;
  if (items.length !== 1 || !isValidElement<ChildProps>(first)) {
    throw new Error('[bit] Link asChild needs exactly one child element.');
  }
  return first;
}

function setRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as RefObject<T | null>).current = value;
}

/** One ref callback that feeds every ref it was given. */
export function composeRefs<T>(...refs: (Ref<T> | undefined)[]): (node: T | null) => void {
  return (node) => {
    for (const ref of refs) setRef(ref, node);
  };
}

/** The child's handler runs first; the Slot's runs after, unless the child called preventDefault(). */
function chain(childHandler: unknown, slotHandler: unknown): unknown {
  if (typeof childHandler !== 'function') return slotHandler;
  if (typeof slotHandler !== 'function') return childHandler;
  return (event: { defaultPrevented: boolean }, ...more: unknown[]) => {
    childHandler(event, ...more);
    if (!event.defaultPrevented) slotHandler(event, ...more);
  };
}

/** Slot props under the child's. className joins (Slot first), style merges (child wins), handlers chain. */
export function mergeProps(slot: AnyProps, child: ChildProps): AnyProps {
  const merged: AnyProps = { ...slot, ...child };
  for (const key of Object.keys(slot)) {
    if (HANDLER.test(key)) merged[key] = chain(child[key], slot[key]);
  }
  const className = [slot.className, child.className].filter(Boolean).join(' ');
  merged.className = className || undefined;
  if (slot.style || child.style) merged.style = { ...(slot.style as CSSProperties), ...child.style };
  return merged;
}

/**
 * Renders its only child element with the Slot's props merged in, so a component can lend its classes
 * and behavior to another element (Link asChild around a router link). Internal: not exported.
 */
export const Slot = forwardRef<HTMLElement, SlotProps>(function Slot({ children, ...slotProps }, forwardedRef) {
  const child = onlyElement(children);
  return cloneElement(child, {
    ...mergeProps(slotProps, child.props),
    ref: composeRefs(forwardedRef, child.props.ref),
  });
});
