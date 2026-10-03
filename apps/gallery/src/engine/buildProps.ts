import type { ControlState, Manifest } from '../manifests/types';
import { isOmittedSentinel } from '../manifests/sentinels';

/** Turn control state into the props object the component receives. `children` is rendered separately. */
export function buildProps(manifest: Manifest, state: ControlState): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const control of manifest.controls) {
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
