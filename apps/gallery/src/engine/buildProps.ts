import type { ControlState, Manifest } from '../manifests/types';
import { isOmittedSentinel } from '../manifests/sentinels';
import { isVirtual } from '../manifests/virtual';
import { staticProps } from './staticProps';

/**
 * Turn control state into the props object the component receives, on top of the manifest's static
 * props (fixed and derived). Virtual controls shape the page only and are never passed. `children` is rendered separately.
 */
export function buildProps(manifest: Manifest, state: ControlState): Record<string, unknown> {
  const props: Record<string, unknown> = { ...staticProps(manifest, state) };
  for (const control of manifest.controls) {
    if (isVirtual(control)) continue;
    const value = state[control.prop];
    if (value === undefined) continue;
    if (isOmittedSentinel(control, value)) continue;
    if (control.kind === 'number' || (control.kind === 'select' && control.numeric)) {
      props[control.prop] = Number(value);
      continue;
    }
    props[control.prop] = value;
  }
  return props;
}
