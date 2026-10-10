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
import { bitTheme } from './bitTheme';
import { bitLogo } from './bitLogo';
import { field } from './field';
import { input } from './input';
import { select } from './select';
import { switchManifest } from './switch';
import { checkbox } from './checkbox';
import { radioGroup } from './radioGroup';
import { textarea } from './textarea';
import { link } from './link';
import { code } from './code';
import { codeBlock } from './codeBlock';
import { segmentedControl } from './segmentedControl';
import { table } from './table';
import { dialog } from './dialog';
import { tabs } from './tabs';
import { icon } from './icon';
import { iconButton } from './iconButton';
import { tooltip } from './tooltip';

/** Sidebar order within each group (Components, then Forms, then Brand). */
export const MANIFESTS: readonly Manifest[] = [button, badge, alert, card, stack, box, text, heading, spinner, modeToggle, bitTheme, link, code, codeBlock, segmentedControl, table, dialog, tabs, icon, iconButton, tooltip, field, input, textarea, select, checkbox, radioGroup, switchManifest, bitLogo];

export function findManifest(slug: string): Manifest | undefined {
  return MANIFESTS.find((m) => m.slug === slug);
}

export function routeFor(manifest: Manifest): string {
  return manifest.group === 'brand' ? '/brand/logo' : `/components/${manifest.slug}`;
}

/** The pages a manifest's `related` names, in its order: only slugs with a manifest, never itself, each once. */
export function relatedManifests(manifest: Manifest): Manifest[] {
  const slugs = [...new Set(manifest.related ?? [])].filter((slug) => slug !== manifest.slug);
  return slugs.map(findManifest).filter((found): found is Manifest => found !== undefined);
}

export type { Manifest, ManifestGroup } from './types';
