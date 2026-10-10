import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRef, useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from './Textarea';
import { Field } from '../Field/Field';
import { expectNoA11yViolations } from '../../test/a11y';

const { announce } = vi.hoisted(() => ({ announce: vi.fn() }));
vi.mock('../../system/announce', () => ({ announce }));

afterEach(() => announce.mockClear());

const count = (container: HTMLElement) => container.querySelector<HTMLElement>('.bit-textarea__count');

describe('Textarea showCount', () => {
  it('without showCount there is no count: just the textarea', () => {
    const { container } = render(<Textarea aria-label="Notes" maxLength={140} />);
    expect(container.children).toHaveLength(1);
    expect(count(container)).toBeNull();
  });

  it('without maxLength it counts characters, singular for one', async () => {
    const user = userEvent.setup();
    const { container } = render(<Textarea aria-label="Notes" showCount />);
    expect(count(container)).toHaveTextContent(/^0 characters$/);
    await user.type(screen.getByRole('textbox'), 'a');
    expect(count(container)).toHaveTextContent(/^1 character$/);
    await user.type(screen.getByRole('textbox'), 'b');
    expect(count(container)).toHaveTextContent(/^2 characters$/);
    expect(count(container)).not.toHaveAttribute('data-state');
  });

  it('with maxLength it reads "length / limit", is a div under the box, and is hidden from screen readers', () => {
    const { container } = render(<Textarea aria-label="Bio" maxLength={140} showCount defaultValue="Hello" />);
    const node = count(container)!;
    expect(node.tagName).toBe('DIV');
    expect(node.previousElementSibling).toBe(screen.getByRole('textbox'));
    // Outside a Field the two share a wrapper, so the count stays under the box in any layout.
    expect(container.firstElementChild).toHaveClass('bit-textarea__wrap');
    expect(container.firstElementChild!.children).toHaveLength(2);
    expect(node.firstChild?.textContent).toBe('5 / 140');
    expect(node).toHaveAttribute('aria-hidden', 'true');
  });

  it('turns near with 10% left and limit at the limit, and the hard limit stops typing', async () => {
    const user = userEvent.setup();
    const { container } = render(<Textarea aria-label="Bio" maxLength={20} showCount defaultValue={'x'.repeat(17)} />);
    const box = screen.getByRole('textbox');
    expect(count(container)).not.toHaveAttribute('data-state');
    await user.type(box, 'y');
    expect(count(container)).toHaveAttribute('data-state', 'near');
    await user.type(box, 'yyyyy');
    expect(box).toHaveValue(`${'x'.repeat(17)}yyy`);
    expect(count(container)!.firstChild?.textContent).toBe('20 / 20');
    expect(count(container)).toHaveAttribute('data-state', 'limit');
  });

  it('controlled: follows the value prop', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [text, setText] = useState('Hi');
      return (
        <>
          <Textarea aria-label="Bio" maxLength={10} showCount value={text} onChange={(e) => setText(e.target.value)} />
          <button type="button" onClick={() => setText('')}>
            Clear
          </button>
        </>
      );
    }
    const { container } = render(<Controlled />);
    expect(count(container)!.firstChild?.textContent).toBe('2 / 10');
    await user.type(screen.getByRole('textbox'), ' there');
    expect(count(container)!.firstChild?.textContent).toBe('8 / 10');
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(count(container)!.firstChild?.textContent).toBe('0 / 10');
  });

  it('uncontrolled: still calls your onChange, and a form reset puts the count back', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <form>
        <Textarea aria-label="Bio" showCount defaultValue="abc" onChange={onChange} />
      </form>,
    );
    await user.type(screen.getByRole('textbox'), 'defg');
    expect(onChange).toHaveBeenCalledTimes(4);
    expect(count(container)).toHaveTextContent('7 characters');
    container.querySelector('form')!.reset();
    await waitFor(() => expect(count(container)).toHaveTextContent('3 characters'));
    expect(screen.getByRole('textbox')).toHaveValue('abc');
  });

  it('turning showCount on after typing counts what the box holds, in a Field or not', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<Textarea aria-label="Notes" defaultValue="ab" />);
    await user.type(screen.getByRole('textbox'), 'cd');
    rerender(<Textarea aria-label="Notes" defaultValue="ab" showCount />);
    // The new wrapper mounts a fresh box at defaultValue, and the count follows it.
    expect(count(container)).toHaveTextContent(`${(screen.getByRole('textbox') as HTMLTextAreaElement).value.length} characters`);
    const field = render(
      <Field label="Bio">
        <Textarea defaultValue="ab" />
      </Field>,
    );
    await user.type(screen.getByRole('textbox', { name: 'Bio' }), 'cd');
    field.rerender(
      <Field label="Bio">
        <Textarea defaultValue="ab" showCount />
      </Field>,
    );
    expect(screen.getByRole('textbox', { name: 'Bio' })).toHaveValue('abcd');
    expect(count(field.container)).toHaveTextContent('4 characters');
  });

  it('the ref and className still land on the textarea', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} aria-label="Bio" className="extra" showCount />);
    expect(ref.current).toBe(screen.getByRole('textbox'));
    expect(ref.current!.className).toBe('bit-textarea bit-md extra');
  });
});

