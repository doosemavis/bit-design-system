import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { button } from '../../../manifests/button';
import type { Manifest } from '../../../manifests/types';
import { Instance } from './Instance';
import { Loupe } from './Loupe';

const origin = { x: 0, y: 0, width: 100, height: 40 };
const at = { x: 50, y: 20 };

describe('Loupe', () => {
  it('is an aria-hidden, inert data-role="loupe"', () => {
    const { container } = render(<Loupe manifest={button} landed={[]} at={at} thickness={4} origin={origin} />);
    const loupe = container.querySelector('[data-role="loupe"]');
    expect(loupe).toHaveAttribute('aria-hidden', 'true');
    expect(loupe).toHaveAttribute('inert');
  });

  it('scales its copy 4x around the point', () => {
    const { container } = render(<Loupe manifest={button} landed={[]} at={at} thickness={4} origin={origin} />);
    const scaled = container.querySelector<HTMLElement>('[data-role="loupe"] [style*="scale(4)"]');
    expect(scaled?.style.transform).toBe('scale(4)');
    expect(scaled?.style.transformOrigin).toBe('50px 20px');
  });

  it('turns off the parts not yet landed, as the stage does', () => {
    const loupe = render(<Loupe manifest={button} landed={['Edge']} at={at} thickness={4} origin={origin} />).container;
    const el = loupe.querySelector<HTMLElement>('[data-role="loupe"] [data-instance]')!;
    expect(el.style.getPropertyValue('--bit-border-width')).toBe('');
    expect(el.style.getPropertyValue('--bit-color-primary')).toBe('transparent');
    expect(el.style.getPropertyValue('--bit-shadow-md')).toBe('none');
  });

  it('renders without anatomy.base', () => {
    const manifest = { ...button, anatomy: { ...button.anatomy!, base: { variant: 'outline' } } } as Manifest;
    const stage = render(<Instance manifest={manifest} />).container;
    expect(stage.querySelector('.bit-button')).toHaveClass('bit-outline');
    const loupe = render(<Loupe manifest={manifest} landed={[]} at={at} thickness={4} origin={origin} />).container;
    expect(loupe.querySelector('.bit-button')).toHaveClass('bit-solid');
  });

  it.each([4, 2])('labels the measure %ipx', (thickness) => {
    const { container } = render(<Loupe manifest={button} landed={[]} at={at} thickness={thickness} origin={origin} />);
    expect(container.querySelector('text')?.textContent).toBe(`${thickness}px`);
  });
});
