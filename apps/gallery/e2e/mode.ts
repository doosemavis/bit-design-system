import type { Page } from '@playwright/test';
import { COLOR_MODE_STORAGE_KEY } from '@bit-ds/react';

/** The two colour modes every mode-aware spec runs under. */
export const MODES = ['light', 'dark'] as const;

export type SeedMode = (typeof MODES)[number];

/** Save a colour-mode choice before the page loads, as the toggle would have, so the first paint is in that mode. */
export async function seedColorMode(page: Page, mode: SeedMode): Promise<void> {
  await page.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [COLOR_MODE_STORAGE_KEY, mode] as const);
}
