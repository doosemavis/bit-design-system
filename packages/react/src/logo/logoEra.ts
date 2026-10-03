import { useSyncExternalStore } from 'react';

/** The console eras the wordmark is drawn in, in the order page loads step through them. */
export const ERAS = [8, 16, 32, 64] as const;
export type Era = (typeof ERAS)[number];

/** Where the last page load's era is remembered, so the next load can show the one after it. */
export const LOGO_ERA_STORAGE_KEY = 'bit-logo-era';

/** Shown wherever the rotation can't run: server render, no window, blocked storage. */
const STILL_ERA: Era = 64;

/** The era after `previous`, wrapping 64 → 8. A missing or unknown value starts the sequence at 8. */
function nextEra(previous: string | null): Era {
  const index = ERAS.findIndex((era) => String(era) === previous);
  return index === -1 ? ERAS[0] : ERAS[(index + 1) % ERAS.length]!;
}

function advance(): Era {
  if (typeof window === 'undefined') return STILL_ERA;
  try {
    const era = nextEra(window.localStorage.getItem(LOGO_ERA_STORAGE_KEY));
    window.localStorage.setItem(LOGO_ERA_STORAGE_KEY, String(era));
    return era;
  } catch {
    // Storage is blocked (private browsing, disabled cookies, quota): no rotation, show the still era.
    return STILL_ERA;
  }
}

// One era per page load, shared by every logo on the page. This cached value is the one intentional
// piece of mutable state here; it is computed on first read and never changes until the next load.
let pageEra: Era | null = null;

/** The era for this page load. The first call advances the stored rotation; later calls reuse it. */
export function currentPageEra(): Era {
  if (pageEra === null) pageEra = advance();
  return pageEra;
}

/** Tests only: forget this page load's era, as if the page reloaded. Not exported from the package. */
export function resetLogoEra(): void {
  pageEra = null;
}

// The era never changes during a page load, so there is nothing to subscribe to.
const subscribe = () => () => {};

/** The pinned era, or this page load's era. A pinned era never touches storage. */
export function useLogoEra(pinned?: Era): Era {
  return useSyncExternalStore(
    subscribe,
    pinned === undefined ? currentPageEra : () => pinned,
    () => pinned ?? STILL_ERA,
  );
}
