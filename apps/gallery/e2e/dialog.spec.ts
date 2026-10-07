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
    // A native modal's Tab order ends at the browser's own chrome (activeElement is then <body>) and wraps back in;
    // it never lands on the page behind.
    const visited = new Set<string>();
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press('Tab');
      const where = await dialog.evaluate((el) => {
        const a = document.activeElement;
        if (a === document.body) return 'body';
        return el.contains(a) ? (a?.textContent ?? '').trim() : 'OUTSIDE';
      });
      expect(where).not.toBe('OUTSIDE');
      visited.add(where);
    }
    expect([...visited]).toEqual(expect.arrayContaining(['×', 'Cancel', 'Save']));
    await page.keyboard.press('Shift+Tab');
    expect(await dialog.evaluate((el) => el.contains(document.activeElement) || document.activeElement === document.body)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveAttribute('data-state', 'closing');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('while open, the page behind is inert', async ({ page }) => {
    await page.goto('#/components/dialog');
    await page.getByRole('region', { name: 'Dialog preview' }).getByRole('button', { name: 'Open dialog' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    // The HTML spec makes focus() a no-op on content blocked by a modal dialog, so a link that can't take focus is inert.
    const link = page.locator('#gallery-nav a').first();
    const canFocus = () => link.evaluate((el) => { (el as HTMLElement).focus(); return document.activeElement === el; });
    expect(await canFocus()).toBe(false);
    // Occlusion only (not inertness): the dialog covers the link.
    expect(await link.evaluate((el) => {
      const box = el.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + 5, box.top + 5);
      return hit !== null && el.contains(hit);
    })).toBe(false);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    expect(await canFocus()).toBe(true);
  });

  test('a click on the dimmed page closes it; with Alert it shakes instead, under a red title bar', async ({ page }) => {
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
    // The shake lasts 300ms, so note data-shake from the moment it appears rather than polling for it.
    await alert.evaluate((el) => {
      const seen = el as HTMLElement;
      new MutationObserver(() => {
        if (seen.hasAttribute('data-shake')) seen.dataset.shook = 'yes';
      }).observe(seen, { attributes: true, attributeFilter: ['data-shake'] });
    });
    await page.mouse.click(10, 10);
    await expect(alert).toHaveAttribute('data-shook', 'yes');
    await expect(alert).toBeVisible();
    // It clears on its animationend, so the next click can shake again.
    await expect(alert).not.toHaveAttribute('data-shake');
    // The red title bar: the header's background is the danger colour.
    const colours = await alert.evaluate((el) => {
      const probe = document.createElement('div');
      probe.style.background = 'var(--bit-color-danger)';
      el.append(probe);
      const danger = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return { danger, header: getComputedStyle(el.querySelector('.bit-dialog__header')!).backgroundColor };
    });
    expect(colours.header).toBe(colours.danger);
    expect(colours.danger).not.toBe('rgba(0, 0, 0, 0)');
    await alert.getByRole('button', { name: 'Close' }).click();
    await expect(alert).toBeHidden();
  });

  test('the page does not scroll while the dialog is open', async ({ page }) => {
    await page.goto('#/components/dialog');
    await page.getByRole('region', { name: 'Dialog preview' }).getByRole('button', { name: 'Open dialog' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('hidden');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe('hidden');
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
