import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Badge, Stack } from '@bit-ds/react';
import { StackDemo } from './StackDemo';

/** jsdom has no layout: give the Stack a 152 × 72px inside and each Badge a size, as the browser would. */
function fakeLayout(badgeWidth: number, badgeHeight = 24) {
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockImplementation(function (this: Element) {
    return this.classList.contains('bit-stack') ? 152 : 0;
  });
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockImplementation(function (this: Element) {
    return this.classList.contains('bit-stack') ? 72 : 0;
  });
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
    return this.classList.contains('bit-badge') ? badgeWidth : 0;
  });
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
    return this.classList.contains('bit-badge') ? badgeHeight : 0;
  });
}

const badges = [<Badge key="1">One</Badge>, <Badge key="2">Two</Badge>, <Badge key="3">Three</Badge>];
const stackOf = (container: HTMLElement) => container.querySelector('.bit-stack')!;

describe('StackDemo', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('puts the Stack in a Box at the chosen width, padded 4px', () => {
    fakeLayout(40);
    const { container } = render(<StackDemo stack={<Stack>{badges}</Stack>} width={240} />);
    const box = container.firstElementChild as HTMLElement;
    expect(box).toHaveClass('bit-box');
    expect(box).toHaveAttribute('data-p', '4');
    expect(box.style.width).toBe('240px');
    expect(box.firstElementChild).toBe(stackOf(container));
  });

  it('a row whose children fit stays on one line', () => {
    fakeLayout(40); // 3 × 40 = 120, inside 152
    const { container } = render(<StackDemo stack={<Stack direction="row">{badges}</Stack>} width={160} />);
    expect(stackOf(container)).not.toHaveAttribute('data-wrap');
  });

  it('a row whose children are wider than the Box wraps by itself, so nothing spills past the outline', () => {
    fakeLayout(70); // 3 × 70 = 210, past 152
    const { container } = render(<StackDemo stack={<Stack direction="row">{badges}</Stack>} width={160} />);
    expect(stackOf(container)).toHaveAttribute('data-wrap');
  });

  it('a column with no set height never wraps by itself: it grows to fit, whatever its children', () => {
    fakeLayout(70, 30);
    const { container } = render(<StackDemo stack={<Stack>{badges}</Stack>} width={160} />);
    expect(stackOf(container)).not.toHaveAttribute('data-wrap');
  });

  it('a column taller than a set height wraps by itself, like a row too wide', () => {
    fakeLayout(40, 30); // 3 × 30 = 90, past 72
    const { container } = render(<StackDemo stack={<Stack>{badges}</Stack>} width={160} height={80} />);
    expect(stackOf(container)).toHaveAttribute('data-wrap');
  });

  it('a set height goes on the Box, and the Stack fills it at 100%', () => {
    fakeLayout(40, 20);
    const { container } = render(<StackDemo stack={<Stack direction="row">{badges}</Stack>} width={160} height={80} />);
    expect((container.firstElementChild as HTMLElement).style.height).toBe('80px');
    expect((stackOf(container) as HTMLElement).style.height).toBe('100%');
    expect(stackOf(container)).not.toHaveAttribute('data-wrap');
  });

  it('wrap the visitor turned on stays on, even when the row fits', () => {
    fakeLayout(40);
    const { container } = render(<StackDemo stack={<Stack direction="row" wrap>{badges}</Stack>} width={360} />);
    expect(stackOf(container)).toHaveAttribute('data-wrap');
  });
});
