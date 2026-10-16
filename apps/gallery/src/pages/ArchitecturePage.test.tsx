import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { colorMode, COLORS } from '@bit-ds/react';
import { CURRENT_TOKENS } from '../content/currentTokens';
import { MANIFESTS } from '../manifests';
import { missingRepoLink } from '../test/repoLinks';
import { renderAt } from '../test/renderRoute';
import { AXES, REPO_FILES } from './architecture/architectureDoc';
import { ARCHITECTURE_DOC_URL } from './ArchitecturePage';

// jsdom reads a `?raw` CSS import as empty, so hand the page the real theme, read from disk.
async function readTheme(): Promise<string> {
  const { readFileSync } = await import('node:fs');
  const { dirname, resolve } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  return readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../../../packages/core/src/themes/power-up.css'), 'utf8');
}
vi.mock('./tokens/themeFlows', async () => {
  const { parseColorFlows } = await import('./tokens/colorFlows');
  return { THEME_FLOWS: parseColorFlows(await readTheme()) };
});
vi.mock('./architecture/themeSource', async () => ({ THEME_CSS: await readTheme() }));

async function renderArchitecture() {
  const utils = renderAt('/architecture');
  await screen.findByRole('heading', { level: 1, name: 'Architecture' });
  return { ...utils, main: screen.getByRole('main') };
}

const chain = () => screen.getByRole('list', { name: 'From the prop to the pixels' });

/** What a reader gets from an element: its text without the aria-hidden parts (the slots' invisible size-holders). */
function shown(element: Element): string {
  const copy = element.cloneNode(true) as HTMLElement;
  for (const hidden of copy.querySelectorAll('[aria-hidden="true"]')) hidden.remove();
  return copy.textContent ?? '';
}

/** The caption under the theme lines that is showing now (the others hold the room, hidden). */
const caption = () => document.querySelector('.gallery-arch-slot__caption[data-current]');

