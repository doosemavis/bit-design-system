import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { scrollToSection } from './scrollToSection';
import { InPageLink } from './InPageLink';

afterEach(() => {
  Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
});

describe('scrollToSection', () => {
  it('scrolls the target into view, makes it focusable with tabIndex -1, and focuses it', () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(Element.prototype, 'scrollIntoView', { value: scrollIntoView, configurable: true });
    render(<h2 id="usage">Usage</h2>);
    expect(scrollToSection('usage')).toBe(true);
    const heading = screen.getByRole('heading', { name: 'Usage' });
    expect(heading).toHaveAttribute('tabindex', '-1');
    expect(document.activeElement).toBe(heading);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
  });

  it('keeps a tabindex the target already has', () => {
    render(<main id="main" tabIndex={0} />);
    scrollToSection('main');
    expect(document.getElementById('main')).toHaveAttribute('tabindex', '0');
  });

  it('returns false and moves nothing when no element has the id', () => {
    expect(scrollToSection('missing')).toBe(false);
    expect(document.activeElement).toBe(document.body);
  });
});

describe('InPageLink', () => {
  it('is a bit Link to #id that focuses the target and does not follow the href', async () => {
    render(
      <>
        <InPageLink targetId="props">Props</InPageLink>
        <h2 id="props">Props table</h2>
      </>,
    );
    const link = screen.getByRole('link', { name: 'Props' });
    expect(link).toHaveAttribute('href', '#props');
    expect(link).toHaveClass('bit-link');
    const before = window.location.href;
    await userEvent.click(link);
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Props table' }));
    expect(window.location.href).toBe(before);
  });
});
