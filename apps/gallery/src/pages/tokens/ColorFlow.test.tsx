import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ColorFlow } from './ColorFlow';
import type { ColorFlows } from './colorFlows';
import { expectNoA11yViolations } from '../../test/a11y';
import { stubClipboard } from '../../test/clipboard';

const FLOWS: ColorFlows = {
  palette: { paper: '#EEEFE9', violet: '#7C3AED', yellow: '#FFC800', night: '#15151C' },
  light: [
    { from: 'paper', to: '--bit-color-bg' },
    { from: 'violet', to: '--bit-color-primary' },
    { from: 'violet', to: '--bit-color-accent' },
    { from: 'yellow', to: '--bit-color-warning' },
  ],
  dark: [
    { from: 'night', to: '--bit-color-bg' },
    { from: 'violet', to: '--bit-color-primary' },
    { from: 'yellow', to: '--bit-color-accent' },
    { from: 'yellow', to: '--bit-color-warning' },
  ],
};

const bands = (container: HTMLElement) => [...container.querySelectorAll('[data-flow]')];

describe('ColorFlow', () => {
  it('is a group with a title, a summary, and a picture named for the mode, with no axe violations', async () => {
    const { container } = render(<ColorFlow flows={FLOWS} mode="light" />);
    expect(screen.getByRole('group', { name: 'Where every color goes' })).toBeInTheDocument();
    expect(screen.getByText(/3 of 4 palette colors feed 4 color tokens in light mode/)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Which palette color feeds each color token, light mode' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('draws one band per flow, one bar per palette color in use, and labels both sides', () => {
    const { container } = render(<ColorFlow flows={FLOWS} mode="light" />);
    expect(bands(container).map((band) => band.getAttribute('data-flow'))).toEqual([
      'paper → --bit-color-bg',
      'violet → --bit-color-primary',
      'violet → --bit-color-accent',
      'yellow → --bit-color-warning',
    ]);
    const svg = screen.getByRole('group', { name: /^Which palette color/ });
    for (const label of ['paper', 'violet', 'yellow', '--bit-color-bg', '--bit-color-primary', '--bit-color-accent', '--bit-color-warning']) {
      expect(svg).toHaveTextContent(label);
    }
    expect(svg).not.toHaveTextContent('night');
  });

  it('bands take their palette color', () => {
    const { container } = render(<ColorFlow flows={FLOWS} mode="light" />);
    expect(container.querySelector('[data-flow="paper → --bit-color-bg"]')).toHaveStyle({ fill: '#EEEFE9' });
  });

  it("highlights every flow from the accent's palette color, and names it in the summary", () => {
    const { container } = render(<ColorFlow flows={FLOWS} mode="light" />);
    expect(bands(container).filter((band) => band.hasAttribute('data-accent')).map((band) => band.getAttribute('data-flow'))).toEqual([
      'violet → --bit-color-primary',
      'violet → --bit-color-accent',
    ]);
    expect(screen.getByText(/The bright flows come from violet, the accent's color/)).toBeInTheDocument();
  });

  it('dark mode draws the dark wiring: the accent moves to yellow', () => {
    const { container } = render(<ColorFlow flows={FLOWS} mode="dark" />);
    expect(screen.getByRole('group', { name: 'Which palette color feeds each color token, dark mode' })).toBeInTheDocument();
    expect(bands(container).filter((band) => band.hasAttribute('data-accent')).map((band) => band.getAttribute('data-flow'))).toEqual([
      'yellow → --bit-color-accent',
      'yellow → --bit-color-warning',
    ]);
    expect(screen.getByRole('group', { name: /^Which palette color/ })).toHaveTextContent('night');
  });

  it('every token on the right is a Copy chip, in drawing order, and clicking one copies its name', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    stubClipboard(writeText);
    render(<ColorFlow flows={FLOWS} mode="light" />);
    const picture = screen.getByRole('group', { name: /^Which palette color/ });
    expect(within(picture).getAllByRole('button').map((button) => button.getAttribute('aria-label'))).toEqual([
      'Copy --bit-color-bg',
      'Copy --bit-color-primary',
      'Copy --bit-color-accent',
      'Copy --bit-color-warning',
    ]);
    await act(async () => {
      fireEvent.click(within(picture).getByRole('button', { name: 'Copy --bit-color-primary' }));
    });
    expect(writeText).toHaveBeenCalledExactlyOnceWith('--bit-color-primary');
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('the bands and bars are decoration, hidden from screen readers; the names carry the meaning', () => {
    const { container } = render(<ColorFlow flows={FLOWS} mode="light" />);
    for (const band of bands(container)) expect(band.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('a theme with no accent token highlights nothing and says nothing about it', () => {
    const flows: ColorFlows = { ...FLOWS, light: FLOWS.light.filter((flow) => flow.to !== '--bit-color-accent') };
    const { container } = render(<ColorFlow flows={flows} mode="light" />);
    expect(bands(container).filter((band) => band.hasAttribute('data-accent'))).toEqual([]);
    expect(screen.queryByText(/bright flows/)).toBeNull();
  });
});
