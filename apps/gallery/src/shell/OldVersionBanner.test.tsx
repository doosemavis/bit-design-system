import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetVersionsCache } from './useVersions';
import { OldVersionBanner } from './OldVersionBanner';

const entry = (line: string, version: string, path: string) => ({ line, version, date: '2026-10-04', path, react: '19.2.0', reactDom: '19.2.0' });
const ok = (body: unknown) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
const NEWER = { latest: '9.0.0', lines: [entry('9', '9.0.0', '/bit-design-system/'), entry('0.1', '0.1.0', '/bit-design-system/v0.1/')] };

describe('OldVersionBanner', () => {
  beforeEach(() => resetVersionsCache());
  afterEach(() => vi.unstubAllGlobals());

  it('warns, with a link to the latest, when the build is not the latest line', async () => {
    vi.stubGlobal('fetch', vi.fn(() => ok(NEWER)));
    render(<OldVersionBanner />);
    const banner = await screen.findByRole('status');
    expect(banner).toHaveTextContent(`You're viewing the docs for v${__BIT_VERSION__}`);
    expect(banner).toHaveClass('bit-solid', 'bit-warning');
    expect(screen.getByRole('link', { name: 'Go to the latest (v9.0.0) →' })).toHaveAttribute('href', '/bit-design-system/#/');
  });

  it('renders nothing when the build is the latest line', async () => {
    vi.stubGlobal('fetch', vi.fn(() => ok({ latest: __BIT_VERSION__, lines: [entry('0.1', __BIT_VERSION__, '/bit-design-system/')] })));
    const fetchMock = vi.mocked(fetch);
    const { container } = render(<OldVersionBanner />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 0));
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing while loading', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    const { container } = render(<OldVersionBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when unavailable', async () => {
    const fetchMock = vi.fn(() => Promise.reject(new Error('x')));
    vi.stubGlobal('fetch', fetchMock);
    const { container } = render(<OldVersionBanner />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 0));
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the build is a newer, unreleased line', async () => {
    const fetchMock = vi.fn(() => ok({ latest: '0.0.9', lines: [entry('0.0', '0.0.9', '/bit-design-system/')] }));
    vi.stubGlobal('fetch', fetchMock);
    const { container } = render(<OldVersionBanner />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 0));
    expect(container).toBeEmptyDOMElement();
  });
});
