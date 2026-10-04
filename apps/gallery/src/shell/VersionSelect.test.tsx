import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lineOf } from '../content/versionLines.mjs';
import { resetVersionsCache } from './useVersions';
import { urlForLine, VersionSelect } from './VersionSelect';

const CURRENT = lineOf(__BIT_VERSION__);
const entry = (line: string, version: string, path: string) => ({ line, version, date: '2026-10-04', path, react: '19.2.0', reactDom: '19.2.0' });
const ROOT = '/bit-design-system/';
const V01 = '/bit-design-system/v0.1/';
const TWO = { latest: '0.2', lines: [entry('0.2', '0.2.0', ROOT), entry('0.1', '0.1.3', V01)] };
const ONE = { latest: '0.1', lines: [entry('0.1', '0.1.0', ROOT)] };
// The PR dry-run's --as-older file: the same line twice, told apart only by path.
const AS_OLDER = { latest: '0.1', lines: [entry('0.1', '0.1.0', ROOT), entry('0.1', '0.1.0', V01)] };
const ok = (body: unknown) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
/** Serves the page from `pathname` (jsdom's own is '/', outside the site, which counts as the root). */
const at = (pathname: string, hash = '') => {
  const assign = vi.fn();
  vi.stubGlobal('location', { ...window.location, pathname, hash, assign });
  return assign;
};

describe('urlForLine', () => {
  it('keeps the hash route', () => expect(urlForLine('/bit-design-system/v0.1/', '#/release-notes')).toBe('/bit-design-system/v0.1/#/release-notes'));
  it('falls back to the home route with no hash', () => expect(urlForLine('/bit-design-system/', '')).toBe('/bit-design-system/#/'));
});

describe('VersionSelect', () => {
  beforeEach(() => {
    resetVersionsCache();
    delete document.documentElement.dataset.bitVersionPicker;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('lists one option per entry, valued by path, and selects this copy (the root here)', async () => {
    vi.stubGlobal('fetch', vi.fn(() => ok(TWO)));
    render(<VersionSelect />);
    const select = screen.getByLabelText('Version');
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(2));
    expect(screen.getByRole('option', { name: '0.2 (latest) · 0.2.0' })).toHaveValue(ROOT);
    expect(screen.getByRole('option', { name: '0.1 · 0.1.3' })).toHaveValue(V01);
    expect(select).toHaveValue(ROOT);
    expect(select).toBeEnabled();
  });

  it('selects the archived copy it is served from', async () => {
    at(`${V01}index.html`);
    vi.stubGlobal('fetch', vi.fn(() => ok(TWO)));
    render(<VersionSelect />);
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(2));
    expect(screen.getByLabelText('Version')).toHaveValue(V01);
  });

  it('goes to the chosen copy, keeping the hash route', async () => {
    const assign = at(ROOT, '#/release-notes');
    vi.stubGlobal('fetch', vi.fn(() => ok(TWO)));
    render(<VersionSelect />);
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(2));
    await userEvent.selectOptions(screen.getByLabelText('Version'), V01);
    expect(assign).toHaveBeenCalledWith('/bit-design-system/v0.1/#/release-notes');
  });

  it('tells two entries on one line apart by path (the as-older rehearsal)', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const assign = at(ROOT, '#/versions');
    vi.stubGlobal('fetch', vi.fn(() => ok(AS_OLDER)));
    render(<VersionSelect />);
    const select = screen.getByLabelText('Version');
    await waitFor(() => expect(select).toBeEnabled());
    expect(screen.getAllByRole('option').map((o) => [o.textContent, (o as HTMLOptionElement).value])).toEqual([
      ['0.1 (latest) · 0.1.0', ROOT],
      ['0.1 · 0.1.0', V01],
    ]);
    await userEvent.selectOptions(select, V01);
    expect(assign).toHaveBeenCalledWith('/bit-design-system/v0.1/#/versions');
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });

  it('is disabled with a title when there is one line', async () => {
    vi.stubGlobal('fetch', vi.fn(() => ok(ONE)));
    render(<VersionSelect />);
    const select = screen.getByLabelText('Version');
    await waitFor(() => expect(select).toBeDisabled());
    expect(select).toHaveAttribute('title', 'Only one release line so far');
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });

  it('shows only the current line, disabled, while loading', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    render(<VersionSelect />);
    expect(screen.getByLabelText('Version')).toBeDisabled();
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option')).toHaveValue(ROOT);
    expect(screen.getByRole('option')).toHaveTextContent(`${CURRENT} · ${__BIT_VERSION__}`);
  });

  it('shows dev (unreleased) when unavailable in dev', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('404'))));
    render(<VersionSelect />);
    await waitFor(() => expect(screen.getByRole('option', { name: 'dev (unreleased)' })).toBeInTheDocument());
    expect(screen.getByLabelText('Version')).toBeDisabled();
  });

  it('shows the current line, disabled, with a title when unavailable in production', async () => {
    vi.stubEnv('DEV', false);
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('404'))));
    render(<VersionSelect />);
    const select = screen.getByLabelText('Version');
    await waitFor(() => expect(select).toHaveAttribute('title', 'The version list could not be loaded'));
    expect(select).toBeDisabled();
    expect(screen.getByRole('option', { name: `${CURRENT} · ${__BIT_VERSION__}` })).toBeInTheDocument();
  });

  it('adds this copy when the file does not list its path', async () => {
    at('/bit-design-system/v0.0/');
    vi.stubGlobal('fetch', vi.fn(() => ok(TWO)));
    render(<VersionSelect />);
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(3));
    expect(screen.getByRole('option', { name: `${CURRENT} · ${__BIT_VERSION__}` })).toHaveValue('/bit-design-system/v0.0/');
    expect(screen.getByLabelText('Version')).toHaveValue('/bit-design-system/v0.0/');
  });

  it('marks the document once mounted', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    render(<VersionSelect />);
    expect(document.documentElement).toHaveAttribute('data-bit-version-picker');
  });
});
