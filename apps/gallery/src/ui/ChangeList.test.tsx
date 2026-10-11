import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RELEASES } from '../content/changelog';
import { ChangeList, changeHeadline } from './ChangeList';

// Critique 2026-10-11: release notes put a code chip on nearly every noun. The headline is the item's first
// sentence in plain words; the full item, with its code, is one switch away.
describe('changeHeadline', () => {
  it('is the first sentence, with code as plain text and the subject before the colon apart', () => {
    expect(changeHeadline('`Slider`: pick a number on a range, on a native `<input type="range">`. Three looks.')).toEqual({
      subject: 'Slider',
      text: 'pick a number on a range, on a native <input type="range">.',
    });
  });

  it('drops parentheses, even ones that hold code', () => {
    expect(changeHeadline('Slider `notched` (`data-notched`): the thumb snaps to each step (20 marks at most). More.')).toEqual({
      subject: 'Slider notched',
      text: 'the thumb snaps to each step.',
    });
  });

  it('keeps parentheses that are part of a code span, like a call', () => {
    expect(changeHeadline('`headingTag(size)` and the `HeadingTag` type: the tag a Heading size renders.')).toEqual({
      subject: 'headingTag(size) and the HeadingTag type',
      text: 'the tag a Heading size renders.',
    });
  });

  it('never ends a sentence on a dot inside code or a version number', () => {
    expect(changeHeadline('Removed in 0.2.0, see `a. b`. Then more.').text).toBe('Removed in 0.2.0, see a. b.');
  });

  it('has no subject when the colon comes late or sits inside code', () => {
    const late = changeHeadline(
      "Heads up, bit's CSS is in cascade layers now (`bit.reset`), so any unlayered style in your app beats bit's, whatever its specificity: `button { padding: 0 }` now overrides Button.",
    );
    expect(late.subject).toBeUndefined();
    expect(late.text).toBe(
      "Heads up, bit's CSS is in cascade layers now, so any unlayered style in your app beats bit's, whatever its specificity: button { padding: 0 } now overrides Button.",
    );
    expect(changeHeadline('Spinner, Button and Switch stop their own motion under Reduce motion.')).toEqual({
      text: 'Spinner, Button and Switch stop their own motion under Reduce motion.',
    });
  });

  it('gives every CHANGELOG item a non-empty headline with no backticks', () => {
    const items = RELEASES.flatMap((r) => Object.values(r.sections).flat());
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      const { subject, text } = changeHeadline(item);
      expect(text.trim(), item).not.toBe('');
      expect(`${subject ?? ''}${text}`, item).not.toContain('`');
    }
  });
});

describe('ChangeList', () => {
  const ITEM = 'Slider `notched` (`data-notched`): the thumb snaps to each step. Up to 20 marks.';

  it('shows each item in full, with its code, by default', () => {
    render(<ChangeList items={[ITEM]} label="Added" />);
    const item = within(screen.getByRole('list', { name: 'Added' })).getByRole('listitem');
    expect(item).toHaveTextContent('Slider notched (data-notched): the thumb snaps to each step. Up to 20 marks.');
    expect(item.querySelectorAll('code')).toHaveLength(2);
  });

  it('headlines shows the bold subject and the plain first sentence, with no code chips', () => {
    render(<ChangeList items={[ITEM]} label="Added" headlines />);
    const item = within(screen.getByRole('list', { name: 'Added' })).getByRole('listitem');
    expect(item).toHaveTextContent(/^Slider notched: the thumb snaps to each step\.$/);
    expect(item.querySelector('code')).toBeNull();
    expect(within(item).getByText('Slider notched')).toHaveAttribute('data-weight', 'bold');
  });
});
