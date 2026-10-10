import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 900 } });

test.describe('Menu page', () => {
  test('opens by keyboard in the top layer, moves with the arrows, chooses with Enter, and focus returns', async ({ page }) => {
    await page.goto('#/components/menu');
    const example = page.getByRole('article').filter({ hasText: 'File menu with shortcuts' });
    const trigger = example.getByRole('button', { name: 'File', exact: true });
    await trigger.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    const menu = page.getByRole('menu', { name: 'File' });
    await expect(menu).toBeVisible();
    expect(await menu.evaluate((el) => el.parentElement!.matches(':popover-open'))).toBe(true);
    await expect(menu.getByRole('menuitem', { name: /New game/ })).toBeFocused();
    // Below the trigger, its left edge on the trigger's.
    const [t, m] = await Promise.all([trigger.boundingBox(), menu.locator('..').boundingBox()]);
    expect(m!.y).toBeGreaterThan(t!.y + t!.height);
    expect(Math.round(m!.x)).toBe(Math.round(t!.x));
    await page.keyboard.press('ArrowDown');
    await expect(menu.getByRole('menuitem', { name: /Save/ })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(example.getByRole('status')).toHaveText('Chose: Save');
  });

  test('Esc closes without choosing; Tab closes and moves on', async ({ page }) => {
    await page.goto('#/components/menu');
    const example = page.getByRole('article').filter({ hasText: 'File menu with shortcuts' });
    const trigger = example.getByRole('button', { name: 'File', exact: true });
    await trigger.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await trigger.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu', { name: 'File' })).toBeHidden();
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('menu', { name: 'File' })).toBeHidden();
    expect(await page.evaluate(() => document.activeElement?.closest('[role="menu"]') ?? null)).toBeNull();
  });
});
