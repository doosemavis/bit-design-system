import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetVersionsCache } from './useVersions';
import { OldVersionBanner } from './OldVersionBanner';

const ROOT = '/bit-design-system/';
const V01 = '/bit-design-system/v0.1/';
const entry = (line: string, version: string, path: string) => ({ line, version, date: '2026-10-04', path, react: '19.2.0', reactDom: '19.2.0' });
const ok = (body: unknown) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
const NEWER = { latest: '9', lines: [entry('9', '9.0.0', ROOT), entry('0.1', '0.1.0', V01)] };
/** Serves the page from `pathname` (jsdom's own '/' is outside the site, which counts as the root). */
const at = (pathname: string) => vi.stubGlobal('location', { ...window.location, pathname, hash: '' });

/** Mounts and waits until versions.json has been read, then until React has settled. */
async function renderSettled(body: unknown) {
  const fetchMock = vi.fn(() => ok(body));
  vi.stubGlobal('fetch', fetchMock);
  const view = render(<OldVersionBanner />);
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  await new Promise((r) => setTimeout(r, 0));
  return view;
}

describe('OldVersionBanner', () => {
  beforeEach(() => resetVersionsCache());
  afterEach(() => vi.unstubAllGlobals());

  it('warns on an older copy, with a link to the latest named by its version', async () => {
    at(V01);
    vi.stubGlobal('fetch', vi.fn(() => ok(NEWER)));
    render(<OldVersionBanner />);
    const banner = await screen.findByRole('status');
    expect(banner).toHaveTextContent(`You're viewing the docs for v${__BIT_VERSION__}`);
    expect(banner).toHaveClass('bit-solid', 'bit-warning');
    expect(screen.getByRole('link', { name: 'Go to the latest (v9.0.0) →' })).toHaveAttribute('href', '/bit-design-system/#/');
  });

  it('warns on a v<line>/ copy of the latest line too (the as-older rehearsal)', async () => {
    at(V01);
    vi.stubGlobal('fetch', vi.fn(() => ok({ latest: '0.1', lines: [entry('0.1', '0.1.1', ROOT), entry('0.1', '0.1.0', V01)] })));
    render(<OldVersionBanner />);
    expect(await screen.findByRole('status')).toHaveTextContent('You\'re viewing the docs for');
    expect(screen.getByRole('link', { name: 'Go to the latest (v0.1.1) →' })).toBeInTheDocument();
  });

  it('renders nothing on the root copy, which is the latest', async () => {
    at(ROOT);
    const { container } = await renderSettled(NEWER);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing outside the site (dev, tests): that counts as the root', async () => {
    const { container } = await renderSettled(NEWER);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing while loading', () => {
    at(V01);
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    const { container } = render(<OldVersionBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when unavailable', async () => {
    at(V01);
    const fetchMock = vi.fn(() => Promise.reject(new Error('x')));
    vi.stubGlobal('fetch', fetchMock);
    const { container } = render(<OldVersionBanner />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 0));
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when an unlisted copy is a newer, unreleased line than the latest', async () => {
    at('/bit-design-system/v0.9/');
    const { container } = await renderSettled({ latest: '0.0', lines: [entry('0.0', '0.0.9', ROOT)] });
    expect(container).toBeEmptyDOMElement();
  });
});
