import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';
import { TONES } from '../../system/axes';
import { expectNoA11yViolations } from '../../test/a11y';

describe('Badge', () => {
  it('renders a span with the default decorators', () => {
    render(<Badge>New</Badge>);
    const badge = screen.getByText('New');
    expect(badge.tagName).toBe('SPAN');
    expect(badge.className).toBe('bit-badge bit-neutral bit-solid bit-md');
  });

  it('maps tone, variant, and size', () => {
    render(<Badge tone="success" variant="outline" size="sm">1-Up</Badge>);
    expect(screen.getByText('1-Up').className).toBe('bit-badge bit-success bit-outline bit-sm');
  });

  it('appends className last, forwards ref, spreads props', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Badge ref={ref} className="extra" data-testid="b">X</Badge>);
    expect(screen.getByTestId('b').className).toBe('bit-badge bit-neutral bit-solid bit-md extra');
    expect(ref.current).toBe(screen.getByTestId('b'));
  });

  it.each(TONES)('tone=%s has no accessibility violations', async (tone) => {
    const { container } = render(<Badge tone={tone}>Tag</Badge>);
    await expectNoA11yViolations(container);
  });
});
