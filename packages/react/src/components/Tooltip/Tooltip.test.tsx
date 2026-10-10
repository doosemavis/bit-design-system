import { createRef } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Tooltip } from './Tooltip';
import { Button } from '../Button/Button';
import { expectNoA11yViolations } from '../../test/a11y';

afterEach(() => vi.useRealTimers());
const bubble = () => screen.getByRole('tooltip', { hidden: true });

describe('Tooltip', () => {
  it('is hidden until the pointer enters, then shows its content, and the trigger is described by it', () => {
    render(<Tooltip content="Copy link"><Button>Share</Button></Tooltip>);
    expect(bubble()).not.toBeVisible();
    fireEvent.pointerEnter(screen.getByRole('button'));
    expect(bubble()).toBeVisible();
    expect(bubble()).toHaveTextContent('Copy link');
    expect(bubble()).toHaveClass('bit-tooltip');
    expect(screen.getByRole('button')).toHaveAttribute('aria-describedby', bubble().id);
  });
  it('closes 100ms after the pointer leaves, and stays open while the pointer is on the bubble', () => {
    vi.useFakeTimers();
    render(<Tooltip content="Copy link"><Button>Share</Button></Tooltip>);
    fireEvent.pointerEnter(screen.getByRole('button'));
    fireEvent.pointerLeave(screen.getByRole('button'));
    fireEvent.pointerEnter(bubble());
    act(() => vi.advanceTimersByTime(200));
    expect(bubble()).toBeVisible();
    fireEvent.pointerLeave(bubble());
    act(() => vi.advanceTimersByTime(100));
    expect(bubble()).not.toBeVisible();
  });
  it('opens on focus and closes on blur', () => {
    render(<Tooltip content="Copy link"><Button>Share</Button></Tooltip>);
    fireEvent.focus(screen.getByRole('button'));
    expect(bubble()).toBeVisible();
    fireEvent.blur(screen.getByRole('button'));
    expect(bubble()).not.toBeVisible();
  });
  it('Esc closes it and is consumed only while it is open', () => {
    const outer = vi.fn();
    document.addEventListener('keydown', outer);
    render(<Tooltip content="Copy link"><Button>Share</Button></Tooltip>);
    fireEvent.focus(screen.getByRole('button'));
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    expect(bubble()).not.toBeVisible();
    expect(outer).not.toHaveBeenCalled();
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(outer).toHaveBeenCalledTimes(1);
    document.removeEventListener('keydown', outer);
  });
  it('a controlled open={true} does not consume Esc, so an enclosing Dialog still hears it', () => {
    const outer = vi.fn();
    document.addEventListener('keydown', outer);
    render(<Tooltip content="x" open><Button>Share</Button></Tooltip>);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Escape' });
    expect(outer).toHaveBeenCalledTimes(1);
    expect(bubble()).toBeVisible();
    document.removeEventListener('keydown', outer);
  });
  it('describe={false} leaves aria-describedby off; an existing one is kept and joined', () => {
    const { rerender } = render(<Tooltip content="x" describe={false}><Button aria-describedby="hint">Share</Button></Tooltip>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-describedby', 'hint');
    rerender(<Tooltip content="x"><Button aria-describedby="hint">Share</Button></Tooltip>);
    expect(screen.getByRole('button').getAttribute('aria-describedby')).toBe(`hint ${bubble().id}`);
  });
  it('open={true} shows it without hover; open={false} keeps it shut on hover', () => {
    const { rerender } = render(<Tooltip content="x" open><Button>Share</Button></Tooltip>);
    expect(bubble()).toBeVisible();
    rerender(<Tooltip content="x" open={false}><Button>Share</Button></Tooltip>);
    fireEvent.pointerEnter(screen.getByRole('button'));
    expect(bubble()).not.toBeVisible();
  });
  it("keeps the child's own handlers and ref", () => {
    const onFocus = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(<Tooltip content="x"><Button ref={ref} onFocus={onFocus}>Share</Button></Tooltip>);
    fireEvent.focus(screen.getByRole('button'));
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(ref.current).toBe(screen.getByRole('button'));
  });
  it('marks the open bubble with its placement', () => {
    render(<Tooltip content="x" open><Button>Share</Button></Tooltip>);
    expect(bubble()).toHaveAttribute('data-placement');
  });
  it.each(['', undefined, null, false] as const)('content=%s renders no bubble and no aria-describedby, and hover shows nothing', (content) => {
    render(<Tooltip content={content}><Button>Share</Button></Tooltip>);
    const button = screen.getByRole('button');
    fireEvent.pointerEnter(button);
    fireEvent.focus(button);
    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
    expect(button).not.toHaveAttribute('aria-describedby');
  });
  it('keeps an existing aria-describedby when content is empty', () => {
    render(<Tooltip content=""><Button aria-describedby="hint">Share</Button></Tooltip>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-describedby', 'hint');
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
      cleanup(); // unmount while the stubs still exist: an open tooltip calls hidePopover on the way out
      Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
      Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
    });

    it('opening sets popover="manual" and calls showPopover; closing calls hidePopover', () => {
      render(<Tooltip content="x"><Button>Share</Button></Tooltip>);
      expect(show).not.toHaveBeenCalled();
      fireEvent.focus(screen.getByRole('button'));
      expect(show).toHaveBeenCalledTimes(1);
      expect(bubble()).toHaveAttribute('popover', 'manual');
      expect(hide).not.toHaveBeenCalled();
      fireEvent.blur(screen.getByRole('button'));
      expect(hide).toHaveBeenCalledTimes(1);
    });
    it('a string content change while open places it again', () => {
      const { rerender } = render(<Tooltip content="short" open><Button>Share</Button></Tooltip>);
      expect(show).toHaveBeenCalledTimes(1);
      rerender(<Tooltip content="a much longer hint" open><Button>Share</Button></Tooltip>);
      expect(show).toHaveBeenCalledTimes(2);
      expect(hide).toHaveBeenCalledTimes(1);
      expect(bubble()).toHaveAttribute('data-placement');
      expect(bubble()).toHaveTextContent('a much longer hint');
    });
  });

  it('has no accessibility violations, closed or open', async () => {
    const { container } = render(<Tooltip content="Copy link"><Button>Share</Button></Tooltip>);
    await expectNoA11yViolations(container);
    fireEvent.pointerEnter(screen.getByRole('button'));
    expect(bubble()).toBeVisible();
    await expectNoA11yViolations(container);
  });
});
