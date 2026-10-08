import { Badge, Button, Card, Heading, Link, Stack } from '@bit-ds/react';
import { Link as RouterLink } from 'react-router-dom';
import { MANIFESTS, routeFor } from '../../manifests';
import type { Manifest } from '../../manifests';
import { renderManifest } from '../../engine/renderManifest';
import { defaultState } from '../../engine/state';

/** Components that get a large live tile. Every Forms component does too. */
const HEADLINERS: readonly string[] = ['alert', 'button', 'card', 'segmentedcontrol'];

/** The icon chip on a compact tile. A component missing here shows its first letter. */
const GLYPHS: Readonly<Record<string, string>> = {
  badge: '+1',
  box: '□',
  code: '<>',
  codeblock: '{}',
  heading: 'H',
  icon: '★',
  link: 'a',
  modetoggle: '◐',
  spinner: '◌',
  stack: '≡',
  table: '▦',
  text: 'Aa',
};

/** The compact tile's chip: the component's glyph, or its first letter when it has none. */
export function glyphFor(manifest: Manifest): string {
  return GLYPHS[manifest.slug] ?? manifest.name.charAt(0);
}

export function isLargeTile(manifest: Manifest): boolean {
  return manifest.group === 'forms' || HEADLINERS.includes(manifest.slug);
}

/**
 * A live preview on top, the name and → below; the whole tile is one Link. The preview is inert: it shows
 * the component but takes no clicks or focus, so the tile stays a single link.
 */
function LargeTile({ manifest }: { manifest: Manifest }) {
  return (
    <Card className="gallery-tile">
      <div className="gallery-tile__preview" inert>
        {renderManifest(manifest, defaultState(manifest))}
      </div>
      <Link asChild color="neutral" className="gallery-tile__link">
        <RouterLink to={routeFor(manifest)}>
          {manifest.name} <span aria-hidden="true">→</span>
        </RouterLink>
      </Link>
    </Card>
  );
}

function CompactTile({ manifest }: { manifest: Manifest }) {
  return (
    <Button asChild variant="outline" color="neutral" size="sm" className="gallery-chip">
      <RouterLink to={routeFor(manifest)}>
        <span aria-hidden="true">
          <Badge variant="outline" size="sm">
            {glyphFor(manifest)}
          </Badge>
        </span>
        {manifest.name}
        <span aria-hidden="true">→</span>
      </RouterLink>
    </Button>
  );
}

function TileGroup({ title, manifests }: { title: string; manifests: readonly Manifest[] }) {
  const large = manifests.filter(isLargeTile);
  const compact = manifests.filter((m) => !isLargeTile(m));
  return (
    <Stack gap={16}>
      <Stack direction="row" gap={8} align="center">
        <Heading level={2}>{title}</Heading>
        <Badge variant="outline">{String(manifests.length)}</Badge>
      </Stack>
      {large.length > 0 ? (
        <div className="gallery-tiles">
          {large.map((m) => (
            <LargeTile key={m.slug} manifest={m} />
          ))}
        </div>
      ) : null}
      {compact.length > 0 ? (
        <div className="gallery-chips">
          {compact.map((m) => (
            <CompactTile key={m.slug} manifest={m} />
          ))}
        </div>
      ) : null}
    </Stack>
  );
}

/** Every component and form control as a tile, from the manifests, so a new one shows up by itself. */
export function ComponentTiles() {
  return (
    <Stack gap={32}>
      <TileGroup title="Components" manifests={MANIFESTS.filter((m) => m.group === 'components')} />
      <TileGroup title="Forms" manifests={MANIFESTS.filter((m) => m.group === 'forms')} />
    </Stack>
  );
}
