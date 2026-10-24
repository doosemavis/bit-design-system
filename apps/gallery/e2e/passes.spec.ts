import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { MODES, seedColorMode } from './mode';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const PASS_NAMES = { wireframe: 'Wireframe', tokens: 'Tokens', states: 'States', final: 'Final' } as const;
const stage = (page: Page, name: string) => page.getByRole('group', { name: `${name} pass: Button` });
const urlFor = (value: string) => `#/components/button${value === 'wireframe' ? '' : `?pass=${value}`}`;

test.describe('Passes on the Button page', () => {
  for (const [value, name] of Object.entries(PASS_NAMES)) {
    test(`?pass=${value} loads the ${name} pass`, async ({ page }) => {
      await page.goto(urlFor(value));
      await expect(stage(page, name)).toBeVisible();
    });
  }

  test('?pass=xray lands on Wireframe with the key gone', async ({ page }) => {
    await page.goto('#/components/button?pass=xray');
    await expect(stage(page, 'Wireframe')).toBeVisible();
    await expect(page).toHaveURL(/#\/components\/button$/);
  });

  test('Back and Forward step through passes; a Playground control keeps the pass', async ({ page }) => {
    await page.goto('#/components/button');
    // The radio sits under its label, as in every bit SegmentedControl: a user clicks the label.
    await page.locator('.gallery-passes__controls').getByText('Tokens', { exact: true }).click();
    await expect(stage(page, 'Tokens')).toBeVisible();
    await page.getByRole('button', { name: 'Next: States' }).click();
    await expect(stage(page, 'States')).toBeVisible();
    await page.goBack();
    await expect(stage(page, 'Tokens')).toBeVisible();
    await page.goForward();
    await expect(stage(page, 'States')).toBeVisible();
    // The variant control is a bit Select (a combobox with a listbox), not a radio group.
    const variant = page.getByRole('region', { name: 'Controls' }).getByRole('combobox', { name: 'variant' });
    await variant.click();
    await page.locator(`[id="${await variant.getAttribute('aria-controls')}"]`).getByRole('option', { name: 'outline' }).click();
    await expect(page).toHaveURL(/variant=outline&pass=states/);
  });

  test('keyboard only: reach the control, change pass, press Next; the focus ring always shows', async ({ page }) => {
    await page.goto('#/components/button');
    await page.getByRole('radio', { name: 'Wireframe' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(stage(page, 'Tokens')).toBeVisible();
    const ring = () => page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle);
    expect(await ring()).not.toBe('none');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Next: States' })).toBeFocused();
    expect(await ring()).not.toBe('none');
    await page.keyboard.press('Enter');
    await expect(stage(page, 'States')).toBeVisible();
    await expect(page.getByRole('status')).toHaveText('States, pass 3 of 4');
    await page.keyboard.press('Tab');
    const focusedTile = await page.evaluate(() => document.activeElement?.closest('[data-tile]')?.textContent ?? '');
    expect(focusedTile).toContain('Try it');
  });

  test('leader lines touch their callouts and anchors at 1440px and 1024px', async ({ page }) => {
    for (const width of [1440, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('#/components/button?pass=tokens');
      await expect(page.locator('.gallery-passes__svg path')).toHaveCount(4);
      // Poll: after a resize the stage re-measures on the next frame, so the paths briefly lag the new layout.
      const touching = () => page.evaluate(() => {
        const canvas = document.querySelector('.gallery-passes__canvas--tokens')!.getBoundingClientRect();
        const button = document.querySelector('.gallery-passes__canvas--tokens .bit-button')!.getBoundingClientRect();
        const callouts = [...document.querySelectorAll('[data-part]')].map((el) => el.getBoundingClientRect());
        return [...document.querySelectorAll('.gallery-passes__svg path')].map((path) => {
          const [x1, y1, x2, y2] = path.getAttribute('d')!.match(/-?[\d.]+/g)!.map(Number) as [number, number, number, number];
          const toX = x2 + canvas.left;
          const toY = y2 + canvas.top;
          const fromX = x1 + canvas.left;
          const fromY = y1 + canvas.top;
          const onButton = toX >= button.left - 1 && toX <= button.right + 1 && toY >= button.top - 1 && toY <= button.bottom + 1;
          const onCallout = callouts.some((c) => (Math.abs(fromX - c.right) <= 1 || Math.abs(fromX - c.left) <= 1) && fromY >= c.top && fromY <= c.bottom);
          return onButton && onCallout;
        });
      });
      await expect.poll(touching).toEqual([true, true, true, true]);
    }
  });

  test('at 640px (200% of 1280) the stage stacks: no lines, every part listed', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 900 });
    await page.goto('#/components/button?pass=tokens');
    await expect(page.locator('.gallery-passes__canvas--tokens[data-stacked]')).toBeVisible();
    await expect(page.locator('.gallery-passes__svg')).toHaveCount(0);
    await expect(page.locator('[data-part]')).toHaveCount(4);
  });

  test('the stage keeps one height across Wireframe, Tokens and States', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const heights: number[] = [];
    for (const value of ['wireframe', 'tokens', 'states']) {
      await page.goto(urlFor(value));
      heights.push(await page.locator('.gallery-passes__stage').evaluate((el) => el.getBoundingClientRect().height));
    }
    expect(new Set(heights).size).toBe(1);
  });
});

for (const mode of MODES) {
  test.describe(`Passes axe, ${mode} mode`, () => {
    test.beforeEach(async ({ page }) => {
      await seedColorMode(page, mode);
    });
    for (const [value, name] of Object.entries(PASS_NAMES)) {
      test(`${name} pass has no axe violations`, async ({ page }) => {
        await page.goto(urlFor(value));
        await expect(stage(page, name)).toBeVisible();
        const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
      });
    }
  });
}
