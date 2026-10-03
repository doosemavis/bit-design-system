import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { isPresetActive, Presets } from './Presets';
import { defaultState } from './state';
import { button } from '../manifests/button';
import { spinner } from '../manifests/spinner';

describe('isPresetActive', () => {
  it('is true while every value the preset sets holds', () => {
    const preset = { label: 'Danger outline', state: { color: 'danger', variant: 'outline' } };
    expect(isPresetActive(preset, defaultState(button))).toBe(false);
    expect(isPresetActive(preset, { ...defaultState(button), color: 'danger' })).toBe(false);
    expect(isPresetActive(preset, { ...defaultState(button), color: 'danger', variant: 'outline', size: 'lg' })).toBe(true);
  });
});

describe('Presets', () => {
  it('renders one ghost button per preset in a "Presets" group and applies its state', async () => {
    const onApply = vi.fn();
    render(<Presets manifest={button} state={defaultState(button)} onApply={onApply} />);
    const buttons = screen.getAllByRole('button');
    expect(screen.getByRole('group', { name: 'Presets' })).toBeInTheDocument();
    expect(buttons.map((b) => b.textContent)).toEqual(['Danger outline', 'Ghost small', 'Loading']);
    for (const b of buttons) {
      expect(b).toHaveClass('bit-ghost', 'bit-sm');
      expect(b).toHaveAttribute('aria-pressed', 'false');
    }
    await userEvent.click(buttons[0]!);
    expect(onApply).toHaveBeenCalledWith({ color: 'danger', variant: 'outline' });
  });

  it('the preset matching the current state is pressed and solid', () => {
    render(<Presets manifest={button} state={{ ...defaultState(button), variant: 'ghost', size: 'sm' }} onApply={() => {}} />);
    const active = screen.getByRole('button', { name: 'Ghost small' });
    expect(active).toHaveAttribute('aria-pressed', 'true');
    expect(active).toHaveClass('bit-solid', 'bit-primary');
    expect(screen.getByRole('button', { name: 'Loading' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders nothing when a manifest has no presets', () => {
    const { container } = render(<Presets manifest={{ ...spinner, presets: undefined }} state={{}} onApply={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
