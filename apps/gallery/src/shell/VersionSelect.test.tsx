import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lineOf } from '../content/versionLines.mjs';
import { resetVersionsCache } from './useVersions';
import { urlForLine, VersionSelect } from './VersionSelect';

const CURRENT = lineOf(__BIT_VERSION__);
const entry = (line: string, version: string, path: string) => ({ line, version, date: '2026-10-04', path, react: '19.2.0', reactDom: '19.2.0' });
const TWO = {
  latest: '0.2.0',
  lines: [entry('0.2', '0.2.0', '/bit-design-system/'), entry('0.1', '0.1.3', '/bit-design-system/v0.1/')],
};
const ONE = { latest: '0.1.0', lines: [entry('0.1', '0.1.0', '/bit-design-system/')] };
const ok = (body: unknown) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });

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

  it('lists one option per line and selects the current line', async () => {
    vi.stubGlobal('fetch', vi.fn(() => ok(TWO)));
    render(<VersionSelect />);
    const select = screen.getByLabelText('Version');
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(2));
    expect(screen.getByRole('option', { name: '0.2 (latest) · 0.2.0' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '0.1 · 0.1.3' })).toBeInTheDocument();
    expect(select).toHaveValue(CURRENT);
    expect(select).toBeEnabled();
  });

  it('goes to the chosen line, keeping the hash route', async () => {
    vi.stubGlobal('fetch', vi.fn(() => ok(TWO)));
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, hash: '#/release-notes', assign });
    render(<VersionSelect />);
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(2));
    await userEvent.selectOptions(screen.getByLabelText('Version'), '0.2');
    expect(assign).toHaveBeenCalledWith('/bit-design-system/#/release-notes');
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
    expect(screen.getByRole('option')).toHaveValue(CURRENT);
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

  it('adds the current build when the file does not list its line', async () => {
    vi.stubGlobal('fetch', vi.fn(() => ok({ latest: '0.9.0', lines: [entry('0.9', '0.9.0', '/bit-design-system/')] })));
    render(<VersionSelect />);
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(2));
    expect(screen.getByLabelText('Version')).toHaveValue(CURRENT);
  });

  it('marks the document once mounted', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    render(<VersionSelect />);
    expect(document.documentElement).toHaveAttribute('data-bit-version-picker');
  });
});
