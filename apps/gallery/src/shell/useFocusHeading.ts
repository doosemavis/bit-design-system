import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * After each route change (not the first load), move focus to the page's h1 so screen readers
 * announce the new page. Pages are lazy, so the h1 may not exist yet when the route changes;
 * poll one animation frame at a time until it does, and stop if the route changes again.
 */
export function useFocusHeading(): void {
  const { pathname } = useLocation();
  const firstLoad = useRef(true);
  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    let cancelled = false;
    const tryFocus = () => {
      if (cancelled) return;
      const heading = document.querySelector<HTMLHeadingElement>('main h1');
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
