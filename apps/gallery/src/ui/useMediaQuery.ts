import { useCallback, useSyncExternalStore } from 'react';

/** The gallery's one breakpoint: the phone layout, matching `@media (max-width: 720px)` in gallery.css. */
export const NARROW_QUERY = '(max-width: 720px)';

function mediaList(query: string): MediaQueryList | null {
  return typeof window.matchMedia === 'function' ? window.matchMedia(query) : null;
}

/** True while the media query matches. False where matchMedia doesn't exist (jsdom, old browsers). */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = mediaList(query);
      list?.addEventListener('change', onChange);
      return () => list?.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => mediaList(query)?.matches ?? false,
    () => false,
  );
}
