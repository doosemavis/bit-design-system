import { relatedManifests } from '../../manifests';
import type { Manifest } from '../../manifests/types';
import type { SectionLink } from '../../ui/PageSection';
import { variantAxes } from '../../engine/VariantsTable';

export const SECTIONS = {
  playground: { id: 'section-playground', title: 'Playground' },
  variants: { id: 'section-variants', title: 'Variants' },
  usage: { id: 'section-usage', title: 'Usage' },
  props: { id: 'section-props', title: 'Props' },
  accessibility: { id: 'section-accessibility', title: 'Accessibility' },
  related: { id: 'section-related', title: 'Related' },
} as const satisfies Record<string, SectionLink>;

/**
 * The page's sections in order. Variants only when the component has an axis to draw; then the page's own extra
 * section, if any; Related last, when the manifest names pages that exist.
 */
export function componentSections(manifest: Manifest): SectionLink[] {
  return [
    SECTIONS.playground,
    ...(variantAxes(manifest) ? [SECTIONS.variants] : []),
    ...(manifest.extraSection ? [{ id: manifest.extraSection.id, title: manifest.extraSection.title }] : []),
    SECTIONS.usage,
    SECTIONS.props,
    SECTIONS.accessibility,
    ...(relatedManifests(manifest).length > 0 ? [SECTIONS.related] : []),
  ];
}
