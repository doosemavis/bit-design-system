import { useLayoutEffect } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CURRENT_TOKENS } from '../content/currentTokens';
import { renderAt } from '../test/renderRoute';
import { TokensPage } from './TokensPage';
import { expectNoA11yViolations } from '../test/a11y';
import { stubClipboard } from '../test/clipboard';
import { flowTokens } from './tokens/colorFlows';
import { THEME_FLOWS } from './tokens/themeFlows';

// jsdom reads a `?raw` CSS import as empty, so hand the page the real theme's wiring, read from disk.
vi.mock('./tokens/themeFlows', async () => {
  const { readFileSync } = await import('node:fs');
  const { dirname, resolve } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { parseColorFlows } = await import('./tokens/colorFlows');
  const theme = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../packages/core/src/themes/power-up.css');
  return { THEME_FLOWS: parseColorFlows(readFileSync(theme, 'utf8')) };
});

/** jsdom loads no CSS, so give it a few literal token values, light and dark, to compute. */
const THEME = `
  :root { --bit-color-primary: #7C3AED; --bit-color-neutral: #FFFFFF; --bit-color-bg: #EEEFE9; --bit-radius-6px: 6px; --bit-space-16px: 16px; }
  [data-mode="dark"] { --bit-color-neutral: #2B2B37; --bit-color-bg: #15151C; }
`;
let style: HTMLStyleElement;

beforeAll(() => {
  style = document.createElement('style');
  style.textContent = THEME;
  document.head.append(style);
});

afterAll(() => style.remove());

afterEach(() => {
  localStorage.clear();
  Reflect.deleteProperty(navigator, 'clipboard');
});

async function open() {
  const utils = renderAt('/tokens');
  await screen.findByRole('heading', { level: 1, name: 'Tokens' });
  return utils;
}

/** Every public token the page shows: the deprecated text-size aliases (11, 13, 15; removed in 0.2.0) are left out. */
const SHOWN_TOKENS = CURRENT_TOKENS;

const card = (name: string) => screen.getByRole('group', { name: `${name} tokens` });
const region = (name: string) => screen.getByRole('region', { name });
/** The token cards in a section, by name, in order. */
const cardsIn = (section: string) =>
  within(region(section))
    .getAllByRole('group')
    .map((group) => group.getAttribute('aria-label') ?? '')
    .filter((label) => label.endsWith(' tokens'))
    .map((label) => label.replace(/ tokens$/, ''));

