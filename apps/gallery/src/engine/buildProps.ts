import type { ControlState, Manifest } from '../manifests/types';

/** Select values that mean "leave the prop off". */
const OMIT_SENTINELS = new Set(['default', 'none']);

/** Turn control state into the props object the component receives. `children` is rendered separately. */
export function buildProps(manifest: Manifest, state: ControlState): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const control of manifest.controls) {
    const value = state[control.prop];
    if (value === undefined) continue;
    if (control.kind === 'select' && typeof value === 'string' && OMIT_SENTINELS.has(value)) continue;
    if (control.kind === 'number' || (control.kind === 'select' && control.numeric)) {
      props[control.prop] = Number(value);
      continue;
    }
    props[control.prop] = value;
  }
  return props;
}
