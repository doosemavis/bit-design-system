import { useLayoutEffect } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SEMANTIC_TOKENS } from '@bit-ds/react';
import { renderAt } from '../test/renderRoute';
import { TokensPage } from './TokensPage';
import { filterTokens } from './tokens/AllTokens';
import { expectNoA11yViolations } from '../test/a11y';

/** jsdom loads no CSS, so give it a few literal token values, light and dark, to compute. */
const THEME = `
  :root { --bit-color-primary: #7C3AED; --bit-color-neutral: #FFFFFF; --bit-color-bg: #EEEFE9; --bit-radius-6px: 6px; }
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

/** How many public tokens share a name prefix, so the expected counts follow the token list. */
const countPrefix = (...prefixes: string[]) =>
  SEMANTIC_TOKENS.filter((name) => prefixes.some((prefix) => name.startsWith(prefix))).length;
const SPACE_COUNT = countPrefix('--bit-space-');
const SHAPE_COUNT = countPrefix('--bit-radius-', '--bit-shadow-');

const card = (color: string) => screen.getByRole('group', { name: `${color} tokens` });

describe('TokensPage', () => {
  it('has the Foundations eyebrow, a section bar, and the five sections in order, with no axe violations', async () => {
    const { container } = await open();
    const main = screen.getByRole('main');
    expect(within(main).getByText('Foundations')).toHaveClass('gallery-eyebrow');
    const titles = ['Color', 'Type', 'Space', 'Shape', 'All tokens'];
    expect(within(main).getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(titles);
    const bar = screen.getByRole('navigation', { name: 'On this page' });
    expect(within(bar).getAllByRole('link').map((l) => l.textContent)).toEqual(titles);
    await expectNoA11yViolations(container);
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
    expect(within(screen.getByRole('group', { name: 'Surface tokens' })).getByText('#EEEFE9')).toBeInTheDocument();
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
    expect(within(screen.getByRole('group', { name: 'Surface tokens' })).getByText('#15151C')).toBeInTheDocument();
    await userEvent.click(within(screen.getByRole('banner')).getByRole('button', { name: 'Light' }));
    expect(within(card('neutral')).getByText('#FFFFFF')).toBeInTheDocument();
  });

  it('Type and Space are one compact row each, linking to their pages', async () => {
    await open();
    expect(screen.getByRole('link', { name: 'See Typography' })).toHaveAttribute('href', '/typography');
    expect(screen.getByRole('link', { name: 'See Spacing' })).toHaveAttribute('href', '/spacing');
    const type = screen.getByRole('region', { name: 'Type' });
    expect([...type.querySelectorAll('.gallery-face')].map((el) => el.textContent)).toEqual([
      'Lilita One',
      'Nunito',
      'Press Start',
      'JetBrains Mono',
    ]);
    expect(screen.getByRole('region', { name: 'Space' }).querySelectorAll('.gallery-ruler__bar')).toHaveLength(SPACE_COUNT);
  });

  it('Shape has a tile per radius and shadow token, with its name and value', async () => {
    await open();
    const shape = screen.getByRole('region', { name: 'Shape' });
    expect(shape.querySelectorAll('.gallery-shape')).toHaveLength(SHAPE_COUNT);
    expect(within(shape).getByText('--bit-radius-6px')).toHaveClass('bit-code');
    expect(within(shape).getByText('6px')).toBeInTheDocument();
  });

  it('All tokens: every token with a count, and a Copy for each that copies var(--name)', async () => {
    await open();
    const count = screen.getByText(`${SEMANTIC_TOKENS.length} of ${SEMANTIC_TOKENS.length} tokens`);
    expect(count).toHaveClass('bit-badge');
    expect(count).toHaveAttribute('role', 'status');
    const table = screen.getByRole('region', { name: 'Token values' });
    expect(within(table).getAllByRole('row')).toHaveLength(SEMANTIC_TOKENS.length + 1);
    expect(within(table).getByRole('button', { name: 'Copy var(--bit-color-primary)' })).toBeInTheDocument();
  });

  it("a row's Copy puts var(--name) on the clipboard", async () => {
    await open();
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const table = screen.getByRole('region', { name: 'Token values' });
    await act(async () => {
      fireEvent.click(within(table).getByRole('button', { name: 'Copy var(--bit-color-primary)' }));
    });
    expect(writeText).toHaveBeenCalledExactlyOnceWith('var(--bit-color-primary)');
  });

  it('the filter narrows the table and the count', async () => {
    await open();
    await userEvent.type(screen.getByLabelText('Filter'), 'SPACE');
    const table = screen.getByRole('region', { name: 'Token values' });
    expect(within(table).getAllByRole('row')).toHaveLength(SPACE_COUNT + 1);
    expect(screen.getByText(`${SPACE_COUNT} of ${SEMANTIC_TOKENS.length} tokens`)).toBeInTheDocument();
  });

  it('no match: the message, the name format, and Clear filter, which restores the list and focuses the field', async () => {
    await open();
    const field = screen.getByLabelText('Filter');
    await userEvent.type(field, 'sparkle');
    expect(screen.queryByRole('region', { name: 'Token values' })).toBeNull();
    expect(screen.getByText('No tokens match “sparkle”.')).toBeInTheDocument();
    expect(screen.getByText('--bit-color-primary', { selector: 'code' })).toBeInTheDocument();
    expect(screen.getByText(`0 of ${SEMANTIC_TOKENS.length} tokens`)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear filter' }));
    expect(field).toHaveValue('');
    expect(document.activeElement).toBe(field);
    expect(screen.getByRole('region', { name: 'Token values' })).toBeInTheDocument();
  });
});

describe('filterTokens', () => {
  it('matches part of a name, ignoring case and outer spaces; empty keeps every name', () => {
    expect(filterTokens(['--bit-color-bg', '--bit-space-4px'], ' COLOR ')).toEqual(['--bit-color-bg']);
    expect(filterTokens(['--bit-color-bg'], '')).toEqual(['--bit-color-bg']);
    expect(filterTokens(['--bit-color-bg'], 'zzz')).toEqual([]);
  });
});
