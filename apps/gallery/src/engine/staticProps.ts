import type { ControlState, LiteralValue, Manifest } from '../manifests/types';
import { defaultState } from './state';

/**
 * The props a page passes besides its controls' own: the manifest's fixed props, then those derived from the
 * state (the defaults fill in anything the state leaves out). Every reader, the printed code first, goes
 * through here. Pure; the result is a new object.
 */
export function staticProps(manifest: Manifest, state: ControlState): Record<string, LiteralValue> {
  const derived = manifest.deriveProps?.({ ...defaultState(manifest), ...state });
  return { ...manifest.fixedProps, ...derived };
}
