import { describe, it, expect } from 'vitest';
import * as lib from '@bit-ds/react';
import { MANIFESTS, findManifest, routeFor } from './index';
import { COMPONENTS, HTML_CHILDREN, isHtmlElement } from './registry';
import { defaultState, parseState, serializeState } from '../engine/state';
import { stack } from './stack';
import { text } from './text';
import { heading } from './heading';
import { box } from './box';
import { button } from './button';
import { modeToggle } from './modeToggle';
import { codeBlock } from './codeBlock';
import { select } from './select';
import { field } from './field';
import { isVirtual } from './virtual';
import { childSpecs, isInteractive } from '../engine/childSpecs';
import { staticProps } from '../engine/staticProps';
import { toJsx } from '../code/toJsx';
import { isOmittedSentinel } from './sentinels';
import type { ChildSpec, Control, ControlState, Manifest } from './types';

/** ChildSpec names, nested parts included, that are neither a registered component nor an allowed HTML element. */
function unknownChildren(children: readonly ChildSpec[]): string[] {
  return children.flatMap((child) => {
    const name = child.component;
    const unknown = isHtmlElement(name) ? !HTML_CHILDREN.includes(name) : COMPONENTS[name] === undefined;
    const nested = typeof child.children === 'object' ? unknownChildren(child.children) : [];
    return unknown ? [name, ...nested] : nested;
  });
}

/**
 * Every runtime export of @bit-ds/react that is a component: PascalCase with a lowercase second
 * character. COLORS, SIZES, ERAS, PREFIX, SEMANTIC_TOKENS are all-caps and excluded; type-only
 * exports do not exist at runtime. ColorModeService is a class (the service behind `colorMode`), not a component.
 */
const NOT_COMPONENTS = ['ColorModeService'];
const COMPONENT_EXPORTS = Object.keys(lib)
  .filter((name) => /^[A-Z][a-z]/.test(name) && !NOT_COMPONENTS.includes(name))
  .sort();

/** Compound parts are documented on their parent's page, not their own. */
const PARTS = MANIFESTS.flatMap((m) => m.parts ?? []);

