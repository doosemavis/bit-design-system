import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Stack } from './Stack';
import { SPACE_STEPS } from '../../system/axes';
import { expectNoA11yViolations } from '../../test/a11y';

describe('Stack', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders a column with a 12px gap by default and no decorator classes', () => {
    render(<Stack data-testid="s">x</Stack>);
    const el = screen.getByTestId('s');
    expect(el.className).toBe('bit-stack');
    expect(el).toHaveAttribute('data-direction', 'column');
    expect(el).toHaveAttribute('data-gap', '12');
    expect(el).not.toHaveAttribute('data-align');
    expect(el).not.toHaveAttribute('data-justify');
    expect(el).not.toHaveAttribute('data-wrap');
  });

  it('exposes layout props as data attributes', () => {
    render(<Stack direction="row" gap={32} align="center" justify="between" wrap data-testid="s">x</Stack>);
    const el = screen.getByTestId('s');
    expect(el).toHaveAttribute('data-direction', 'row');
    expect(el).toHaveAttribute('data-gap', '32');
    expect(el).toHaveAttribute('data-align', 'center');
    expect(el).toHaveAttribute('data-justify', 'between');
    expect(el).toHaveAttribute('data-wrap', '');
  });

  it.each(SPACE_STEPS)('gap={%i} renders data-gap with the same px number', (n) => {
    render(<Stack gap={n} data-testid="s">x</Stack>);
    expect(screen.getByTestId('s')).toHaveAttribute('data-gap', String(n));
  });

  it('gap={4} is 4px now, not the old fourth step (16px)', () => {
    render(<Stack gap={4} data-testid="s">x</Stack>);
    expect(screen.getByTestId('s')).toHaveAttribute('data-gap', '4');
  });

  it('drops an off-scale gap from an untyped caller and warns in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // @ts-expect-error 3 was the old step for 12px; gap is the px value now
    render(<Stack gap={3} data-testid="s">x</Stack>);
    expect(screen.getByTestId('s')).not.toHaveAttribute('data-gap');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('gap="3"');
  });

  it('accepts a number-like string gap from an untyped caller without warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Stack gap={'16' as never} data-testid="s">x</Stack>);
    expect(screen.getByTestId('s')).toHaveAttribute('data-gap', '16');
    expect(warn).not.toHaveBeenCalled();
  });

  it('appends className last', () => {
    render(<Stack className="extra" data-testid="s">x</Stack>);
    expect(screen.getByTestId('s').className).toBe('bit-stack extra');
  });

  it('rejects the legacy DOM color attribute and does not render it', () => {
    render(
      // @ts-expect-error color is not part of StackProps
      <Stack color="danger" data-testid="s">
        x
      </Stack>,
    );
    expect(screen.getByTestId('s')).not.toHaveAttribute('color');
  });

  it('has no accessibility violations, as a column or a row', async () => {
    const { container } = render(
      <Stack gap={16}>
        <p>One</p>
        <Stack direction="row" gap={8}>
          <button type="button">Two</button>
          <button type="button">Three</button>
        </Stack>
      </Stack>,
    );
    await expectNoA11yViolations(container);
  });
});
