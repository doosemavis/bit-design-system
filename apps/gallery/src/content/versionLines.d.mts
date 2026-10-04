export declare const SITE_BASE: '/bit-design-system/';
/** '0.1.3' → '0.1', '1.2.3' → '1', '2.0.0' → '2' */
export declare function lineOf(version: string): string;
/** False for pre-releases ('1.0.0-rc.1') and anything that isn't semver. */
export declare function isRelease(version: string): boolean;
export interface LineEntry { line: string; version: string; date: string; path: string; react: string; reactDom: string }
export interface VersionsFile { latest: string; lines: LineEntry[] }
/** The latest line is served at SITE_BASE, others under `${SITE_BASE}v${line}/`. */
export declare function pathForLine(line: string, latestLine: string): string;
/** Newest patch per line, lines newest first. Input: versions without the leading 'v'. */
export declare function newestPerLine(versions: readonly string[]): { line: string; version: string }[];
