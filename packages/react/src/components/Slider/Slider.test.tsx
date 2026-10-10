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

  describe('smooth, the default', () => {
    /** Lay the track out 224px wide from x = 0 under a 24px thumb, so the thumb's middle travels 12..212. */
    function layOutTrack(container: HTMLElement) {
      const rect = (left: number, width: number) => () => ({ left, right: left + width, top: 0, bottom: 24, width, height: 24, x: left, y: 0, toJSON: () => ({}) });
      container.querySelector<HTMLElement>('.bit-slider__track')!.getBoundingClientRect = rect(0, 224);
      container.querySelector<HTMLElement>('.bit-slider__thumb')!.getBoundingClientRect = rect(0, 24);
    }

    it.each(['square', 'round'] as const)('%s: the thumb glides under the pointer, and settles on the step when the pointer lifts', (variant) => {
      const onValueChange = vi.fn();
      const { container } = render(<Slider aria-label="x" variant={variant} step={10} defaultValue={40} onValueChange={onValueChange} />);
      layOutTrack(container);
      const input = screen.getByRole('slider');
      fireEvent.pointerDown(input, { clientX: 99 });
      expect(fill(container)).toBe('0.435');
      // The browser moves the input itself, a whole step at a time.
      fireEvent.change(input, { target: { value: '40' } });
      expect(onValueChange).not.toHaveBeenCalled();
      fireEvent.pointerMove(window, { clientX: 120 });
      expect(fill(container)).toBe('0.54');
      fireEvent.change(input, { target: { value: '50' } });
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith(50);
      expect(fill(container)).toBe('0.54');
      fireEvent.pointerUp(window);
      expect(fill(container)).toBe('0.5');
      expect(input).toHaveValue('50');
    });

    it('the round bubble and the input say the snapped value while the thumb glides', () => {
      const { container } = render(<Slider aria-label="x" variant="round" step={10} defaultValue={40} formatValue={(v) => `${v}%`} />);
      layOutTrack(container);
      const input = screen.getByRole('slider');
      fireEvent.pointerDown(input, { clientX: 120 });
      fireEvent.change(input, { target: { value: '50' } });
      expect(container.querySelector('.bit-slider__bubble')).toHaveTextContent('50%');
      expect(input).toHaveAttribute('aria-valuetext', '50%');
      expect(input).toHaveValue('50');
    });

    it('keys and forms move by whole steps: the native input keeps its step, so only a pointer glides', () => {
      const { container } = render(
        <form data-testid="form">
          <Slider aria-label="x" name="volume" step={10} defaultValue={40} />
        </form>,
      );
      const input = screen.getByRole('slider');
      expect(input).toHaveAttribute('step', '10');
      // An arrow key fires change with the next step, and the thumb goes straight there.
      fireEvent.change(input, { target: { value: '50' } });
      expect(container.querySelector<HTMLElement>('.bit-slider')!.style.getPropertyValue('--_bit-slider-fill')).toBe('0.5');
      expect(new FormData(screen.getByTestId('form') as HTMLFormElement).get('volume')).toBe('50');
    });

    it('right to left, the pointer is measured from the right', () => {
      const { container } = render(<Slider aria-label="x" />);
      layOutTrack(container);
      const real = window.getComputedStyle;
      vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => ({ ...real(el), direction: 'rtl' }) as CSSStyleDeclaration);
      fireEvent.pointerDown(screen.getByRole('slider'), { clientX: 162 });
      expect(fill(container)).toBe('0.25');
    });

    it('notched, read-only and a track not laid out never glide', () => {
      const cases = [{ notched: true }, { readOnly: true }];
      for (const props of cases) {
        const { container, unmount } = render(<Slider aria-label="x" step={10} defaultValue={40} {...props} />);
        layOutTrack(container);
        fireEvent.pointerDown(screen.getByRole('slider'), { clientX: 120 });
        expect(fill(container)).toBe('0.4');
        unmount();
      }
      const { container } = render(<Slider aria-label="x" step={10} defaultValue={40} />);
      fireEvent.pointerDown(screen.getByRole('slider'), { clientX: 120 });
      expect(fill(container)).toBe('0.4');
    });
  });

  describe('notched', () => {
    const at = (container: HTMLElement) =>
      [...container.querySelectorAll<HTMLElement>('.bit-slider__notch')].map((mark) => mark.style.getPropertyValue('--_bit-slider-at'));

    it('marks the root data-notched and draws a mark per step under the track, hidden from screen readers', () => {
      const { container } = render(<Slider aria-label="Difficulty" notched min={1} max={5} defaultValue={3} />);
      expect(root(container)).toHaveAttribute('data-notched', '');
      const marks = container.querySelector('.bit-slider__notches')!;
      expect(marks).toHaveAttribute('aria-hidden', 'true');
      expect(marks.previousElementSibling).toHaveClass('bit-slider__thumb');
      expect(at(container)).toEqual(['0', '0.25', '0.5', '0.75', '1']);
    });

    it('marks only the steps it can reach', () => {
      const { container } = render(<Slider aria-label="x" notched max={10} step={3} />);
      expect(at(container)).toEqual(['0', '0.3', '0.6', '0.9']);
    });

    it('round is notched the same way', () => {
      const { container } = render(<Slider aria-label="x" variant="round" notched max={100} step={10} />);
      expect(container.querySelectorAll('.bit-slider__notch')).toHaveLength(11);
    });

    it('draws 20 marks at most; with more steps it draws none and warns in development', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { container, rerender } = render(<Slider aria-label="x" notched max={19} />);
      expect(container.querySelectorAll('.bit-slider__notch')).toHaveLength(20);
      expect(warn).not.toHaveBeenCalled();
      rerender(<Slider aria-label="x" notched max={100} />);
      expect(container.querySelector('.bit-slider__notches')).toBeNull();
      expect(root(container)).toHaveAttribute('data-notched', '');
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('0 to 100 by 1 is 101 marks'));
    });

    it('without notched there are no marks and no data-notched', () => {
      const { container } = render(<Slider aria-label="x" max={10} />);
      expect(root(container)).not.toHaveAttribute('data-notched');
      expect(container.querySelector('.bit-slider__notches')).toBeNull();
    });
  });

  describe('numberInput', () => {
    const box = () => screen.getByRole('spinbutton');

    it('adds a number box after the range parts and marks the root data-number-input', () => {
      const { container } = render(<Slider aria-label="Volume" numberInput defaultValue={40} />);
      expect(root(container)).toHaveAttribute('data-number-input', '');
      expect(root(container).lastElementChild).toHaveClass('bit-slider__box');
      expect(box()).toHaveAttribute('type', 'number');
      expect(box()).toHaveClass('bit-input', 'bit-slider__number');
      expect(box()).toHaveValue(40);
      expect(box()).toHaveAttribute('min', '0');
      expect(box()).toHaveAttribute('max', '100');
      expect(box()).toHaveAttribute('step', '1');
    });

    it('is as wide as the longest value, in characters', () => {
      const { container, rerender } = render(<Slider aria-label="x" numberInput />);
      const width = () => container.querySelector<HTMLElement>('.bit-slider__box')!.style.getPropertyValue('--_bit-slider-chars');
      expect(width()).toBe('3');
      rerender(<Slider aria-label="x" numberInput min={-100} max={0} step={0.5} />);
      expect(width()).toBe('6');
    });

    it('takes the slider’s name: aria-label, aria-labelledby, or the Field’s label', () => {
      const { unmount } = render(<Slider aria-label="Volume" numberInput />);
      expect(screen.getByRole('spinbutton', { name: 'Volume' })).toBeInTheDocument();
      unmount();
      const second = render(
        <>
          <span id="t">Treble</span>
          <Slider aria-labelledby="t" numberInput />
        </>,
      );
      expect(screen.getByRole('spinbutton', { name: 'Treble' })).toBeInTheDocument();
      second.unmount();
      render(
        <Field label="Brightness" hint="Screen only." error="Too bright.">
          <Slider numberInput defaultValue={90} />
        </Field>,
      );
      expect(screen.getByRole('slider', { name: 'Brightness' })).toBeInTheDocument();
      expect(screen.getByRole('spinbutton', { name: 'Brightness' })).toHaveAccessibleDescription('Screen only. Too bright.');
      expect(box()).toHaveAttribute('aria-invalid', 'true');
    });

    it('has no name, so the form gets the value once, from the range input', () => {
      render(
        <form data-testid="form">
          <Slider aria-label="x" name="volume" numberInput defaultValue={30} />
        </form>,
      );
      expect(box()).not.toHaveAttribute('name');
      expect(new FormData(screen.getByTestId('form') as HTMLFormElement).getAll('volume')).toEqual(['30']);
    });

    it('follows the slider: a drag or a key updates the box', () => {
      render(<Slider aria-label="x" numberInput defaultValue={30} />);
      fireEvent.change(screen.getByRole('slider'), { target: { value: '64' } });
      expect(box()).toHaveValue(64);
    });

    it('typing a number in range moves the slider as you type, through onChange and onValueChange', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const onValueChange = vi.fn();
      const { container } = render(<Slider aria-label="x" numberInput defaultValue={30} onChange={onChange} onValueChange={onValueChange} />);
      await user.clear(box());
      await user.type(box(), '72');
      expect(screen.getByRole('slider')).toHaveValue('72');
      expect(fill(container)).toBe('0.72');
      expect(onValueChange.mock.calls).toEqual([[7], [72]]);
      expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('a number out of range waits; Enter or leaving the box pulls it into range and onto a step', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<Slider aria-label="x" numberInput step={10} defaultValue={30} onValueChange={onValueChange} />);
      await user.clear(box());
      await user.type(box(), '150');
      // "15" was in range, so the slider went to its step, 20; "150" isn't, so it waits there.
      expect(screen.getByRole('slider')).toHaveValue('20');
      expect(box()).toHaveValue(150);
      onValueChange.mockClear();
      await user.type(box(), '{Enter}');
      expect(box()).toHaveValue(100);
      expect(screen.getByRole('slider')).toHaveValue('100');
      expect(onValueChange.mock.calls).toEqual([[100]]);
      await user.type(box(), '{Enter}');
      expect(onValueChange).toHaveBeenCalledTimes(1);
      await user.clear(box());
      await user.type(box(), '-20');
      await user.tab();
      expect(box()).toHaveValue(0);
      expect(screen.getByRole('slider')).toHaveValue('0');
      await user.clear(box());
      await user.type(box(), '37{Enter}');
      expect(box()).toHaveValue(40);
      expect(screen.getByRole('slider')).toHaveValue('40');
    });

    it('an emptied box goes back to the current value', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<Slider aria-label="x" numberInput defaultValue={30} onValueChange={onValueChange} />);
      await user.clear(box());
      expect(box()).toHaveValue(null);
      await user.tab();
      expect(box()).toHaveValue(30);
      expect(screen.getByRole('slider')).toHaveValue('30');
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('works with a parent that keeps the value in state', async () => {
      const user = userEvent.setup();
      function Controlled() {
        const [volume, setVolume] = useState(40);
        return (
          <>
            <Slider aria-label="Volume" numberInput value={volume} onValueChange={setVolume} />
            <output>{volume}</output>
          </>
        );
      }
      render(<Controlled />);
      await user.clear(box());
      await user.type(box(), '55');
      expect(screen.getByRole('status')).toHaveTextContent('55');
      // The box still has focus: a change from elsewhere replaces what was typed.
      fireEvent.change(screen.getByRole('slider'), { target: { value: '12' } });
      expect(box()).toHaveValue(12);
    });

    it('disabled, read-only and invalid reach the box', () => {
      const { rerender } = render(<Slider aria-label="x" numberInput disabled />);
      expect(box()).toBeDisabled();
      rerender(<Slider aria-label="x" numberInput readOnly />);
      expect(box()).toHaveAttribute('readonly');
      rerender(<Slider aria-label="x" numberInput invalid />);
      expect(box()).toHaveAttribute('aria-invalid', 'true');
    });

    describe('step buttons', () => {
      const buttons = (container: HTMLElement) => [...container.querySelectorAll<HTMLButtonElement>('.bit-slider__step')];

      it('two stacked buttons at the box’s end, out of the Tab order and hidden from screen readers', async () => {
        const user = userEvent.setup();
        const { container } = render(<Slider aria-label="x" numberInput />);
        const [up, down] = buttons(container);
        expect(up).toHaveAttribute('data-direction', 'up');
        expect(down).toHaveAttribute('data-direction', 'down');
        for (const button of [up, down]) {
          expect(button).toHaveAttribute('type', 'button');
          expect(button).toHaveAttribute('tabindex', '-1');
          expect(button!.closest('[aria-hidden="true"]')).toHaveClass('bit-slider__steps');
          expect(button!.querySelector('svg.bit-icon')).not.toBeNull();
        }
        await user.tab();
        await user.tab();
        expect(box()).toHaveFocus();
        await user.tab();
        expect(document.body).toHaveFocus();
      });

      it('each press moves one step and calls onValueChange, kept between min and max', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        const { container } = render(<Slider aria-label="x" numberInput min={0} max={20} step={5} defaultValue={15} onValueChange={onValueChange} />);
        const [up, down] = buttons(container);
        await user.click(up!);
        expect(screen.getByRole('slider')).toHaveValue('20');
        expect(box()).toHaveValue(20);
        await user.click(up!);
        expect(onValueChange.mock.calls).toEqual([[20]]);
        await user.click(down!);
        await user.click(down!);
        expect(box()).toHaveValue(10);
        expect(onValueChange.mock.calls).toEqual([[20], [15], [10]]);
        for (let i = 0; i < 4; i += 1) await user.click(down!);
        expect(box()).toHaveValue(0);
      });

      it('a press doesn’t take focus from where it was', async () => {
        const user = userEvent.setup();
        const { container } = render(<Slider aria-label="x" numberInput defaultValue={5} />);
        act(() => box().focus());
        await user.click(buttons(container)[0]!);
        expect(box()).toHaveFocus();
        expect(box()).toHaveValue(6);
      });

      it('disabled and read-only: the buttons are disabled and a press changes nothing', () => {
        for (const locked of [{ disabled: true }, { readOnly: true }]) {
          const onValueChange = vi.fn();
          const { container, unmount } = render(<Slider aria-label="x" numberInput defaultValue={5} onValueChange={onValueChange} {...locked} />);
          for (const button of buttons(container)) {
            expect(button).toBeDisabled();
            fireEvent.click(button);
          }
          expect(screen.getByRole('slider')).toHaveValue('5');
          expect(onValueChange).not.toHaveBeenCalled();
          unmount();
        }
      });
    });

    it('unit: a tab after the box, which describes it, so "%" is read with the number', () => {
      const { container } = render(<Slider aria-label="Volume" numberInput unit="%" aria-describedby="help" />);
      const unit = container.querySelector('.bit-slider__unit')!;
      expect(unit).toHaveTextContent('%');
      expect(unit.previousElementSibling).toHaveClass('bit-slider__spin');
      expect(box()).toHaveAttribute('aria-describedby', expect.stringContaining(unit.id));
    });

    it.each(['$', '€', '£', '¥', '₹', '₩'])('unit %s: a currency sign, so its tab goes before the box', (sign) => {
      const { container } = render(<Slider aria-label="Budget" numberInput unit={sign} />);
      const unit = container.querySelector('.bit-slider__unit')!;
      expect(unit.closest('.bit-slider__box')).toHaveAttribute('data-unit', 'start');
      expect(unit.nextElementSibling).toHaveClass('bit-slider__spin');
      expect(box()).toHaveAttribute('aria-describedby', unit.id);
    });

    it.each(['%', '¢', '°', 'px'])('unit %s: its tab goes after the box', (sign) => {
      const { container } = render(<Slider aria-label="x" numberInput unit={sign} />);
      const unit = container.querySelector('.bit-slider__unit')!;
      expect(unit.closest('.bit-slider__box')).toHaveAttribute('data-unit', 'end');
      expect(unit.previousElementSibling).toHaveClass('bit-slider__spin');
    });

    it('unitPosition overrides the sign: 5 € in French', () => {
      const { container } = render(<Slider aria-label="Prix" numberInput unit="€" unitPosition="end" />);
      expect(container.querySelector('.bit-slider__box')).toHaveAttribute('data-unit', 'end');
      expect(container.querySelector('.bit-slider__unit')!.previousElementSibling).toHaveClass('bit-slider__spin');
    });

    it('without a unit the box has no data-unit', () => {
      const { container } = render(<Slider aria-label="x" numberInput />);
      expect(container.querySelector('.bit-slider__box')).not.toHaveAttribute('data-unit');
    });

    it('without numberInput, unit draws nothing', () => {
      const { container } = render(<Slider aria-label="x" unit="%" />);
      expect(container.querySelector('.bit-slider__box')).toBeNull();
      expect(container.querySelector('.bit-slider__unit')).toBeNull();
    });

    it('blocks ignores numberInput and notched, and warns in development about the box', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { container } = render(<Slider aria-label="x" variant="blocks" max={10} numberInput unit="%" notched />);
      expect(screen.queryByRole('spinbutton')).toBeNull();
      expect(root(container)).not.toHaveAttribute('data-number-input');
      expect(root(container)).not.toHaveAttribute('data-notched');
      expect(container.querySelector('.bit-slider__notches')).toBeNull();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('numberInput'));
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

  it.each([
    ['notched', { notched: true, max: 10 }],
    ['a number box with a unit', { numberInput: true, unit: '%' }],
    ['round, a disabled number box', { variant: 'round' as const, numberInput: true, disabled: true }],
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
