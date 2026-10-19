import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderAt } from '../test/renderRoute';
import { expectNoA11yViolations } from '../test/a11y';
import userEvent from '@testing-library/user-event';
import { CHANGE_KINDS, RELEASES } from '../content/changelog';
import type { ChangeKind } from '../content/changelog';
import { renderInline } from '../ui/renderInline';
import { changeHeadline } from '../ui/ChangeList';
import { formatReleaseDate, KIND_BADGE } from './release-notes/kinds';
import { render, waitFor } from '@testing-library/react';
import { resetVersionsCache } from '../shell/useVersions';

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

/** The newest release, whose card opens first, and its first section. Not always Added: 0.1.11 only has Changed. */
const NEWEST = RELEASES[0]!;
const NEWEST_KIND = CHANGE_KINDS.find((kind) => NEWEST.sections[kind])!;

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

  it('has one heading per release, newest first, each with its date and year as a <time>', async () => {
    await open();
    const headings = within(screen.getByRole('main')).getAllByRole('heading', { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual(RELEASES.map((r) => `v${r.version}`));
    headings.forEach((h, i) => {
      const time = within(h.parentElement!).getByText(formatReleaseDate(RELEASES[i]!.date));
      expect(time.tagName).toBe('TIME');
      expect(time).toHaveAttribute('datetime', RELEASES[i]!.date);
      expect(time.textContent).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{4}$/);
    });
  });

  it('the rail dates carry the year too', async () => {
    await open();
    const rail = within(screen.getByRole('navigation', { name: 'Versions' }));
    const dates = rail.getAllByRole('link').map((a) => a.querySelector('.bit-text')?.textContent);
    expect(dates).toEqual(RELEASES.map((r) => formatReleaseDate(r.date)));
    for (const date of dates) expect(date).toMatch(/\d{4}$/);
  });

  it('labels each section list with its badge', async () => {
    await open();
    const { color, variant } = KIND_BADGE[NEWEST_KIND];
    const badge = within(screen.getByRole('main')).getAllByText(NEWEST_KIND)[0]!;
    expect(badge).toHaveClass(`bit-${color}`, `bit-${variant}`);
    expect(within(screen.getByRole('main')).getAllByRole('list').length).toBeGreaterThanOrEqual(1);
  });

  it('opens the newest card and keeps older ones closed until their toggle is pressed', async () => {
    const user = userEvent.setup();
    await open();
    const toggles = screen.getAllByRole('button', { name: /changes in v/ });
    expect(toggles[0]).toHaveAttribute('aria-expanded', 'true');
    expect(toggles[0]).toHaveTextContent('Hide changes');
    expect(toggles[1]).toHaveAttribute('aria-expanded', 'false');
    // Collapsed, the card is its header alone: no empty body band, and nothing for aria-controls to point at.
    const card = toggles[1]!.closest('.bit-card')!;
    expect(card.querySelector('.bit-card__body')).toBeNull();
    expect(toggles[1]).not.toHaveAttribute('aria-controls');
    await user.click(toggles[1]!);
    expect(toggles[1]).toHaveAttribute('aria-expanded', 'true');
    const body = document.getElementById(toggles[1]!.getAttribute('aria-controls')!)!;
    expect(body).toHaveClass('bit-card__body');
    expect(body).toBeVisible();
  });

  describe('against versions.json', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
      resetVersionsCache();
    });

    it('labels Latest the newest published release, and a newer CHANGELOG section Unreleased, never Latest', async () => {
      const [ahead, published] = RELEASES as [(typeof RELEASES)[number], (typeof RELEASES)[number]];
      const file = {
        latest: published.version.split('.').slice(0, 2).join('.'),
        lines: [{ line: published.version.split('.').slice(0, 2).join('.'), version: published.version, date: published.date, path: '/bit-design-system/', react: '^19.0.0', reactDom: '^19.0.0' }],
      };
      resetVersionsCache();
      vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(file) })));
      await open();
      const main = within(screen.getByRole('main'));
      const cardOf = (version: string) => within(main.getByRole('heading', { level: 2, name: `v${version}` }).closest('.bit-card') as HTMLElement);
      await waitFor(() => expect(cardOf(published.version).getByText('Latest')).toHaveClass('bit-badge'));
      expect(cardOf(ahead.version).queryByText('Latest')).toBeNull();
      expect(cardOf(ahead.version).getByText('Unreleased')).toHaveClass('bit-badge', 'bit-warning');
      expect(main.getAllByText('Latest')).toHaveLength(1);
    });
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

  it('puts aria-current on the newest release link at first', async () => {
    await open();
    const rail = within(screen.getByRole('navigation', { name: 'Versions' }));
    expect(rail.getByRole('link', { name: new RegExp(`^v${RELEASES[0]!.version.replaceAll('.', '\\.')}\\b`) })).toHaveAttribute('aria-current', 'true');
    expect(rail.getAllByRole('link').filter((a) => a.hasAttribute('aria-current'))).toHaveLength(1);
  });

  it('lists every version newest first in the rail, and a link opens its card and focuses its heading', async () => {
    const user = userEvent.setup();
    await open();
    const rail = within(screen.getByRole('navigation', { name: 'Versions' }));
    expect(rail.getAllByRole('link').map((a) => a.querySelector('span')?.textContent)).toEqual(RELEASES.map((r) => `v${r.version}`));
    const heading = screen.getByRole('heading', { level: 2, name: 'v0.1.4' });
    const toggle = within(heading.closest('.bit-card') as HTMLElement).getByRole('button');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(rail.getByRole('link', { name: /^v0\.1\.4\b/ }));
    expect(heading).toHaveFocus();
    expect(rail.getByRole('link', { name: /^v0\.1\.4\b/ })).toHaveAttribute('aria-current', 'true');
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
      const rail = within(screen.getByRole('navigation', { name: 'Versions' }));
      expect(rail.getAllByRole('link').map((a) => a.querySelector('span')?.textContent)).toEqual(matching.map((r) => `v${r.version}`));
      main.getAllByRole('button', { name: /changes in v/ }).forEach((b) => expect(b).toHaveAttribute('aria-expanded', 'true'));
      main.getAllByRole('list').forEach((l) => expect(l.getAttribute('aria-label')).toMatch(new RegExp(`^${kind} in`)));
      await expectNoA11yViolations(screen.getByRole('main'));
      await user.click(screen.getByRole('radio', { name: 'All' }));
      expect(main.getAllByRole('heading', { level: 2 })).toHaveLength(RELEASES.length);
    });

    const states = () => screen.getAllByRole('button', { name: /changes in v/ }).map((b) => b.getAttribute('aria-expanded'));

    it('keeps toggles enabled under a filter so a card can be closed and re-opened', async () => {
      const user = userEvent.setup();
      await open();
      await user.click(screen.getByRole('radio', { name: /^Added \(/ }));
      const toggle = screen.getAllByRole('button', { name: /changes in v/ })[0]!;
      expect(toggle).toBeEnabled();
      await user.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await user.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });

    it('does not leak filtered open/close or rail choices into the All view', async () => {
      const user = userEvent.setup();
      await open();
      const before = states();
      await user.click(screen.getByRole('radio', { name: /^Added \(/ }));
      const toggles = screen.getAllByRole('button', { name: /changes in v/ });
      await user.click(toggles[0]!);
      await user.click(toggles[toggles.length - 1]!);
      const rail = within(screen.getByRole('navigation', { name: 'Versions' }));
      const links = rail.getAllByRole('link');
      await user.click(links[links.length - 1]!);
      await user.click(screen.getByRole('radio', { name: 'All' }));
      expect(states()).toEqual(before);
    });
  });

  // Critique 2026-10-11: a code chip on nearly every noun. Headlines first; the API detail is one switch away.
  it('reads as plain headlines at first, with no code chips', async () => {
    await open();
    const items = within(screen.getByRole('list', { name: `${NEWEST_KIND} in v${NEWEST.version}` })).getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual(
      NEWEST.sections[NEWEST_KIND]!.map((item) => {
        const { subject, text } = changeHeadline(item);
        return subject ? `${subject}: ${text}` : text;
      }),
    );
    expect(screen.getByRole('main').querySelector('li code')).toBeNull();
    expect(screen.getByRole('switch', { name: 'Show API details' })).not.toBeChecked();
  });

  it('Show API details brings back every item in full, inline backticks as code', async () => {
    const user = userEvent.setup();
    await open();
    await user.click(screen.getByRole('switch', { name: 'Show API details' }));
    const list = screen.getByRole('list', { name: `${NEWEST_KIND} in v${NEWEST.version}` });
    expect(within(list).getAllByRole('listitem').map((li) => li.textContent)).toEqual(
      NEWEST.sections[NEWEST_KIND]!.map((item) => item.replaceAll('`', '')),
    );
    const withCode = [...document.querySelectorAll('li')].filter((li) => li.querySelector('code'));
    expect(withCode.length).toBeGreaterThan(0);
    expect(withCode[0]!.querySelector('code')).toHaveClass('bit-code');
  });
});
