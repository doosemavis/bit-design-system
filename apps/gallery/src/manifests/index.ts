import type { Manifest } from './types';
import { button } from './button';
import { badge } from './badge';
import { alert } from './alert';
import { card } from './card';
import { stack } from './stack';
import { text } from './text';
import { spinner } from './spinner';
import { bitLogo } from './bitLogo';

/** Sidebar order. */
export const MANIFESTS: readonly Manifest[] = [button, badge, alert, card, stack, text, spinner, bitLogo];

export function findManifest(slug: string): Manifest | undefined {
  return MANIFESTS.find((m) => m.slug === slug);
}

export function routeFor(manifest: Manifest): string {
  return manifest.group === 'Brand' ? '/brand/logo' : `/components/${manifest.slug}`;
}

export type { Manifest, Control, ControlState, ControlValue, ChildSpec, Preset } from './types';
