import type { ChildSpec, ControlState, Manifest } from '../manifests/types';
import { defaultState } from './state';

/** The child parts a page renders and prints for `state`: deriveChildren's, else a ChildSpec array, else none. Pure. */
export function childSpecs(manifest: Manifest, state: ControlState): readonly ChildSpec[] | undefined {
  if (manifest.deriveChildren) return manifest.deriveChildren({ ...defaultState(manifest), ...state });
  return typeof manifest.children === 'object' ? manifest.children : undefined;
}

/** Whether the component needs React to work in this state, so its HTML alone would not. */
export function isInteractive(manifest: Manifest, state: ControlState): boolean {
  const { interactive } = manifest;
  if (typeof interactive === 'function') return interactive({ ...defaultState(manifest), ...state });
  return interactive === true;
}
