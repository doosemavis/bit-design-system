import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { MODES, seedColorMode } from './mode';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

test.use({ viewport: { width: 1280, height: 900 } });

async function listOf(page: Page, trigger: Locator): Promise<Locator> {
  const id = await trigger.getAttribute('aria-controls');
  expect(id).toBeTruthy();
  return page.locator(`[id="${id}"]`);
}

async function settle(list: Locator): Promise<void> {
  await list.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((animation) => animation.finished)));
  await expect(list).toHaveCSS('opacity', '1');
}

test.describe('Select page: option count and multi-select', () => {
  test('12 options make the list scroll inside the viewport', async ({ page }) => {
    await page.goto('#/components/select');
    const options = page.getByRole('region', { name: 'Controls' }).getByRole('spinbutton', { name: 'options' });
    await options.fill('12');
    const trigger = page.getByRole('region', { name: 'Select preview' }).getByRole('combobox', { name: 'Color' });
    await trigger.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await trigger.click();
    const list = await listOf(page, trigger);
    await expect(list.getByRole('option')).toHaveCount(12);
    expect(await list.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    const box = (await list.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    await expect.poll(() => new URL(page.url()).hash).toContain('optionCount=12');
  });

  for (const mode of MODES) {
    test(`${mode}: multi-select toggles by mouse and keyboard, stays open, and the closed box shows the pill`, async ({ page }) => {
      await seedColorMode(page, mode);
      await page.goto('#/components/select');
      await page.getByRole('group', { name: 'Presets' }).getByRole('button', { name: 'Multi-select' }).click();
      const trigger = page.getByRole('region', { name: 'Select preview' }).getByRole('combobox', { name: 'Color' });
      await trigger.evaluate((el) => el.scrollIntoView({ block: 'center' }));
      await trigger.click();
      const list = await listOf(page, trigger);
      await expect(list).toHaveAttribute('aria-multiselectable', 'true');
      await list.getByRole('option', { name: 'Primary' }).click();
      await list.getByRole('option', { name: 'Success' }).click();
      await expect(list).toBeVisible();
      await page.keyboard.press('End');
      await page.keyboard.press('Enter');
      await expect(list.getByRole('option', { name: 'Orange' })).toHaveAttribute('aria-selected', 'true');
      await settle(list);
      const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
      await page.keyboard.press('Escape');
      await expect(list).toBeHidden();
      await expect(trigger.locator('.bit-select__count')).toHaveText('3 selected');
      await expect(trigger).toBeFocused();
    });
  }
});

test.describe('Field page: Select demo', () => {
  test('the Select preset shows a Select named by the Field label, its list opens, and there is no HTML tab', async ({ page }) => {
    await page.goto('#/components/field');
    await page.getByRole('group', { name: 'Presets' }).getByRole('button', { name: 'Select' }).click();
    const trigger = page.getByRole('region', { name: 'Field preview' }).getByRole('combobox', { name: 'Favorite color' });
    await trigger.click();
    await expect(await listOf(page, trigger)).toBeVisible();
    await expect(page.getByRole('radio', { name: 'HTML' })).toHaveCount(0);
  });
});
