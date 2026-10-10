import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createElement } from 'react';
import type { ComponentType, ReactElement } from 'react';
import * as lib from './index';
import { Dialog } from './components/Dialog/Dialog';

const srcDir = dirname(fileURLToPath(import.meta.url));

/** Every file path under a directory, recursively. */
function collectFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? collectFiles(full) : [full];
  });
}

const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

function isComponent(value: unknown): value is ComponentType<Record<string, unknown>> {
  return typeof value === 'function' || (typeof value === 'object' && value !== null && '$$typeof' in value);
}

/** Capitalised exports that are classes, not components. */
const NOT_COMPONENTS = ['ColorModeService'];

const componentNames = Object.keys(lib).filter(
  (name) => /^[A-Z]/.test(name) && !NOT_COMPONENTS.includes(name) && isComponent((lib as Record<string, unknown>)[name]),
);

/**
 * What each component renders with in the naming-rule test: `aria-label="x"` and the child "x", plus
 * these props where a component needs more to render at all. A void element (Input) takes no children.
 */
const SAMPLE_PROPS: Record<string, Record<string, unknown>> = {
  Input: { children: undefined },
  Icon: { icon: lib.iconFavorite, children: undefined },
  IconButton: { icon: lib.iconDelete, label: 'x', children: undefined },
  Tooltip: { content: 'x', children: <button type="button">x</button> },
  Heading: { size: 32 },
  CodeBlock: { code: 'x', language: 'shell', children: undefined },
  SegmentedControl: { legend: 'x', options: [{ value: 'x', label: 'x' }], children: undefined },
  Select: { options: [{ value: 'x', label: 'x' }], children: undefined },
  Table: { children: <tbody><tr><td>x</td></tr></tbody> },
  TableHead: { children: <tr><th>x</th></tr> },
  TableBody: { children: <tr><td>x</td></tr> },
  TableRow: { children: <td>x</td> },
  Tab: { value: 'x' },
  TabPanel: { value: 'x' },
};

/** Table parts only render inside their table parents. The root is then the part's own element. */
const PARENTS: Record<string, { wrap: (part: ReactElement) => ReactElement; root: string }> = {
  // Tooltip's root is the bubble after its trigger.
  Tooltip: { wrap: (part) => part, root: '.bit-tooltip' },
  TableHead: { wrap: (part) => <table>{part}</table>, root: 'thead' },
  TableBody: { wrap: (part) => <table>{part}</table>, root: 'tbody' },
  TableRow: { wrap: (part) => <table><tbody>{part}</tbody></table>, root: 'tr' },
  TableCell: { wrap: (part) => <table><tbody><tr>{part}</tr></tbody></table>, root: 'td' },
  DialogHeader: { wrap: (part) => <Dialog open={false} onOpenChange={() => {}}>{part}</Dialog>, root: '.bit-dialog__header' },
  DialogBody: { wrap: (part) => <Dialog open={false} onOpenChange={() => {}}>{part}</Dialog>, root: '.bit-dialog__body' },
  DialogFooter: { wrap: (part) => <Dialog open={false} onOpenChange={() => {}}>{part}</Dialog>, root: '.bit-dialog__footer' },
  TabList: { wrap: (part) => <lib.Tabs>{part}</lib.Tabs>, root: '[role="tablist"]' },
  Tab: { wrap: (part) => <lib.Tabs><lib.TabList aria-label="x">{part}</lib.TabList></lib.Tabs>, root: '[role="tab"]' },
  TabPanel: { wrap: (part) => <lib.Tabs>{part}</lib.Tabs>, root: '[role="tabpanel"]' },
};

/**
 * Names the prefix rule gets wrong because one component's name starts another's ("Tab" starts "Table" and
 * "Tabs"). The Tabs family is one component, so its parts are elements of bit-tabs.
 */
const ROOT_CLASS_OVERRIDES: Record<string, string> = {
  Table: 'bit-table',
  IconButton: 'bit-iconButton',
  Tabs: 'bit-tabs',
  TabList: 'bit-tabs__list',
  Tab: 'bit-tabs__tab',
  TabPanel: 'bit-tabs__panel',
};

/** Components that are a plain Button under another name: their root class is `bit-button`, not `bit-{name}`. */
const BUTTON_ALIASES = ['DialogClose'];

/** The naming rule from the spec, as code. */
function expectedRootClass(name: string): string {
  if (ROOT_CLASS_OVERRIDES[name]) return ROOT_CLASS_OVERRIDES[name];
  const parent = componentNames
    .filter((candidate) => candidate !== name && name.startsWith(candidate))
    .sort((a, b) => b.length - a.length)[0];
  if (parent) return `bit-${kebab(parent)}__${kebab(name.slice(parent.length))}`;
  return `bit-${kebab(name.replace(/^Bit/, ''))}`;
}

