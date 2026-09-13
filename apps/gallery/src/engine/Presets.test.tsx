import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Presets } from './Presets';
import { button } from '../manifests/button';
import { spinner } from '../manifests/spinner';

describe('Presets', () => {
  it('renders one button per preset and applies its state', async () => {
    const onApply = vi.fn();
    render(<Presets manifest={button} onApply={onApply} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(['Danger outline', 'Ghost small', 'Loading']);
    await userEvent.click(buttons[0]!);
    expect(onApply).toHaveBeenCalledWith({ color: 'danger', variant: 'outline' });
  });

  it('renders nothing when a manifest has no presets', () => {
    const { container } = render(<Presets manifest={{ ...spinner, presets: undefined }} onApply={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
