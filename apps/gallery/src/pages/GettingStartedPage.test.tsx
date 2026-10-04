import { screen, within } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
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

  describe('Light and dark', () => {
    const OPTIONAL = 'Optional: use a saved choice before the page draws';

    it('has the help text and a live ModeToggle in a start-aligned Stack', async () => {
      await open();
      expect(
        within(main()).getByText(/^Pick the default in your .*, then switch it from anywhere with .*\. Try the toggle\.$/),
      ).toBeInTheDocument();
      const toggle = within(main()).getByRole('group', { name: 'Color mode' });
      expect(toggle.parentElement).toHaveClass('bit-stack');
      expect(toggle.parentElement).toHaveAttribute('data-align', 'start');
    });

    it('shows the index.html line and the colorMode snippet', async () => {
      await open();
      expect(screen.getByRole('region', { name: 'index.html' }).textContent).toBe(
        '<html lang="en" data-mode="system">  <!-- or "light" / "dark" -->',
      );
      expect(screen.getByRole('region', { name: 'Any file' }).textContent).toBe(
        [
          "import { colorMode } from '@bit-ds/react';",
          '',
          "colorMode.set('dark');   // switch and remember",
          'colorMode.toggle();      // light \u21C4 dark',
          "colorMode.set('system'); // follow the visitor's OS again",
        ].join('\n'),
      );
    });

    it('captions each step 4 block with the file it goes in, right above it', async () => {
      await open();
      for (const [caption, region, code] of [
        ['In index.html', 'index.html', 'index.html'],
        ['In any file', 'Any file', null],
      ] as const) {
        const text = within(main()).getByText((_, el) => el?.tagName === 'P' && el.textContent === caption);
        expect(text).toHaveClass('bit-text');
        if (code) expect(within(text).getByText(code)).toHaveClass('bit-code');
        expect(text.nextElementSibling!.contains(screen.getByRole('region', { name: region }))).toBe(true);
      }
    });

    it('the optional disclosure starts closed, then opens to the snippet and the COLOR_MODE_SCRIPT note', async () => {
      await open();
      const button = within(main()).getByRole('button', { name: OPTIONAL });
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(within(main()).queryByText(/COLOR_MODE_SCRIPT/)).not.toBeVisible();
      await userEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('region', { name: 'Saved-choice script' }).textContent).toBe(
        [
          '<script>',
          "  // Use the visitor's saved choice (from the toggle) before your app loads.",
          '  try {',
          "    const saved = localStorage.getItem('bit-color-mode');",
          "    if (saved === 'light' || saved === 'dark') document.documentElement.dataset.mode = saved;",
          '  } catch {} // storage blocked: the data-mode in your HTML stands',
          '</script>',
        ].join('\n'),
      );
      expect(within(main()).getByText(/COLOR_MODE_SCRIPT/)).toBeVisible();
      await userEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('the button controls the region it shows', async () => {
      await open();
      const button = within(main()).getByRole('button', { name: OPTIONAL });
      const region = document.getElementById(button.getAttribute('aria-controls')!);
      expect(region).not.toBeNull();
      expect(region).toHaveAttribute('hidden');
    });
  });

  it('Next steps links to Tokens, the naming rule on Home and Button', async () => {
    await open();
    for (const [label, href] of [
      ['Tokens', '/tokens'],
      ['The naming rule', '/'],
      ['Button', '/components/button'],
    ] as const) {
      const link = within(main()).getByRole('link', { name: new RegExp(`^${label}`) });
      expect(link.getAttribute('href'), label).toBe(href);
    }
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
