import type { Manifest } from '../../manifests/types';
import type { SectionLink } from '../../ui/PageSection';
import { variantAxes } from '../../engine/VariantsTable';

export const SECTIONS = {
  playground: { id: 'section-playground', title: 'Playground' },
  variants: { id: 'section-variants', title: 'Variants' },
  usage: { id: 'section-usage', title: 'Usage' },
  props: { id: 'section-props', title: 'Props' },
  accessibility: { id: 'section-accessibility', title: 'Accessibility' },
} as const satisfies Record<string, SectionLink>;

/** The page's sections in order. Variants only when the component has an axis to draw. */
export function componentSections(manifest: Manifest): SectionLink[] {
  return [
    SECTIONS.playground,
    ...(variantAxes(manifest) ? [SECTIONS.variants] : []),
    SECTIONS.usage,
    SECTIONS.props,
    SECTIONS.accessibility,
  ];
}
