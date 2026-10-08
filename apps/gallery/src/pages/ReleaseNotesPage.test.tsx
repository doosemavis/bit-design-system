import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderAt } from '../test/renderRoute';
import { expectNoA11yViolations } from '../test/a11y';
import userEvent from '@testing-library/user-event';
import { CHANGE_KINDS, RELEASES } from '../content/changelog';
import type { ChangeKind } from '../content/changelog';
import { renderInline } from '../ui/renderInline';
import { render } from '@testing-library/react';

describe('renderInline', () => {
  it('splits backtick spans into Code and keeps the text around them', () => {
    const { container } = render(<p>{renderInline('Use `Code` in `Table` cells.')}</p>);
    expect([...container.querySelectorAll('code')].map((c) => c.textContent)).toEqual(['Code', 'Table']);
    expect(container.textContent).toBe('Use Code in Table cells.');
  });
  it('leaves an empty backtick pair as literal text, not an empty Code', () => {
    const { container } = render(<p>{renderInline('a `` b')}</p>);
    expect(container.querySelector('code')).toBeNull();
    expect(container.textContent).toBe('a `` b');
  });
  it('leaves text with no backticks, or an unmatched one, as text', () => {
    const { container } = render(<p>{renderInline('plain `open')}</p>);
    expect(container.querySelector('code')).toBeNull();
    expect(container.textContent).toBe('plain `open');
  });
});

describe('ReleaseNotesPage', () => {
  async function open() {
    const utils = renderAt('/release-notes');
    await screen.findByRole('heading', { level: 1, name: 'Release notes' });
    return utils;
  }

  it('has no axe violations', async () => {
    const { container } = await open();
    await expectNoA11yViolations(container);
  });

  it('has one heading per release, newest first, each with a date badge', async () => {
    await open();
    const headings = within(screen.getByRole('main')).getAllByRole('heading', { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual(RELEASES.map((r) => `v${r.version}`));
    headings.forEach((h, i) => {
      const badge = within(h.parentElement!).getByText(RELEASES[i]!.date);
      expect(badge).toHaveClass('bit-badge');
    });
  });

  it('labels each section list with its badge', async () => {
    await open();
    const added = within(screen.getByRole('main')).getAllByText('Added')[0]!;
    expect(added).toHaveClass('bit-success', 'bit-solid');
    expect(within(screen.getByRole('main')).getAllByRole('list').length).toBeGreaterThanOrEqual(1);
  });

  it('opens the newest card and keeps older ones closed until their toggle is pressed', async () => {
    const user = userEvent.setup();
    await open();
    const toggles = screen.getAllByRole('button', { name: /changes$/ });
    expect(toggles[0]).toHaveAttribute('aria-expanded', 'true');
    expect(toggles[0]).toHaveTextContent('Hide changes');
    expect(toggles[1]).toHaveAttribute('aria-expanded', 'false');
    const body = document.getElementById(toggles[1]!.getAttribute('aria-controls')!)!;
    expect(body).not.toBeVisible();
    await user.click(toggles[1]!);
    expect(toggles[1]).toHaveAttribute('aria-expanded', 'true');
    expect(body).toBeVisible();
  });

  it('marks the newest release Latest and shows per-kind counts from the data', async () => {
    await open();
    const main = within(screen.getByRole('main'));
    expect(main.getAllByText('Latest')).toHaveLength(1);
    const row = main.getByRole('heading', { level: 2, name: `v${RELEASES[0]!.version}` }).parentElement!;
    for (const kind of CHANGE_KINDS) {
      const n = RELEASES[0]!.sections[kind]?.length ?? 0;
      if (n > 0) expect(within(row).getByText(`${kind} ${n}`)).toHaveClass('bit-badge');
      else expect(within(row).queryByText(new RegExp(`^${kind} \\d+$`))).toBeNull();
    }
  });

  it('lists every version newest first in the rail, and a link opens its card and focuses its heading', async () => {
    const user = userEvent.setup();
    await open();
    const rail = within(screen.getByRole('navigation', { name: 'Versions' }));
    expect(rail.getAllByRole('link').map((a) => a.textContent)).toEqual(RELEASES.map((r) => `v${r.version}`));
    const target = RELEASES.find((r) => r.version === '0.1.4') ?? RELEASES[2]!;
    await user.click(rail.getByRole('link', { name: `v${target.version}` }));
    const heading = screen.getByRole('heading', { level: 2, name: `v${target.version}` });
    expect(heading).toHaveFocus();
    expect(rail.getByRole('link', { name: `v${target.version}` })).toHaveAttribute('aria-current', 'true');
    const toggle = within(heading.closest('.bit-card') as HTMLElement).getByRole('button');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  describe('kind filter', () => {
    const withKind = (k: ChangeKind) => RELEASES.filter((r) => (r.sections[k]?.length ?? 0) > 0);

    it('labels each kind with its total', async () => {
      await open();
      for (const k of ['Breaking', 'Added', 'Changed', 'Fixed'] as const) {
        const n = RELEASES.reduce((sum, r) => sum + (r.sections[k]?.length ?? 0), 0);
        expect(screen.getByRole('radio', { name: `${k} (${n})` })).toBeInTheDocument();
      }
    });

    it('hides other releases and kinds, opens the rest, shrinks the rail, and All restores', async () => {
      const user = userEvent.setup();
      await open();
      const kind: ChangeKind = 'Fixed';
      const matching = withKind(kind);
      await user.click(screen.getByRole('radio', { name: new RegExp(`^${kind} \\(`) }));
      const main = within(screen.getByRole('main'));
      expect(main.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(matching.map((r) => `v${r.version}`));
      expect(main.getAllByRole('link').map((a) => a.textContent)).toEqual(matching.map((r) => `v${r.version}`));
      main.getAllByRole('button', { name: /changes$/ }).forEach((b) => expect(b).toHaveAttribute('aria-expanded', 'true'));
      main.getAllByRole('list').forEach((l) => expect(l.getAttribute('aria-label')).toMatch(new RegExp(`^${kind} in`)));
      await expectNoA11yViolations(screen.getByRole('main'));
      await user.click(screen.getByRole('radio', { name: 'All' }));
      expect(main.getAllByRole('heading', { level: 2 })).toHaveLength(RELEASES.length);
    });
  });

  it('keeps inline backticks as code elements in the list items', async () => {
    await open();
    const withCode = [...document.querySelectorAll('li')].filter((li) => li.querySelector('code'));
    expect(withCode.length).toBeGreaterThan(0);
    expect(withCode[0]!.querySelector('code')).toHaveClass('bit-code');
  });
});
