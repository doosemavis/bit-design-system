import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { button } from '../../../manifests/button';
import { toJsx } from '../../../code/toJsx';
import { defaultState } from '../../../engine/state';
import { anchorPoint, FinalPass, measureBox, measureLines, renderedClasses, StatesPass, TokensPass, WireframePass } from './passViews';

const rect = (left: number, top: number, width: number, height: number) =>
  ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) }) as DOMRect;

function stageWith(parts: Record<string, DOMRect>, target: DOMRect) {
  const stage = document.createElement('div');
  stage.getBoundingClientRect = () => rect(100, 50, 600, 300);
  for (const [label, box] of Object.entries(parts)) {
    const callout = document.createElement('div');
    callout.dataset.part = label;
    callout.getBoundingClientRect = () => box;
    stage.append(callout);
  }
  const instance = document.createElement('div');
  instance.dataset.instance = '';
  const el = document.createElement('button');
  el.className = 'bit-button bit-primary bit-solid bit-md';
  el.getBoundingClientRect = () => target;
  instance.append(el);
  stage.append(instance);
  return stage;
}

describe('anchorPoint', () => {
  const box = rect(10, 20, 100, 40);
  it.each([
    ['center', { x: 60, y: 40 }],
    ['top', { x: 60, y: 20 }],
    ['bottom', { x: 60, y: 60 }],
    ['left', { x: 10, y: 40 }],
    ['left-upper', { x: 10, y: 30 }],
    ['right', { x: 110, y: 40 }],
    ['bottom-right', { x: 110, y: 60 }],
  ] as const)('%s', (anchor, point) => expect(anchorPoint(box, anchor)).toEqual(point));
});

describe('measureLines', () => {
  const target = rect(350, 180, 80, 40); // relative to the stage: x 250..330, y 130..170
  it('runs from the callout edge facing the instance to the anchor, relative to the stage', () => {
    const stage = stageWith({ Face: rect(120, 160, 100, 30), Edge: rect(560, 160, 100, 30) }, target);
    const lines = measureLines(stage, [
      { label: 'Face', selector: '.bit-button', tokens: [], side: 'left', anchor: 'center' },
      { label: 'Edge', selector: '.bit-button', tokens: [], side: 'right' },
    ]);
    expect(lines).toEqual([
      { part: 'Face', from: { x: 120, y: 125 }, to: { x: 290, y: 150 } },
      { part: 'Edge', from: { x: 460, y: 125 }, to: { x: 330, y: 150 } },
    ]);
  });

  it('gives no line for a selector that matches nothing, or a missing callout', () => {
    const stage = stageWith({ Face: rect(120, 160, 100, 30) }, target);
    expect(
      measureLines(stage, [
        { label: 'Face', selector: '.nope', tokens: [], side: 'left' },
        { label: 'Ghost', selector: '.bit-button', tokens: [], side: 'left' },
      ]),
    ).toEqual([]);
  });
});

describe('measureBox and renderedClasses', () => {
  it('reads the instance box relative to the stage and its computed left padding', () => {
    const stage = stageWith({}, rect(350, 180, 80, 40));
    (stage.querySelector('.bit-button') as HTMLElement).style.paddingLeft = '16px';
    expect(measureBox(stage)).toEqual({ x: 250, y: 130, width: 80, height: 40, paddingLeft: 16 });
    expect(renderedClasses(stage)).toBe('bit-button bit-primary bit-solid bit-md');
  });

  it('is null and empty without an instance', () => {
    expect(measureBox(document.createElement('div'))).toBeNull();
    expect(renderedClasses(document.createElement('div'))).toBe('');
  });
});

describe('pass views', () => {
  it('Wireframe and Tokens show an inert default Button', () => {
    const { container: wire } = render(<WireframePass manifest={button} />);
    expect(wire.querySelector('[data-instance]')).toHaveAttribute('inert');
    const { container: tokens } = render(<TokensPass manifest={button} stacked={false} />);
    expect(tokens.querySelector('[data-instance]')).toHaveAttribute('inert');
    expect(tokens.querySelector('.bit-button')).toHaveClass('bit-primary', 'bit-solid', 'bit-md');
  });

  it('Tokens lists each part with its tokens, as two ARIA lists', () => {
    render(<TokensPass manifest={button} stacked={false} />);
    expect(screen.getAllByRole('list')).toHaveLength(2);
    const face = screen.getByText('Face').closest('[role="listitem"]') as HTMLElement;
    expect(within(face).getByText('--bit-color-primary')).toBeInTheDocument();
    expect(within(face).getByText('--bit-weight-bold')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((item) => item.dataset.part)).toEqual(['Face', 'Size', 'Edge', 'Shadow']);
  });

  it('Tokens in stacked mode draws no svg', () => {
    const { container } = render(<TokensPass manifest={button} stacked />);
    expect(container.querySelector('svg')).toBeNull();
    expect(container.querySelector('[data-stacked]')).not.toBeNull();
  });

  it('States renders one inert tile per state, then a focusable Try it', () => {
    render(<StatesPass manifest={button} />);
    for (const label of ['Default', 'Disabled', 'Loading']) {
      const tile = screen.getByText(label).closest('[data-tile]') as HTMLElement;
      expect(tile.querySelector('[data-instance]')).toHaveAttribute('inert');
    }
    expect(screen.getByText('Disabled').closest('[data-tile]')!.querySelector('button')).toBeDisabled();
    const tryIt = screen.getByText('Try it').closest('[data-tile]') as HTMLElement;
    expect(tryIt.querySelector('[data-instance]')).not.toHaveAttribute('inert');
    expect(within(tryIt).getByText('Point at it, press it, or Tab to it')).toBeInTheDocument();
  });

  it('Final shows the live Button and prints the Code panel snippet', () => {
    render(<FinalPass manifest={button} />);
    expect(document.querySelector('[data-instance]')).not.toHaveAttribute('inert');
    expect(screen.getByRole('region', { name: 'Final code' })).toHaveTextContent(toJsx(button, defaultState(button)).replace(/\s+/g, ' '));
  });
});