/** Strips one pair of surrounding quotes, so docs written as code (`'primary'`) compare with control values (`primary`). */
function unquote(code: string): string {
  return /^(['"]).*\1$/.test(code) ? code.slice(1, -1) : code;
}

/**
 * The control default that claims to be the component's own default, or undefined when it claims nothing.
 *
 * The printed code leaves a prop off at its control default (toJsx), so that default had better be what
 * the component does without the prop. That holds for booleans, numbers and axes, for selects that are
 * not alwaysPrint and do not default to a "leave it off" sentinel, and for text that is not alwaysPrint,
 * not a required aria-* label and not empty. Every other control default is sample content the code
 * always prints (Heading's level, Field's label) or "leave it off", and says nothing about the component.
 *
 * Rows on alwaysPrint controls are deliberately not compared: their control default is sample content
 * (Box's padding of 16, CodeBlock's jsx), not the component's default.
 */
function claimedDefault(c: Control): string | undefined {
  switch (c.kind) {
    case 'select':
      return c.alwaysPrint || isOmittedSentinel(c, c.default) ? undefined : c.default;
    case 'text':
      return c.alwaysPrint || c.prop.includes('-') || c.default === '' ? undefined : c.default;
    case 'axis':
      return isOmittedSentinel(c, c.default) ? undefined : c.default;
    default:
      return String(c.default);
  }
}

/**
 * Each control whose default disagrees with its prop row's default, as "Manifest.prop: ...". Docs write
 * defaults as code (`'primary'`, `16`, `false`): one pair of surrounding quotes is stripped, then the two
 * compare as strings. A row with no default fails when the control claims one.
 */
function defaultMismatches(m: Manifest): string[] {
  return m.controls.flatMap((c) => {
    const row = m.docs.props.find((p) => p.name === c.prop);
    const claimed = claimedDefault(c);
    if (row === undefined || claimed === undefined) return [];
    const documented = row.default === undefined ? undefined : unquote(row.default);
    return documented === claimed ? [] : [`${m.name}.${c.prop}: docs default ${row.default ?? '(none)'}, control default ${claimed}`];
  });
}

/**
 * Each axis or select value missing from its prop row's type union, as "Manifest.prop: ...". The union is
 * split on |, and each part trimmed and unquoted. Sentinels (none, default) leave the prop off, so they
 * are not prop values and are skipped.
 */
function valueMismatches(m: Manifest): string[] {
  return m.controls.flatMap((c) => {
    const row = m.docs.props.find((p) => p.name === c.prop);
    if (row === undefined || (c.kind !== 'axis' && c.kind !== 'select')) return [];
    const union = row.type.split('|').map((part) => unquote(part.trim()));
    return c.values
      .filter((v) => !isOmittedSentinel(c, v) && !union.includes(v))
      .map((v) => `${m.name}.${c.prop}: ${v} is offered but not in the type ${row.type}`);
  });
}

describe('manifest contract', () => {
  it('every component export has a manifest or is a documented part', () => {
    const covered = new Set([...MANIFESTS.map((m) => m.name), ...PARTS]);
    const missing = COMPONENT_EXPORTS.filter((name) => !covered.has(name));
    expect(missing).toEqual([]);
  });

  it('every manifest names a real export and its parts are real exports', () => {
    for (const m of MANIFESTS) {
      expect((lib as Record<string, unknown>)[m.name], m.name).toBe(m.component);
      for (const part of m.parts ?? []) expect((lib as Record<string, unknown>)[part], part).toBeDefined();
    }
  });

  it('slugs are unique, lowercase, and routable', () => {
    const slugs = MANIFESTS.map((m) => m.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const m of MANIFESTS) {
      expect(m.slug).toMatch(/^[a-z]+$/);
      expect(findManifest(m.slug)).toBe(m);
      expect(routeFor(m)).toBe(m.group === 'brand' ? '/brand/logo' : `/components/${m.slug}`);
    }
    expect(findManifest('nope')).toBeUndefined();
  });

  it('axis values are the library constants, not retyped copies', () => {
    for (const m of MANIFESTS) {
      for (const c of m.controls) {
        if (c.kind !== 'axis') continue;
        const real = c.values.filter((v) => !isOmittedSentinel(c, v));
        if (c.prop === 'color') expect(real.every((v) => (lib.COLORS as readonly string[]).includes(v))).toBe(true);
        if (c.prop === 'size') expect(real.every((v) => (lib.SIZES as readonly string[]).includes(v))).toBe(true);
        expect(c.values).toContain(c.default);
      }
    }
  });

  it('every control default is one of its values', () => {
    for (const m of MANIFESTS) {
      for (const c of m.controls) {
        if (c.kind === 'select') expect(c.values, `${m.name}.${c.prop}`).toContain(c.default);
        if (c.kind === 'number') expect(c.default).toBeGreaterThanOrEqual(c.min);
      }
    }
  });

  it('every child spec names a registered component or an allowed HTML element, derived ones included', () => {
    for (const m of MANIFESTS) {
      const states = [defaultState(m), ...(m.presets ?? []).map((p) => ({ ...defaultState(m), ...p.state }) as ControlState)];
      for (const state of states) {
        expect(unknownChildren(childSpecs(m, state) ?? []), m.name).toEqual([]);
      }
    }
  });

  it('a manifest has children or deriveChildren, never both', () => {
    expect(MANIFESTS.filter((m) => m.children !== undefined && m.deriveChildren !== undefined).map((m) => m.name)).toEqual([]);
  });

  it('the ChildSpec allowlist is span, strong, em and code, and catches a typo or a stray tag', () => {
    expect(HTML_CHILDREN).toEqual(['span', 'strong', 'em', 'code']);
    const children: ChildSpec[] = [
      { component: 'span', children: 'ok' },
      { component: 'spn', children: 'typo' },
      { component: 'div', children: 'not allowed' },
      // Select takes an options prop now; an <option> child is a mistake.
      { component: 'option', children: 'no longer allowed' },
      { component: 'Badge', children: 'registered' },
      { component: 'Nope', children: 'unregistered' },
    ];
    expect(unknownChildren(children)).toEqual(['spn', 'div', 'option', 'Nope']);
  });

  it('the allowlist check reaches nested parts (Table rows and cells)', () => {
    const nested: ChildSpec[] = [
      { component: 'TableBody', children: [{ component: 'TableRow', children: [{ component: 'tdd', children: 'typo' }] }] },
    ];
    expect(unknownChildren(nested)).toEqual(['tdd']);
  });

  it('Stack gap and Text size are px numbers, migrated through the D13 table (OV6)', () => {
    expect(stack.controls.find((c) => c.prop === 'gap')).toMatchObject({
      kind: 'select',
      numeric: true,
      default: '12',
      values: ['4', '8', '12', '16', '24', '32', '48', '64'],
    });
    expect(stack.presets?.find((p) => p.label === 'Row, centered')?.state.gap).toBe('16');
    expect(text.controls.find((c) => c.prop === 'size')).toMatchObject({
      kind: 'select',
      numeric: true,
      default: '15',
      // 11 is deprecated (under the 13px floor), so the playground does not offer it.
      values: ['13', '15', '18', '24', '32'],
    });
    expect(text.presets?.map((p) => p.state.size)).toEqual(['32', '13']);
  });

  it('Heading always prints its required level; size is left off until chosen', () => {
    expect(toJsx(heading, defaultState(heading))).toBe(
      "import { Heading } from '@bit-ds/react';\n\n<Heading level={2}>Build with bit</Heading>",
    );
    const preset = heading.presets!.find((p) => p.label === 'h2 that looks like h3')!;
    expect(toJsx(heading, { ...defaultState(heading), ...preset.state } as ControlState)).toContain('<Heading level={2} size={3}>Build with bit</Heading>');
  });

  it('Box prints its padding and leaves the other spacing props off until chosen; 0 prints as 0', () => {
    expect(toJsx(box, defaultState(box))).toBe(
      "import { Badge, Box } from '@bit-ds/react';\n\n<Box padding={16}>\n  <Badge color=\"primary\">Inside the box</Badge>\n</Box>",
    );
    expect(toJsx(box, { ...defaultState(box), paddingY: '0' })).toContain('<Box padding={16} paddingY={0}>');
    expect(box.controls.filter((c) => c.kind === 'select' && c.numeric).map((c) => c.prop)).toEqual([
      'padding',
      'paddingX',
      'paddingY',
      'margin',
      'marginTop',
    ]);
  });

  it('the gallery offers Box every as tag but main and aside (the Box API keeps them)', () => {
    const as = box.controls.find((c) => c.prop === 'as');
    expect(as?.kind === 'select' && as.values).toEqual(['div', 'section', 'article', 'header', 'footer', 'nav', 'span']);
  });

  it('every preset sets only real controls, to values those controls accept (§H.3)', () => {
    for (const m of MANIFESTS) {
      for (const preset of m.presets ?? []) {
        const expected = { ...defaultState(m), ...preset.state } as ControlState;
        expect(parseState(m, serializeState(m, expected)), `${m.name} / ${preset.label}`).toEqual(expected);
      }
    }
  });

  it.each(MANIFESTS.map((m) => [m.name, m] as const))(
    '%s has complete docs: at least one Do, one Don\'t, one prop and one a11y line, none blank',
    (_name, m) => {
      const { usage, props, a11y, badges } = m.docs;
      expect(usage.do.length, 'do').toBeGreaterThan(0);
      expect(usage.dont.length, 'dont').toBeGreaterThan(0);
      expect(props.length, 'props').toBeGreaterThan(0);
      expect(a11y.length, 'a11y').toBeGreaterThan(0);
      const lines = [...badges, ...usage.do, ...usage.dont, ...a11y, ...props.flatMap((p) => [p.name, p.type, p.description])];
      expect(lines.filter((line) => line.trim() === '')).toEqual([]);
    },
  );

  it.each(MANIFESTS.map((m) => [m.name, m] as const))('%s documents every prop its controls expose, once', (_name, m) => {
    const documented = m.docs.props.map((p) => p.name);
    expect(new Set(documented).size, 'duplicate prop rows').toBe(documented.length);
    // A virtual control shapes the page and is not a prop, so it has no row.
    const props = m.controls.filter((c) => !isVirtual(c)).map((c) => c.prop);
    expect(props.filter((prop) => !documented.includes(prop))).toEqual([]);
  });

  it.each(MANIFESTS.map((m) => [m.name, m] as const))('%s gives every axis prop row its bit-{prop} class, and no other row one', (_name, m) => {
    const axes = new Set<string>(m.controls.filter((c) => c.kind === 'axis').map((c) => c.prop));
    for (const row of m.docs.props) {
      expect(row.className, row.name).toBe(axes.has(row.name) ? `bit-{${row.name}}` : undefined);
    }
  });

  it.each(MANIFESTS.map((m) => [m.name, m] as const))('%s documents the same default its controls start at', (_name, m) => {
    expect(defaultMismatches(m)).toEqual([]);
  });

  it.each(MANIFESTS.map((m) => [m.name, m] as const))('%s documents every value its axis and select controls offer', (_name, m) => {
    expect(valueMismatches(m)).toEqual([]);
  });

  it('the default and value checks name the manifest and the prop, and catch a wrong default, a missing one and a missing value', () => {
    const docs = {
      ...button.docs,
      props: [
        { name: 'color', type: "'primary' | 'neutral'", default: "'neutral'", description: 'x' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", description: 'x' },
      ],
    };
    const broken: Manifest = { ...button, docs };
    expect(defaultMismatches(broken)).toEqual([
      "Button.color: docs default 'neutral', control default primary",
      'Button.size: docs default (none), control default md',
    ]);
    expect(valueMismatches(broken)).toEqual([
      "Button.color: success is offered but not in the type 'primary' | 'neutral'",
      "Button.color: warning is offered but not in the type 'primary' | 'neutral'",
      "Button.color: danger is offered but not in the type 'primary' | 'neutral'",
    ]);
  });

  it('only manifests with a children text control carry an empty-children error', () => {
    for (const m of MANIFESTS) {
      if (m.docs.emptyChildrenError !== undefined) expect(typeof m.children, m.name).toBe('string');
    }
    expect(MANIFESTS.filter((m) => m.docs.emptyChildrenError).map((m) => m.name)).toEqual(['Button', 'Link', 'Switch']);
  });

  it('Button\'s empty-children error is the §E text', () => {
    expect(button.docs.emptyChildrenError).toBe('A Button needs text or an aria-label, or screen readers announce just "button".');
  });

  it('CodeBlock offers and documents every language, ts and tsx included', () => {
    const languages = ['jsx', 'tsx', 'ts', 'html', 'css', 'shell'];
    const control = codeBlock.controls.find((c) => c.kind === 'select' && c.prop === 'language');
    expect(control?.kind === 'select' ? control.values : null).toEqual(languages);
    expect(codeBlock.docs.props.find((p) => p.name === 'language')?.type).toBe(languages.map((l) => `'${l}'`).join(' | '));
    expect(codeBlock.docs.badges).toContain(languages.join(' · '));
  });

  it('CodeBlock documents its actions slot', () => {
    expect(codeBlock.docs.props.find((p) => p.name === 'actions')?.type).toBe('ReactNode');
  });

  it('only ModeToggle, CodeBlock, Dialog, Tabs, Tooltip and Select are interactive (no HTML tab): they need React to work', () => {
    expect(MANIFESTS.filter((m) => isInteractive(m, defaultState(m))).map((m) => m.name)).toEqual(['ModeToggle', 'CodeBlock', 'Dialog', 'Tabs', 'Tooltip', 'Select']);
    expect(isInteractive(field, { control: 'Select' })).toBe(true);
  });

  it('Select passes its choices as an options prop, not <option> children', () => {
    expect(select.children).toBeUndefined();
    const options = staticProps(select, defaultState(select)).options as readonly { value: string; label: string }[];
    expect(options.map((o) => o.value)).toEqual(['primary', 'neutral', 'success', 'warning', 'danger']);
    expect(new Set(options.map((o) => o.value)).size).toBe(options.length);
  });

  it('Select documents the new API: options, value, defaultValue, onValueChange, placeholder and name, and no children', () => {
    const names = select.docs.props.map((p) => p.name);
    for (const name of ['options', 'value', 'defaultValue', 'onValueChange', 'placeholder', 'name', 'size', 'invalid', 'disabled']) {
      expect(names, name).toContain(name);
    }
    expect(names).not.toContain('children');
    expect(select.docs.badges.join(' ')).not.toMatch(/Native/);
  });

  it("Select's accessibility notes cover every key and how screen readers name it", () => {
    const a11y = select.docs.a11y.join('\n');
    for (const key of ['Tab', 'Enter', 'Space', 'Home', 'End', 'Page Up', 'Page Down', 'Escape', 'arrow']) {
      expect(a11y, key).toContain(key);
    }
    expect(a11y).toMatch(/typ(e|ing)/);
    expect(a11y).toMatch(/combobox/);
    expect(a11y).toMatch(/Field/);
    expect(a11y).toMatch(/Alt\+ArrowDown opens the list without moving/);
    expect(a11y).toMatch(/Alt\+ArrowUp chooses the active option and closes/);
  });

  it("Select's options row names the exported SelectOption type, spelled out once", () => {
    const type = select.docs.props.find((p) => p.name === 'options')!.type;
    expect(type).toMatch(/^readonly SelectOption\[\]/);
    expect(type.match(/value: string; label: ReactNode; disabled\?: boolean/g)).toHaveLength(1);
  });

  it("Field's a11y notes say a Select's label also opens its list", () => {
    expect(field.docs.a11y.join('\n')).toMatch(/for a Select, clicking the label also opens the list/i);
  });

  it('groups are the sidebar groups, and only the logo is brand', () => {
    for (const m of MANIFESTS) expect(['components', 'forms', 'brand']).toContain(m.group);
    expect(MANIFESTS.filter((m) => m.group === 'brand').map((m) => m.name)).toEqual(['BitLogo']);
  });

  it('the form controls are in the forms group', () => {
    expect(MANIFESTS.filter((m) => m.group === 'forms').map((m) => m.name)).toEqual(['Field', 'Input', 'Select', 'Switch']);
  });

  it('isHtmlElement follows JSX: lowercase is an HTML tag, PascalCase is a component', () => {
    expect(isHtmlElement('span')).toBe(true);
    expect(isHtmlElement('Badge')).toBe(false);
  });
});

describe('modeToggle notes', () => {
  const notes = [...modeToggle.docs.usage.do, ...modeToggle.docs.usage.dont].join('\n');
  it('no longer tells people to inline COLOR_MODE_SCRIPT', () => expect(notes).not.toContain('Inline COLOR_MODE_SCRIPT'));
  it('points to data-mode="system"', () => expect(notes).toContain('data-mode="system"'));
  it('has a "Switch from code" example using colorMode', () => {
    const example = modeToggle.docs.usage.do.find((line) => line.startsWith('Switch from code'));
    expect(example).toContain("colorMode.set('dark')");
  });
});
