export declare const SITE_BASE: '/bit-design-system/';
/** '0.1.3' → '0.1', '1.2.3' → '1', '2.0.0' → '2'. Throws on a non-release (pre-release or non-semver). */
export declare function lineOf(version: string): string;
/** False for pre-releases ('1.0.0-rc.1') and anything that isn't semver. */
export declare function isRelease(version: string): boolean;
export interface LineEntry { line: string; version: string; date: string; path: string; react: string; reactDom: string }
/** `latest` is a line (`0.2`), not a version. */
export interface VersionsFile { latest: string; lines: LineEntry[] }
/** The latest line is served at SITE_BASE, others under `${SITE_BASE}v${line}/`. */
export declare function pathForLine(line: string, latestLine: string): string;
/** Newest patch per line, lines newest first. Input: versions without the leading 'v'. */
export declare function newestPerLine(versions: readonly string[]): { line: string; version: string }[];
/** Negative when line `a` is older than `b`, compared numerically ('0.9' < '0.10' < '1'). */
export declare function compareLines(a: string, b: string): number;
/** A well-formed versions.json: `latest` is a line equal to the root entry's line, every entry complete, paths safe and unique, one entry at SITE_BASE. */
export declare function isVersionsFile(value: unknown): value is VersionsFile;
/** The copy a page is served from (SITE_BASE or `${SITE_BASE}v${line}/`), or null outside the site. */
export declare function ownPathOf(pathname: string): string | null;
