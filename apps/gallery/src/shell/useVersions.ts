import { useEffect, useState } from 'react';
import { BUILD_VERSION } from '../buildVersion';
import { isRelease, lineOf, SITE_BASE } from '../content/versionLines.mjs';
import type { VersionsFile } from '../content/versionLines.mjs';

export type VersionsStatus = 'loading' | 'ready' | 'unavailable';

interface Settled {
  status: 'ready' | 'unavailable';
  file: VersionsFile | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

/** Exactly the site root or `<site>/v<line>/`. These reach location.assign and an href, so nothing else gets through. */
const SITE_PATH = /^\/bit-design-system\/(v[0-9][0-9.]*\/)?$/;

/** versions.json is untrusted: check only what the gallery reads. A bad `latest` would make lineOf throw. */
function isVersionsFile(value: unknown): value is VersionsFile {
  if (!isRecord(value) || typeof value.latest !== 'string' || !isRelease(value.latest) || !Array.isArray(value.lines)) return false;
  return value.lines.every((entry) => isRecord(entry) && typeof entry.line === 'string' && typeof entry.version === 'string' && isRelease(entry.version) && typeof entry.path === 'string' && SITE_PATH.test(entry.path));
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

/** Reads versions.json once per page load. Never throws; a failure is the 'unavailable' status. */
export function useVersions(): { status: VersionsStatus; file: VersionsFile | null; currentLine: string } {
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

  return { status: result?.status ?? 'loading', file: result?.file ?? null, currentLine: currentLine() };
}
