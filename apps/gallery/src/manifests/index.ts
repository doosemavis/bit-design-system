import type { Manifest } from './types';
import { button } from './button';
import { badge } from './badge';
import { alert } from './alert';
import { card } from './card';
import { stack } from './stack';
import { box } from './box';
import { text } from './text';
import { heading } from './heading';
import { spinner } from './spinner';
import { modeToggle } from './modeToggle';
import { bitLogo } from './bitLogo';
import { field } from './field';
import { input } from './input';
import { select } from './select';
import { switchManifest } from './switch';
import { link } from './link';
import { code } from './code';
import { codeBlock } from './codeBlock';
import { segmentedControl } from './segmentedControl';
import { table } from './table';
import { dialog } from './dialog';
import { tabs } from './tabs';

/** Sidebar order within each group (Components, then Forms, then Brand). */
export const MANIFESTS: readonly Manifest[] = [button, badge, alert, card, stack, box, text, heading, spinner, modeToggle, link, code, codeBlock, segmentedControl, table, dialog, tabs, field, input, select, switchManifest, bitLogo];

export function findManifest(slug: string): Manifest | undefined {
  return MANIFESTS.find((m) => m.slug === slug);
}

export function routeFor(manifest: Manifest): string {
  return manifest.group === 'brand' ? '/brand/logo' : `/components/${manifest.slug}`;
}

export type { Manifest, ManifestGroup } from './types';
