import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lineOf } from '../content/versionLines.mjs';
import { resetVersionsCache } from './useVersions';
import { urlForLine, VersionSelect } from './VersionSelect';
import { chooseOption, chosenLabel, optionLabels } from '../test/select';

const picker = () => screen.getByRole('combobox', { name: 'Version' });

const CURRENT = lineOf(__BIT_VERSION__);
const entry = (line: string, version: string, path: string) => ({ line, version, date: '2026-10-04', path, react: '19.2.0', reactDom: '19.2.0' });
const ROOT = '/bit-design-system/';
const V01 = '/bit-design-system/v0.1/';
// The older line's patch must never equal __BIT_VERSION__, or its option shares this copy's label.
const TWO = { latest: '0.2', lines: [entry('0.2', '0.2.0', ROOT), entry('0.1', '0.1.0', V01)] };
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

  it('lists one option per entry, in file order, and chooses this copy (the root here)', async () => {
    vi.stubGlobal('fetch', vi.fn(() => ok(TWO)));
    render(<VersionSelect />);
    await waitFor(() => expect(optionLabels(picker())).toHaveLength(2));
    expect(optionLabels(picker())).toEqual(['0.2 (latest) · 0.2.0', '0.1 · 0.1.0']);
    expect(chosenLabel(picker())).toBe('0.2 (latest) · 0.2.0');
    expect(picker()).toHaveTextContent('0.2 (latest) · 0.2.0');
    expect(picker()).toBeEnabled();
  });

  it('chooses the archived copy it is served from', async () => {
    at(`${V01}index.html`);
    vi.stubGlobal('fetch', vi.fn(() => ok(TWO)));
    render(<VersionSelect />);
    await waitFor(() => expect(optionLabels(picker())).toHaveLength(2));
    expect(chosenLabel(picker())).toBe('0.1 · 0.1.0');
  });

  it('goes to the chosen copy, keeping the hash route', async () => {
    const assign = at(ROOT, '#/release-notes');
    vi.stubGlobal('fetch', vi.fn(() => ok(TWO)));
    render(<VersionSelect />);
    await waitFor(() => expect(picker()).toBeEnabled());
    await chooseOption(userEvent.setup(), picker(), '0.1 · 0.1.0');
    expect(assign).toHaveBeenCalledWith('/bit-design-system/v0.1/#/release-notes');
  });

  it('goes to the chosen copy by keyboard: Enter opens, ArrowDown moves, Enter chooses', async () => {
    const assign = at(ROOT, '#/components/button');
    vi.stubGlobal('fetch', vi.fn(() => ok(TWO)));
    render(<VersionSelect />);
    await waitFor(() => expect(picker()).toBeEnabled());
    picker().focus();
    await userEvent.setup().keyboard('{Enter}{ArrowDown}{Enter}');
    expect(assign).toHaveBeenCalledWith('/bit-design-system/v0.1/#/components/button');
  });

  it('choosing this copy again goes nowhere', async () => {
    const assign = at(ROOT, '#/');
    vi.stubGlobal('fetch', vi.fn(() => ok(TWO)));
    render(<VersionSelect />);
    await waitFor(() => expect(picker()).toBeEnabled());
    await chooseOption(userEvent.setup(), picker(), '0.2 (latest) · 0.2.0');
    expect(assign).not.toHaveBeenCalled();
  });

  it('tells two entries on one line apart by path (the as-older rehearsal)', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const assign = at(ROOT, '#/versions');
    vi.stubGlobal('fetch', vi.fn(() => ok(AS_OLDER)));
    render(<VersionSelect />);
    await waitFor(() => expect(picker()).toBeEnabled());
    expect(optionLabels(picker())).toEqual(['0.1 (latest) · 0.1.0', '0.1 · 0.1.0']);
    expect(chosenLabel(picker())).toBe('0.1 (latest) · 0.1.0');
    await chooseOption(userEvent.setup(), picker(), '0.1 · 0.1.0');
    expect(assign).toHaveBeenCalledWith('/bit-design-system/v0.1/#/versions');
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });

  it('is disabled with a title when there is one line', async () => {
    vi.stubGlobal('fetch', vi.fn(() => ok(ONE)));
    render(<VersionSelect />);
    await waitFor(() => expect(picker()).toBeDisabled());
    expect(picker()).toHaveAttribute('title', 'Only one release line so far');
    expect(optionLabels(picker())).toHaveLength(1);
  });

  it('shows only the current line, disabled, while loading', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    render(<VersionSelect />);
    expect(picker()).toBeDisabled();
    expect(optionLabels(picker())).toEqual([`${CURRENT} · ${__BIT_VERSION__}`]);
    expect(chosenLabel(picker())).toBe(`${CURRENT} · ${__BIT_VERSION__}`);
  });

  it('shows dev (unreleased) when unavailable in dev', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('404'))));
    render(<VersionSelect />);
    await waitFor(() => expect(optionLabels(picker())).toEqual(['dev (unreleased)']));
    expect(picker()).toHaveTextContent('dev (unreleased)');
    expect(picker()).toBeDisabled();
  });

  it('shows the current line, disabled, with a title when unavailable in production', async () => {
    vi.stubEnv('DEV', false);
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('404'))));
    render(<VersionSelect />);
    await waitFor(() => expect(picker()).toHaveAttribute('title', 'The version list could not be loaded'));
    expect(picker()).toBeDisabled();
    expect(optionLabels(picker())).toEqual([`${CURRENT} · ${__BIT_VERSION__}`]);
  });

  it('adds this copy when the file does not list its path, and chooses it', async () => {
    at('/bit-design-system/v0.0/');
    vi.stubGlobal('fetch', vi.fn(() => ok(TWO)));
    render(<VersionSelect />);
    await waitFor(() => expect(optionLabels(picker())).toHaveLength(3));
    expect(optionLabels(picker())[2]).toBe(`${CURRENT} · ${__BIT_VERSION__}`);
    expect(chosenLabel(picker())).toBe(`${CURRENT} · ${__BIT_VERSION__}`);
  });

  it('marks the document once mounted', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    render(<VersionSelect />);
    expect(document.documentElement).toHaveAttribute('data-bit-version-picker');
  });
});
