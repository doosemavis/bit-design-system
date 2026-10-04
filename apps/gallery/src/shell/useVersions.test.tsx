import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lineOf } from '../content/versionLines.mjs';
import { resetVersionsCache, useVersions } from './useVersions';

const FILE = {
  latest: '0.2',
  lines: [
    { line: '0.2', version: '0.2.0', date: '2026-11-01', path: '/bit-design-system/', react: '19.2.0', reactDom: '19.2.0' },
    { line: '0.1', version: '0.1.0', date: '2026-10-04', path: '/bit-design-system/v0.1/', react: '19.2.0', reactDom: '19.2.0' },
  ],
};

const ok = (body: unknown) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });

describe('useVersions', () => {
  beforeEach(() => resetVersionsCache());
  afterEach(() => vi.unstubAllGlobals());

  it('is ready with a valid file', async () => {
    vi.stubGlobal('fetch', vi.fn(() => ok(FILE)));
    const { result } = renderHook(() => useVersions());
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.file).toEqual(FILE);
  });

  it('asks for /versions.json in dev', async () => {
    const fetchMock = vi.fn(() => ok(FILE));
    vi.stubGlobal('fetch', fetchMock);
    renderHook(() => useVersions());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/versions.json'));
  });

  it('asks for the Pages path outside dev', async () => {
    vi.stubEnv('DEV', false);
    const fetchMock = vi.fn(() => ok(FILE));
    vi.stubGlobal('fetch', fetchMock);
    renderHook(() => useVersions());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/bit-design-system/versions.json'));
    vi.unstubAllEnvs();
  });

  it('is unavailable on a 500', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 500, json: () => ok({}) })));
    const { result } = renderHook(() => useVersions());
    await waitFor(() => expect(result.current.status).toBe('unavailable'));
    expect(result.current.file).toBeNull();
  });

  it('is unavailable when the fetch rejects', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
    const { result } = renderHook(() => useVersions());
    await waitFor(() => expect(result.current.status).toBe('unavailable'));
  });

  it('is unavailable on invalid JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.reject(new SyntaxError('x')) })));
    const { result } = renderHook(() => useVersions());
    await waitFor(() => expect(result.current.status).toBe('unavailable'));
  });

  it.each([
    ['null', null],
    ['no lines', { latest: '0.2' }],
    ['a version as latest (the old, drifted shape)', { ...FILE, latest: '0.2.0' }],
    ['duplicate paths', { ...FILE, lines: [FILE.lines[0], { ...FILE.lines[1], path: '/bit-design-system/' }] }],
    ['numeric latest', { latest: 2, lines: [] }],
    ['a pre-release latest', { latest: '1.0.0-rc.1', lines: [] }],
    ['a line without a path', { latest: '0.2', lines: [{ line: '0.2', version: '0.2.0' }] }],
    ['a null line entry', { latest: '0.2', lines: [null] }],
    ['an array root', [FILE]],
    ['a line entry of only a number', { latest: '0.2', lines: [{ line: 1 }] }],
    ['an entry version that is a pre-release', { latest: '0.2', lines: [{ ...FILE.lines[0], version: '1.0.0-rc.1' }] }],
    ['an entry without a version', { latest: '0.2', lines: [{ line: '0.2', path: '/bit-design-system/' }] }],
    ['a javascript: path', { latest: '0.2', lines: [{ ...FILE.lines[0], path: 'javascript:alert(1)' }] }],
    ['a protocol-relative path', { latest: '0.2', lines: [{ ...FILE.lines[0], path: '//evil.example/' }] }],
    ['a path outside the site', { latest: '0.2', lines: [{ ...FILE.lines[0], path: '/elsewhere/' }] }],
    ['a path that climbs out', { latest: '0.2', lines: [{ ...FILE.lines[0], path: '/bit-design-system/../x' }] }],
  ])('is unavailable on a wrong shape: %s', async (_name, body) => {
    vi.stubGlobal('fetch', vi.fn(() => ok(body)));
    const { result } = renderHook(() => useVersions());
    await waitFor(() => expect(result.current.status).toBe('unavailable'));
  });

  it('currentLine is the line of the build version', () => {
    vi.stubGlobal('fetch', vi.fn(() => ok(FILE)));
    const { result } = renderHook(() => useVersions());
    expect(result.current.currentLine).toBe(lineOf(__BIT_VERSION__));
  });

  it('ownPath is the copy this page is served from, or the site root outside the site (dev, tests)', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    expect(renderHook(() => useVersions()).result.current.ownPath).toBe('/bit-design-system/');
    vi.stubGlobal('location', { ...window.location, pathname: '/bit-design-system/v0.1/index.html' });
    expect(renderHook(() => useVersions()).result.current.ownPath).toBe('/bit-design-system/v0.1/');
  });

  it('fetches once across two mounts', async () => {
    const fetchMock = vi.fn(() => ok(FILE));
    vi.stubGlobal('fetch', fetchMock);
    const first = renderHook(() => useVersions());
    await waitFor(() => expect(first.result.current.status).toBe('ready'));
    const second = renderHook(() => useVersions());
    await waitFor(() => expect(second.result.current.status).toBe('ready'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
