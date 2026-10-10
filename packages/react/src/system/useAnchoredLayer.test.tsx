import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { useRef } from 'react';
import { useAnchoredLayer } from './useAnchoredLayer';
import type { PlaceLayer } from './useAnchoredLayer';

let placement: string | null = 'bottom';
const place = vi.fn<PlaceLayer>((_trigger, layer) => {
  layer.style.top = '10px';
  return placement;
});

interface HarnessProps {
  open: boolean;
  onLeave?: () => void;
  contents?: string;
  restartKey?: string;
}

function Harness({ open, onLeave, contents, restartKey }: HarnessProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  useAnchoredLayer(open, triggerRef, layerRef, { place, onLeave, contents, restartKey });
  return (
    <>
      <button ref={triggerRef} type="button">
        Trigger
      </button>
      <div ref={layerRef} data-testid="layer" hidden={!open}>
        <div data-testid="inner">Layer</div>
      </div>
    </>
  );
}

const layer = () => document.querySelector<HTMLElement>('[data-testid="layer"]')!;

beforeEach(() => {
  placement = 'bottom';
  place.mockClear();
});

describe('useAnchoredLayer', () => {
  it('does nothing while closed', () => {
    render(<Harness open={false} />);
    expect(place).not.toHaveBeenCalled();
    expect(layer()).not.toHaveAttribute('data-entered');
  });

  it('opening places the layer, records its placement, then marks it entered', () => {
    render(<Harness open />);
    expect(place).toHaveBeenCalledTimes(1);
    expect(place.mock.calls[0]![1]).toBe(layer());
    expect(layer()).toHaveAttribute('data-placement', 'bottom');
    expect(layer()).toHaveAttribute('data-entered');
    expect(layer().style.top).toBe('10px');
  });

  it('follows scrolls and resizes, but not a scroll inside the layer', () => {
    render(<Harness open />);
    place.mockClear();
    fireEvent.scroll(document.body);
    fireEvent(window, new Event('resize'));
    expect(place).toHaveBeenCalledTimes(2);
    fireEvent.scroll(layer());
    fireEvent.scroll(document.querySelector('[data-testid="inner"]')!);
    expect(place).toHaveBeenCalledTimes(2);
    expect(() => window.dispatchEvent(new Event('scroll'))).not.toThrow();
    expect(place).toHaveBeenCalledTimes(3);
  });

  it('calls onLeave when place reports the trigger out of view', () => {
    const onLeave = vi.fn();
    render(<Harness open onLeave={onLeave} />);
    placement = null;
    fireEvent.scroll(document.body);
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it('closing clears entered and placement and stops following', () => {
    const { rerender } = render(<Harness open />);
    rerender(<Harness open={false} />);
    expect(layer()).not.toHaveAttribute('data-entered');
    expect(layer()).not.toHaveAttribute('data-placement');
    place.mockClear();
    fireEvent.scroll(document.body);
    fireEvent(window, new Event('resize'));
    expect(place).not.toHaveBeenCalled();
  });

  it('a new contents string places it again, an equal one does not', () => {
    const { rerender } = render(<Harness open contents="a" />);
    rerender(<Harness open contents="a" />);
    expect(place).toHaveBeenCalledTimes(1);
    placement = 'top';
    rerender(<Harness open contents="b" />);
    expect(place).toHaveBeenCalledTimes(2);
    expect(layer()).toHaveAttribute('data-placement', 'top');
  });

  it('a contents change that finds the trigger out of view calls onLeave', () => {
    const onLeave = vi.fn();
    const { rerender } = render(<Harness open contents="a" onLeave={onLeave} />);
    placement = null;
    rerender(<Harness open contents="b" onLeave={onLeave} />);
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  describe('top layer', () => {
    const show = vi.fn();
    const hide = vi.fn();
    beforeEach(() => {
      show.mockClear();
      hide.mockClear();
      Object.defineProperty(HTMLElement.prototype, 'showPopover', { configurable: true, writable: true, value: show });
      Object.defineProperty(HTMLElement.prototype, 'hidePopover', { configurable: true, writable: true, value: hide });
    });
    afterEach(() => {
      cleanup();
      Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
      Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
    });

    it('shows a manual popover on open and hides it on close', () => {
      const { rerender } = render(<Harness open={false} />);
      expect(show).not.toHaveBeenCalled();
      rerender(<Harness open />);
      expect(layer()).toHaveAttribute('popover', 'manual');
      expect(show).toHaveBeenCalledTimes(1);
      rerender(<Harness open={false} />);
      expect(hide).toHaveBeenCalledTimes(1);
    });

    it('a new restartKey shows it afresh; a new contents string only places it', () => {
      const { rerender } = render(<Harness open restartKey="a" contents="a" />);
      rerender(<Harness open restartKey="a" contents="b" />);
      expect(show).toHaveBeenCalledTimes(1);
      rerender(<Harness open restartKey="b" contents="b" />);
      expect(hide).toHaveBeenCalledTimes(1);
      expect(show).toHaveBeenCalledTimes(2);
      expect(layer()).toHaveAttribute('data-entered');
    });

    it('unmounting while open hides the popover', () => {
      const { unmount } = render(<Harness open />);
      unmount();
      expect(hide).toHaveBeenCalledTimes(1);
    });
  });

  it('without the Popover API it leaves popover off and relies on hidden', () => {
    render(<Harness open />);
    expect(layer()).not.toHaveAttribute('popover');
  });
});
