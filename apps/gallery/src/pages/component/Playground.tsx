import { Card } from '@bit-ds/react';
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

/**
 * Preview (with presets) beside the controls in one bit Card, and the code under both. The preview sticks under
 * the site header while a long controls list scrolls. Under 720px the controls stack under the preview, still in
 * the card, and the preview sticks over them at a capped height, so a change shows without scrolling back up.
 */
export function Playground({ manifest, controls }: PlaygroundProps) {
  const { state, setProp, apply, reset } = controls;
  return (
    <div className="gallery-playground">
      <Card className="gallery-playground__top">
        <Preview label={`${manifest.name} preview`} presets={<Presets manifest={manifest} state={state} onApply={apply} />}>
          {renderManifest(manifest, state, { sample: true })}
        </Preview>
        <ControlsPanel manifest={manifest} state={state} onChange={setProp} onReset={reset} />
      </Card>
      <CodePanel manifest={manifest} state={state} />
    </div>
  );
}
