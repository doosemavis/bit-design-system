import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { latestVersion, releaseStatus, useLatestVersion } from './latestVersion';
import { resetVersionsCache } from './useVersions';

const entry = (line: string, version: string, path: string) => ({ line, version, date: '2026-10-01', path, react: '^19.0.0', reactDom: '^19.0.0' });

const FILE = {
  latest: '0.2',
  lines: [entry('0.2', '0.2.3', '/bit-design-system/'), entry('0.1', '0.1.9', '/bit-design-system/v0.1/')],
};

describe('latestVersion', () => {
  it("is the root entry's version when versions.json is there, whatever this build is", () => {
    expect(latestVersion(FILE, '0.1.9')).toBe('0.2.3');
    expect(latestVersion(FILE, '0.3.0')).toBe('0.2.3');
  });

  it("falls back to this build's version without the file", () => {
    expect(latestVersion(null, '0.1.8')).toBe('0.1.8');
  });

  it('reads the root entry even when it is not listed first', () => {
    expect(latestVersion({ ...FILE, lines: [...FILE.lines].reverse() }, '0.0.1')).toBe('0.2.3');
  });
});

describe('releaseStatus', () => {
  it('marks the latest itself, newer as unreleased, older as released', () => {
    expect(releaseStatus('0.1.8', '0.1.8')).toBe('latest');
    expect(releaseStatus('0.1.9', '0.1.8')).toBe('unreleased');
    expect(releaseStatus('0.2.0', '0.1.8')).toBe('unreleased');
    expect(releaseStatus('0.1.7', '0.1.8')).toBe('released');
  });

  it('compares numerically, not as text', () => {
    expect(releaseStatus('0.1.10', '0.1.9')).toBe('unreleased');
  });

  it('treats a version it cannot compare as released, so nothing gets a wrong label', () => {
    expect(releaseStatus('0.2.0-beta.1', '0.1.8')).toBe('released');
    expect(releaseStatus('0.1.8', 'dev')).toBe('released');
  });
});

describe('useLatestVersion', () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    resetVersionsCache();
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    warn.mockRestore();
    resetVersionsCache();
  });

  it("starts at the build's version, then follows versions.json", async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(FILE) })));
    const { result } = renderHook(() => useLatestVersion());
    expect(result.current).toBe(__BIT_VERSION__);
    await waitFor(() => expect(result.current).toBe('0.2.3'));
  });

  it("stays at the build's version when the file can't load", async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve(null) })));
    const { result } = renderHook(() => useLatestVersion());
    await waitFor(() => expect(warn).toHaveBeenCalled());
    expect(result.current).toBe(__BIT_VERSION__);
  });
});
