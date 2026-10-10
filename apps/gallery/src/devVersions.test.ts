// @vitest-environment node
import type { IncomingMessage, ServerResponse } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import { buildDevVersionsJson, devVersionsPlugin, versionsMiddleware } from '../devVersions';
import { isVersionsFile, SITE_BASE } from './content/versionLines.mjs';

/** A response that records what the middleware sends. */
function fakeResponse() {
  const headers: Record<string, string> = {};
  let resolveDone: (body: string) => void = () => {};
  const done = new Promise<string>((resolve) => (resolveDone = resolve));
  const res = {
    statusCode: 200,
    setHeader: (name: string, value: string) => {
      headers[name.toLowerCase()] = value;
    },
    end: (body: string) => resolveDone(body),
  };
  return { res: res as unknown as ServerResponse, headers, done, status: () => res.statusCode };
}

const request = (url: string, method = 'GET') => ({ url, method }) as IncomingMessage;

describe('dev versions.json', () => {
  it('builds the file the deploy would, from this checkout: valid, with the newest release at the root', async () => {
    const file: unknown = JSON.parse(await buildDevVersionsJson());
    expect(isVersionsFile(file)).toBe(true);
    const root = (file as { lines: { path: string; version: string }[] }).lines.find((entry) => entry.path === SITE_BASE);
    expect(root?.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('answers GET /versions.json (with or without a query) as fresh JSON', async () => {
    const middleware = versionsMiddleware(() => Promise.resolve('{"ok":true}'));
    for (const url of ['/versions.json', '/versions.json?t=1']) {
      const { res, headers, done, status } = fakeResponse();
      const next = vi.fn();
      middleware(request(url), res, next);
      expect(await done).toBe('{"ok":true}');
      expect(status()).toBe(200);
      expect(headers['content-type']).toBe('application/json');
      expect(headers['cache-control']).toBe('no-cache');
      expect(next).not.toHaveBeenCalled();
    }
  });

  it('passes every other request on', () => {
    const build = vi.fn(() => Promise.resolve(''));
    const middleware = versionsMiddleware(build);
    for (const [url, method] of [['/', 'GET'], ['/src/main.tsx', 'GET'], ['/versions.json', 'POST']] as const) {
      const next = vi.fn();
      middleware(request(url, method), fakeResponse().res, next);
      expect(next).toHaveBeenCalledOnce();
    }
    expect(build).not.toHaveBeenCalled();
  });

  it('turns a failure into a 500, which the gallery reads as "unavailable"', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { res, done, status } = fakeResponse();
    versionsMiddleware(() => Promise.reject(new Error('no git')))(request('/versions.json'), res, vi.fn());
    expect(await done).toBe('no git');
    expect(status()).toBe(500);
    expect(warn).toHaveBeenCalledWith('[bit] dev versions.json: no git');
    warn.mockRestore();
  });

  it('runs in dev only, so build and preview keep serving public/', () => {
    expect(devVersionsPlugin().apply).toBe('serve');
  });
});
