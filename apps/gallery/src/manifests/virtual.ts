import type { Control } from './types';

/** A control that shapes the page only (a count, a title in a child part): never passed, printed or documented as a prop. */
export function isVirtual(control: Control): boolean {
  return 'virtual' in control && control.virtual === true;
}
