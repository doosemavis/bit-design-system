import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { COLOR_MODES, ICON_GROUPS, SEMANTIC_TOKENS } from '@bit-ds/react';
import { renderAt } from '../test/renderRoute';
import { expectNoA11yViolations } from '../test/a11y';
import { MANIFESTS, routeFor } from '../manifests';
import { NAV } from '../shell/Sidebar';
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

  it('beside the hero, a quick start card: the install line and a first component, from the shared snippets', async () => {
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
      `${SEMANTIC_TOKENS.length}tokens`,
      `${ICON_GROUPS.reduce((n, group) => n + group.icons.length, 0)}icons`,
      `${COLOR_MODES.length}color modes`,
    ]);
  });

  it('Browse components goes to the first component in the sidebar', () => {
    expect(BROWSE_TARGET).toBe(NAV.find((item) => item.group === 'Components')!.to);
  });

  it('Components and Forms are h2s with counts from the manifests, and a one-line lead', async () => {
    await open();
    for (const [title, group] of [
      ['Components', 'components'],
      ['Forms', 'forms'],
    ] as const) {
      const heading = within(main()).getByRole('heading', { level: 2, name: title });
      expect(heading.parentElement).toHaveTextContent(`${title}${MANIFESTS.filter((m) => m.group === group).length}`);
    }
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
    expect(grids).toEqual([MANIFESTS.filter((m) => m.group === 'components').length, MANIFESTS.filter((m) => m.group === 'forms').length]);
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
    const table = screen.getByRole('region', { name: 'The naming rule' });
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
    expect(screen.getByRole('region', { name: 'The naming rule' })).toHaveClass('bit-table', 'gallery-naming');
    // home/homeCss.test.ts pins the nowrap rule this class turns on.
  });
});
