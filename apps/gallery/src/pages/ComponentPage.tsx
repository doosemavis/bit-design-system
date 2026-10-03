import { CodeBlock, Stack, Text } from '@bit-ds/react';
import type { Manifest } from '../manifests';
import { useControlState } from '../engine/useControlState';
import { renderManifest } from '../engine/renderManifest';
import { Presets } from '../engine/Presets';
import { Preview } from '../engine/Preview';
import { ControlsPanel } from '../engine/ControlsPanel';
import { toJsx } from '../code/toJsx';

interface ComponentPageProps {
  manifest: Manifest;
}

/**
 * The minimal page every component gets until PR3's layout C (D14): heading, description,
 * presets, the live preview, its controls, and the React code. State lives in the URL.
 */
export function ComponentPage({ manifest }: ComponentPageProps) {
  const { state, setProp, apply, reset } = useControlState(manifest);
  return (
    <Stack gap={24}>
      <Stack gap={8}>
        <Text as="h1" size={32}>
          {manifest.name}
        </Text>
        <Text>{manifest.description}</Text>
      </Stack>
      <Presets manifest={manifest} onApply={apply} />
      <Preview label={`${manifest.name} preview`}>{renderManifest(manifest, state)}</Preview>
      <ControlsPanel manifest={manifest} state={state} onChange={setProp} onReset={reset} />
      <section aria-labelledby="code-heading">
        <Text as="h2" size={18} id="code-heading">
          React
        </Text>
        <CodeBlock code={toJsx(manifest, state)} language="jsx" label="Example code" />
      </section>
    </Stack>
  );
}
