import { expect, test } from '@playwright/test';

/** Every token row's boxes, measured in the page: the row, its name, value, chip, and the card body it sits in. */
async function measureRows(page: import('@playwright/test').Page) {
  return page.locator('.gallery-token-row').evaluateAll((rows) =>
    rows.map((row) => {
      const box = (el: Element | null) => {
        const r = el!.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width };
      };
      const value = row.querySelector('.gallery-token-row__value')!;
      return {
        token: row.querySelector('button')!.getAttribute('aria-label'),
        row: box(row),
        preview: box(row.querySelector('.gallery-token-row__preview')),
        text: box(row.querySelector('.gallery-token-row__text')),
        name: box(row.querySelector('.gallery-token-row__name')),
        leader: box(row.querySelector('.gallery-token-row__leader')),
        value: value.textContent ? box(value) : null,
        chip: box(row.querySelector('.gallery-token-row__chip button')),
        body: box(row.closest('.bit-card__body')),
      };
    }),
  );
}

// Sub-pixel rounding differs by platform; anything under half a pixel is invisible.
const near = (a: number, b: number) => Math.abs(a - b) < 0.5;

for (const [label, width] of [
  ['desktop', 1280],
  ['tablet', 900],
  ['phone', 390],
] as const) {
  test(`Tokens: every token row lines up on a ${label} (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('#/tokens');
    await expect(page.locator('.gallery-token-row').first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready.then(() => true));
    const rows = await measureRows(page);
    expect(rows.length).toBeGreaterThan(50);
    const problems: string[] = [];
    for (const r of rows) {
      if (!near(r.preview.width, 64)) problems.push(`${r.token}: preview is ${r.preview.width}px, not 64`);
      if (!near(r.chip.left, r.name.left)) problems.push(`${r.token}: chip starts at ${r.chip.left}, name at ${r.name.left}`);
      if (r.chip.right > r.body.right + 0.5) problems.push(`${r.token}: chip runs out of its card`);
      if (r.value) {
        if (!near(r.value.right, r.text.right)) problems.push(`${r.token}: value ends at ${r.value.right}, not the row's right edge ${r.text.right}`);
        if (Math.abs(r.value.top - r.name.top) > 1) problems.push(`${r.token}: value is not on the name's line`);
        if (r.name.right > r.value.left + 0.5) problems.push(`${r.token}: name and value overlap`);
        // Every value stays on one line, the inset shadow's too.
        if (r.value.bottom - r.value.top > (r.name.bottom - r.name.top) * 1.5) problems.push(`${r.token}: value wraps`);
        if (r.value.right > r.body.right + 0.5) problems.push(`${r.token}: value runs out of its card`);
        // The dotted leader fills the gap between the name and the value, and is never squeezed away.
        if (r.leader.left < r.name.right - 0.5 || r.leader.right > r.value.left + 0.5) problems.push(`${r.token}: leader is not between name and value`);
        // 16px at least; 8px on a phone, where the line is tightened so the longest value still fits.
        const minLeader = width < 480 ? 7.5 : 15.5;
        if (r.leader.width < minLeader) problems.push(`${r.token}: leader is only ${r.leader.width}px`);
      }
    }
    // Rows that start at the same x are one column: their names all start at the same x too.
    const columns = new Map<number, number[]>();
    for (const r of rows) columns.set(Math.round(r.row.left), [...(columns.get(Math.round(r.row.left)) ?? []), r.name.left]);
    for (const [left, names] of columns) {
      if (Math.max(...names) - Math.min(...names) > 0.5) problems.push(`column at ${left}: names start at ${[...new Set(names)].join(', ')}`);
    }
    expect(problems).toEqual([]);
    // And the page itself never scrolls sideways.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

/** The top and width of each card in a section, in order. */
async function cardBoxes(page: import('@playwright/test').Page, section: string) {
  return page
    .getByRole('region', { name: section })
    .locator('.gallery-token-grid > [role="group"]')
    .evaluateAll((cards) => cards.map((card) => ({ top: Math.round(card.getBoundingClientRect().top), width: card.getBoundingClientRect().width })));
}

test('Tokens: on a desktop the token cards sit three to a row, like the color cards above them', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('#/tokens');
  await expect(page.locator('.gallery-token-row').first()).toBeVisible();
  for (const section of ['Type', 'System']) {
    const [a, b, c] = await cardBoxes(page, section);
    expect([b!.top, c!.top], `${section} cards`).toEqual([a!.top, a!.top]);
  }
});

test('Tokens: on a desktop Shape is radius and lines side by side, then shadow across the full width', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('#/tokens');
  await expect(page.locator('.gallery-token-row').first()).toBeVisible();
  const [radius, lines, shadow] = await cardBoxes(page, 'Shape');
  expect(lines!.top).toBe(radius!.top);
  expect(shadow!.top).toBeGreaterThan(radius!.top);
  expect(shadow!.width).toBeGreaterThan(radius!.width + lines!.width);
});
