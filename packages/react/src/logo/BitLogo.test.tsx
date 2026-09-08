import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BitLogo, ERAS } from './BitLogo';
import { expectNoA11yViolations } from '../test/a11y';

const eras = (root: HTMLElement) => [...root.querySelectorAll('.bit-logo__era')].map((el) => el.getAttribute('data-era'));

describe('BitLogo', () => {
  it('renders all four eras, the fixed suffix, and cycles by default', () => {
    render(<BitLogo />);
    const root = screen.getByRole('img', { name: 'bit' });
    expect(root.className).toBe('bit-logo bit-md');
    expect(root).toHaveAttribute('data-animated');
    expect(eras(root)).toEqual(['8', '16', '32', '64']);
    expect(root.querySelector('.bit-logo__suffix')).toHaveTextContent('-bit');
    expect(root.style.getPropertyValue('--bit-logo-interval')).toBe('5s');
  });

  it('freeze renders only the chosen era and stops the cycle', () => {
    render(<BitLogo freeze={32} />);
    const root = screen.getByRole('img');
    expect(eras(root)).toEqual(['32']);
    expect(root).not.toHaveAttribute('data-animated');
  });

  it('animated={false} renders only the first era', () => {
    render(<BitLogo animated={false} />);
    const root = screen.getByRole('img');
    expect(eras(root)).toEqual([String(ERAS[0])]);
    expect(root).not.toHaveAttribute('data-animated');
  });

  it('maps size, sets the interval variable, appends className last', () => {
    render(<BitLogo size="lg" interval={2} className="extra" />);
    const root = screen.getByRole('img');
    expect(root.className).toBe('bit-logo bit-lg extra');
    expect(root.style.getPropertyValue('--bit-logo-interval')).toBe('2s');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BitLogo />);
    await expectNoA11yViolations(container);
  });
});
