import { Alert, Link } from '@bit-ds/react';
import { compareLines, isRelease, lineOf, SITE_BASE } from '../content/versionLines.mjs';
import { BUILD_VERSION } from '../buildVersion';
import { useVersions } from './useVersions';
import { urlForLine } from './VersionSelect';

/** Above the routes on every page of an older release. Nothing while loading, when unavailable, or on the latest. */
export function OldVersionBanner() {
  const { status, file, currentLine } = useVersions();
  if (status !== 'ready' || !file) return null;
  const latestLine = lineOf(file.latest);
  // Only a strictly older release warns: a newer, unreleased build, or a pre-release one, shows nothing.
  if (!isRelease(BUILD_VERSION) || compareLines(currentLine, latestLine) >= 0) return null;
  const latestPath = file.lines.find((entry) => entry.line === latestLine)?.path ?? SITE_BASE;

  return (
    <Alert color="warning" variant="solid" className="gallery-old-version">
      You&apos;re viewing the docs for v{BUILD_VERSION}. Components here behave as they did in that release.{' '}
      <Link href={urlForLine(latestPath, '')}>Go to the latest (v{file.latest}) →</Link>
    </Alert>
  );
}
