import { screen, within } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { COLOR_MODE_SCRIPT } from '@bit-ds/react';
import { renderAt } from '../test/renderRoute';
import { expectNoA11yViolations } from '../test/a11y';
import { STYLE_IMPORTS } from '../content/styleImports';

async function open() {
  const utils = renderAt('/getting-started');
  await screen.findByRole('heading', { level: 1, name: 'Getting started' });
  return utils;
}

const main = () => screen.getByRole('main');

describe('GettingStartedPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('has the Start here eyebrow and an h1, with no axe violations', async () => {
    const { container } = await open();
    expect(within(main()).getByText('Start here')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('five numbered steps', async () => {
    await open();
    const steps = within(main()).getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(steps).toEqual(['Install', 'Add the styles once', 'Use a component', 'Light and dark', 'Next steps']);
  });

  it('Install keeps the version Badge and the package manager switcher', async () => {
    await open();
    expect(screen.getByText(`v${__BIT_VERSION__}`)).toHaveClass('bit-badge');
    expect(screen.getByRole('region', { name: 'Install command' }).textContent).toBe('pnpm add @bit-ds/react');
    expect(screen.getByRole('radio', { name: 'npm' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'yarn' })).toBeInTheDocument();
  });

  it('shows the style imports and the first component', async () => {
    await open();
    expect(screen.getByRole('region', { name: 'Style imports' }).textContent).toBe(STYLE_IMPORTS);
    expect(screen.getByRole('region', { name: 'First component' }).textContent).toBe(
      "import { Button } from '@bit-ds/react';\n\n<Button>Save</Button>",
    );
    const help = within(main()).getByText(/^Import it and use it\./);
    expect(within(help).getByText('className="bit-danger"')).toHaveClass('bit-code');
  });

  it('Light and dark: a live ModeToggle and the no-flash script in a script tag', async () => {
    await open();
    expect(within(main()).getByRole('group', { name: 'Color mode' })).toBeInTheDocument();
    const code = screen.getByRole('region', { name: 'No-flash script' });
    expect(code.textContent).toBe(`<script>${COLOR_MODE_SCRIPT}</script>`);
  });

  it('Next steps links to Tokens, the naming rule on Home and Button', async () => {
    await open();
    const next = within(main()).getByRole('heading', { level: 2, name: 'Next steps' }).closest('div')!.parentElement!;
    const hrefs = within(next).getAllByRole('link').map((l) => [l.textContent, l.getAttribute('href')]);
    expect(hrefs).toEqual([
      ['Tokens', '/tokens'],
      ['The naming rule', '/'],
      ['Button', '/components/button'],
    ]);
  });
});

describe('Versions and Release notes stubs', () => {
  it.each([
    ['/versions', 'Versions'],
    ['/release-notes', 'Release notes'],
  ])('%s: eyebrow Start here and an h1', async (path, title) => {
    renderAt(path);
    await screen.findByRole('heading', { level: 1, name: title });
    expect(within(main()).getByText('Start here')).toBeInTheDocument();
  });
});
