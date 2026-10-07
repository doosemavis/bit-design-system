import type { Control } from './types';

/** A control that shapes the page only (SegmentedControl's segments, Select's option count): never passed, printed or documented as a prop. */
export function isVirtual(control: Control): boolean {
  return (control.kind === 'select' || control.kind === 'number') && control.virtual === true;
}
