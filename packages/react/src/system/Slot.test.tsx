import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import type { MouseEvent } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { composeRefs, createSlot, mergeProps } from './Slot';

const Slot = createSlot('Link');
const ERROR = '[bit] Link asChild needs exactly one child element.';

describe('Slot', () => {
  it('renders its only child element, not a wrapper', () => {
    const { container } = render(
      <Slot>
        <a href="/docs">Docs</a>
      </Slot>,
    );
    expect(container.innerHTML).toBe('<a href="/docs">Docs</a>');
  });

  it('joins className with the Slot first and the child second', () => {
    render(
      <Slot className="bit-link bit-primary">
        <a href="/docs" className="router-active">
          Docs
        </a>
      </Slot>,
    );
    expect(screen.getByRole('link').className).toBe('bit-link bit-primary router-active');
  });

  it('merges style, and the child wins a clash', () => {
    render(
      <Slot style={{ color: 'red', marginTop: 4 }}>
        <a href="/docs" style={{ color: 'blue' }}>
          Docs
        </a>
      </Slot>,
    );
    const link = screen.getByRole('link');
    expect(link.style.color).toBe('blue');
    expect(link.style.marginTop).toBe('4px');
  });

  it('other props merge with the child winning', () => {
    render(
      <Slot title="from slot" data-slot="" aria-label="slot">
        <a href="/docs" title="from child">
          Docs
        </a>
      </Slot>,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('title', 'from child');
    expect(link).toHaveAttribute('data-slot', '');
    expect(link).toHaveAttribute('aria-label', 'slot');
  });

  it('runs the child handler first, then the Slot handler', async () => {
    const calls: string[] = [];
    render(
      <Slot onClick={() => calls.push('slot')}>
        <button type="button" onClick={() => calls.push('child')}>
          Go
        </button>
      </Slot>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(calls).toEqual(['child', 'slot']);
  });

  it('skips the Slot handler when the child prevents the default', async () => {
    const slot = vi.fn();
    render(
      <Slot onClick={slot}>
        <a href="#x" onClick={(event: MouseEvent) => event.preventDefault()}>
          Go
        </a>
      </Slot>,
    );
    await userEvent.click(screen.getByRole('link'));
    expect(slot).not.toHaveBeenCalled();
  });

  it('keeps a handler that only one side has', async () => {
    const slot = vi.fn();
    const child = vi.fn();
    render(
      <>
        <Slot onClick={slot}>
          <button type="button">Slot only</button>
        </Slot>
        <Slot onMouseDown={slot}>
          <button type="button" onClick={child}>
            Child only
          </button>
        </Slot>
      </>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Slot only' }));
    expect(slot).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Child only' }));
    expect(child).toHaveBeenCalledTimes(1);
  });

  it('forwards the ref and still feeds the child ref', () => {
    const slotRef = createRef<HTMLElement>();
    const childRef = vi.fn();
    render(
      <Slot ref={slotRef}>
        <a href="/docs" ref={childRef}>
          Docs
        </a>
      </Slot>,
    );
    const link = screen.getByRole('link');
    expect(slotRef.current).toBe(link);
    expect(childRef).toHaveBeenCalledWith(link);
  });

  it.each([
    ['no child', undefined],
    ['two children', [<a key="1" href="/a">A</a>, <a key="2" href="/b">B</a>]],
    ['a text child', 'Docs'],
  ])('throws with %s', (_name, children) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Slot>{children}</Slot>)).toThrow(ERROR);
    vi.restoreAllMocks();
  });

  it('names its owner in the error and the display name', () => {
    const ButtonSlot = createSlot('Button');
    expect(ButtonSlot.displayName).toBe('Button.Slot');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ButtonSlot />)).toThrow('[bit] Button asChild needs exactly one child element.');
    vi.restoreAllMocks();
  });

  it('keeps the composed ref stable across re-renders, so a child callback ref fires once', () => {
    const slotRef = createRef<HTMLElement>();
    const childRef = vi.fn();
    const ui = (label: string) => (
      <Slot ref={slotRef}>
        <a href="/docs" ref={childRef}>
          {label}
        </a>
      </Slot>
    );
    const { rerender } = render(ui('Docs'));
    rerender(ui('Docs again'));
    expect(childRef).toHaveBeenCalledTimes(1);
    expect(slotRef.current).toBe(screen.getByRole('link'));
  });
});

describe('mergeProps', () => {
  it('leaves className and style off when neither side has them', () => {
    expect(mergeProps({ id: 'a' }, { title: 'b' })).toEqual({ id: 'a', title: 'b', className: undefined });
  });

  it('keeps the child handler when the Slot passes an empty one', () => {
    const child = () => {};
    expect(mergeProps({ onClick: undefined }, { onClick: child }).onClick).toBe(child);
  });

  it('keeps a style only the child has', () => {
    expect(mergeProps({}, { style: { color: 'red' } }).style).toEqual({ color: 'red' });
  });
});

describe('composeRefs', () => {
  it('sets object refs and calls function refs, and skips null and undefined', () => {
    const object = createRef<HTMLElement>();
    const fn = vi.fn();
    const node = document.createElement('a');
    composeRefs<HTMLElement>(object, fn, null, undefined)(node);
    expect(object.current).toBe(node);
    expect(fn).toHaveBeenCalledWith(node);
  });

  it('returns nothing when no ref hands back a cleanup', () => {
    expect(composeRefs<HTMLElement>(createRef<HTMLElement>(), () => {})(document.createElement('a'))).toBeUndefined();
  });

  it('returns a cleanup when a ref does: it runs that cleanup and nulls the other refs (React 19)', () => {
    const object = createRef<HTMLElement>();
    const plain = vi.fn();
    const cleanup = vi.fn();
    const node = document.createElement('a');
    const dispose = composeRefs<HTMLElement>(object, plain, () => cleanup)(node);
    expect(typeof dispose).toBe('function');
    if (typeof dispose === 'function') dispose();
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(object.current).toBeNull();
    expect(plain).toHaveBeenLastCalledWith(null);
  });
});
