import { BUILD_VERSION } from '../buildVersion';
import { compareVersions, isRelease, SITE_BASE } from '../content/versionLines.mjs';
import type { VersionsFile } from '../content/versionLines.mjs';
import { useVersions } from './useVersions';

/**
 * The one rule for "latest" across the site: the newest published version, which versions.json lists at the site
 * root, or this build's own version when the file is missing (loading, offline, a local preview without it).
 * The header picker, the Versions page, Getting started's Install badge and Release notes all follow it.
 */
export function latestVersion(file: VersionsFile | null, build: string): string {
  return file?.lines.find((entry) => entry.path === SITE_BASE)?.version ?? build;
}

/** Where a CHANGELOG release stands against the latest published one. */
export type ReleaseStatus = 'latest' | 'unreleased' | 'released';

/**
 * 'latest' for the latest itself, 'unreleased' for anything newer (a CHANGELOG section written before its
 * tag), 'released' for anything older. A version that isn't plain X.Y.Z can't be compared, so it is 'released'.
 */
export function releaseStatus(version: string, latest: string): ReleaseStatus {
  if (!isRelease(version) || !isRelease(latest)) return 'released';
  const order = compareVersions(version, latest);
  if (order === 0) return 'latest';
  return order > 0 ? 'unreleased' : 'released';
}

/** The latest published version, by the rule above. It is the build's version until versions.json loads. */
export function useLatestVersion(): string {
  const { file } = useVersions();
  return latestVersion(file, BUILD_VERSION);
}
