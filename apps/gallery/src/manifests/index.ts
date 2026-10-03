import type { Manifest } from './types';
import { button } from './button';
import { badge } from './badge';
import { alert } from './alert';
import { card } from './card';
import { stack } from './stack';
import { text } from './text';
import { spinner } from './spinner';
import { modeToggle } from './modeToggle';
import { bitLogo } from './bitLogo';
import { field } from './field';
import { input } from './input';
import { select } from './select';
import { switchManifest } from './switch';
import { link } from './link';

/** Sidebar order within each group (Components, then Forms, then Brand). */
export const MANIFESTS: readonly Manifest[] = [button, badge, alert, card, stack, text, spinner, modeToggle, link, field, input, select, switchManifest, bitLogo];

export function findManifest(slug: string): Manifest | undefined {
  return MANIFESTS.find((m) => m.slug === slug);
}

export function routeFor(manifest: Manifest): string {
  return manifest.group === 'brand' ? '/brand/logo' : `/components/${manifest.slug}`;
}

export type { Manifest, ManifestGroup, ManifestDocs, PropDoc, Control, ControlState, ControlValue, ChildSpec, Preset } from './types';
