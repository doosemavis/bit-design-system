import { InPageLink } from './InPageLink';
import type { SectionLink } from './PageSection';

interface SectionBarProps {
  sections: readonly SectionLink[];
}

/**
 * The row of in-page links under a page's header (Playground, Variants, …; Color, Type, …). Each one
 * scrolls to its section and focuses the h2, and the route never changes.
 */
export function SectionBar({ sections }: SectionBarProps) {
  return (
    <nav aria-label="On this page" className="gallery-section-bar">
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
