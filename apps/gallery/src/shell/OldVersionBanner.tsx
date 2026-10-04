import { Alert, Link } from '@bit-ds/react';
import { lineOf, SITE_BASE } from '../content/versionLines.mjs';
import { useVersions } from './useVersions';
import { urlForLine } from './VersionSelect';

/** Above the routes on every page of an older release. Nothing while loading, when unavailable, or on the latest. */
export function OldVersionBanner() {
  const { status, file, currentLine } = useVersions();
  if (status !== 'ready' || !file) return null;
  const latestLine = lineOf(file.latest);
  if (latestLine === currentLine) return null;
  const latestPath = file.lines.find((entry) => entry.line === latestLine)?.path ?? SITE_BASE;

  return (
    <Alert color="warning" variant="solid" className="gallery-old-version">
      You&apos;re viewing the docs for v{__BIT_VERSION__}. Components here behave as they did in that release.{' '}
      <Link href={urlForLine(latestPath, '')}>Go to the latest (v{file.latest}) →</Link>
    </Alert>
  );
}
