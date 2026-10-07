import { render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetVersionsCache } from '../shell/useVersions';
import { VersionsPage } from './VersionsPage';
import { renderAt } from '../test/renderRoute';
import { expectNoA11yViolations } from '../test/a11y';
import pkg from '../../../../packages/react/package.json';

vi.mock('../buildVersion', () => ({ BUILD_VERSION: '0.1.0' }));

const entry = (line: string, version: string, react: string) => ({ line, version, date: '2026-10-04', path: line === '0.3' ? '/bit-design-system/' : `/bit-design-system/v${line}/`, react, reactDom: react });
const ok = (body: unknown) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
// The breaking items travel in versions.json (written at deploy from the current CHANGELOG), not in
// this copy's bundled CHANGELOG, which stops at its own tag.
const FILE = {
  latest: '0.3',
  lines: [
    { ...entry('0.3', '0.3.1', '^19.1.0'), breaking: [{ version: '0.3.1', items: ['Newest.'] }, { version: '0.3.0', items: ['`Button` lost `size`.', 'Second.'] }] },
    entry('0.2', '0.2.0', '^19.0.0'),
    { ...entry('0.1', '0.1.0', '^18.3.0'), breaking: [{ version: '0.1.0', items: ['Old one.'] }] },
  ],
};

/** Serves the page from `pathname` (jsdom's own '/' is outside the site, which counts as the root). */
const at = (pathname: string) => vi.stubGlobal('location', { ...window.location, pathname, hash: '' });

describe('VersionsPage', () => {
  beforeEach(() => {
    resetVersionsCache();
    at('/bit-design-system/v0.1/');
  });
  afterEach(() => vi.unstubAllGlobals());

  it('lists one row per line in a table named Versions, with Latest and Viewing badges', async () => {
    vi.stubGlobal('fetch', vi.fn(() => ok(FILE)));
    render(<VersionsPage />);
    expect(await screen.findByRole('table', { name: 'Versions' })).toBeInTheDocument();
    await screen.findByText('v0.3.1');
    expect(screen.getAllByRole('columnheader').map((c) => c.textContent)).toEqual(['bit', 'React', 'react-dom', 'Status']);
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(3);
    expect(within(rows[0]!).getByText('Latest')).toHaveClass('bit-badge');
    expect(within(rows[0]!).queryByText('Viewing')).toBeNull();
    expect(within(rows[2]!).getByText('Viewing')).toHaveClass('bit-badge');
    expect(within(rows[2]!).getByText('^18.3.0', { selector: 'td:nth-child(2) *' })).toBeInTheDocument();
  });

  it('keys rows by path: two entries on one line are two rows, and only the root one is Latest', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const asOlder = {
      latest: '0.1',
      lines: [
        { ...entry('0.1', '0.1.0', '^19.0.0'), path: '/bit-design-system/' },
        { ...entry('0.1', '0.1.0', '^19.0.0'), path: '/bit-design-system/v0.1/' },
      ],
    };
    vi.stubGlobal('fetch', vi.fn(() => ok(asOlder)));
    render(<VersionsPage />);
    await waitFor(() => expect(screen.getAllByText('v0.1.0')).toHaveLength(2));
    const rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]!).getByText('Latest')).toBeInTheDocument();
    expect(within(rows[1]!).queryByText('Latest')).toBeNull();
    expect(within(rows[1]!).getByText('Viewing')).toBeInTheDocument();
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });

  it('shows a warning outline Alert for each newer release with Breaking in versions.json, newest first, not this line\'s', async () => {
    vi.stubGlobal('fetch', vi.fn(() => ok(FILE)));
    render(<VersionsPage />);
    const alert = await screen.findByText('Breaking changes in 0.3.0');
    const box = alert.closest('.bit-alert')!;
    expect(box).toHaveClass('bit-warning', 'bit-outline');
    expect(box.textContent).toContain('Second.');
    expect(box.querySelector('code')?.textContent).toBe('Button');
    const titles = screen.getAllByText(/^Breaking changes in /).map((t) => t.textContent);
    expect(titles).toEqual(['Breaking changes in 0.3.1', 'Breaking changes in 0.3.0']);
  });

  it('shows no breaking box on the latest copy, even when its own line has Breaking items', async () => {
    at('/bit-design-system/');
    vi.stubGlobal('fetch', vi.fn(() => ok(FILE)));
    render(<VersionsPage />);
    await screen.findByText('v0.3.1');
    expect(screen.queryByText(/Breaking changes in/)).toBeNull();
  });

  it('shows no breaking box when the newer lines carry no breaking list', async () => {
    vi.stubGlobal('fetch', vi.fn(() => ok({ ...FILE, lines: FILE.lines.map((line) => ({ ...line, breaking: undefined })) })));
    render(<VersionsPage />);
    await screen.findByText('v0.3.1');
    expect(screen.queryByText(/Breaking changes/)).toBeNull();
  });

  it('shows one row for the current build, with the package peers, when versions.json is unavailable', async () => {
    const fetchMock = vi.fn(() => Promise.reject(new Error('x')));
    vi.stubGlobal('fetch', fetchMock);
    render(<VersionsPage />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const cell = await screen.findByText('v0.1.0');
    const row = cell.closest('tr')!;
    const cells = within(row).getAllByRole('cell').map((c) => c.textContent);
    expect(cells.slice(1, 3)).toEqual([pkg.peerDependencies.react, pkg.peerDependencies['react-dom']]);
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.queryByText(/Breaking changes in/)).toBeNull();
  });
});

describe('VersionsPage route', () => {
  beforeEach(() => {
    resetVersionsCache();
    at('/bit-design-system/v0.1/');
  });
  afterEach(() => vi.unstubAllGlobals());
  it('has no axe violations', async () => {
    vi.stubGlobal('fetch', vi.fn(() => ok(FILE)));
    const { container } = renderAt('/versions');
    await screen.findByRole('heading', { level: 1, name: 'Versions' });
    await screen.findByText('Breaking changes in 0.3.0');
    await expectNoA11yViolations(container);
  });
});
