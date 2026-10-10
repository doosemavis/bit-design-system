import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRef, useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Slider } from './Slider';
import type { SliderVariant } from './Slider';
import { Field } from '../Field/Field';
import { COLORS, SIZES } from '../../system/axes';
import { expectNoA11yViolations } from '../../test/a11y';

const VARIANTS: readonly SliderVariant[] = ['square', 'blocks', 'round'];

const root = (container: HTMLElement) => container.firstElementChild as HTMLElement;
const fill = (container: HTMLElement) => root(container).style.getPropertyValue('--_bit-slider-fill');
const states = (container: HTMLElement) =>
  [...container.querySelectorAll('.bit-slider__block')].map((b) => b.getAttribute('data-state') ?? '-').join(' ');

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Slider', () => {
  it('renders a root holding a native range input, then the track, fill and thumb, hidden from screen readers', () => {
    const { container } = render(<Slider aria-label="Volume" />);
    expect(root(container).tagName).toBe('DIV');
    expect(root(container).className).toBe('bit-slider bit-square bit-primary bit-md');
    const input = screen.getByRole('slider', { name: 'Volume' });
    expect(input).toHaveAttribute('type', 'range');
    expect(input.className).toBe('bit-slider__input');
    expect([...root(container).children].map((el) => el.className)).toEqual([
      'bit-slider__input',
      'bit-slider__track',
      'bit-slider__fill',
      'bit-slider__thumb',
    ]);
    for (const part of ['track', 'fill', 'thumb']) expect(container.querySelector(`.bit-slider__${part}`)).toHaveAttribute('aria-hidden', 'true');
  });

  it('min 0, max 100 and step 1 by default, starting at min', () => {
    render(<Slider aria-label="Volume" />);
    const input = screen.getByRole('slider');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '100');
    expect(input).toHaveAttribute('step', '1');
    expect(input).toHaveValue('0');
  });

  it.each(VARIANTS)('variant=%s goes on the root as bit-%s', (variant) => {
    const { container } = render(<Slider aria-label="x" variant={variant} />);
    expect(root(container).className).toBe(`bit-slider bit-${variant} bit-primary bit-md`);
  });

  it.each(SIZES)('size=%s goes on the root as bit-%s', (size) => {
    const { container } = render(<Slider aria-label="x" size={size} />);
    expect(root(container)).toHaveClass(`bit-${size}`);
  });

  it.each(COLORS)('color=%s goes on the root as bit-%s', (color) => {
    const { container } = render(<Slider aria-label="x" color={color} />);
    expect(root(container)).toHaveClass(`bit-${color}`);
  });

  it('a decorator in className replaces the prop, and the markup follows a variant class', () => {
    const { container } = render(<Slider aria-label="x" className="bit-blocks bit-danger bit-lg extra" max={10} />);
    expect(root(container).className).toBe('bit-slider bit-blocks bit-danger bit-lg extra');
    expect(container.querySelectorAll('.bit-slider__block')).toHaveLength(10);
    expect(container.querySelector('.bit-slider__thumb')).toBeNull();
  });

  it('the ref, id, name and aria-* go to the input; className, style and the rest go to the root', () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(
      <Slider ref={ref} id="vol" name="volume" form="settings" aria-describedby="help" data-testid="root" style={{ margin: 4 }} aria-label="Volume" />,
    );
    const input = screen.getByRole('slider');
    expect(ref.current).toBe(input);
    expect(input).toHaveAttribute('id', 'vol');
    expect(input).toHaveAttribute('name', 'volume');
    expect(input).toHaveAttribute('form', 'settings');
    expect(input).toHaveAttribute('aria-describedby', 'help');
    expect(screen.getByTestId('root')).toBe(root(container));
    expect(root(container).style.margin).toBe('4px');
    expect(fill(container)).toBe('0');
  });

  it('keeps a callback ref working beside its own', () => {
    const ref = vi.fn();
    render(<Slider ref={ref} aria-label="x" />);
    expect(ref).toHaveBeenCalledWith(screen.getByRole('slider'));
  });

  it('uncontrolled: starts at defaultValue, moves, and calls onChange then onValueChange with a number', () => {
    const calls: string[] = [];
    const { container } = render(
      <Slider
        aria-label="Volume"
        defaultValue={25}
        onChange={(e) => calls.push(`change:${e.target.value}`)}
        onValueChange={(v) => calls.push(`value:${typeof v}:${v}`)}
      />,
    );
    const input = screen.getByRole('slider');
    expect(input).toHaveValue('25');
    expect(fill(container)).toBe('0.25');
    fireEvent.change(input, { target: { value: '62' } });
    expect(input).toHaveValue('62');
    expect(fill(container)).toBe('0.62');
    expect(calls).toEqual(['change:62', 'value:number:62']);
  });

  it('controlled: shows value, reports changes, and moves only when the parent updates', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Slider aria-label="x" value={10} onValueChange={onValueChange} />);
    const input = screen.getByRole('slider');
    fireEvent.change(input, { target: { value: '30' } });
    expect(onValueChange).toHaveBeenCalledWith(30);
    expect(input).toHaveValue('10');
    rerender(<Slider aria-label="x" value={30} onValueChange={onValueChange} />);
    expect(input).toHaveValue('30');
  });

  it('works with a parent that keeps the value in state', () => {
    function Controlled() {
      const [volume, setVolume] = useState(40);
      return (
        <>
          <Slider aria-label="Volume" value={volume} onValueChange={setVolume} />
          <output>{volume}</output>
        </>
      );
    }
    render(<Controlled />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '41' } });
    expect(screen.getByRole('status')).toHaveTextContent('41');
  });

  it('snaps value and defaultValue to a step inside min..max, as the native input does', () => {
    const { rerender } = render(<Slider aria-label="x" defaultValue={37} step={10} />);
    expect(screen.getByRole('slider')).toHaveValue('40');
    rerender(<Slider aria-label="x" value={150} />);
    expect(screen.getByRole('slider')).toHaveValue('100');
    rerender(<Slider aria-label="x" value={-3} min={2} max={12} step={5} />);
    expect(screen.getByRole('slider')).toHaveValue('2');
  });

  it('keys are the native input’s: a real range input in the Tab order, with min, max and step for the browser to step by', async () => {
    const user = userEvent.setup();
    render(<Slider aria-label="Volume" min={0} max={10} step={2} defaultValue={4} />);
    await user.tab();
    const input = screen.getByRole('slider');
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('step', '2');
    // jsdom has no range keyboard; the browser's arrow keys fire change, as here (e2e presses the real keys).
    fireEvent.change(input, { target: { value: '6' } });
    expect(input).toHaveValue('6');
  });

  it('inside a Field: the label names it, the hint and error describe it, the error marks it invalid, and required is left off', () => {
    render(
      <Field label="Volume" hint="Turn it down at night." error="Too loud." required>
        <Slider defaultValue={90} />
      </Field>,
    );
    const input = screen.getByRole('slider', { name: 'Volume' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Turn it down at night. Too loud.');
    expect(input).not.toHaveAttribute('required');
    expect(document.querySelector('label.bit-field__label')).toHaveAttribute('for', input.id);
  });

  it('invalid sets aria-invalid on the input', () => {
    render(<Slider aria-label="x" invalid />);
    expect(screen.getByRole('slider')).toHaveAttribute('aria-invalid', 'true');
  });

  it('readOnly keeps focus and the value: a change moves nothing and calls nothing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onValueChange = vi.fn();
    render(<Slider aria-label="x" readOnly defaultValue={5} onChange={onChange} onValueChange={onValueChange} />);
    const input = screen.getByRole('slider');
    expect(input).toHaveAttribute('aria-readonly', 'true');
    expect(input).not.toHaveAttribute('readonly');
    await user.tab();
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: '50' } });
    expect(input).toHaveValue('5');
    expect(onChange).not.toHaveBeenCalled();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('disabled is the native attribute: out of the Tab order', async () => {
    const user = userEvent.setup();
    render(<Slider aria-label="x" disabled />);
    await user.tab();
    expect(screen.getByRole('slider')).toBeDisabled();
    expect(screen.getByRole('slider')).not.toHaveFocus();
  });

  it('submits its value under name, and a form reset returns it to defaultValue', () => {
    render(
      <form data-testid="form">
        <Slider aria-label="x" name="volume" defaultValue={20} />
      </form>,
    );
    const form = screen.getByTestId('form') as HTMLFormElement;
    const input = screen.getByRole('slider');
    fireEvent.change(input, { target: { value: '70' } });
    expect(new FormData(form).get('volume')).toBe('70');
    act(() => form.reset());
    expect(input).toHaveValue('20');
    expect(new FormData(form).get('volume')).toBe('20');
  });

  it('with no defaultValue, a form reset returns it to min', () => {
    render(
      <form data-testid="form">
        <Slider aria-label="x" min={10} />
      </form>,
    );
    fireEvent.change(screen.getByRole('slider'), { target: { value: '60' } });
    act(() => (screen.getByTestId('form') as HTMLFormElement).reset());
    expect(screen.getByRole('slider')).toHaveValue('10');
  });

  it('a form reset leaves a controlled Slider to its parent', () => {
    render(
      <form data-testid="form">
        <Slider aria-label="x" name="volume" value={70} defaultValue={20} onValueChange={() => {}} />
      </form>,
    );
    act(() => (screen.getByTestId('form') as HTMLFormElement).reset());
    expect(screen.getByRole('slider')).toHaveValue('70');
  });

  it('a disabled Slider submits nothing, like a disabled native input', () => {
    render(
      <form data-testid="form">
        <Slider aria-label="x" name="volume" disabled defaultValue={20} />
      </form>,
    );
    expect(new FormData(screen.getByTestId('form') as HTMLFormElement).get('volume')).toBeNull();
  });

  it('marks the root data-dragging from pointer down until the pointer lifts anywhere', () => {
    const { container } = render(<Slider aria-label="x" />);
    fireEvent.pointerDown(screen.getByRole('slider'));
    expect(root(container)).toHaveAttribute('data-dragging', '');
    fireEvent.pointerUp(window);
    expect(root(container)).not.toHaveAttribute('data-dragging');
  });

  it('a read-only Slider never looks dragged', () => {
    const { container } = render(<Slider aria-label="x" readOnly />);
    fireEvent.pointerDown(screen.getByRole('slider'));
    expect(root(container)).not.toHaveAttribute('data-dragging');
  });

  it('formatValue gives screen readers the words, as aria-valuetext; an explicit aria-valuetext wins', () => {
    const { rerender } = render(<Slider aria-label="x" defaultValue={30} formatValue={(v) => `${v}%`} />);
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '30%');
    rerender(<Slider aria-label="x" defaultValue={30} formatValue={(v) => `${v}%`} aria-valuetext="thirty" />);
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', 'thirty');
    rerender(<Slider aria-label="x" defaultValue={30} />);
    expect(screen.getByRole('slider')).not.toHaveAttribute('aria-valuetext');
  });

  describe('round', () => {
    it('puts a value bubble in the thumb, hidden from screen readers with it, shut until focus or a drag', () => {
      const { container } = render(<Slider aria-label="x" variant="round" defaultValue={42} formatValue={(v) => `${v}%`} />);
      const bubble = container.querySelector('.bit-slider__bubble')!;
      expect(bubble.parentElement).toHaveClass('bit-slider__thumb');
      expect(bubble.closest('[aria-hidden="true"]')).not.toBeNull();
      expect(bubble).toHaveTextContent('42%');
      expect(bubble).not.toHaveAttribute('data-open');
    });

    it('opens the bubble while focused', () => {
      const { container } = render(<Slider aria-label="x" variant="round" />);
      const bubble = container.querySelector('.bit-slider__bubble')!;
      act(() => screen.getByRole('slider').focus());
      expect(bubble).toHaveAttribute('data-open', '');
      act(() => screen.getByRole('slider').blur());
      expect(bubble).not.toHaveAttribute('data-open');
    });

    it('opens the bubble while dragged', () => {
      const { container } = render(<Slider aria-label="x" variant="round" />);
      const bubble = container.querySelector('.bit-slider__bubble')!;
      fireEvent.pointerDown(screen.getByRole('slider'));
      expect(bubble).toHaveAttribute('data-open', '');
      fireEvent.pointerUp(window);
      expect(bubble).not.toHaveAttribute('data-open');
    });

    it('square and blocks have no bubble', () => {
      for (const variant of ['square', 'blocks'] as const) {
        const { container, unmount } = render(<Slider aria-label="x" variant={variant} />);
        expect(container.querySelector('.bit-slider__bubble')).toBeNull();
        unmount();
      }
    });
  });

  describe('blocks', () => {
    /** Lay the blocks out 20px wide from x = 0, as a browser would, so pointer maths has something to read. */
    function layOut(container: HTMLElement, rtl = false) {
      const blocks = container.querySelectorAll<HTMLElement>('.bit-slider__block');
      blocks.forEach((b, i) => {
        const left = (rtl ? blocks.length - 1 - i : i) * 20;
        b.getBoundingClientRect = () => ({ left, right: left + 20, top: 0, bottom: 16, width: 20, height: 16, x: left, y: 0, toJSON: () => ({}) });
      });
    }

    it('draws one block per step in a hidden frame, and no track or thumb', () => {
      const { container } = render(<Slider aria-label="Lives" variant="blocks" max={10} />);
      expect(container.querySelectorAll('.bit-slider__block')).toHaveLength(10);
      expect(container.querySelector('.bit-slider__blocks')).toHaveAttribute('aria-hidden', 'true');
      expect(container.querySelector('.bit-slider__track')).toBeNull();
      expect(container.querySelector('.bit-slider__thumb')).toBeNull();
    });

    it('lights the blocks up to the value; the one at the value is current', () => {
      const { container, rerender } = render(<Slider aria-label="x" variant="blocks" max={10} value={6} />);
      expect(states(container)).toBe('on on on on on current - - - -');
      rerender(<Slider aria-label="x" variant="blocks" max={10} value={0} />);
      expect(states(container)).toBe('- - - - - - - - - -');
      rerender(<Slider aria-label="x" variant="blocks" min={0} max={100} step={20} value={100} />);
      expect(states(container)).toBe('on on on on current');
    });

    it('draws at most 20 blocks and warns in development when there are more steps', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { container } = render(<Slider aria-label="x" variant="blocks" defaultValue={50} />);
      expect(container.querySelectorAll('.bit-slider__block')).toHaveLength(20);
      expect(states(container).split(' ').filter((s) => s !== '-')).toHaveLength(10);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('0 to 100 by 1 is 100 steps'));
    });

    it('a click on a block picks it, through the input, so onChange and onValueChange run', () => {
      const onChange = vi.fn();
      const onValueChange = vi.fn();
      const { container } = render(<Slider aria-label="x" variant="blocks" max={10} onChange={onChange} onValueChange={onValueChange} />);
      layOut(container);
      fireEvent.pointerDown(container.querySelector('.bit-slider__blocks')!, { clientX: 45, button: 0 });
      expect(screen.getByRole('slider')).toHaveValue('3');
      expect(screen.getByRole('slider')).toHaveFocus();
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith(3);
      expect(states(container)).toBe('on on current - - - - - - -');
      fireEvent.pointerDown(container.querySelector('.bit-slider__blocks')!, { clientX: 55, button: 0 });
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('a drag keeps picking the block under the pointer while the frame holds it; other buttons do nothing', () => {
      const { container } = render(<Slider aria-label="x" variant="blocks" max={10} />);
      layOut(container);
      const frame = container.querySelector<HTMLElement>('.bit-slider__blocks')!;
      let held = false;
      frame.setPointerCapture = () => {
        held = true;
      };
      frame.hasPointerCapture = () => held;
      fireEvent.pointerDown(frame, { clientX: 150, button: 2 });
      expect(screen.getByRole('slider')).toHaveValue('0');
      fireEvent.pointerMove(frame, { clientX: 150 });
      expect(screen.getByRole('slider')).toHaveValue('0');
      fireEvent.pointerDown(frame, { clientX: 5, button: 0 });
      expect(screen.getByRole('slider')).toHaveValue('1');
      fireEvent.pointerMove(frame, { clientX: 150 });
      expect(screen.getByRole('slider')).toHaveValue('8');
      expect(root(container)).toHaveAttribute('data-dragging', '');
    });

    it('right to left, the first block is on the right', () => {
      const { container } = render(<Slider aria-label="x" variant="blocks" max={10} />);
      layOut(container, true);
      const real = window.getComputedStyle;
      vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => ({ ...real(el), direction: 'rtl' }) as CSSStyleDeclaration);
      // Block 1 is at 180..200, so the pointer at 45 is in the 8th block from the right.
      fireEvent.pointerDown(container.querySelector('.bit-slider__blocks')!, { clientX: 45, button: 0 });
      expect(screen.getByRole('slider')).toHaveValue('8');
    });

    it('a click before the first block picks min; read-only and disabled blocks ignore clicks', () => {
      const { container, rerender } = render(<Slider aria-label="x" variant="blocks" max={10} defaultValue={4} />);
      layOut(container);
      fireEvent.pointerDown(container.querySelector('.bit-slider__blocks')!, { clientX: -5, button: 0 });
      expect(screen.getByRole('slider')).toHaveValue('0');
      for (const locked of [{ readOnly: true }, { disabled: true }]) {
        rerender(<Slider aria-label="x" variant="blocks" max={10} value={4} {...locked} />);
        layOut(container);
        fireEvent.pointerDown(container.querySelector('.bit-slider__blocks')!, { clientX: 150, button: 0 });
        expect(screen.getByRole('slider')).toHaveValue('4');
      }
    });
  });

  it('warns in development when it has no name, and not inside a Field or with a label', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { unmount } = render(<Slider />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('bit-slider has no name'));
    unmount();
    warn.mockClear();
    render(
      <>
        <Field label="Volume">
          <Slider />
        </Field>
        <Slider aria-labelledby="t" />
        <span id="t">Treble</span>
      </>,
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it.each(VARIANTS)('%s has no accessibility violations', async (variant) => {
    const { container } = render(<Slider aria-label="Volume" variant={variant} max={10} defaultValue={6} />);
    await expectNoA11yViolations(container);
  });

  it.each([
    ['invalid', { invalid: true }],
    ['read-only', { readOnly: true }],
    ['disabled', { disabled: true }],
    ['round, focused', { variant: 'round' as const, autoFocus: true }],
  ])('%s has no accessibility violations', async (_name, props) => {
    const { container } = render(<Slider aria-label="Volume" {...props} />);
    await expectNoA11yViolations(container);
  });

  it('in a Field with a hint and an error, has no accessibility violations', async () => {
    const { container } = render(
      <Field label="Volume" hint="0 to 10." error="Too loud.">
        <Slider variant="blocks" max={10} defaultValue={9} formatValue={(v) => `${v} of 10`} />
      </Field>,
    );
    await expectNoA11yViolations(container);
  });
});
