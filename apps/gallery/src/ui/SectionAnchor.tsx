import type { ReactNode } from 'react';
import { Link, Text } from '@bit-ds/react';
import { Link as RouterLink, useInRouterContext, useLocation } from 'react-router-dom';
import { scrollToSection } from './scrollToSection';

interface SectionAnchorProps {
  /** The section h2's id. */
  id: string;
  /** The h2's text, for the link's name. */
  title: string;
}

/**
 * The "#" beside a section title: a deep link to it (the page, its query and `#<id>`, so
 * `#/components/button#section-props` under the hash router) that can be copied like any link. A click scrolls
 * there and focuses the h2 too. It shows on hover of the title row and on keyboard focus; touch screens always
 * show it.
 */
function RoutedAnchor({ id, title }: SectionAnchorProps) {
  const { pathname, search } = useLocation();
  return (
    <Link asChild color="neutral" className="gallery-anchor">
      <RouterLink to={{ pathname, search, hash: id }} aria-label={`Link to the ${title} section`} onClick={() => scrollToSection(id)}>
        <Text size={24} color="neutral" aria-hidden="true">
          #
        </Text>
      </RouterLink>
    </Link>
  );
}

/** Outside a router (a unit test of one section) there is no route to link, so it renders nothing. */
export function SectionAnchor(props: SectionAnchorProps) {
  return useInRouterContext() ? <RoutedAnchor {...props} /> : null;
}

/** A section's title row: the h2, then its anchor, which appears on hover. */
export function SectionHead({ id, title, children }: SectionAnchorProps & { children: ReactNode }) {
  return (
    <div className="gallery-section-head">
      {children}
      <SectionAnchor id={id} title={title} />
    </div>
  );
}
