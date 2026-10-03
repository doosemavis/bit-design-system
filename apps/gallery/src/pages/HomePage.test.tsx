import { screen, within } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderAt } from '../test/renderRoute';
import { expectNoA11yViolations } from '../test/a11y';
import { MANIFESTS, routeFor } from '../manifests';
import { NAV } from '../shell/Sidebar';
import { STYLE_IMPORTS } from '../content/styleImports';
import { NAMING_COLUMNS } from './home/NamingRule';
import { BROWSE_TARGET } from './HomePage';

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
        'A retro-game React design system for people new to design systems. The prop you type is the class it emits is the token it reads.',
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

  it('Get started: three numbered steps, the version Badge, the install switcher and the style imports', async () => {
    await open();
    const steps = within(main()).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(steps).toEqual(['Install', 'Add the styles once', 'Use a component']);
    // version.test.ts pins __BIT_VERSION__ to @bit-ds/react's package.json.
    expect(screen.getByText(`v${__BIT_VERSION__}`)).toHaveClass('bit-badge');
    expect(screen.getByRole('region', { name: 'Install command' }).textContent).toBe('pnpm add @bit-ds/react');
    expect(screen.getByRole('region', { name: 'Style imports' }).textContent).toBe(STYLE_IMPORTS);
    expect(screen.getByRole('region', { name: 'First component' }).textContent).toBe(
      "import { Button } from '@bit-ds/react';\n\n<Button>Save</Button>",
    );
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
});