describe('TokensPage', () => {
  it('has a section bar, and the five sections in order, with no axe violations', async () => {
    const { container } = await open();
    const main = screen.getByRole('main');
    const titles = ['Color', 'Type', 'Space', 'Shape', 'System'];
    expect(within(main).getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(titles);
    const bar = screen.getByRole('navigation', { name: 'On this page' });
    expect(within(bar).getAllByRole('link').map((l) => l.textContent)).toEqual(titles);
    await expectNoA11yViolations(container);
  });

  it('every public token can be copied by name exactly once: the flow holds the color tokens, the cards hold the rest', async () => {
    await open();
    const named = within(screen.getByRole('main'))
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label') ?? '')
      .filter((label) => label.startsWith('Copy --bit-'))
      .map((label) => label.slice('Copy '.length));
    expect(named.filter((name, i) => named.indexOf(name) !== i)).toEqual([]);
    expect([...named].sort()).toEqual([...SHOWN_TOKENS].sort());
    // The long table is gone: every token is in a card or the flow.
    expect(screen.queryByRole('region', { name: 'Token values' })).toBeNull();
  });

  it('each section is a grid of cards, named for the family they hold', async () => {
    await open();
    expect(cardsIn('Type')).toEqual(['faces', 'sizes', 'weight & leading']);
    expect(cardsIn('Space')).toEqual(['space', 'controls']);
    // Shadow last and full width: its values are the longest, so it gets the room to keep each on one line.
    expect(cardsIn('Shape')).toEqual(['radius', 'lines', 'shadow']);
    expect(card('shadow')).toHaveClass('gallery-token-card--full');
    expect(cardsIn('System')).toEqual(['motion', 'text colors', 'logo', 'code syntax']);
    for (const section of ['Type', 'Space', 'Shape', 'System']) {
      expect(region(section).querySelector('.gallery-token-grid')).not.toBeNull();
    }
  });

  it('every token row has the same shape: a preview, then name, a dotted leader and the value on one line, then the Copy chip', async () => {
    await open();
    const rows = [...document.querySelectorAll('.gallery-token-row')];
    // One row per token the color flow does not draw.
    expect(rows).toHaveLength(SHOWN_TOKENS.length - flowTokens(THEME_FLOWS!).size);
    for (const row of rows) {
      const [preview, text] = [...row.children];
      expect(preview).toHaveClass('gallery-token-row__preview');
      expect(preview).toHaveAttribute('aria-hidden', 'true');
      expect([...text!.children].map((el) => el.className.split(' ').find((c) => c.startsWith('gallery-token-row__')))).toEqual([
        'gallery-token-row__name',
        'gallery-token-row__leader',
        'gallery-token-row__value',
        'gallery-token-row__chip',
      ]);
      expect(text!.querySelector('.gallery-token-row__chip button.gallery-copy-chip')).not.toBeNull();
      // The leader is decoration: screen readers hear the name, then the value.
      expect(text!.querySelector('.gallery-token-row__leader')).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('values come from the live page', async () => {
    await open();
    const row = (token: string) => screen.getByRole('button', { name: `Copy ${token}` }).closest('.gallery-token-row')!;
    expect(row('--bit-radius-6px').querySelector('.gallery-token-row__value')).toHaveTextContent('6px');
    expect(row('--bit-space-16px').querySelector('.gallery-token-row__value')).toHaveTextContent('16px');
  });

  it('Type: each face is previewed in itself and named, the sizes are the even scale (no deprecated 11, 13 or 15), and Typography is linked', async () => {
    await open();
    const faces = card('faces');
    expect([...faces.querySelectorAll('.gallery-face')].map((el) => el.getAttribute('data-face'))).toEqual(['display', 'body', 'pixel', 'mono']);
    expect([...faces.querySelectorAll('.gallery-token-row__name')].map((el) => el.textContent)).toEqual([
      'Lilita One',
      'Nunito',
      'Press Start',
      'JetBrains Mono',
    ]);
    expect([...card('sizes').querySelectorAll('.gallery-token-row__name')].map((el) => el.textContent)).toEqual(['14', '16', '18', '24', '32', '40']);
    for (const old of [11, 13, 15]) expect(screen.queryByRole('button', { name: `Copy --bit-text-${old}px` })).toBeNull();
    expect(card('sizes')).not.toHaveTextContent('deprecated');
    expect(screen.getByRole('link', { name: 'See Typography' })).toHaveAttribute('href', '/typography');
    expect(screen.getByRole('link', { name: 'See Spacing' })).toHaveAttribute('href', '/spacing');
  });

  it('the color cards show values computed from the live page', async () => {
    await open();
    expect(within(card('primary')).getByText('#7C3AED')).toHaveClass('bit-code');
    expect(within(card('neutral')).getByText('#FFFFFF')).toBeInTheDocument();
    expect(within(card('danger')).getAllByText(/fill|hover|soft|contrast/).map((el) => el.textContent)).toEqual([
      'fill',
      'hover',
      'soft',
      'contrast',
    ]);
    expect(within(card('page')).getByText('#EEEFE9')).toBeInTheDocument();
  });

  it('the page card holds the six page-wide colors, headed like the role cards', async () => {
    await open();
    expect(within(card('page')).getByText('page', { selector: '.bit-card__header' })).toBeInTheDocument();
    expect(
      within(card('page'))
        .getAllByText(/^(bg|surface|text|text-muted|ink|focus)$/)
        .map((el) => el.textContent),
    ).toEqual(['bg', 'surface', 'text', 'text-muted', 'ink', 'focus']);
  });

  it('the six color cards share the color grid (two even rows of three, page last)', async () => {
    await open();
    const grid = card('primary').parentElement!;
    // gallery-css.test.ts pins the columns this class sets.
    expect(grid).toHaveClass('gallery-color-grid');
    expect([...grid.children].map((el) => el.getAttribute('aria-label'))).toEqual(
      ['primary', 'neutral', 'success', 'warning', 'danger', 'page'].map((c) => `${c} tokens`),
    );
  });

  it('the values are in the first commit, not filled in by a later effect', () => {
    // A layout effect in a later sibling runs in the same commit as the page's own DOM, before any effect's
    // setState could re-render, so it sees exactly what the first paint would show.
    let firstCommit: string | null = null;
    function FirstCommitProbe() {
      useLayoutEffect(() => {
        firstCommit = document.querySelector('[aria-label="primary tokens"]')?.textContent ?? '';
      }, []);
      return null;
    }
    render(
      <MemoryRouter>
        <TokensPage />
        <FirstCommitProbe />
      </MemoryRouter>,
    );
    expect(firstCommit).toContain('#7C3AED');
  });

  it('switching the mode re-reads the values', async () => {
    await open();
    await userEvent.click(within(screen.getByRole('banner')).getByRole('button', { name: 'Dark' }));
    expect(within(card('neutral')).getByText('#2B2B37')).toBeInTheDocument();
    expect(within(card('page')).getByText('#15151C')).toBeInTheDocument();
    await userEvent.click(within(screen.getByRole('banner')).getByRole('button', { name: 'Light' }));
    expect(within(card('neutral')).getByText('#FFFFFF')).toBeInTheDocument();
  });

  it('data-mode="system" is not read as a mode: values come from computed style', async () => {
    document.documentElement.dataset.mode = 'system';
    try {
      await open();
      // Only the theme's :root values exist for "system" in jsdom (no media query), so they show as-is.
      expect(within(card('neutral')).getByText('#FFFFFF')).toBeInTheDocument();
    } finally {
      delete document.documentElement.dataset.mode;
    }
  });

  it('Color opens with the color flow, above the cards, drawn for the mode on screen', async () => {
    await open();
    const flow = within(region('Color')).getByRole('group', { name: 'Where every color goes' });
    expect(flow.compareDocumentPosition(card('primary')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(flow).getByRole('group', { name: /light mode$/ })).toBeInTheDocument();
    await userEvent.click(within(screen.getByRole('banner')).getByRole('button', { name: 'Dark' }));
    expect(within(flow).getByRole('group', { name: /dark mode$/ })).toBeInTheDocument();
  });

  it.each([
    ['a color card hex', () => card('primary'), '#7C3AED'],
    ['a Shape token name', () => region('Shape'), '--bit-radius-6px'],
    ['a Space token name', () => card('space'), '--bit-space-16px'],
    ['a color flow token', () => screen.getByRole('group', { name: 'Where every color goes' }), '--bit-color-accent'],
  ])('clicking %s copies exactly what it shows', async (_, scope, shown) => {
    await open();
    const writeText = vi.fn(() => Promise.resolve());
    stubClipboard(writeText);
    const chip = within(scope()).getByRole('button', { name: `Copy ${shown}` });
    expect(chip).toHaveTextContent(shown);
    await act(async () => {
      fireEvent.click(chip);
    });
    expect(writeText).toHaveBeenCalledExactlyOnceWith(shown);
  });

  it('every hex chip in the color cards is a Copy chip', async () => {
    await open();
    const codes = [...card('primary').parentElement!.querySelectorAll('code')];
    expect(codes.length).toBeGreaterThan(0);
    expect(codes.filter((code) => !code.closest('button.gallery-copy-chip'))).toEqual([]);
  });
});
