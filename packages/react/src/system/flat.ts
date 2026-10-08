/** The class that drops a component's hard shadow. */
export const FLAT_CLASS = 'bit-flat';

/**
 * The className to render for a `flat` prop: the caller's className, with `bit-flat` added unless it is
 * already there (so `flat` plus `className="bit-flat"` never doubles the class). Not added when `flat` is off.
 */
export function withFlat(flat: boolean, className?: string): string | undefined {
  if (!flat) return className;
  if (className?.split(/\s+/).includes(FLAT_CLASS)) return className;
  return className ? `${className} ${FLAT_CLASS}` : FLAT_CLASS;
}
