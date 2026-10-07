import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { MODES, seedColorMode } from './mode';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
test.use({ viewport: { width: 1280, height: 900 } });

test.describe('Dialog page', () => {
  test('opens a real modal: focus inside on Cancel, Tab stays inside; Esc folds it away and focus returns', async ({ page }) => {
    await page.goto('#/components/dialog');
    const trigger = page.getByRole('region', { name: 'Dialog preview' }).getByRole('button', { name: 'Open dialog' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Save changes?' });
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate((el) => el.matches(':modal'))).toBe(true);
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    for (let i = 0; i < 4; i += 1) {
      await page.keyboard.press('Tab');
      // A native modal's Tab order ends at the browser's own chrome (activeElement is then <body>) and wraps back in;
      // it never lands on the page behind.
      expect(await dialog.evaluate((el) => el.contains(document.activeElement) || document.activeElement === document.body)).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveAttribute('data-state', 'closing');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('while open, the page behind is inert', async ({ page }) => {
    await page.goto('#/components/dialog');
    await page.getByRole('region', { name: 'Dialog preview' }).getByRole('button', { name: 'Open dialog' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    // Playwright's role queries ignore `inert`, so test it by hit-testing: the sidebar's first link is covered while the modal is open.
    const link = page.locator('#gallery-nav a').first();
    const reachable = () => link.evaluate((el) => {
      const box = el.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + 5, box.top + 5);
      return hit !== null && el.contains(hit);
    });
    expect(await reachable()).toBe(false);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    expect(await reachable()).toBe(true);
  });

  test('a click on the dimmed page closes it; with Alert it does not', async ({ page }) => {
    await page.goto('#/components/dialog');
    const trigger = page.getByRole('region', { name: 'Dialog preview' }).getByRole('button', { name: 'Open dialog' });
    await trigger.click();
    await expect(page.getByRole('dialog')).toHaveAttribute('data-state', 'open');
    await page.mouse.click(10, 10);
    await expect(page.getByRole('dialog')).toBeHidden();
    await page.getByRole('group', { name: 'Presets' }).getByRole('button', { name: 'Alert' }).click();
    await trigger.click();
    const alert = page.getByRole('alertdialog', { name: 'Delete report?' });
    await expect(alert).toHaveAttribute('data-state', 'open');
    await page.mouse.click(10, 10);
    await expect(alert).toBeVisible();
    await alert.getByRole('button', { name: 'Close' }).click();
    await expect(alert).toBeHidden();
  });

  test('the page does not scroll while the dialog is open', async ({ page }) => {
    await page.goto('#/components/dialog');
    await page.getByRole('region', { name: 'Dialog preview' }).getByRole('button', { name: 'Open dialog' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('hidden');
  });

  for (const mode of MODES) {
    test(`${mode}: no axe violations while open`, async ({ page }) => {
      await seedColorMode(page, mode);
      await page.goto('#/components/dialog');
      await page.getByRole('region', { name: 'Dialog preview' }).getByRole('button', { name: 'Open dialog' }).click();
      await expect(page.getByRole('dialog')).toHaveAttribute('data-state', 'open');
      const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    });
  }
});
