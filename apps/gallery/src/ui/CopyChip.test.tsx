import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { CopyChip } from './CopyChip';
import { expectNoA11yViolations } from '../test/a11y';
import { stubClipboard } from '../test/clipboard';

async function click(element: HTMLElement): Promise<void> {
  await act(async () => {
    fireEvent.click(element);
  });
}

afterEach(() => {
  document.getElementById('bit-announcer')?.remove();
  Reflect.deleteProperty(navigator, 'clipboard');
  vi.useRealTimers();
});

describe('CopyChip', () => {
  it('is a button that shows its text in a Code chip, is named "Copy <text>", and has no accessibility violations', async () => {
    const { container } = render(<CopyChip text="#7C3AED" />);
    const button = screen.getByRole('button', { name: 'Copy #7C3AED' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('gallery-copy-chip');
    expect(button.querySelector('code')).toHaveClass('bit-code');
    expect(button).toHaveTextContent('#7C3AED');
    await expectNoA11yViolations(container);
  });

  it('hovering or focusing shows a "Copy" hint, which is not added to the name a second time', () => {
    render(<CopyChip text="--bit-radius-6px" />);
    const button = screen.getByRole('button', { name: 'Copy --bit-radius-6px' });
    fireEvent.focus(button);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Copy');
    expect(button).not.toHaveAttribute('aria-describedby');
  });

  it('copies exactly the text it shows, then the hint and the announcer say "Copied" until 2000ms pass', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn(() => Promise.resolve());
    stubClipboard(writeText);
    render(<CopyChip text="--bit-color-primary" />);
    const button = screen.getByRole('button');
    fireEvent.focus(button);
    await click(button);
    expect(writeText).toHaveBeenCalledExactlyOnceWith('--bit-color-primary');
    expect(screen.getByRole('tooltip')).toHaveTextContent('Copied');
    // The chip's own text never changes, so nothing around it moves.
    expect(button).toHaveTextContent('--bit-color-primary');
    act(() => vi.advanceTimersByTime(100));
    expect(document.getElementById('bit-announcer')).toHaveTextContent('Copied');
    act(() => vi.advanceTimersByTime(1900));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Copy');
  });

  it('a blocked or missing clipboard says "Copy failed", without throwing', async () => {
    stubClipboard(undefined);
    render(<CopyChip text="#EEEFE9" />);
    const button = screen.getByRole('button');
    fireEvent.focus(button);
    await click(button);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Copy failed');
  });
});