describe('Textarea showCount for screen readers', () => {
  it('announces only when crossing 20 left, 10 left and the limit; deleting and typing back speaks again', async () => {
    const user = userEvent.setup();
    render(<Textarea aria-label="Bio" maxLength={30} showCount />);
    const box = screen.getByRole('textbox');
    await user.type(box, 'x'.repeat(9));
    expect(announce).not.toHaveBeenCalled();
    await user.type(box, 'x');
    expect(announce).toHaveBeenLastCalledWith('20 characters left');
    await user.type(box, 'x'.repeat(9));
    expect(announce).toHaveBeenCalledTimes(1);
    await user.type(box, 'x');
    expect(announce).toHaveBeenLastCalledWith('10 characters left');
    await user.type(box, 'x'.repeat(10));
    expect(announce).toHaveBeenLastCalledWith('Limit reached, 30 characters');
    expect(announce).toHaveBeenCalledTimes(3);
    await user.type(box, '{Backspace}{Backspace}');
    expect(announce).toHaveBeenCalledTimes(3);
    await user.type(box, 'xx');
    expect(announce).toHaveBeenCalledTimes(4);
    expect(announce).toHaveBeenLastCalledWith('Limit reached, 30 characters');
  });

  it('a paste past a threshold says what is left, once', async () => {
    const user = userEvent.setup();
    render(<Textarea aria-label="Bio" maxLength={30} showCount />);
    await user.click(screen.getByRole('textbox'));
    await user.paste('x'.repeat(25));
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith('5 characters left');
  });

  it('never announces without a limit', async () => {
    const user = userEvent.setup();
    render(<Textarea aria-label="Notes" showCount />);
    await user.type(screen.getByRole('textbox'), 'x'.repeat(30));
    expect(announce).not.toHaveBeenCalled();
  });

  it('the limit is part of the description, after your own aria-describedby', () => {
    render(
      <>
        <p id="own">Be kind.</p>
        <Textarea aria-label="Bio" aria-describedby="own" maxLength={140} showCount />
      </>,
    );
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Be kind. Up to 140 characters');
  });

  it('only with both maxLength and showCount', () => {
    const { rerender } = render(<Textarea aria-label="Bio" maxLength={140} />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');
    rerender(<Textarea aria-label="Bio" showCount />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');
  });
});

describe('Textarea showCount inside a Field', () => {
  it("sits right after the box, a direct child of the Field, so the Field's CSS puts it on the hint's row", () => {
    const { container } = render(
      <Field label="Bio" hint="A line or two about you.">
        <Textarea maxLength={140} showCount />
      </Field>,
    );
    const field = container.querySelector('.bit-field')!;
    expect(field.querySelector('.bit-textarea__wrap')).toBeNull();
    const node = field.querySelector(':scope > .bit-textarea__count')!;
    expect(node).not.toBeNull();
    expect(node.previousElementSibling).toBe(screen.getByRole('textbox'));
    expect(node.nextElementSibling).toHaveClass('bit-field__hint');
  });

  it("merges the limit into the Field's hint and error description", () => {
    render(
      <Field label="Bio" hint="A line or two about you." error="Too plain.">
        <Textarea maxLength={140} showCount />
      </Field>,
    );
    const box = screen.getByRole('textbox', { name: 'Bio' });
    expect(box.getAttribute('aria-describedby')).toMatch(/-hint \S+-error \S+$/);
    expect(box).toHaveAccessibleDescription('A line or two about you. Too plain. Up to 140 characters');
  });

  it.each([
    ['with a limit', { maxLength: 140 }],
    ['without a limit', {}],
  ])('has no accessibility violations %s', async (_name, props) => {
    const { container } = render(
      <Field label="Bio" hint="A line or two about you.">
        <Textarea showCount defaultValue="Hello" {...props} />
      </Field>,
    );
    await expectNoA11yViolations(container);
  });
});
