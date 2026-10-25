import type { ReactElement } from 'react';
import type { ControlState, Manifest } from '../../../manifests/types';
import { renderManifest } from '../../../engine/renderManifest';
import { defaultState } from '../../../engine/state';

interface InstanceProps {
  manifest: Manifest;
  patch?: Partial<ControlState>;
  inert?: boolean;
  /** Merge `anatomy.base` over the defaults. Default true; the Loupe drops it. */
  withBase?: boolean;
}

/** The manifest's defaults + anatomy.base (unless withBase is false) + patch, in div[data-instance]. Never the Playground's state. */
export function Instance({ manifest, patch = {}, inert = false, withBase = true }: InstanceProps): ReactElement {
  const base = withBase ? manifest.anatomy?.base : undefined;
  const state = { ...defaultState(manifest), ...base, ...patch } as ControlState;
  return (
    <div data-instance="" inert={inert} className="gallery-passes__instance">
      {renderManifest(manifest, state, { sample: true })}
    </div>
  );
}
