import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderAt } from '../test/renderRoute';
import { expectNoA11yViolations } from '../test/a11y';
import { RELEASES } from '../content/changelog';
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

  it('has the Start here eyebrow and no axe violations', async () => {
    const { container } = await open();
    expect(within(screen.getByRole('main')).getByText('Start here')).toBeInTheDocument();
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
});
