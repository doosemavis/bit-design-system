import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';
import { TONES, VARIANTS } from '../../system/axes';
import { expectNoA11yViolations } from '../../test/a11y';

describe('Button', () => {
  it('renders a <button type="button"> with the default decorators', () => {
    render(<Button>Save</Button>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn).toHaveAttribute('type', 'button');
    expect(btn.className).toBe('bit-button bit-primary bit-solid bit-md');
  });

  it('maps tone, variant, and size to decorator classes', () => {
    render(<Button tone="danger" variant="outline" size="lg">Delete</Button>);
    expect(screen.getByRole('button').className).toBe('bit-button bit-danger bit-outline bit-lg');
  });

  it('appends className last so it can override a decorator', () => {
    render(<Button className="bit-danger">X</Button>);
    expect(screen.getByRole('button').className).toBe('bit-button bit-solid bit-md bit-danger');
  });

  it('a tone decorator in className overrides the tone prop', () => {
    render(<Button tone="danger" className="bit-primary">X</Button>);
    expect(screen.getByRole('button').className).toBe('bit-button bit-solid bit-md bit-primary');
  });

  it('forwards the ref and spreads unknown props onto the button', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref} data-testid="save">Save</Button>);
    expect(ref.current).toBe(screen.getByTestId('save'));
  });

  it('loading sets data-loading and aria-busy and disables the button', () => {
    render(<Button loading>Saving</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('data-loading');
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toBeDisabled();
  });

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Nope</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('asChild renders the child element with Button classes and no type attribute', () => {
    render(
      <Button asChild tone="neutral">
        <a href="/docs">Docs</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link.className).toBe('bit-button bit-neutral bit-solid bit-md');
    expect(link).not.toHaveAttribute('type');
  });

  const combos = TONES.flatMap((tone) => VARIANTS.map((variant) => [tone, variant] as const));
  it.each(combos)('tone=%s variant=%s has no accessibility violations', async (tone, variant) => {
    const { container } = render(<Button tone={tone} variant={variant}>Go</Button>);
    await expectNoA11yViolations(container);
  });
});
