import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { COLOR_MODES, ICON_GROUPS } from '@bit-ds/react';
import { CURRENT_TOKENS } from '../content/currentTokens';
import { renderAt } from '../test/renderRoute';
import { expectNoA11yViolations } from '../test/a11y';
import { MANIFESTS, routeFor } from '../manifests';
import { NAV } from '../shell/Sidebar';
import { COMPONENT_GROUPS } from '../shell/navGroups';
import { GAMES } from '../arcade/games';
import { bestKey } from '../arcade/bestScore';
import { INSTALL_COMMANDS, STYLE_IMPORTS } from '../content/snippets.mjs';
import { NAMING_COLUMNS } from './home/NamingRule';
import { BROWSE_TARGET } from './HomePage';

async function open() {
  const utils = renderAt('/');
  await screen.findByRole('heading', { level: 1, name: 'bit Design System' });
  return utils;
}

const main = () => screen.getByRole('main');
/** Every component and form control, the logo excluded: one tile each. */
const TILED = MANIFESTS.filter((m) => m.group !== 'brand');

describe('HomePage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('the hero: BitLogo as the h1, the tagline, and two Buttons, with no axe violations', async () => {
    const { container } = await open();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(within(h1).getByRole('img', { name: 'bit Design System' })).toHaveClass('bit-lg');
    expect(screen.getByText('A retro-styled React Design System for people who want a bit of nostalgia.')).toBeInTheDocument();
    const browse = screen.getByRole('link', { name: 'Browse components' });
    expect(browse).toHaveClass('bit-button', 'bit-primary', 'bit-solid');
    expect(browse).toHaveAttribute('href', BROWSE_TARGET);
    expect(screen.getByRole('link', { name: 'See the tokens' })).toHaveClass('bit-outline');
    expect(screen.getByRole('link', { name: 'See the tokens' })).toHaveAttribute('href', '/tokens');
    await expectNoA11yViolations(container);
  });

  it('beside the hero, the quick start: the install line and a first component, from the shared snippets', async () => {
    await open();
    const card = screen.getByRole('group', { name: 'quick start' });
    expect(card.closest('.gallery-hero')).not.toBeNull();
    expect(within(card).getByRole('region', { name: 'Install command' })).toHaveTextContent(INSTALL_COMMANDS.pnpm);
    const first = within(card).getByRole('region', { name: 'Your first component' });
    for (const line of STYLE_IMPORTS.split('\n')) expect(first).toHaveTextContent(line);
    expect(first).toHaveTextContent("import { Button } from '@bit-ds/react';");
    expect(first).toHaveTextContent('<Button color="primary">Save</Button>');
    // Each block keeps its Copy button.
    expect(within(card).getAllByRole('button', { name: /^Copy/ })).toHaveLength(2);
  });

  it('the quick start install line has the pnpm, npm and yarn switcher from Getting started, and switches the command', async () => {
    await open();
    const card = screen.getByRole('group', { name: 'quick start' });
    const install = within(card).getByRole('region', { name: 'Install command' });
    const managers = within(card).getByRole('group', { name: 'Package manager' });
    expect(within(managers).getAllByRole('radio').map((radio) => radio.getAttribute('value'))).toEqual(['pnpm', 'npm', 'yarn']);
    expect(within(managers).getByRole('radio', { name: 'pnpm' })).toBeChecked();
    await userEvent.click(within(managers).getByRole('radio', { name: 'npm' }));
    expect(install).toHaveTextContent(INSTALL_COMMANDS.npm);
    await userEvent.click(within(managers).getByRole('radio', { name: 'yarn' }));
    expect(install).toHaveTextContent(INSTALL_COMMANDS.yarn);
  });

  it('at a glance: four facts, each counted from the source, under the buttons beside the quick start card', async () => {
    await open();
    const facts = screen.getByRole('list', { name: 'At a glance' });
    // In the hero's first column, so the intro is as tall as the quick start card beside it.
    expect(facts.closest('.gallery-hero > *')).toBe(screen.getByRole('heading', { level: 1 }).closest('.gallery-hero > *'));
    // Each count is in the pixel face, like the mockup: gallery.css sets it on this class.
    expect(facts.querySelectorAll('.gallery-fact__count')).toHaveLength(4);
    expect(within(facts).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      `${TILED.length}components`,
      `${CURRENT_TOKENS.length}tokens`,
      `${ICON_GROUPS.reduce((n, group) => n + group.icons.length, 0)}icons`,
      `${COLOR_MODES.length}color modes`,
    ]);
  });

  it('Browse components goes to Button, the first item of the first component group', () => {
    expect(BROWSE_TARGET).toBe('/components/button');
    const first = NAV.find((item) => item.group === COMPONENT_GROUPS[0].label)!;
    expect(first).toMatchObject({ label: 'Button', to: BROWSE_TARGET });
  });

  it('Components is one h2 with the total count and a one-line lead, then an h3 per sidebar group, in sidebar order', async () => {
    await open();
    const heading = within(main()).getByRole('heading', { level: 2, name: 'Components' });
    expect(heading.parentElement).toHaveTextContent(`Components${TILED.length}`);
    const section = screen.getByRole('region', { name: 'Components' });
    expect(within(section).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(COMPONENT_GROUPS.map((g) => g.label));
    expect(within(main()).queryByRole('heading', { name: 'Forms' })).toBeNull();
  });

  it('each group\'s tiles are the links under that group in the sidebar, in the same order', async () => {
    await open();
    for (const group of COMPONENT_GROUPS) {
      const grid = within(main()).getByRole('list', { name: group.label });
      // The tile's own link: the inert previews hold links of their own (Link, Navbar).
      const names = [...grid.querySelectorAll('.gallery-tile__link')].map((link) => link.textContent!.replace(' →', ''));
      expect(names, group.label).toEqual(NAV.filter((item) => item.group === group.label).map((item) => item.label));
    }
  });

  it('Press start: an Arcade section with a Card per game, after the hero and before the components', async () => {
    const { container } = await open();
    const arcade = screen.getByRole('region', { name: 'Press start' });
    expect(within(arcade).getByRole('heading', { level: 2, name: 'Press start' })).toBeInTheDocument();
    for (const game of GAMES) {
      const card = within(arcade).getByRole('group', { name: game.label });
      expect(card).toHaveClass('bit-card');
      expect(within(card).getByRole('heading', { level: 3, name: game.label })).toBeInTheDocument();
      expect(within(card).getByText(game.blurb)).toBeInTheDocument();
      expect(within(card).getByRole('button', { name: `Play ${game.label}` })).toHaveClass('bit-button');
    }
    const sections = [...container.querySelectorAll('main section[aria-labelledby]')].map((s) => s.getAttribute('aria-labelledby'));
    expect(sections.indexOf('home-arcade')).toBeLessThan(sections.indexOf('home-components'));
    await expectNoA11yViolations(arcade);
  });

  it('a game card shows the best score the game keeps, and no badge before there is one', async () => {
    localStorage.setItem(bestKey('snake'), '12');
    await open();
    const arcade = screen.getByRole('region', { name: 'Press start' });
    expect(within(within(arcade).getByRole('group', { name: 'Snake' })).getByText('Best 12')).toHaveClass('bit-badge');
    expect(within(within(arcade).getByRole('group', { name: 'Cheese Run' })).queryByText(/^Best/)).toBeNull();
  });

  const SIDEBAR_GAMES = GAMES.filter((game) => game.place === 'sidebar');
  it.each(SIDEBAR_GAMES.map((game) => [game.label, game.id] as const))('Play %s opens that game in the sidebar, where it runs', async (label) => {
    await open();
    await userEvent.click(screen.getByRole('button', { name: `Play ${label}` }));
    expect(await screen.findByRole('region', { name: `Arcade: ${label}` })).toHaveAttribute('id', 'gallery-nav');
  });

  it('Play Bit Blaster opens it over the main area, with the page out of reach under it', async () => {
    await open();
    await userEvent.click(screen.getByRole('button', { name: 'Play Bit Blaster' }));
    expect(await screen.findByRole('region', { name: 'Arcade: Bit Blaster' })).toHaveAttribute('id', 'gallery-stage');
    expect(main()).toHaveAttribute('inert');
    expect(screen.getByRole('navigation', { name: 'Gallery' })).toBeInTheDocument();
  });

  it('one tile per manifest except the logo, each one Link to its page', async () => {
    await open();
    for (const m of TILED) {
      const links = within(main()).getAllByRole('link', { name: m.name });
      expect(links.map((l) => l.getAttribute('href')), m.name).toEqual([routeFor(m)]);
    }
    expect(within(main()).queryByRole('link', { name: 'BitLogo' })).toBeNull();
  });

  it('every tile is the same: a Card with a live, inert preview over its link; no pill rows are left', async () => {
    const { container } = await open();
    const tiles = [...container.querySelectorAll('.gallery-tile')];
    expect(tiles).toHaveLength(TILED.length);
    for (const tile of tiles) {
      expect(tile).toHaveClass('bit-card');
      const preview = tile.querySelector('.gallery-tile__preview')!;
      expect(preview).toHaveAttribute('inert');
      expect(preview.querySelector('[class*="bit-"]')).not.toBeNull();
    }
    expect(container.querySelector('.gallery-chips, .gallery-chip')).toBeNull();
    const grids = [...container.querySelectorAll('.gallery-tiles')].map((grid) => grid.children.length);
    expect(grids).toEqual(COMPONENT_GROUPS.map((g) => g.slugs.length));
  });

  it('demos too big for a tile get a compact sample of the real component: CodeBlock, Table, Tabs and Stack', async () => {
    await open();
    const preview = (name: string) =>
      within(main()).getByRole('link', { name }).closest('.gallery-tile')!.querySelector('.gallery-tile__preview')!;
    const code = preview('CodeBlock');
    expect(code.querySelector('[data-language="jsx"]')).toHaveTextContent('<Button size="lg" />');
    expect(code.querySelector('button')).toBeNull();
    expect(preview('Table').querySelectorAll('tr')).toHaveLength(3);
    expect(preview('Tabs').querySelectorAll('[role="tab"]')).toHaveLength(2);
    // Stack: its badges alone, without the Stack page's sized Box (a 240px Box would be clipped by the tile).
    expect(preview('Stack').querySelector('.bit-box')).toBeNull();
    expect(preview('Stack').querySelectorAll('.bit-stack > .bit-badge')).toHaveLength(3);
  });

  it('Start building: three cards, headed like the Tokens page, each linking on', async () => {
    await open();
    const section = screen.getByRole('region', { name: 'Start building' });
    const cards = within(section).getAllByRole('group');
    expect(cards.map((card) => card.querySelector('.bit-card__header')!.textContent)).toEqual(['get started', 'tokens', 'icons']);
    const icon = MANIFESTS.find((m) => m.slug === 'icon')!;
    expect(cards.map((card) => within(card).getByRole('link').getAttribute('href'))).toEqual(['/getting-started', '/tokens', routeFor(icon)]);
  });

  it('the naming rule has five columns, and its Result column renders real Buttons', async () => {
    await open();
    expect(within(main()).getByRole('heading', { level: 2, name: 'The naming rule' })).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'The naming rule' });
    expect(within(table).getAllByRole('columnheader').map((th) => th.textContent)).toEqual([
      'You write (prop)',
      'Or write (className)',
      'Class it emits',
      'Token',
      'Result',
    ]);
    expect(NAMING_COLUMNS).toHaveLength(5);
    const buttons = within(table).getAllByRole('button', { name: 'Save' });
    expect(buttons.map((b) => b.className)).toEqual([
      'bit-button bit-primary bit-solid bit-md',
      'bit-button bit-primary bit-outline bit-md',
      'bit-button bit-primary bit-solid bit-lg',
    ]);
    expect(within(table).getByText('className="bit-outline"')).toHaveClass('bit-code');
    expect(within(table).getByText('--bit-control-height-lg')).toHaveClass('bit-code');
  });

  it('the naming-rule codes never wrap mid-word: the table scrolls sideways instead', async () => {
    await open();
    expect(screen.getByRole('table', { name: 'The naming rule' }).parentElement).toHaveClass('bit-table', 'gallery-naming');
    // home/homeCss.test.ts pins the nowrap rule this class turns on.
  });
});
