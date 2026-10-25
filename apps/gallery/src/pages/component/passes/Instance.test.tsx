import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { button } from '../../../manifests/button';
import type { Manifest } from '../../../manifests/types';
import { Instance } from './Instance';

const withBase = (base: Record<string, unknown>): Manifest =>
  ({ ...button, anatomy: { ...button.anatomy!, base } }) as Manifest;

describe('Instance', () => {
  it('renders the defaults inside div[data-instance]', () => {
    const { container } = render(<Instance manifest={button} />);
    expect(container.querySelector('div[data-instance] > .bit-button')).toHaveClass('bit-primary', 'bit-solid');
  });

  it('merges anatomy.base over the defaults, and a patch over both', () => {
    const manifest = withBase({ variant: 'outline' });
    const merged = render(<Instance manifest={manifest} />).container;
    expect(merged.querySelector('.bit-button')).toHaveClass('bit-outline');
    const patched = render(<Instance manifest={manifest} patch={{ variant: 'ghost' }} />).container;
    expect(patched.querySelector('.bit-button')).toHaveClass('bit-ghost');
  });

  it('drops anatomy.base with withBase={false}', () => {
    const { container } = render(<Instance manifest={withBase({ variant: 'outline' })} withBase={false} />);
    expect(container.querySelector('.bit-button')).toHaveClass('bit-solid');
  });

  it('is inert on request', () => {
    const { container } = render(<Instance manifest={button} inert />);
    expect(container.querySelector('[data-instance]')).toHaveAttribute('inert');
  });
});
