import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { NAV } from '../src/shell/Sidebar';
import { MODES, seedColorMode } from './mode';

/**
 * PR C only (deleted before merge): the role-token switch must not move a pixel. Run once with ROLE_PIXELS=capture
 * on the code before the switch, then with ROLE_PIXELS=compare after it. Byte-for-byte, so a single changed pixel
 * fails. Baselines live in the git-ignored .superpowers workspace, never in the repo. CI never sets ROLE_PIXELS.
 */
const MODE = process.env.ROLE_PIXELS;
const DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../../.superpowers/role-pixels');

test.skip(MODE !== 'capture' && MODE !== 'compare', 'set ROLE_PIXELS=capture or ROLE_PIXELS=compare');

async function shoot(target: Locator, name: string) {
  const png = await target.screenshot({ animations: 'disabled' });
  const file = resolve(DIR, `${name}.png`);
  if (MODE === 'capture') {
    mkdirSync(DIR, { recursive: true });
    writeFileSync(file, png);
    return;
  }
  expect(existsSync(file), `no baseline for ${name}: run ROLE_PIXELS=capture first`).toBe(true);
  const same = readFileSync(file).equals(png);
  if (!same) writeFileSync(resolve(DIR, `${name}.actual.png`), png);
  expect(same, `${name} changed: compare ${name}.png with ${name}.actual.png`).toBe(true);
}

async function open(page: Page, mode: (typeof MODES)[number], to: string) {
  await seedColorMode(page, mode);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`#${to}`);
  await page.evaluate(() => document.fonts.ready.then(() => true));
  if (to !== '/tokens') await page.locator('#section-playground').waitFor();
}

/** The control's parent (its table cell or label), so its shadow and focus ring are in the shot. */
const around = (locator: Locator) => locator.locator('xpath=..');

const COMPONENTS = NAV.filter((item) => item.group === 'Components');

/** A page section by its h2's id: the gallery-section that holds that heading (innermost, if they nest). */
const sectionOf = (page: Page, id: string) => page.locator('.gallery-section').filter({ has: page.locator(`#${id}`) }).last();

for (const mode of MODES) {
  for (const item of COMPONENTS) {
    test(`${item.label} (${mode})`, async ({ page }) => {
      await open(page, mode, item.to);
      const slug = item.to.replace(/\W+/g, '-');
      for (const id of ['section-playground', 'section-variants']) {
        if ((await page.locator(`#${id}`).count()) > 0) await shoot(sectionOf(page, id), `${mode}${slug}-${id}`);
      }
    });
  }

  test(`Tokens page (${mode})`, async ({ page }) => {
    await open(page, mode, '/tokens');
    await shoot(page.locator('main'), `${mode}-tokens`);
  });

  test(`hover and focus (${mode})`, async ({ page }) => {
    const button = COMPONENTS.find((item) => item.label === 'Button')!;
    await open(page, mode, button.to);
    const solid = sectionOf(page, 'section-variants').locator('.bit-button.bit-solid').first();
    await solid.scrollIntoViewIfNeeded();
    await solid.hover();
    await shoot(around(solid), `${mode}-button-hover`);
    await page.mouse.move(0, 0);
    await page.keyboard.press('Tab');
    await solid.focus();
    // Leaving hover runs the press transition back; let it finish so the shot is the same every run.
    await page.waitForTimeout(500);
    await shoot(around(solid), `${mode}-button-focus`);

    const checkbox = COMPONENTS.find((item) => item.label === 'Checkbox')!;
    await open(page, mode, checkbox.to);
    const box = sectionOf(page, 'section-variants').locator('input[type="checkbox"]').first();
    await box.scrollIntoViewIfNeeded();
    await page.keyboard.press('Tab');
    await box.focus();
    await shoot(around(around(box)), `${mode}-checkbox-focus`);
  });
}
