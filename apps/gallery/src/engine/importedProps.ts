import type { ControlState, ImportedProp, Manifest } from '../manifests/types';
import { defaultState } from './state';

/** The props a page passes by export name (Icon's `icon`), from the full state. Empty without the hook. */
export function importedProps(manifest: Manifest, state: ControlState): readonly ImportedProp[] {
  return manifest.importedProps?.({ ...defaultState(manifest), ...state }) ?? [];
}
