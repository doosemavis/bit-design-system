// @vitest-environment node
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it, expect } from 'vitest';
import { BIT_VERSION } from '../vite.config';

const require = createRequire(import.meta.url);
const pkg = JSON.parse(readFileSync(require.resolve('@bit-ds/react/package.json'), 'utf8')) as { version: string };

describe('__BIT_VERSION__', () => {
  it("is @bit-ds/react's package.json version, inlined at build time", () => {
    expect(BIT_VERSION).toBe(pkg.version);
    expect(__BIT_VERSION__).toBe(pkg.version);
  });

  it('is a semver version', () => {
    expect(__BIT_VERSION__).toMatch(/^\d+\.\d+\.\d+/);
  });
});
