import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/** The page's own h1, skipping presentational samples such as the Typography page's heading table. */
const PAGE_HEADING = 'main h1:not([role="presentation"]):not([role="none"])';

/**
 * When the page changes (a new pathname, not the first load), move focus to the page's h1 so screen
 * readers announce the new page. A query-only change (a control on a component page) is the same page,
 * so focus stays where the visitor is typing. Pages are lazy, so the h1 may not exist yet: poll one
 * animation frame at a time until it does, and stop if the page changes again. The last pathname lives
 * in a ref compared by value, so StrictMode's double-invoked mount effect can't count as a change.
 */
export function useFocusHeading(): void {
  const { pathname } = useLocation();
  const shown = useRef(pathname);
  useEffect(() => {
    if (pathname === shown.current) return;
    shown.current = pathname;
    let cancelled = false;
    const tryFocus = () => {
      if (cancelled) return;
      const heading = document.querySelector<HTMLHeadingElement>(PAGE_HEADING);
      if (!heading) {
        requestAnimationFrame(tryFocus);
        return;
      }
      heading.tabIndex = -1;
      heading.focus();
    };
    tryFocus();
    return () => {
      cancelled = true;
    };
  }, [pathname]);
}
