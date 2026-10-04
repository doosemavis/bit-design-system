import { render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetVersionsCache } from '../shell/useVersions';
import { VersionsPage } from './VersionsPage';
import { renderAt } from '../test/renderRoute';
import { expectNoA11yViolations } from '../test/a11y';
import pkg from '../../../../packages/react/package.json';

vi.mock('../buildVersion', () => ({ BUILD_VERSION: '0.1.0' }));
vi.mock('../content/changelog', () => ({
  RELEASES: [
    { version: '0.3.0', date: '2026-12-01', sections: { Breaking: ['`Button` lost `size`.', 'Second.'], Added: ['x'] } },
    { version: '0.2.0', date: '2026-11-01', sections: { Added: ['y'] } },
    { version: '0.1.0', date: '2026-10-04', sections: { Breaking: ['Old one.'] } },
  ],
}));

const entry = (line: string, version: string, react: string) => ({ line, version, date: '2026-10-04', path: line === '0.3' ? '/bit-design-system/' : `/bit-design-system/v${line}/`, react, reactDom: react });
const ok = (body: unknown) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
const FILE = { latest: '0.3.0', lines: [entry('0.3', '0.3.0', '^19.1.0'), entry('0.2', '0.2.0', '^19.0.0'), entry('0.1', '0.1.0', '^18.3.0')] };

describe('VersionsPage', () => {
  beforeEach(() => resetVersionsCache());
  afterEach(() => vi.unstubAllGlobals());

  it('lists one row per line in a table named Versions, with Latest and Viewing badges', async () => {
    vi.stubGlobal('fetch', vi.fn(() => ok(FILE)));
    render(<VersionsPage />);
    expect(await screen.findByRole('table', { name: 'Versions' })).toBeInTheDocument();
    await screen.findByText('v0.3.0');
    expect(screen.getAllByRole('columnheader').map((c) => c.textContent)).toEqual(['bit', 'React', 'react-dom', 'Status']);
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(3);
    expect(within(rows[0]!).getByText('Latest')).toHaveClass('bit-badge');
    expect(within(rows[0]!).queryByText('Viewing')).toBeNull();
    expect(within(rows[2]!).getByText('Viewing')).toHaveClass('bit-badge');
    expect(within(rows[2]!).getByText('^18.3.0', { selector: 'td:nth-child(2) *' })).toBeInTheDocument();
  });

  it('shows a warning outline Alert for each newer release with Breaking, not older ones', async () => {
    vi.stubGlobal('fetch', vi.fn(() => ok(FILE)));
    render(<VersionsPage />);
    const alert = await screen.findByText('Breaking changes in 0.3.0');
    const box = alert.closest('.bit-alert')!;
    expect(box).toHaveClass('bit-warning', 'bit-outline');
    expect(box.textContent).toContain('Second.');
    expect(box.querySelector('code')?.textContent).toBe('Button');
    expect(screen.queryByText('Breaking changes in 0.2.0')).toBeNull();
    expect(screen.queryByText('Breaking changes in 0.1.0')).toBeNull();
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
  beforeEach(() => resetVersionsCache());
  afterEach(() => vi.unstubAllGlobals());
  it('has the Start here eyebrow and no axe violations', async () => {
    vi.stubGlobal('fetch', vi.fn(() => ok(FILE)));
    const { container } = renderAt('/versions');
    await screen.findByRole('heading', { level: 1, name: 'Versions' });
    await screen.findByText('Breaking changes in 0.3.0');
    expect(within(screen.getByRole('main')).getByText('Start here')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });
});
