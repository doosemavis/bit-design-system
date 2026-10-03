import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createElement } from 'react';
import type { ComponentType } from 'react';
import * as lib from './index';

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

const componentNames = Object.keys(lib).filter((name) => /^[A-Z]/.test(name) && isComponent((lib as Record<string, unknown>)[name]));

/**
 * What each component renders with in the naming-rule test: `aria-label="x"` and the child "x", plus
 * these props where a component needs more to render at all. A void element (Input) takes no children.
 */
const SAMPLE_PROPS: Record<string, Record<string, unknown>> = {
  Input: { children: undefined },
};

/** The naming rule from the spec, as code. */
function expectedRootClass(name: string): string {
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
        'Field', 'Input',
      ].sort(),
    );
  });

  it('exports the prefix and axes', () => {
    expect(lib.PREFIX).toBe('bit');
    expect(lib.COLORS).toHaveLength(5);
    expect(lib.VARIANTS).toEqual(['solid', 'outline', 'ghost']);
    expect(lib.SIZES).toEqual(['sm', 'md', 'lg']);
    expect(lib.TEXT_SIZES).toEqual([11, 13, 15, 18, 24, 32]);
    expect(lib.SPACE_STEPS).toEqual([4, 8, 12, 16, 24, 32, 48, 64]);
  });

  it.each(componentNames)('%s renders the root class the naming rule predicts', (name) => {
    const Component = (lib as Record<string, unknown>)[name] as ComponentType<Record<string, unknown>>;
    const { container } = render(createElement(Component, { 'aria-label': 'x', children: 'x', ...SAMPLE_PROPS[name] }));
    const root = container.firstElementChild;
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
    expect('resetColorModeStore' in lib).toBe(false);
    expect('setColorMode' in lib).toBe(false);
    expect('resolveColorMode' in lib).toBe(false);
  });

  it('exports the logo eras and storage key but not the page-era internals', () => {
    expect(lib.ERAS).toEqual([8, 16, 32, 64]);
    expect(lib.LOGO_ERA_STORAGE_KEY).toBe('bit-logo-era');
    for (const name of ['resetLogoEra', 'currentPageEra', 'useLogoEra']) expect(name in lib).toBe(false);
  });
});
