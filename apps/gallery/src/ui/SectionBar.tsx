import { useId } from 'react';
import { Text } from '@bit-ds/react';
import { InPageLink } from './InPageLink';
import type { SectionLink } from './PageSection';

interface SectionBarProps {
  sections: readonly SectionLink[];
}

/**
 * "On this page": the row of in-page links under a page's header (Playground, Variants, …; Color, Type, …). Each
 * one scrolls to its section and focuses the h2, and the route never changes. gallery.css keeps the row in view
 * under the site header on wide screens; on a phone it is one row that scrolls sideways.
 */
export function SectionBar({ sections }: SectionBarProps) {
  const labelId = useId();
  return (
    <nav aria-labelledby={labelId} className="gallery-section-bar">
      <Text id={labelId} color="neutral" weight="bold">
        On this page
      </Text>
      <ul className="gallery-link-list">
        {sections.map((section) => (
          <li key={section.id}>
            <InPageLink targetId={section.id}>{section.title}</InPageLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
