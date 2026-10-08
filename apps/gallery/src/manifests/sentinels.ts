import type { Control, ControlValue } from './types';

/** Select values that mean "leave the prop off". */
const OMIT_SENTINELS = new Set(['default', 'none']);

/**
 * True when a control's value means "omit this prop". Select and axis controls have sentinels (an axis
 * that starts at none, like Icon's color); a text control's "none" is real text. The preview (buildProps)
 * and the code (toJsx) both use this, so they cannot disagree.
 */
export function isOmittedSentinel(control: Control, value: ControlValue): boolean {
  return (control.kind === 'select' || control.kind === 'axis') && typeof value === 'string' && OMIT_SENTINELS.has(value);
}
