import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { MODES, seedColorMode } from './mode';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

test.use({ viewport: { width: 1280, height: 900 } });

/** The listbox a bit Select's trigger controls. */
async function listOf(page: Page, trigger: Locator): Promise<Locator> {
  const id = await trigger.getAttribute('aria-controls');
  expect(id).toBeTruthy();
  return page.locator(`[id="${id}"]`);
}

/**
 * Put the trigger mid-viewport, so its list has room to open below. Instant: the gallery scrolls smoothly, and a
 * click mid-scroll would open the list near the viewport's bottom, where it flips up.
 */
async function centre(trigger: Locator): Promise<void> {
  await trigger.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
}

/** True when the topmost element at the centre of `row` is the row itself or inside it: nothing clips or covers it. */
function hitsItself(row: Locator): Promise<boolean> {
  return row.evaluate((el) => {
    const box = el.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return hit !== null && el.contains(hit);
  });
}

test.describe('a ControlsPanel Select inside the one-card playground', () => {
  test('opens a list that is visible, inside the viewport and not clipped by the card; choosing updates the preview and the URL', async ({ page }) => {
    // Stack's container height is the last control in the card at 1280px: its list overhangs the card's bottom edge.
    await page.goto('#/components/stack');
    await expect(page.getByRole('heading', { level: 1, name: 'Stack' })).toBeVisible();
    const card = page.locator('.bit-card.gallery-playground__top');
    const trigger = card.getByRole('combobox', { name: 'container height' });
    await centre(trigger);
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const list = await listOf(page, trigger);
    await expect(list).toBeVisible();
    // In the top layer, so no overflow: hidden ancestor can clip it.
    expect(await list.evaluate((el) => el.matches(':popover-open'))).toBe(true);
    const viewport = page.viewportSize()!;
    const box = (await list.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);

    // It reaches past the card's bottom edge, and its last row is still the topmost thing there.
    const cardBox = (await card.boundingBox())!;
    expect(box.y + box.height).toBeGreaterThan(cardBox.y + cardBox.height);
    const rows = list.getByRole('option');
    await expect(rows).toHaveCount(4);
    expect(await hitsItself(rows.last())).toBe(true);
    expect(await hitsItself(rows.first())).toBe(true);

    // The last row, below the card's edge, takes the click.
    await rows.last().click();
    await expect(list).toBeHidden();
    await expect(trigger).toHaveText('200');
    await expect(trigger).toBeFocused();
    await expect(page.getByRole('region', { name: 'Stack preview' }).locator('.bit-box').first()).toHaveCSS('height', '200px');
    expect(new URL(page.url()).hash).toBe('#/components/stack?containerHeight=200');
  });

  test('chooses by keyboard: Enter opens, the arrows move, Enter chooses; Escape closes without choosing', async ({ page }) => {
    await page.goto('#/components/button');
    const trigger = page.getByRole('region', { name: 'Controls' }).getByRole('combobox', { name: 'size' });
    await centre(trigger);
    await trigger.focus();
    await page.keyboard.press('Enter');
    const list = await listOf(page, trigger);
    await expect(list).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(list).toBeHidden();
    await expect(trigger).toHaveText('lg');
    await expect(trigger).toBeFocused();
    expect(new URL(page.url()).hash).toBe('#/components/button?size=lg');

    await page.keyboard.press('ArrowUp');
    await expect(list).toBeVisible();
    await page.keyboard.press('Home');
    await page.keyboard.press('Escape');
    await expect(list).toBeHidden();
    await expect(trigger).toHaveText('lg');
    await expect(trigger).toBeFocused();
  });

  test('the URL, presets, Back and a reload round-trip through the Select controls', async ({ page }) => {
    await page.goto('#/components/button?variant=ghost&size=sm');
    const controls = page.getByRole('region', { name: 'Controls' });
    const variant = controls.getByRole('combobox', { name: 'variant' });
    await expect(variant).toHaveText('ghost');
    await expect(controls.getByRole('combobox', { name: 'size' })).toHaveText('sm');

    await page.getByRole('group', { name: 'Presets' }).getByRole('button', { name: 'Danger outline' }).click();
    await expect(controls.getByRole('combobox', { name: 'color' })).toHaveText('danger');
    await expect(variant).toHaveText('outline');
    expect(new URLSearchParams(new URL(page.url()).hash.split('?')[1]).get('variant')).toBe('outline');

    await variant.click();
    await (await listOf(page, variant)).getByRole('option', { name: 'solid' }).click();
    await expect(variant).toHaveText('solid');
    await page.goBack();
    await expect(variant).toHaveText('outline');
    await page.reload();
    await expect(page.getByRole('region', { name: 'Controls' }).getByRole('combobox', { name: 'variant' })).toHaveText('outline');
  });
});

test.describe('the Select page playground', () => {
  for (const mode of MODES) {
    test(`${mode}: the previewed Select opens in view, chooses, and has no axe violations while open`, async ({ page }) => {
      await seedColorMode(page, mode);
      await page.goto('#/components/select');
      await expect(page.locator('html')).toHaveAttribute('data-mode', mode);
      const trigger = page.getByRole('region', { name: 'Select preview' }).getByRole('combobox', { name: 'Color' });
      await expect(trigger).toHaveText('Pick colors');
      await centre(trigger);
      await trigger.click();
      const list = await listOf(page, trigger);
      await expect(list).toBeVisible();
      const box = (await list.boundingBox())!;
      expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
      expect(await hitsItself(list.getByRole('option').last())).toBe(true);

      // Let the slide and fade finish: mid-fade, axe measures contrast against a half-transparent list.
      await list.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((animation) => animation.finished)));
      await expect(list).toHaveCSS('opacity', '1');
      const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);

      await list.getByRole('option', { name: 'Success' }).click();
      await expect(trigger).toHaveText('Success');
    });
  }
});
