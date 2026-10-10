import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { scrollToSection } from '../ui/scrollToSection';

/** The page's own h1, skipping presentational samples such as the Typography page's heading table. */
const PAGE_HEADING = 'main h1:not([role="presentation"]):not([role="none"])';

/** The section id a route's hash names (`#section-props` → `section-props`), or '' for none. */
export function sectionIdOf(hash: string): string {
  if (!hash.startsWith('#') || hash.length < 2) return '';
  try {
    return decodeURIComponent(hash.slice(1));
  } catch {
    return hash.slice(1);
  }
}

/**
 * When the page changes (a new pathname, not the first load), move focus to the page's h1 so screen readers
 * announce the new page. A route hash names a section instead (`#/components/button#section-props`, from a "#"
 * link or a search result): then that section scrolls into view and its h2 takes focus, on a new page, on the
 * same page, and on the first load of a deep link. A query-only change (a control on a component page) is the
 * same page, so focus stays where the visitor is typing. Pages are lazy, so the h1 may not exist yet: poll one
 * animation frame at a time until it does (a page renders its sections with its h1), and stop if the route
 * changes again. The last pathname lives in a ref compared by value, so StrictMode's double-invoked mount
 * effect can't count as a change.
 */
export function useFocusHeading(): void {
  const { pathname, hash } = useLocation();
  const shown = useRef(pathname);
  useEffect(() => {
    const pageChanged = pathname !== shown.current;
    shown.current = pathname;
    const sectionId = sectionIdOf(hash);
    if (!pageChanged && !sectionId) return;
    let cancelled = false;
    const tryFocus = () => {
      if (cancelled) return;
      const heading = document.querySelector<HTMLHeadingElement>(PAGE_HEADING);
      if (!heading) {
        requestAnimationFrame(tryFocus);
        return;
      }
      // A hash that names nothing on the page falls back to the page's h1 (or, on the same page, leaves focus be).
      if (sectionId && scrollToSection(sectionId)) return;
      if (!pageChanged) return;
      heading.tabIndex = -1;
      heading.focus();
    };
    tryFocus();
    return () => {
      cancelled = true;
    };
  }, [pathname, hash]);
}
