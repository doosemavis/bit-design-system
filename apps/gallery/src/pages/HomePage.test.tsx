import { screen, within } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderAt } from '../test/renderRoute';
import { expectNoA11yViolations } from '../test/a11y';
import { MANIFESTS, routeFor } from '../manifests';
import { NAV } from '../shell/Sidebar';
import { NAMING_COLUMNS } from './home/NamingRule';
import { glyphFor, isLargeTile } from './home/ComponentTiles';
import { BROWSE_TARGET } from './HomePage';
import { bitLogo } from '../manifests/bitLogo';

async function open() {
  const utils = renderAt('/');
  await screen.findByRole('heading', { level: 1, name: 'bit Design System' });
  return utils;
}

const main = () => screen.getByRole('main');

describe('HomePage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('the hero: BitLogo as the h1, the tagline, and two Buttons, with no axe violations', async () => {
    const { container } = await open();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(within(h1).getByRole('img', { name: 'bit Design System' })).toHaveClass('bit-lg');
    expect(
      screen.getByText(
        'A retro-styled React Design System for people who want a bit of nostalgia.',
      ),
    ).toBeInTheDocument();
    const browse = screen.getByRole('link', { name: 'Browse components' });
    expect(browse).toHaveClass('bit-button', 'bit-primary', 'bit-solid');
    expect(browse).toHaveAttribute('href', BROWSE_TARGET);
    expect(screen.getByRole('link', { name: 'See the tokens' })).toHaveClass('bit-outline');
    expect(screen.getByRole('link', { name: 'See the tokens' })).toHaveAttribute('href', '/tokens');
    await expectNoA11yViolations(container);
  });

  it('Browse components goes to the first component in the sidebar', () => {
    expect(BROWSE_TARGET).toBe(NAV.find((item) => item.group === 'Components')!.to);
  });

  it('Components and Forms are h2s with counts from the manifests', async () => {
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
    const tiles = MANIFESTS.filter((m) => m.group !== 'brand');
    for (const m of tiles) {
      const links = within(main()).getAllByRole('link', { name: m.name });
      expect(links.map((l) => l.getAttribute('href')), m.name).toEqual([routeFor(m)]);
    }
    expect(within(main()).queryByRole('link', { name: 'BitLogo' })).toBeNull();
  });

  it('large tiles show a live, inert preview: Alert, Button, Card, SegmentedControl and the four Forms', async () => {
    const { container } = await open();
    const large = [...container.querySelectorAll('.gallery-tile')].map((tile) => tile.querySelector('a')!.textContent!.replace(' →', ''));
    expect(large).toEqual(['Button', 'Alert', 'Card', 'SegmentedControl', 'Field', 'Input', 'Select', 'Switch']);
    for (const preview of container.querySelectorAll('.gallery-tile__preview')) {
      expect(preview).toHaveAttribute('inert');
      expect(preview.querySelector('[class*="bit-"]')).not.toBeNull();
    }
  });

  it('Get started is a short teaser: a line and a link to /getting-started, with the full steps gone', async () => {
    await open();
    expect(within(main()).getByRole('heading', { level: 2, name: 'Get started' })).toBeInTheDocument();
    const link = within(main()).getByRole('link', { name: /Get started/ });
    expect(link).toHaveAttribute('href', '/getting-started');
    expect(link).toHaveClass('bit-link');
    expect(link).toHaveTextContent('Get started →');
    expect(within(main()).queryAllByRole('heading', { level: 3 })).toEqual([]);
    expect(screen.queryByRole('region', { name: 'Install command' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Style imports' })).toBeNull();
  });

  it('the naming rule has five columns, and its Result column renders real Buttons', async () => {
    await open();
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

  it('large tiles are Cards; compact tiles are outline Buttons with a Badge glyph', async () => {
    await open();
    expect(document.querySelectorAll('.bit-card.gallery-tile').length).toBeGreaterThan(0);
    const compact = MANIFESTS.find((m) => m.group !== 'brand' && !isLargeTile(m))!;
    const chip = within(main()).getByRole('link', { name: new RegExp(compact.name) });
    expect(chip).toHaveClass('bit-button');
    expect(chip.querySelector('.bit-badge')).not.toBeNull();
  });

  it('a compact tile shows its glyph in a Badge, hidden from screen readers, before the name', async () => {
    await open();
    const chip = within(main()).getByRole('link', { name: 'Badge' });
    const wrapper = chip.firstElementChild!;
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    expect(wrapper.querySelector('.bit-badge')).toHaveTextContent('+1');
  });

  it('a manifest with no glyph entry shows its first letter', () => {
    expect(glyphFor({ ...bitLogo, slug: 'widget', name: 'Widget' })).toBe('W');
    expect(glyphFor(MANIFESTS.find((m) => m.slug === 'codeblock')!)).toBe('{}');
  });

  it('the naming-rule codes never wrap mid-word: the table scrolls sideways instead', async () => {
    await open();
    expect(screen.getByRole('region', { name: 'The naming rule' })).toHaveClass('bit-table', 'gallery-naming');
    // home/homeCss.test.ts pins the nowrap rule this class turns on.
  });
});
