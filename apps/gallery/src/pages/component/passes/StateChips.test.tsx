import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StateChips } from './StateChips';

const labels = ['Default', 'Disabled', 'Loading'];

describe('StateChips', () => {
  it('lists the states, then Try it, under a hidden "State" legend', () => {
    render(<StateChips labels={labels} value="Default" onPick={() => {}} />);
    expect(screen.getAllByRole('radio').map((r) => r.closest('label')?.textContent)).toEqual(['Default', 'Disabled', 'Loading', 'Try it']);
    expect(screen.getByRole('group', { name: 'State' })).toBeInTheDocument();
  });

  it('calls onPick with the label', async () => {
    const onPick = vi.fn();
    render(<StateChips labels={labels} value="Default" onPick={onPick} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Loading' }));
    expect(onPick).toHaveBeenCalledWith('Loading');
  });

  it('is one tab stop', async () => {
    render(
      <>
        <StateChips labels={labels} value="Default" onPick={() => {}} />
        <span tabIndex={0}>after</span>
      </>,
    );
    await userEvent.tab();
    expect(screen.getByRole('radio', { name: 'Default' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByText('after')).toHaveFocus();
  });
});
