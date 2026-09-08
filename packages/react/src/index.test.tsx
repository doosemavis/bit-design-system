import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import type { ComponentType } from 'react';
import * as lib from './index';

const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

function isComponent(value: unknown): value is ComponentType<Record<string, unknown>> {
  return typeof value === 'function' || (typeof value === 'object' && value !== null && '$$typeof' in value);
}

const componentNames = Object.keys(lib).filter((name) => /^[A-Z]/.test(name) && isComponent((lib as Record<string, unknown>)[name]));

/** The naming rule from the spec, as code. */
function expectedRootClass(name: string): string {
  const parent = componentNames
    .filter((candidate) => candidate !== name && name.startsWith(candidate))
    .sort((a, b) => b.length - a.length)[0];
  if (parent) return `bit-${kebab(parent)}__${kebab(name.slice(parent.length))}`;
  return `bit-${kebab(name.replace(/^Bit/, ''))}`;
}

describe('public index', () => {
  it('exports exactly the Phase 1 components', () => {
    expect(componentNames.sort()).toEqual(
      ['Alert', 'Badge', 'BitLogo', 'Button', 'Card', 'CardBody', 'CardFooter', 'CardHeader', 'Spinner', 'Stack', 'Text'].sort(),
    );
  });

  it('exports the prefix and axes', () => {
    expect(lib.PREFIX).toBe('bit');
    expect(lib.TONES).toHaveLength(5);
    expect(lib.VARIANTS).toEqual(['solid', 'outline', 'ghost']);
    expect(lib.SIZES).toEqual(['sm', 'md', 'lg']);
  });

  it.each(componentNames)('%s renders the root class the naming rule predicts', (name) => {
    const Component = (lib as Record<string, unknown>)[name] as ComponentType<Record<string, unknown>>;
    const { container } = render(<Component aria-label="x">x</Component>);
    const root = container.firstElementChild;
    expect(root).not.toBeNull();
    expect(root!.classList.contains(expectedRootClass(name))).toBe(true);
  });
});
