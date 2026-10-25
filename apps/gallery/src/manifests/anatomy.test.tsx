import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { SEMANTIC_TOKENS } from '@bit-ds/react';
import { describe, expect, it } from 'vitest';
import { MANIFESTS } from './index';
import type { ControlState, Manifest } from './types';
import { button } from './button';
import { renderManifest } from '../engine/renderManifest';
import { defaultState, parseState, serializeState } from '../engine/state';
import { anatomyErrors, cssFileFor, offErrors } from '../test/anatomyGuard';

// Plain paths, not URLs: jsdom replaces the global URL class, and node:fs rejects its instances.
const CORE = resolve(import.meta.dirname, '../../../../packages/core/src');
const SYSTEM = readdirSync(resolve(CORE, 'system'))
  .filter((file) => file.endsWith('.css'))
  .map((file) => readFileSync(resolve(CORE, 'system', file), 'utf8'));
const componentCss = (manifest: Manifest): string | null => {
  const path = resolve(CORE, 'components', cssFileFor(manifest));
  return existsSync(path) ? readFileSync(path, 'utf8') : null;
};
const withAnatomy = MANIFESTS.filter((m) => m.anatomy);

describe('anatomy guard', () => {
  it('Button has anatomy, so the guard runs on something', () => {
    expect(withAnatomy.map((m) => m.slug)).toContain('button');
  });

  it.each(withAnatomy.map((m) => [m.slug, m] as const))('%s: every token is a theme token the component reads', (_slug, manifest) => {
    expect(anatomyErrors(manifest, componentCss(manifest), SYSTEM, SEMANTIC_TOKENS)).toEqual([]);
  });

  it.each(withAnatomy.map((m) => [m.slug, m] as const))('%s: every selector matches the default instance', (_slug, manifest) => {
    const state: ControlState = { ...defaultState(manifest), ...manifest.anatomy!.base } as ControlState;
    const { container } = render(<div>{renderManifest(manifest, state, { sample: true })}</div>);
    for (const part of manifest.anatomy!.parts.filter((p) => !p.unseen)) {
      expect(container.querySelector(part.selector), `${manifest.slug} "${part.label}"`).not.toBeNull();
    }
  });

  it.each(withAnatomy.map((m) => [m.slug, m] as const))('%s: parts on one element touch different points', (_slug, manifest) => {
    const points = manifest.anatomy!.parts.map((part) => `${part.selector} ${part.touch.kind} ${part.touch.edge} ${part.touch.at ?? 0.5}`);
    expect(new Set(points).size, points.join(', ')).toBe(points.length);
  });

  it.each(withAnatomy.map((m) => [m.slug, m] as const))("%s: off only sets the part's own tokens", (_slug, manifest) => {
    expect(offErrors(manifest)).toEqual([]);
  });

  it.each(withAnatomy.map((m) => [m.slug, m] as const))('%s: every state patch is valid control state', (_slug, manifest) => {
    for (const { label, state } of manifest.anatomy!.states) {
      const merged = { ...defaultState(manifest), ...state } as ControlState; // patches never hold undefined
      expect(parseState(manifest, serializeState(manifest, merged)), `${manifest.slug} state "${label}"`).toEqual(merged);
    }
  });
});

describe('anatomy guard proves itself on fixtures', () => {
  const scene = { caption: 'In use', render: (instance: ReactElement) => instance };
  const fixture = (tokens: readonly string[], css?: string): Manifest => ({
    ...button,
    anatomy: {
      parts: [{ label: 'Face', selector: '.bit-button', tokens, side: 'left', touch: { kind: 'fill', edge: 'left' } }],
      states: [],
      scene,
      ...(css ? { css } : {}),
    },
  });
  const buttonCss = componentCss(button);

  it('passes a token read directly (border width) and one read through --_bit-color in system/colors.css', () => {
    expect(anatomyErrors(fixture(['--bit-border-width', '--bit-color-primary']), buttonCss, SYSTEM, SEMANTIC_TOKENS)).toEqual([]);
  });

  it('fails a token the component never reads, naming component, part and token', () => {
    expect(anatomyErrors(fixture(['--bit-code-bg']), buttonCss, SYSTEM, SEMANTIC_TOKENS)).toEqual([
      'button anatomy "Face": --bit-code-bg is not read by button.css, directly or through a --_bit-* property it reads',
    ]);
  });

  it('fails a token that appears only inside a comment, in the component or a system sheet', () => {
    const error = 'button anatomy "Face": --bit-code-bg is not read by button.css, directly or through a --_bit-* property it reads';
    const commented = `${buttonCss}\n/* var(--bit-code-bg) */`;
    expect(anatomyErrors(fixture(['--bit-code-bg']), commented, SYSTEM, SEMANTIC_TOKENS)).toEqual([error]);
    const privateInComment = `${buttonCss}\n.bit-button { color: var(--_bit-fixture); }`;
    const system = [...SYSTEM, '/* .x { --_bit-fixture: var(--bit-code-bg); } */'];
    expect(anatomyErrors(fixture(['--bit-code-bg']), privateInComment, system, SEMANTIC_TOKENS)).toEqual([error]);
  });

  it('fails a token that is not in the theme', () => {
    expect(anatomyErrors(fixture(['--bit-color-made-up']), buttonCss, SYSTEM, SEMANTIC_TOKENS)).toEqual([
      'button anatomy "Face": --bit-color-made-up is not a theme token',
    ]);
  });

  it('fails a CSS file that does not exist', () => {
    expect(anatomyErrors(fixture(['--bit-border-width'], 'nope.css'), null, SYSTEM, SEMANTIC_TOKENS)).toEqual([
      'button anatomy: packages/core/src/components/nope.css does not exist',
    ]);
  });

  it('fails an off key the part does not list', () => {
    const face = { ...fixture(['--bit-color-primary']).anatomy!.parts[0]!, off: { '--bit-shadow-md': 'none' } };
    const manifest = { ...button, anatomy: { ...fixture([]).anatomy!, parts: [face] } };
    expect(offErrors(manifest)).toEqual(['button anatomy "Face": off sets --bit-shadow-md, which the part doesn\'t list']);
  });

  it('names the CSS file from the anatomy override, else the kebab-case name', () => {
    expect(cssFileFor(button)).toBe('button.css');
    expect(cssFileFor({ ...button, name: 'IconButton', anatomy: undefined })).toBe('icon-button.css');
    expect(cssFileFor({ ...button, name: 'RadioGroup', anatomy: { parts: [], states: [], scene, css: 'radio.css' } })).toBe('radio.css');
  });
});
