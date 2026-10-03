import { useParams } from 'react-router-dom';
import { Stack, Text } from '@bit-ds/react';
import { findManifest, routeFor } from '../manifests';
import type { Manifest } from '../manifests';
import { bitLogo } from '../manifests/bitLogo';
import { useControlState } from '../engine/useControlState';
import { renderManifest } from '../engine/renderManifest';
import { Presets } from '../engine/Presets';
import { Preview } from '../engine/Preview';
import { ControlsPanel } from '../engine/ControlsPanel';
import { toJsx } from '../code/toJsx';
import { NotFoundPage } from './NotFoundPage';

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
        <pre className="gallery-pre">
          <code>{toJsx(manifest, state)}</code>
        </pre>
      </section>
    </Stack>
  );
}

/** `/components/:slug`. Unknown slugs, and manifests routed elsewhere (the logo is under Brand), get the 404. */
export function ComponentRoute() {
  const { slug = '' } = useParams();
  const manifest = findManifest(slug);
  if (!manifest || routeFor(manifest) !== `/components/${slug}`) return <NotFoundPage />;
  return <ComponentPage key={manifest.slug} manifest={manifest} />;
}

/** `/brand/logo`. */
export function LogoRoute() {
  return <ComponentPage manifest={bitLogo} />;
}
