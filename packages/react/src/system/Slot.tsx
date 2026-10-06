import { Children, cloneElement, forwardRef, isValidElement, useMemo } from 'react';
import type { CSSProperties, HTMLAttributes, ReactElement, ReactNode, Ref, RefObject } from 'react';

export interface SlotProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

type AnyProps = Record<string, unknown>;
type ChildProps = AnyProps & { className?: string; style?: CSSProperties; ref?: Ref<HTMLElement> };
/** What a React 19 callback ref may hand back: a function React runs instead of calling the ref with null. */
type RefCleanup = () => void;

const HANDLER = /^on[A-Z]/;

/** The single element child, or a clear error. A string, a number, nothing, or two children all throw. */
function onlyElement(children: ReactNode, owner: string): ReactElement<ChildProps> {
  const items = Children.toArray(children);
  const [first] = items;
  if (items.length !== 1 || !isValidElement<ChildProps>(first)) {
    throw new Error(`[bit] ${owner} asChild needs exactly one child element.`);
  }
  return first;
}

function setRef<T>(ref: Ref<T> | undefined, value: T | null): void | RefCleanup {
  if (typeof ref === 'function') return ref(value);
  if (ref) (ref as RefObject<T | null>).current = value;
}

/**
 * One ref callback that feeds every ref it was given. If any of them returns a cleanup (React 19), so does
 * this one: it runs those cleanups and sets the other refs to null, as React would have.
 */
export function composeRefs<T>(...refs: (Ref<T> | undefined)[]): (node: T | null) => void | RefCleanup {
  return (node) => {
    const cleanups = refs.map((ref) => setRef(ref, node));
    if (!cleanups.some((cleanup) => typeof cleanup === 'function')) return undefined;
    return () => {
      cleanups.forEach((cleanup, i) => (typeof cleanup === 'function' ? cleanup() : setRef(refs[i], null)));
    };
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
 * A Slot renders its only child element with the Slot's props merged in, so a component can lend its classes
 * and behavior to another element (Link asChild around a router link, Button asChild around an `<a>`).
 * `owner` names the component in the error a wrong child throws. Internal: not exported from the package.
 */
export function createSlot(owner: string) {
  const Slot = forwardRef<HTMLElement, SlotProps>(function Slot({ children, ...slotProps }, forwardedRef) {
    const child = onlyElement(children, owner);
    const childRef = child.props.ref;
    // Memoised so a child callback ref is not detached and re-attached on every render.
    const ref = useMemo(() => composeRefs(forwardedRef, childRef), [forwardedRef, childRef]);
    return cloneElement(child, { ...mergeProps(slotProps, child.props), ref });
  });
  Slot.displayName = `${owner}.Slot`;
  return Slot;
}
