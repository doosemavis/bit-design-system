import { describe, it, expect } from 'vitest';
import { ROLE_TOKENS } from '../tokens';
import { listCss, readCss } from './css';

/** Component and system CSS: everything a theme's roles must reach. */
const FILES = ['components', 'system'].flatMap((dir) => listCss(dir).map((file) => `${dir}/${file}`));

/** A size step read straight from the scale: `--bit-radius-10px`, `--bit-shadow-md`. Full and inset are allowed. */
const SCALE_READ = /var\((--bit-radius-\d+px|--bit-shadow-(?:sm|md|lg))\)/g;

describe('component CSS reads role tokens', () => {
  it('never reads a corner or shadow straight from the size scale', () => {
    const reads = FILES.flatMap((file) =>
      readCss(file)
        .split('\n')
        .flatMap((line, i) => [...line.matchAll(SCALE_READ)].map((m) => `${file}:${i + 1} reads ${m[1]}`)),
    );
    expect(reads, 'read a role token (ROLE_TOKENS) instead, so a theme can retune it').toEqual([]);
  });

  it('reads every role token somewhere, so none is dead', () => {
    const css = FILES.map((file) => readCss(file)).join('\n');
    expect(ROLE_TOKENS.filter((role) => !css.includes(`var(${role})`))).toEqual([]);
  });
});
