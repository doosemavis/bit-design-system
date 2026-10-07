import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { Alert } from './Alert';
import { COLORS } from '../../system/axes';
import { expectNoA11yViolations } from '../../test/a11y';

const variants = ['solid', 'outline'] as const;
const combos = COLORS.flatMap((color) => variants.map((variant) => [color, variant] as const));

describe('Alert', () => {
  it('renders role="status" with default decorators and a body element', () => {
    render(<Alert>Saved.</Alert>);
    const alert = screen.getByRole('status');
    expect(alert.className).toBe('bit-alert bit-neutral bit-outline');
    expect(screen.getByText('Saved.').className).toBe('bit-alert__body');
    expect(alert.querySelector('.bit-alert__title')).toBeNull();
  });

  it('renders the title in a title element', () => {
    render(<Alert title="Coins collected">You picked up 42 coins.</Alert>);
    expect(screen.getByText('Coins collected').className).toBe('bit-alert__title');
  });

  it('maps color and variant, and lets role be overridden', () => {
    render(<Alert color="danger" variant="solid" role="alert">Game over</Alert>);
    expect(screen.getByRole('alert').className).toBe('bit-alert bit-danger bit-solid');
  });

  it.each(combos)('color=%s variant=%s has no accessibility violations', async (color, variant) => {
    const { container } = render(<Alert color={color} variant={variant} title="Heads up">Body</Alert>);
    await expectNoA11yViolations(container);
  });
});

describe('Alert onDismiss (the × button)', () => {
  it('shows no × and no data-dismissible by default', () => {
    render(<Alert title="Heads up">Saved.</Alert>);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('status').hasAttribute('data-dismissible')).toBe(false);
  });

  it('with onDismiss, shows a × button named "Dismiss" and marks the root data-dismissible', () => {
    render(<Alert onDismiss={() => {}}>Saved.</Alert>);
    const button = screen.getByRole('button', { name: 'Dismiss' });
    expect(button.getAttribute('type')).toBe('button');
    expect(button.textContent).toBe('×');
    expect(button.querySelector('span')!.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByRole('status').getAttribute('data-dismissible')).toBe('');
  });

  it('the × is a real bit Button: neutral, outline, sm, with the dismiss element class, after the body', () => {
    render(<Alert title="Heads up" onDismiss={() => {}}>Saved.</Alert>);
    const button = screen.getByRole('button', { name: 'Dismiss' });
    expect(button.className).toBe('bit-button bit-neutral bit-outline bit-sm bit-alert__dismiss');
    expect(screen.getByRole('status').lastElementChild).toBe(button);
  });

  it('a click calls onDismiss once, with no arguments', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<Alert onDismiss={onDismiss}>Saved.</Alert>);
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith();
  });

  it('dismissLabel names the button', () => {
    render(<Alert onDismiss={() => {}} dismissLabel="Close message">Saved.</Alert>);
    expect(screen.getByRole('button', { name: 'Close message' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();
  });

  it('dismissLabel alone shows no ×, and is not forwarded to the root', () => {
    render(<Alert dismissLabel="Close message">Saved.</Alert>);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('status').hasAttribute('dismisslabel')).toBe(false);
  });

  it('keeps the ref, role and other props on the root', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Alert ref={ref} role="alert" id="note" data-testid="a" onDismiss={() => {}}>Saved.</Alert>);
    const root = screen.getByRole('alert');
    expect(ref.current).toBe(root);
    expect(root.id).toBe('note');
    expect(root.dataset.testid).toBe('a');
  });

  it.each(combos)('dismissible color=%s variant=%s has no accessibility violations', async (color, variant) => {
    const { container } = render(
      <Alert color={color} variant={variant} title="Heads up" onDismiss={() => {}}>
        Body
      </Alert>,
    );
    await expectNoA11yViolations(container);
  });
});
