import type { Control, ControlValue } from './types';

/** Select values that mean "leave the prop off". */
const OMIT_SENTINELS = new Set(['default', 'none']);

/**
 * True when a control's value means "omit this prop". Only select controls have sentinels;
 * a text control's "none" is real text. The preview (buildProps) and the code (toJsx) both use
 * this, so they cannot disagree.
 */
export function isOmittedSentinel(control: Control, value: ControlValue): boolean {
  return control.kind === 'select' && typeof value === 'string' && OMIT_SENTINELS.has(value);
}
