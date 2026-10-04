/**
 * The install commands, in one place. The gallery's InstallCommand reads them; snippets.mjs is the source, so
 * every install line anywhere matches.
 */
import { INSTALL_COMMANDS, PACKAGE_MANAGERS } from './snippets.mjs';

export { INSTALL_COMMANDS, PACKAGE_MANAGERS };
export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

const DEFAULT_PACKAGE_MANAGER: PackageManager = 'pnpm';

/** Where the visitor's pick is remembered. */
export const PACKAGE_MANAGER_STORAGE_KEY = 'bit-gallery-package-manager';

export function isPackageManager(value: unknown): value is PackageManager {
  return typeof value === 'string' && (PACKAGE_MANAGERS as readonly string[]).includes(value);
}

/** The remembered pick. Blocked storage, nothing stored, or an unknown value all give pnpm. */
export function readPackageManager(): PackageManager {
  try {
    const stored = window.localStorage.getItem(PACKAGE_MANAGER_STORAGE_KEY);
    return isPackageManager(stored) ? stored : DEFAULT_PACKAGE_MANAGER;
  } catch {
    return DEFAULT_PACKAGE_MANAGER;
  }
}

/** Remember the pick. Blocked storage (private browsing) keeps it for this visit only, silently. */
export function writePackageManager(manager: PackageManager): void {
  try {
    window.localStorage.setItem(PACKAGE_MANAGER_STORAGE_KEY, manager);
  } catch {
    // Storage is blocked: the pick lasts until the page closes.
  }
}
