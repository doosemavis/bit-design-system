import { screen, within } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderAt } from './test/renderRoute';

/**
 * The hard shadow is rationed: it marks what you press (Buttons, the component tiles, the playground, which
 * carries the biggest), so the eye lands there first. Reading surfaces (cards of prose, tokens and release notes,
 * the docs tables, the pager) are flat: Card `flat` or `variant="outline"`, Table `flat`.
 */

/** Live samples of a component show its default look, shadow and all: specimens, not page surfaces. Tiles are pressed. */
const SKIPPED = '.gallery-example__sample, .gallery-tile, .gallery-preview, .gallery-split__result';

/** Every Card or Table frame on the page that still draws the hard shadow, specimens and tiles left out. */
function raised(root: HTMLElement): string[] {
  return [...root.querySelectorAll<HTMLElement>('.bit-card, .bit-table')]
    .filter((el) => !el.matches('.bit-flat, .bit-outline'))
    .filter((el) => el.closest(SKIPPED) == null)
    .map((el) => el.getAttribute('aria-label') ?? el.textContent!.slice(0, 40));
}

const main = () => screen.getByRole('main');

async function openAt(path: string, h1: string) {
  renderAt(path);
  await screen.findByRole('heading', { level: 1, name: h1 });
}

describe('surfaces: the hard shadow is only on what you press', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it.each([
    ['/getting-started', 'Getting started'],
    ['/release-notes', 'Release notes'],
    ['/tokens', 'Tokens'],
    ['/typography', 'Typography'],
    ['/spacing', 'Spacing'],
    ['/accessibility', 'Accessibility'],
  ])('%s: every card and table is flat', async (path, h1) => {
    await openAt(path, h1);
    expect(raised(main())).toEqual([]);
  });

  it('home: the facts, start cards and naming table are flat; the component tiles keep their shadow', async () => {
    await openAt('/', 'bit Design System');
    const tiles = main().querySelectorAll('.bit-card.gallery-tile');
    expect(tiles.length).toBeGreaterThan(20);
    for (const tile of tiles) expect(tile).not.toHaveClass('bit-flat');
    expect(raised(main())).toEqual([]);
    // The facts are the lightest: an outline with no fill, so the hero's Buttons stand out beside them.
    const facts = screen.getByRole('list', { name: 'At a glance' });
    for (const card of facts.querySelectorAll('.bit-card')) expect(card).toHaveClass('bit-outline');
  });

  it('home: the quick start is one layer, its two code blocks stacked in no card of their own', async () => {
    await openAt('/', 'bit Design System');
    const quick = screen.getByRole('group', { name: 'quick start' });
    expect(quick).not.toHaveClass('bit-card');
    expect(quick.querySelector('.bit-card')).toBeNull();
    const blocks = quick.querySelectorAll('.bit-code__block');
    expect(blocks).toHaveLength(2);
    // No frame inside a frame: neither block sits in the other, or in any framed surface.
    for (const block of blocks) expect(block.parentElement!.closest('.bit-card, .bit-code__block, .bit-table, .bit-alert')).toBeNull();
  });

  it('a component page: the playground keeps the big shadow; Props, Accessibility, Related and the pager are flat', async () => {
    await openAt('/components/button', 'Button');
    const playground = main().querySelector('.bit-card.gallery-playground__top')!;
    expect(playground).toHaveClass('bit-solid');
    expect(playground).not.toHaveClass('bit-flat');
    const region = (name: string) => within(main()).getByRole('region', { name });
    expect(within(region('Props')).getByRole('table').parentElement).toHaveClass('bit-table', 'bit-flat');
    expect(region('Accessibility').querySelector('.bit-card')).toHaveClass('bit-flat');
    const related = region('Related').querySelectorAll('.bit-card');
    expect(related.length).toBeGreaterThan(0);
    for (const card of related) expect(card).toHaveClass('bit-flat');
    const pager = screen.getByRole('navigation', { name: 'Previous and next page' });
    const cards = pager.querySelectorAll('.bit-card');
    expect(cards).toHaveLength(2);
    for (const card of cards) expect(card).toHaveClass('bit-flat');
  });
});
