/**
 * The install commands, in one place. The gallery's InstallCommand reads them; PR3c's snippets.mjs and the
 * consumer smoke test will import them too, so every install line anywhere matches.
 */
export const PACKAGE_NAME = '@bit-ds/react';

export const PACKAGE_MANAGERS = ['pnpm', 'npm', 'yarn'] as const;
export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

export const INSTALL_COMMANDS: Readonly<Record<PackageManager, string>> = {
  pnpm: `pnpm add ${PACKAGE_NAME}`,
  npm: `npm install ${PACKAGE_NAME}`,
  yarn: `yarn add ${PACKAGE_NAME}`,
};

export const DEFAULT_PACKAGE_MANAGER: PackageManager = 'pnpm';

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