describe('public index', () => {
  it('exports exactly the public components', () => {
    expect(componentNames.sort()).toEqual(
      [
        'Alert', 'Badge', 'BitLogo', 'Button', 'Card', 'CardBody', 'CardFooter', 'CardHeader', 'ModeToggle', 'Spinner', 'Stack', 'Text',
        'Field', 'Input', 'Select', 'Switch', 'Link', 'Code', 'CodeBlock', 'SegmentedControl',
        'Table', 'TableHead', 'TableBody', 'TableRow', 'TableCell',
        'Tabs', 'TabList', 'Tab', 'TabPanel',
        'Heading', 'Box', 'Icon', 'IconButton', 'Tooltip',
        'Dialog', 'DialogHeader', 'DialogBody', 'DialogFooter', 'DialogClose',
      ].sort(),
    );
  });

  it('exports the 300 icons and their groups, each with a regular and a fill path', () => {
    const icons = Object.keys(lib).filter((name) => /^icon[A-Z]/.test(name));
    expect(icons).toHaveLength(300);
    expect(lib.ICON_GROUPS).toHaveLength(8);
    const all = lib.ICON_GROUPS.flatMap((g) => g.icons);
    expect(all).toHaveLength(300);
    for (const icon of all) {
      expect(typeof icon.path).toBe('string');
      expect(typeof icon.fillPath).toBe('string');
    }
    expect(lib.iconFavorite).toEqual({ name: 'favorite', path: expect.stringMatching(/^[Mm]/), fillPath: expect.stringMatching(/^[Mm]/) });
  });

  it('exports the prefix and axes', () => {
    expect(lib.PREFIX).toBe('bit');
    expect(lib.COLORS).toHaveLength(5);
    expect(lib.VARIANTS).toEqual(['solid', 'outline', 'ghost']);
    expect(lib.SIZES).toEqual(['sm', 'md', 'lg']);
    expect(lib.TEXT_SIZES).toEqual([14, 16, 18, 24, 32, 40]);
    expect(lib.HEADING_SIZES).toEqual([20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44]);
    expect(lib.SPACE_STEPS).toEqual([4, 8, 12, 16, 24, 32, 48, 64]);
  });

  it('exports SEMANTIC_TOKENS, the 114 tier-2 token names every theme declares, from @bit-ds/core', () => {
    expect(lib.SEMANTIC_TOKENS).toHaveLength(114);
    expect(lib.SEMANTIC_TOKENS).toContain('--bit-color-primary');
    expect(lib.SEMANTIC_TOKENS).toContain('--bit-space-64px');
    expect(lib.SEMANTIC_TOKENS.every((name) => name.startsWith('--bit-'))).toBe(true);
  });

  it.each(componentNames.filter((name) => !BUTTON_ALIASES.includes(name)))('%s renders the root class the naming rule predicts', (name) => {
    const Component = (lib as Record<string, unknown>)[name] as ComponentType<Record<string, unknown>>;
    const sample = createElement(Component, { 'aria-label': 'x', children: 'x', ...SAMPLE_PROPS[name] });
    const parent = PARENTS[name];
    const { container } = render(parent ? parent.wrap(sample) : sample);
    const root = parent ? container.querySelector(parent.root) : container.firstElementChild;
    expect(root).not.toBeNull();
    expect(root!.classList.contains(expectedRootClass(name))).toBe(true);
  });

  it('no file under src imports a .css file (styles come from @bit-ds/core only)', () => {
    const offenders = collectFiles(srcDir).filter((file) => {
      const content = readFileSync(file, 'utf8');
      return content.includes("import '") || content.includes('import "')
        ? /import\s*['"][^'"]*\.css['"]/.test(content)
        : false;
    });
    expect(offenders).toEqual([]);
  });

  it('exports the color mode service but not its test helpers', () => {
    expect(lib.COLOR_MODES).toEqual(['light', 'dark']);
    expect(lib.COLOR_MODE_STORAGE_KEY).toBe('bit-color-mode');
    expect(typeof lib.COLOR_MODE_SCRIPT).toBe('string');
    expect(typeof lib.useColorMode).toBe('function');
    expect(lib.colorMode).toBeInstanceOf(lib.ColorModeService);
    for (const name of ['set', 'toggle', 'onChange'] as const) expect(typeof lib.colorMode[name]).toBe('function');
    expect(typeof lib.announce).toBe('function');
    expect('resetColorModeStore' in lib).toBe(false);
    expect('setColorMode' in lib).toBe(false);
    expect('resolveColorMode' in lib).toBe(false);
  });

  it('exports the logo eras and storage key but not the page-era internals', () => {
    expect(lib.ERAS).toEqual([8, 16, 32, 64]);
    expect(lib.LOGO_ERA_STORAGE_KEY).toBe('bit-logo-era');
    for (const name of ['resetLogoEra', 'currentPageEra', 'useLogoEra']) expect(name in lib).toBe(false);
  });

  it('keeps Slot internal: Link asChild uses it, the package does not export it', () => {
    for (const name of ['Slot', 'composeRefs', 'mergeProps']) expect(name in lib).toBe(false);
  });

  it('keeps the tokenizer and the copy button internal', () => {
    for (const name of ['tokenize', 'CODE_LANGUAGES', 'CopyButton', 'COPY_RESET_MS']) expect(name in lib).toBe(false);
  });

  it('exports the copy hook CodeBlock uses', () => {
    expect(typeof lib.useCopyToClipboard).toBe('function');
  });
});
