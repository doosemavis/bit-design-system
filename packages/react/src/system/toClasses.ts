import { PREFIX } from '@bit/core/tokens';

/** One axis of a component: its prop name, the allowed values, and the value the caller passed. */
export interface Axis {
  name: string;
  allowed: readonly string[];
  value: string | undefined;
}

/** `bit-{block}` */
export function block(blockName: string): string {
  return `${PREFIX}-${blockName}`;
}

/** `bit-{block}__{element}` */
export function element(blockName: string, elementName: string): string {
  return `${PREFIX}-${blockName}__${elementName}`;
}

/**
 * Build a component's class string: block class, one `bit-{value}` decorator per
 * axis (in the order given), then the caller's className last so it wins.
 * Unknown values are dropped with a dev-only warning; nothing throws.
 */
export function toClasses(blockName: string, axes: readonly Axis[], className?: string): string {
  const classes = [block(blockName)];
  for (const axis of axes) {
    if (axis.value === undefined) continue;
    if (!axis.allowed.includes(axis.value)) {
      warnUnknown(blockName, axis);
      continue;
    }
    classes.push(`${PREFIX}-${axis.value}`);
  }
  if (className) classes.push(className);
  return classes.join(' ');
}

function warnUnknown(blockName: string, axis: Axis): void {
  if (process.env.NODE_ENV === 'production') return;
  console.warn(
    `[bit] ${block(blockName)} received ${axis.name}="${axis.value}" but only ` +
      `${axis.allowed.join(' | ')} are allowed. The value was dropped.`,
  );
}