describe('Architecture page', () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = 'power-up';
    colorMode.set('light');
  });
  afterEach(() => {
    colorMode.set('light');
    localStorage.clear();
  });

  it('has an h1, three h2 sections, and an h3 for each level and the future package', async () => {
    const { main } = await renderArchitecture();
    const outline = within(main)
      .getAllByRole('heading')
      .map((h) => `${h.tagName} ${h.textContent}`);
    expect(outline).toEqual([
      'H1 Architecture',
      'H2 How the layers fit',
      'H3 Palette',
      'H3 Semantic tokens',
      'H3 Component CSS',
      'H3 Components',
      'H3 Your app',
      // After the app in reading order (where a phone shows it); the grid seats it beside the react box on a desktop.
      'H3 A second framework',
      'H2 The naming rule, live',
      'H2 What kind of design system this is',
    ]);
  });

  it('the scoreboard counts its facts from their sources, and screen readers hear the numbers, not the padding', async () => {
    await renderArchitecture();
    const board = screen.getByRole('list', { name: 'bit by the numbers' });
    const items = within(board).getAllByRole('listitem');
    const heard = items.map((item) => {
      const copy = item.cloneNode(true) as HTMLElement;
      for (const hidden of copy.querySelectorAll('[aria-hidden="true"]')) hidden.remove();
      return copy.textContent;
    });
    expect(heard).toEqual([`${MANIFESTS.length} components`, '0 dependencies', '3 CSS layers', `${CURRENT_TOKENS.length} tokens`]);
    const shown = items.map((item) => item.querySelector('.gallery-arch-scoreboard__count')!.textContent);
    expect(shown).toEqual([String(MANIFESTS.length).padStart(3, '0'), '000', '003', String(CURRENT_TOKENS.length).padStart(3, '0')]);
    // A dark cabinet in either page mode: a BitTheme subtree.
    expect(board.closest('.bit-theme')).toHaveClass('bit-dark', 'gallery-arch-scoreboard');
  });

  it('each score links to where its count can be checked, and every link lands', async () => {
    await renderArchitecture();
    const board = screen.getByRole('list', { name: 'bit by the numbers' });
    const links = within(board).getAllByRole('link');
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['components', `${REPO_FILES}README.md#components`],
      ['dependencies', 'https://www.npmjs.com/package/@bit-ds/react?activeTab=dependencies'],
      ['CSS layers', `${REPO_FILES}README.md#your-css-wins`],
      // A gallery route: the test's memory router writes it bare; the app's hash router writes #/tokens.
      ['tokens', '/tokens'],
    ]);
    for (const link of links.slice(0, 3)) expect(link).toHaveClass('bit-link', 'bit-neutral');
    expect([links[0]!, links[2]!].map((link) => missingRepoLink(link.getAttribute('href')!))).toEqual([null, null]);
  });

  it('the diagram is a named figure whose caption says the whole flow in words', async () => {
    await renderArchitecture();
    const figure = screen.getByRole('figure', { name: "bit's layers, top to bottom" });
    expect(figure).toHaveAccessibleDescription(
      'Read top to bottom: the theme’s palette maps onto semantic tokens; component CSS reads only those tokens; that CSS styles the classes the React components emit; and your app imports the components.',
    );
    // The pipes are decoration: their verbs are in the caption.
    for (const pipe of figure.querySelectorAll('.gallery-arch-pipe')) expect(pipe).toHaveAttribute('aria-hidden', 'true');
  });

  it('draws the two packages as boxes: core private and inlined, react on npm, and Angular dashed and not built', async () => {
    await renderArchitecture();
    const core = document.querySelector('.gallery-arch-zone[data-zone="core"]')!;
    expect(core).toHaveTextContent('@bit-ds/core');
    expect(core).toHaveTextContent('private · inlined at build');
    expect(within(core as HTMLElement).getAllByRole('heading').map((h) => h.textContent)).toEqual(['Palette', 'Semantic tokens', 'Component CSS']);
    const react = document.querySelector('.gallery-arch-zone[data-zone="react"]')!;
    expect(react).toHaveTextContent(/@bit-ds\/react.*published on npm/);
    expect(within(react as HTMLElement).getAllByRole('button').map((b) => b.textContent)).toEqual([...COLORS]);
    const locked = screen.getByRole('heading', { name: 'A second framework' }).closest('.gallery-arch-zone')!;
    expect(locked).toHaveAttribute('data-zone', 'future');
    expect(locked).toHaveClass('bit-outline');
    expect(locked).toHaveTextContent('not built');
    expect(locked).toHaveTextContent('@bit-ds/angular would read the same core');
  });

  it('the palette and token levels show the real theme’s wiring for the five fills', async () => {
    await renderArchitecture();
    const palette = screen.getByRole('list', { name: 'Palette colors behind the five fills, light mode' });
    expect(within(palette).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['violet#7C3AED', 'steel#5F6372', 'green#1FA34A', 'yellow#FFC800', 'red#D91A1A']);
    const tokens = screen.getByRole('list', { name: 'Five color tokens and the palette color each reads' });
    expect(within(tokens).getAllByRole('listitem')[4]).toHaveTextContent('--bit-color-dangerreads red');
  });

  it('the naming chain starts at neutral and walks prop, class, token, the hex the theme assigns, then the pixels', async () => {
    await renderArchitecture();
    const steps = within(chain()).getAllByRole('listitem').map(shown);
    expect(steps).toEqual(['1 · propcolor="neutral"', '2 · classbit-neutral', '3 · token--bit-color-neutral', '4 · hex#5F6372', '5 · pixelsSave']);
    expect(within(chain()).getByRole('button', { name: 'Save' })).toHaveClass('bit-button', 'bit-neutral');
    expect(screen.getByRole('region', { name: 'power-up theme, light mode' })).toHaveTextContent(
      '.bit-theme-power-up { --bit-palette-steel: #5F6372; --bit-color-neutral: var(--bit-palette-steel); }',
    );
    // Neutral is the fill that changes with the mode, so the caption can promise it.
    expect(caption()).toHaveTextContent('In dark mode it reads steel-light, #9A9EB0: switch the mode in the header to watch it change.');
  });

  it('picking a color repaints the Button in the chain and moves every step, down to the hex', async () => {
    const user = userEvent.setup();
    await renderArchitecture();
    await user.click(screen.getByRole('radio', { name: 'danger' }));
    expect(within(chain()).getByRole('button', { name: 'Save' })).toHaveClass('bit-button', 'bit-danger');
    expect(within(chain()).getAllByRole('listitem').map(shown)).toEqual([
      '1 · propcolor="danger"',
      '2 · classbit-danger',
      '3 · token--bit-color-danger',
      '4 · hex#D91A1A',
      '5 · pixelsSave',
    ]);
    // Danger is the same red in both modes, and the caption says so rather than promising a change.
    expect(caption()).toHaveTextContent('In light mode, power-up sets --bit-color-danger to the palette’s red, #D91A1A. Red is the same in light and dark.');
  });

  it('in dark mode the chain follows the dark block: neutral reads steel-light', async () => {
    colorMode.set('dark');
    await renderArchitecture();
    expect(within(chain()).getAllByRole('listitem')[3]).toHaveTextContent('4 · hex#9A9EB0');
    expect(screen.getByRole('region', { name: 'power-up theme, dark mode' })).toHaveTextContent('--bit-color-neutral: var(--bit-palette-steel-light);');
  });

  it('the kind table has Axis, bit chose and Why (no Revisit when), one row per axis, its rejected options struck through', async () => {
    await renderArchitecture();
    const table = screen.getByRole('table', { name: 'What kind of design system this is' });
    expect(within(table).getAllByRole('columnheader').map((th) => th.textContent)).toEqual(['Axis', 'bit chose', 'Why, and what it costs']);
    expect(within(table).getAllByRole('row')).toHaveLength(AXES.length + 1);
    const struck = [...table.querySelectorAll('s')].map((el) => el.textContent);
    expect(struck).toEqual(AXES.flatMap((axis) => axis.over));
    expect(table).not.toHaveTextContent(/revisit/i);
    // Every row shows what its choice costs, from the doc's Cost column.
    for (const row of AXES) expect(table).toHaveTextContent(row.cost.replaceAll('`', ''));
  });

  it('the kind table\'s citations are the doc\'s own links, not text that only looks like one', async () => {
    await renderArchitecture();
    const table = screen.getByRole('table', { name: 'What kind of design system this is' });
    const link = (name: string) => within(table).getByRole('link', { name }).getAttribute('href');
    expect(link('f3fd5eb')).toBe('https://github.com/doosemavis/bit-design-system/commit/f3fd5eb');
    expect(link('verify-dist.mjs')).toBe(`${REPO_FILES}packages/react/scripts/verify-dist.mjs`);
    expect(link('CHANGELOG 0.1.9')).toBe(`${REPO_FILES}CHANGELOG.md#019--2026-10-10`);
    expect(link('spec §12')).toBe(`${REPO_FILES}docs/superpowers/specs/2026-09-06-bit-design-system-design.md#12-decisions-log`);
    // The markdown is drawn, never shown.
    expect(table).not.toHaveTextContent(/\]\(/);
  });

  it('links the full rationale in ARCHITECTURE.md, in a purple note', async () => {
    await renderArchitecture();
    const link = screen.getByRole('link', { name: 'ARCHITECTURE.md' });
    expect(link).toHaveAttribute('href', ARCHITECTURE_DOC_URL);
    expect(link.closest('[role="note"]')).toHaveClass('bit-alert', 'bit-primary', 'bit-outline');
  });

  it('uses no raw table, code, pre or heading tags: every one comes from a bit component', async () => {
    const { main } = await renderArchitecture();
    for (const el of main.querySelectorAll('table, code, pre, h1, h2, h3, h4, h5, h6')) {
      expect(el.matches('.bit-table__table, .bit-code, .bit-code__pre, .bit-code__pre code, .bit-heading'), el.outerHTML).toBe(true);
    }
  });
});
