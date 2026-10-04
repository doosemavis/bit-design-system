import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ReleaseNotesPage } from './ReleaseNotesPage';

vi.mock('../content/changelog', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../content/changelog')>()),
  RELEASES: [
    { version: '0.2.0', date: '', sections: { Added: ['x'] } },
    { version: '0.1.0', date: '2026-10-04', sections: { Added: ['y'] } },
  ],
}));

describe('ReleaseNotesPage without a date', () => {
  it('renders a date badge only for releases that have a date', () => {
    render(<ReleaseNotesPage />);
    const [first, second] = screen.getAllByRole('heading', { level: 2 });
    expect(within(first!.parentElement!).queryByText(/\d{4}/)).toBeNull();
    expect(within(first!.parentElement!).queryByText('', { selector: '.bit-badge' })).toBeNull();
    expect(within(second!.parentElement!).getByText('2026-10-04')).toHaveClass('bit-badge');
  });
});
