import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Disclosure } from './Disclosure';

describe('Disclosure', () => {
  it('starts closed, with its content hidden', () => {
    render(<Disclosure title="More">Hidden text</Disclosure>);
    const button = screen.getByRole('button', { name: 'More' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Hidden text')).not.toBeVisible();
  });

  it('opens and closes on click, and names the region it controls', async () => {
    render(<Disclosure title="More">Hidden text</Disclosure>);
    const button = screen.getByRole('button', { name: 'More' });
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Hidden text')).toBeVisible();
    expect(screen.getByRole('region', { name: 'More' })).toHaveAttribute('id', button.getAttribute('aria-controls'));
    await userEvent.click(button);
    expect(screen.getByText('Hidden text')).not.toBeVisible();
  });

  it('can start open', () => {
    render(<Disclosure title="More" defaultOpen>Shown</Disclosure>);
    expect(screen.getByText('Shown')).toBeVisible();
  });

  it('shows one ▸ that turns on open (CSS reads aria-expanded), hidden from the accessible name', async () => {
    render(<Disclosure title="More">Hidden text</Disclosure>);
    const button = screen.getByRole('button', { name: 'More' });
    const glyph = button.querySelector('[aria-hidden="true"]')!;
    expect(glyph).not.toBeNull();
    expect(glyph.tagName).toBe('SPAN');
    expect(glyph).toHaveClass('bit-text', 'gallery-disclosure__glyph');
    expect(glyph.textContent).toBe('▸');
    expect(button.textContent?.indexOf('▸')).toBe(0);
    await userEvent.click(button);
    expect(glyph.textContent).toBe('▸');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'More' })).toBe(button);
  });

  it('indents the open region so it reads as part of the button', () => {
    render(<Disclosure title="More" defaultOpen>Shown</Disclosure>);
    const region = screen.getByRole('region', { name: 'More' });
    expect(region).toHaveClass('bit-box');
    expect(region).toHaveAttribute('data-pl', '16');
  });

  it('derives the button and region ids from one useId', () => {
    render(<Disclosure title="More">Hidden text</Disclosure>);
    const button = screen.getByRole('button', { name: 'More' });
    const regionId = button.getAttribute('aria-controls')!;
    expect(button.id).toMatch(/-button$/);
    expect(regionId).toBe(button.id.replace(/-button$/, '-region'));
  });
});
