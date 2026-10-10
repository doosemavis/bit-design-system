import { matchPath, useLocation } from 'react-router-dom';
import type { NavItem } from './Sidebar';
import { LinkCard } from '../ui/LinkCard';

/** The pages before and after `pathname` in sidebar order; null when the path isn't a sidebar page (a 404). */
export function neighbors(items: readonly NavItem[], pathname: string): { prev?: NavItem; next?: NavItem } | null {
  const index = items.findIndex((item) => matchPath({ path: item.to, end: true }, pathname));
  if (index === -1) return null;
  return { prev: items[index - 1], next: items[index + 1] };
}

/**
 * Previous and next at the foot of every page, in sidebar order, so a reader can walk the docs front to back.
 * The first page has no Previous and the last no Next; a page outside the sidebar (a 404) has neither.
 */
export function PageFooter({ items }: { items: readonly NavItem[] }) {
  const around = neighbors(items, useLocation().pathname);
  if (!around || (!around.prev && !around.next)) return null;
  const { prev, next } = around;
  return (
    <nav aria-label="Previous and next page" className="gallery-pager">
      {prev ? <LinkCard to={prev.to} title={prev.label} eyebrow="← Previous" label={`Previous: ${prev.label}`} rel="prev" /> : null}
      {next ? (
        <div className="gallery-pager__next">
          <LinkCard to={next.to} title={next.label} eyebrow="Next →" label={`Next: ${next.label}`} rel="next" align="end" />
        </div>
      ) : null}
    </nav>
  );
}
