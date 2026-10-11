import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderAt } from './test/renderRoute';

/**
 * Owner pick 2026-10-11 (option D of the badge board): the docs' own badges, the ones you read, use size="lg"
 * (body font, 16px bold). The 8px pixel badge stays the library's micro-label: live samples show it as an app
 * renders it, and the Arcade keeps it for its scores.
 */

/** Live samples and the Arcade keep the library's default badge; everything else in main is docs chrome. */
const SAMPLES = '.gallery-example__sample, .gallery-tile, .gallery-preview, .gallery-split__result, .gallery-home-arcade__card';

/** Every docs badge on the page that is not lg, as its text. */
function smallBadges(root: HTMLElement): string[] {
  return [...root.querySelectorAll<HTMLElement>('.bit-badge')]
    .filter((badge) => badge.closest(SAMPLES) == null)
    .filter((badge) => !badge.classList.contains('bit-lg'))
    .map((badge) => badge.textContent!);
}

async function openAt(path: string, h1: string) {
  renderAt(path);
  await screen.findByRole('heading', { level: 1, name: h1 });
}

describe('docs badges are lg: readable body text, not 8px pixel', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it.each([
    ['/release-notes', 'Release notes'],
    ['/versions', 'Versions'],
    ['/getting-started', 'Getting started'],
    ['/', 'bit Design System'],
  ])('%s: every docs badge is lg', async (path, h1) => {
    await openAt(path, h1);
    const main = screen.getByRole('main');
    expect(main.querySelectorAll('.bit-badge').length).toBeGreaterThan(0);
    expect(smallBadges(main)).toEqual([]);
  });

  it('release notes: the open card\'s kind labels are lg too', async () => {
    await openAt('/release-notes', 'Release notes');
    const card = screen.getAllByRole('button', { name: /^Hide changes in v/ })[0]!.closest('.bit-card') as HTMLElement;
    expect(card.querySelectorAll('.bit-card__body .bit-badge').length).toBeGreaterThan(0);
    expect(smallBadges(card)).toEqual([]);
  });

  it('search: every result chip is lg', async () => {
    await openAt('/', 'bit Design System');
    await userEvent.keyboard('{Control>}k{/Control}');
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByRole('combobox', { name: 'Search pages, components and props' }), 'but');
    expect(dialog.querySelectorAll('.bit-badge').length).toBeGreaterThan(0);
    expect(smallBadges(dialog)).toEqual([]);
  });

  it('the Arcade keeps its pixel score badges', async () => {
    localStorage.setItem('bit-gallery-arcade-snake-best', '12');
    await openAt('/', 'bit Design System');
    const scores = document.querySelectorAll('.gallery-home-arcade__card .bit-badge');
    expect(scores.length).toBeGreaterThan(0);
    for (const badge of scores) expect(badge).not.toHaveClass('bit-lg');
  });
});
