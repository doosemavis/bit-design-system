import { useEffect, useState } from 'react';
import { BUILD_VERSION } from '../buildVersion';
import { isRelease, isVersionsFile, lineOf, ownPathOf, SITE_BASE } from '../content/versionLines.mjs';
import type { VersionsFile } from '../content/versionLines.mjs';

export type VersionsStatus = 'loading' | 'ready' | 'unavailable';

interface Settled {
  status: 'ready' | 'unavailable';
  file: VersionsFile | null;
}

// A failed fetch is cached too: it is not retried until the page reloads.
let pending: Promise<Settled> | null = null;
let settled: Settled | null = null;

async function load(): Promise<Settled> {
  const url = import.meta.env.DEV ? '/versions.json' : `${SITE_BASE}versions.json`;
  try {
    const response = await fetch(url);
    if (!response.ok) return { status: 'unavailable', file: null };
    const body: unknown = await response.json();
    // The same check build-versioned-site.mjs runs on the file it deploys (see versionLines.mjs).
    return isVersionsFile(body) ? { status: 'ready', file: body } : { status: 'unavailable', file: null };
  } catch {
    // Offline, a 404 page that isn't JSON, a blocked request: the picker falls back to the current build.
    return { status: 'unavailable', file: null };
  }
}

/** For tests: forget the cached result. */
export function resetVersionsCache(): void {
  pending = null;
  settled = null;
}

/** The build's line; a pre-release build has none, so it keeps its raw version. Never throws. */
function currentLine(): string {
  return isRelease(BUILD_VERSION) ? lineOf(BUILD_VERSION) : BUILD_VERSION;
}

/** The copy this page is served from; outside the site (dev, tests) that is the root. */
function ownPath(): string {
  return ownPathOf(window.location.pathname) ?? SITE_BASE;
}

/**
 * Reads versions.json once per page load. Never throws; a failure is the 'unavailable' status.
 * Entries are told apart by `path` (two can share a line); `ownPath` is this copy's.
 */
export function useVersions(): { status: VersionsStatus; file: VersionsFile | null; currentLine: string; ownPath: string } {
  const [result, setResult] = useState<Settled | null>(settled);

  useEffect(() => {
    if (settled) return;
    let live = true;
    pending ??= load().then((value) => (settled = value));
    void pending.then((value) => {
      if (live) setResult(value);
    });
    return () => {
      live = false;
    };
  }, []);

  return { status: result?.status ?? 'loading', file: result?.file ?? null, currentLine: currentLine(), ownPath: ownPath() };
}
