import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fadeOut } from './motion';
import { useFadeOut } from './stageEffects';

vi.mock('./motion', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./motion')>()),
  fadeOut: vi.fn(() => null),
}));

function Fading({ show }: { show: boolean }) {
  const { mounted, ref } = useFadeOut<HTMLDivElement>(show);
  return mounted ? <div ref={ref} data-testid="fading" /> : null;
}

const fading = () => document.querySelector('[data-testid="fading"]');

afterEach(() => {
  vi.mocked(fadeOut).mockReset();
  vi.mocked(fadeOut).mockImplementation(() => null);
});

describe('useFadeOut', () => {
  it('unmounts at once when there is no fade (reduced motion, or no animate())', () => {
    const { rerender } = render(<Fading show />);
    expect(fading()).not.toBeNull();
    rerender(<Fading show={false} />);
    expect(fadeOut).toHaveBeenCalledTimes(1);
    expect(fading()).toBeNull();
  });

  it('stays mounted for the fade, on the element itself, then unmounts when it finishes', async () => {
    let finish: () => void = () => {};
    const animation = { finished: new Promise<void>((resolve) => (finish = resolve)), cancel: vi.fn() } as unknown as Animation;
    vi.mocked(fadeOut).mockImplementation(() => animation);
    const { rerender } = render(<Fading show />);
    const el = fading();
    rerender(<Fading show={false} />);
    expect(vi.mocked(fadeOut).mock.calls[0]![0]).toBe(el);
    expect(fading()).toBe(el);
    await act(async () => finish());
    expect(fading()).toBeNull();
  });

  it('showing it again mid-fade cancels the fade and keeps it', () => {
    const animation = { finished: new Promise<void>(() => {}), cancel: vi.fn() } as unknown as Animation;
    vi.mocked(fadeOut).mockImplementation(() => animation);
    const { rerender } = render(<Fading show />);
    rerender(<Fading show={false} />);
    rerender(<Fading show />);
    expect(animation.cancel).toHaveBeenCalled();
    expect(fading()).not.toBeNull();
  });

  it('never fades something that was never shown', () => {
    render(<Fading show={false} />);
    expect(fadeOut).not.toHaveBeenCalled();
    expect(fading()).toBeNull();
  });
});
