import { findManifest } from '../manifests';
import type { Manifest } from '../manifests';

/**
 * The components, grouped by the job they do, in the home page's order: what a reader reaches for first comes
 * first. Each group lists manifest slugs and holds seven at most, so a group reads at a glance. Every component,
 * the logo included (Brand, last), is in exactly one group: HomePage.test checks it, so a new manifest must be
 * placed. The sidebar doesn't use these groups: it lists every component under Components, and the logo under Brand.
 */
export const COMPONENT_GROUPS = [
  { label: 'Actions', slugs: ['button', 'iconbutton', 'menu'] },
  { label: 'Text inputs', slugs: ['field', 'input', 'textarea'] },
  { label: 'Choice inputs', slugs: ['checkbox', 'radiogroup', 'segmentedcontrol', 'select', 'slider', 'switch'] },
  { label: 'Feedback', slugs: ['alert', 'avatar', 'badge', 'dialog', 'spinner', 'tooltip'] },
  { label: 'Navigation', slugs: ['link', 'navbar', 'tabs'] },
  { label: 'Layout', slugs: ['box', 'card', 'stack', 'table'] },
  { label: 'Type', slugs: ['code', 'codeblock', 'heading', 'text'] },
  { label: 'Theming', slugs: ['bittheme', 'icon', 'modetoggle'] },
  { label: 'Brand', slugs: ['logo'] },
] as const;

export type ComponentGroup = (typeof COMPONENT_GROUPS)[number];
export type ComponentGroupLabel = ComponentGroup['label'];

const byName = (a: Manifest, b: Manifest) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });

/** A group's manifests, alphabetical by name, as the sidebar lists them. */
export function groupManifests(group: ComponentGroup): Manifest[] {
  return group.slugs
    .map((slug) => findManifest(slug))
    .filter((found): found is Manifest => found !== undefined)
    .sort(byName);
}
