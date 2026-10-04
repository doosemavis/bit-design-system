import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { COPY_RESET_MS, CopyButton } from './CopyButton';
import { expectNoA11yViolations } from '../test/a11y';

function stubClipboard(writeText: ((text: string) => Promise<void>) | undefined): void {
  Object.defineProperty(navigator, 'clipboard', { value: writeText ? { writeText } : undefined, configurable: true });
}

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

describe('CopyButton', () => {
  it('reads "Copy", is named by its label, and has no accessibility violations', async () => {
    const { container } = render(<CopyButton text="var(--bit-color-bg)" label="Copy --bit-color-bg" />);
    const button = screen.getByRole('button', { name: 'Copy --bit-color-bg' });
    expect(button).toHaveTextContent('Copy');
    expect(button).toHaveClass('bit-button', 'bit-sm', 'bit-outline', 'bit-neutral');
    await expectNoA11yViolations(container);
  });

  it('copies its text, shows and announces "Copied", then reads "Copy" again after 2000ms', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn(() => Promise.resolve());
    stubClipboard(writeText);
    render(<CopyButton text="import { Button } from '@bit-ds/react';" label="Copy import line" />);
    await click(screen.getByRole('button'));
    expect(writeText).toHaveBeenCalledWith("import { Button } from '@bit-ds/react';");
    expect(screen.getByRole('button')).toHaveTextContent('Copied');
    act(() => vi.advanceTimersByTime(100));
    expect(document.getElementById('bit-announcer')).toHaveTextContent('Copied');
    act(() => vi.advanceTimersByTime(COPY_RESET_MS));
    expect(screen.getByRole('button', { name: 'Copy import line' })).toHaveTextContent('Copy');
  });

  it('a blocked or missing clipboard shows "Copy failed" in danger, without throwing', async () => {
    stubClipboard(undefined);
    render(<CopyButton text="x" label="Copy x" />);
    await click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveTextContent('Copy failed');
    expect(screen.getByRole('button')).toHaveClass('bit-danger');
  });

  it('unmounting while the clipboard is busy starts no timer', async () => {
    vi.useFakeTimers();
    let finish: () => void = () => {};
    stubClipboard(() => new Promise<void>((resolve) => (finish = resolve)));
    const { unmount } = render(<CopyButton text="x" label="Copy x" />);
    fireEvent.click(screen.getByRole('button'));
    unmount();
    await act(async () => finish());
    expect(vi.getTimerCount()).toBe(0);
  });
});
