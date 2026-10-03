import type { Manifest } from '../../manifests/types';
import type { ControlStateApi } from '../../engine/useControlState';
import { renderManifest } from '../../engine/renderManifest';
import { Presets } from '../../engine/Presets';
import { Preview } from '../../engine/Preview';
import { ControlsPanel } from '../../engine/ControlsPanel';
import { CodePanel } from '../../code/CodePanel';

interface PlaygroundProps {
  manifest: Manifest;
  controls: ControlStateApi;
}

/** Preview (with presets) beside the controls, and the code under both. Under 720px the controls stack. */
export function Playground({ manifest, controls }: PlaygroundProps) {
  const { state, setProp, apply, reset } = controls;
  return (
    <div className="gallery-playground">
      <div className="gallery-playground__top">
        <Preview label={`${manifest.name} preview`} presets={<Presets manifest={manifest} state={state} onApply={apply} />}>
          {renderManifest(manifest, state)}
        </Preview>
        <ControlsPanel manifest={manifest} state={state} onChange={setProp} onReset={reset} />
      </div>
      <CodePanel manifest={manifest} state={state} />
    </div>
  );
}
