import { screen, within } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderAt } from '../test/renderRoute';
import { expectNoA11yViolations } from '../test/a11y';
import { GLOBAL_CSS_IMPORTS, STYLE_IMPORTS } from '../content/snippets.mjs';

async function open() {
  const utils = renderAt('/getting-started');
  await screen.findByRole('heading', { level: 1, name: 'Getting started' });
  return utils;
}

const main = () => screen.getByRole('main');
/** A paragraph by its whole text, for lines broken up by inline Code. */
const paragraph = (text: string) => within(main()).getByText((_, el) => el?.tagName === 'P' && el.textContent === text);
/** A step's sub-heading (an h3), by its visible text (inline Code changes the computed accessible name's spacing). */
const subheading = (text: string) => {
  const match = within(main()).getAllByRole('heading', { level: 3 }).find((h) => h.textContent === text);
  if (!match) throw new Error(`No h3 reads "${text}"`);
  return match;
};
/** The step a heading belongs to, by the Step's data-step hook. */
const stepOf = (heading: HTMLElement) => heading.closest<HTMLElement>('[data-step]')!;

describe('GettingStartedPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('has an h1, with no axe violations', async () => {
    const { container } = await open();
    await expectNoA11yViolations(container);
  });

  it('five numbered steps', async () => {
    await open();
    const steps = within(main()).getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(steps).toEqual(['Install', 'Add the styles once', 'Use a component', 'Light and dark', 'Next steps']);
  });

  it('every step frames its content in a Card, with the number and heading above it', async () => {
    await open();
    const headings = within(main()).getAllByRole('heading', { level: 2 });
    for (const heading of headings) {
      expect(heading.closest('.bit-card'), heading.textContent!).toBeNull();
      const card = stepOf(heading).querySelector(':scope > .bit-card');
      expect(card, heading.textContent!).not.toBeNull();
      expect(card!.querySelector(':scope > .bit-card__body'), heading.textContent!).not.toBeNull();
      expect(card!.contains(heading), heading.textContent!).toBe(false);
    }
  });

  it('every step reads easily: no text under 15px, and its parts sit 24px apart so each caption pairs with the code under it', async () => {
    await open();
    for (const heading of within(main()).getAllByRole('heading', { level: 2 })) {
      const body = stepOf(heading).querySelector('.bit-card__body > .bit-stack')!;
      expect(body, heading.textContent!).toHaveAttribute('data-gap', '24');
      for (const text of body.querySelectorAll('.bit-text')) {
        expect(Number(text.getAttribute('data-size')), `${heading.textContent}: ${text.textContent}`).toBeGreaterThanOrEqual(15);
      }
    }
  });

  it("the steps' sub-labels are h3 headings, so screen readers can jump between them", async () => {
    await open();
    const names = within(main()).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(names).toEqual([
      'In your entry file',
      'Or in your global stylesheet',
      '1. In a component file, such as src/Toolbar.tsx:',
      'It renders:',
      '2. Then use your component like any other, for example in src/App.tsx:',
      'In index.html',
      'In any file',
    ]);
  });

  it('every sub-label is a gallery caption, so inline Code in it gets the slim chip', async () => {
    await open();
    for (const h3 of within(main()).getAllByRole('heading', { level: 3 })) {
      expect(h3, h3.textContent!).toHaveClass('bit-text', 'gallery-caption');
      expect(h3, h3.textContent!).toHaveAttribute('data-weight', 'bold');
    }
  });

  it('code for a .tsx file is tsx; the colorMode lines, valid in any file, stay jsx', async () => {
    await open();
    const languageOf = (region: string) =>
      screen.getByRole('region', { name: region }).closest('.bit-code__block')!.getAttribute('data-language');
    for (const region of ['Style imports', 'First component', 'Use it in your app']) expect(languageOf(region)).toBe('tsx');
    expect(languageOf('Any file')).toBe('jsx');
  });

  it('Install keeps the version Badge and the package manager switcher', async () => {
    await open();
    expect(screen.getByText(`v${__BIT_VERSION__}`)).toHaveClass('bit-badge');
    expect(screen.getByRole('region', { name: 'Install command' }).textContent).toBe('pnpm add @bit-ds/react');
    expect(screen.getByRole('radio', { name: 'npm' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'yarn' })).toBeInTheDocument();
  });

  describe('Add the styles once', () => {
    it('says the two stylesheets go in once and apply to the whole app', async () => {
      await open();
      expect(within(main()).getByText(/^Two stylesheets, added once for the whole app\./)).toHaveTextContent(
        'Two stylesheets, added once for the whole app. CSS imported in React is global, so every component in every folder gets these styles.',
      );
    });

    it('explains each file: the theme first, then the component styles', async () => {
      await open();
      const items = within(main()).getAllByRole('listitem').map((li) => li.textContent);
      expect(items).toContain('themes/power-up.css: the theme. Colours, fonts and sizes as --bit-* tokens, in light and dark. It comes first.');
      expect(items).toContain('styles.css: the component styles. They read the theme\'s tokens.');
    });

    it('offers two places: the entry file (JS imports) or the global stylesheet (CSS @imports)', async () => {
      await open();
      expect(within(main()).getByText(/^In your entry file$/)).toBeInTheDocument();
      expect(paragraph('src/main.tsx in Vite, app/layout.tsx in Next.js.')).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Style imports' }).textContent).toBe(STYLE_IMPORTS);
      expect(within(main()).getByText(/^Or in your global stylesheet$/)).toBeInTheDocument();
      expect(paragraph('At the very top of src/index.css (Vite) or app/globals.css (Next.js), before any other rule.')).toBeInTheDocument();
      const css = screen.getByRole('region', { name: 'Global stylesheet imports' });
      expect(css.textContent).toBe(GLOBAL_CSS_IMPORTS);
      expect(css.closest('.bit-code__block')).toHaveAttribute('data-language', 'css');
    });

    it('says not to repeat them per component', async () => {
      await open();
      expect(within(main()).getByText(/^Pick one\./)).toHaveTextContent(
        "Pick one. You don't import them again in each component: the component examples on this site leave them out for that reason.",
      );
    });
  });

  describe('Use a component', () => {
    it('says where the import goes and where the component goes', async () => {
      await open();
      expect(
        paragraph('Import what you need from @bit-ds/react at the top of a component file, then put it in the JSX that component returns.'),
      ).toBeInTheDocument();
    });

    it('shows a whole component file you can paste, not a bare element', async () => {
      await open();
      expect(subheading('1. In a component file, such as src/Toolbar.tsx:')).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'First component' }).textContent).toBe(
        [
          "import { Button, Stack } from '@bit-ds/react';",
          '',
          'export function Toolbar() {',
          '  return (',
          '    <Stack direction="row" gap={8} wrap>',
          '      <Button>Save</Button>',
          '      <Button color="danger">Delete</Button>',
          '      <Button className="bit-danger">Delete</Button>',
          '    </Stack>',
          '  );',
          '}',
        ].join('\n'),
      );
    });

    it('renders the same three Buttons live, so you see what the file makes', async () => {
      await open();
      const result = screen.getByRole('region', { name: 'What it renders' });
      const buttons = within(result).getAllByRole('button');
      expect(buttons.map((b) => b.textContent)).toEqual(['Save', 'Delete', 'Delete']);
      expect(buttons[0]).toHaveClass('bit-primary');
      expect(buttons[1]).toHaveClass('bit-danger');
      expect(buttons[2]).toHaveClass('bit-danger');
    });

    it('puts the code and what it renders side by side, code first', async () => {
      await open();
      const code = screen.getByRole('region', { name: 'First component' }).closest('.gallery-split__code')!;
      const result = screen.getByRole('region', { name: 'What it renders' });
      expect(code.parentElement).toHaveClass('gallery-split');
      expect(result).toHaveClass('gallery-split__result');
      expect(result.closest('.gallery-split')).toBe(code.parentElement);
      expect([...code.parentElement!.children].indexOf(code)).toBe(0);
    });

    it('reads easily: its part labels are body size, and the two parts sit 24px apart', async () => {
      await open();
      const one = subheading('1. In a component file, such as src/Toolbar.tsx:');
      const two = subheading('2. Then use your component like any other, for example in src/App.tsx:');
      for (const label of [one, two, subheading('It renders:')]) expect(label).toHaveAttribute('data-size', '15');
      const parts = one.closest('[data-step-part="1"]')!.parentElement!;
      expect(parts).toHaveAttribute('data-gap', '24');
      expect(two.closest('[data-step-part="2"]')!.parentElement).toBe(parts);
    });

    it('the live result wraps like the code says, so no Button is cut off on a narrow screen', async () => {
      await open();
      const row = within(screen.getByRole('region', { name: 'What it renders' })).getAllByRole('button')[0]!.parentElement!;
      expect(row).toHaveAttribute('data-direction', 'row');
      expect(row).toHaveAttribute('data-wrap');
    });

    it('explains each part of the file', async () => {
      await open();
      const items = within(main()).getAllByRole('listitem').map((li) => li.textContent);
      expect(items).toEqual(
        expect.arrayContaining([
          'import { Button, Stack }: name every component you use, in one import from @bit-ds/react.',
          'export function Toolbar(): your own component. It returns the JSX to show.',
          '<Button>Save</Button>: a Button with its defaults. The text between the tags is its label.',
          'color="danger": a prop that changes the colour.',
          'className="bit-danger": the same change written as a class. The last two Buttons look the same.',
          '<Stack direction="row" gap={8} wrap>: lays the Buttons out in a row, 8px apart, and wraps them on a narrow screen.',
        ]),
      );
    });

    it('then shows how to use your component in the app', async () => {
      await open();
      expect(subheading('2. Then use your component like any other, for example in src/App.tsx:')).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Use it in your app' }).textContent).toBe(
        "import { Toolbar } from './Toolbar';\n\nexport default function App() {\n  return <Toolbar />;\n}",
      );
    });
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
        const text = subheading(caption);
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
  ])('%s: an h1', async (path, title) => {
    renderAt(path);
    await screen.findByRole('heading', { level: 1, name: title });
  });
});
