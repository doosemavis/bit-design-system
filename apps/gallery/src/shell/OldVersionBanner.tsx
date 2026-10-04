import { Alert, Link } from '@bit-ds/react';
import { compareLines, isRelease, SITE_BASE } from '../content/versionLines.mjs';
import { BUILD_VERSION } from '../buildVersion';
import { useVersions } from './useVersions';
import { urlForLine } from './VersionSelect';

/**
 * Above the routes on every page of an older copy. Nothing while loading, when unavailable, or on
 * the root copy (the latest). A v<line>/ copy on the latest's own line still warns: that is the
 * as-older rehearsal, and any copy away from the root is frozen.
 */
export function OldVersionBanner() {
  const { status, file, currentLine, ownPath } = useVersions();
  if (status !== 'ready' || !file || !isRelease(BUILD_VERSION) || ownPath === SITE_BASE) return null;
  const latest = file.lines.find((entry) => entry.path === SITE_BASE);
  if (!latest) return null;
  const ownLine = file.lines.find((entry) => entry.path === ownPath)?.line ?? currentLine;
  // A newer, unreleased line served away from the root shows nothing.
  if (compareLines(ownLine, latest.line) > 0) return null;

  return (
    <Alert color="warning" variant="solid" className="gallery-old-version">
      You&apos;re viewing the docs for v{BUILD_VERSION}. Components here behave as they did in that release.{' '}
      <Link href={urlForLine(latest.path, '')}>Go to the latest (v{latest.version}) →</Link>
    </Alert>
  );
}
