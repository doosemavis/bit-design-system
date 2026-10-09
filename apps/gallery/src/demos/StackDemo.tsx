import { cloneElement, useLayoutEffect, useRef, useState } from 'react';
import type { ReactElement, RefAttributes } from 'react';
import { Box } from '@bit-ds/react';
import type { StackProps } from '@bit-ds/react';

type StackElement = ReactElement<StackProps & RefAttributes<HTMLDivElement>>;

/**
 * Whether a Stack's children, end to end along its direction with their gaps, are longer than the Stack. Summed
 * from the children's own sizes, so it reads the same wrapped or not, and turning wrap on can't flip it back off.
 */
function overflows(stack: HTMLElement, row: boolean): boolean {
  const children = [...stack.children] as HTMLElement[];
  const style = getComputedStyle(stack);
  const gap = parseFloat(row ? style.columnGap : style.rowGap) || 0;
  const size = (child: HTMLElement) => (row ? child.offsetWidth : child.offsetHeight);
  const needed = children.reduce((sum, child) => sum + size(child), 0) + gap * Math.max(children.length - 1, 0);
  return needed > (row ? stack.clientWidth : stack.clientHeight);
}

interface StackDemoProps {
  stack: StackElement;
  width: number | string;
  /** Leave it off and the Box, and the Stack, are as tall as the children. */
  height?: number;
}

/**
 * The Stack page's preview: the Stack the controls built, in a Box at the chosen size (the stage outlines it).
 * With a height, the Stack fills it, so stretch shows in a row and justify in a column. Children too long for the
 * Box wrap by themselves, so they never spill past the outline. A column with no height grows instead.
 */
export function StackDemo({ stack, width, height }: StackDemoProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [tooLong, setTooLong] = useState(false);
  const row = stack.props.direction === 'row';
  const checks = row || height !== undefined;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !checks) {
      setTooLong(false);
      return;
    }
    const check = () => setTooLong(overflows(el, row));
    check();
    // A new size, or the pixel font loading, changes the sizes after the first paint.
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(check);
    observer.observe(el);
    for (const child of el.children) observer.observe(child);
    return () => observer.disconnect();
  }, [stack, width, height, row, checks]);

  return (
    <Box padding={4} style={{ width, height }}>
      {cloneElement(stack, {
        ref,
        wrap: stack.props.wrap === true || tooLong,
        style: height === undefined ? stack.props.style : { ...stack.props.style, height: '100%' },
      })}
    </Box>
  );
}
