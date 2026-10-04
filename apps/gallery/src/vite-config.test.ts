// @vitest-environment node
import { describe, expect, it } from 'vitest';
import config, { PAGES_BASE } from '../vite.config';

type ConfigFn = (env: { command: 'build' | 'serve'; mode: string; isPreview?: boolean }) => { base?: string };

describe('vite.config base', () => {
  const resolve = config as unknown as ConfigFn;
  it('dev serves from /', () => {
    expect(resolve({ command: 'serve', mode: 'development' }).base).toBe('/');
  });
  it('build and preview use the Pages base, so preview serves the built asset paths', () => {
    expect(resolve({ command: 'build', mode: 'production' }).base).toBe(PAGES_BASE);
    expect(resolve({ command: 'serve', mode: 'production', isPreview: true }).base).toBe(PAGES_BASE);
  });
});
