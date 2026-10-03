import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StrictMode, createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { BitLogo } from './BitLogo';
import { LOGO_ERA_STORAGE_KEY, resetLogoEra } from './logoEra';
import { expectNoA11yViolations } from '../test/a11y';

const logo = () => screen.getByRole('img', { name: 'bit Design System' });
const stored = () => localStorage.getItem(LOGO_ERA_STORAGE_KEY);

beforeEach(() => {
  localStorage.clear();
  resetLogoEra();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('BitLogo', () => {
  it('renders "bit" over "Design System" as one image named "bit Design System"', () => {
    render(<BitLogo />);
    const root = logo();
    expect(root.className).toBe('bit-logo bit-md');
    const word = root.querySelector('.bit-logo__word');
    const caption = root.querySelector('.bit-logo__caption');
    expect(word).toHaveTextContent(/^bit$/);
    expect(caption).toHaveTextContent(/^Design System$/);
    expect(word).toHaveAttribute('aria-hidden', 'true');
    expect(caption).toHaveAttribute('aria-hidden', 'true');
    expect(root.children).toHaveLength(2);
  });

  it.each([
    [null, '8'],
    ['8', '16'],
    ['16', '32'],
    ['32', '64'],
    ['64', '8'],
    ['banana', '8'],
    ['0', '8'],
  ])('after a page load that stored %s, shows and stores era %s', (previous, expected) => {
    if (previous !== null) localStorage.setItem(LOGO_ERA_STORAGE_KEY, previous);
    render(<BitLogo />);
    expect(logo()).toHaveAttribute('data-era', expected);
    expect(stored()).toBe(expected);
  });

  it('every logo on the page shares one era, and later renders do not advance it', () => {
    localStorage.setItem(LOGO_ERA_STORAGE_KEY, '16');
    render(
      <>
        <BitLogo size="sm" />
        <BitLogo size="lg" />
      </>,
    );
    render(<BitLogo />);
    const eras = screen.getAllByRole('img').map((el) => el.getAttribute('data-era'));
    expect(eras).toEqual(['32', '32', '32']);
    expect(stored()).toBe('32');
  });

  it('StrictMode double rendering advances the era only once', () => {
    render(
      <StrictMode>
        <BitLogo />
      </StrictMode>,
    );
    expect(logo()).toHaveAttribute('data-era', '8');
    expect(stored()).toBe('8');
  });

  it('a pinned era shows that era and leaves the rotation alone', () => {
    localStorage.setItem(LOGO_ERA_STORAGE_KEY, '8');
    const { unmount } = render(<BitLogo era={32} />);
    expect(logo()).toHaveAttribute('data-era', '32');
    expect(stored()).toBe('8');
    unmount();
    render(<BitLogo />);
    expect(logo()).toHaveAttribute('data-era', '16');
  });

  it('shows 64-bit and does not throw when storage is blocked', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    expect(() => render(<BitLogo />)).not.toThrow();
    expect(logo()).toHaveAttribute('data-era', '64');
  });

  it('shows 64-bit when reading works but writing throws (quota, private mode)', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => '8',
      setItem: () => {
        throw new Error('quota');
      },
    });
    render(<BitLogo />);
    expect(logo()).toHaveAttribute('data-era', '64');
  });

  it('renders 64-bit on the server, or the pinned era', () => {
    expect(renderToString(<BitLogo />)).toContain('data-era="64"');
    expect(renderToString(<BitLogo era={16} />)).toContain('data-era="16"');
    expect(stored()).toBeNull();
  });

  it('maps size, appends className last, and passes style and ref through', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<BitLogo ref={ref} size="lg" className="extra" style={{ marginTop: 4 }} />);
    const root = logo();
    expect(root.className).toBe('bit-logo bit-lg extra');
    expect(root.style.marginTop).toBe('4px');
    expect(ref.current).toBe(root);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BitLogo />);
    await expectNoA11yViolations(container);
  });

  it('rejects the legacy DOM color attribute and does not render it', () => {
    render(
      // @ts-expect-error color is not part of BitLogoProps
      <BitLogo color="danger" />,
    );
    expect(logo()).not.toHaveAttribute('color');
  });

  it('no longer accepts the old cycle props', () => {
    render(
      <>
        {/* @ts-expect-error interval was removed: nothing animates */}
        <BitLogo interval={5} />
        {/* @ts-expect-error freeze was renamed to era */}
        <BitLogo freeze={32} />
      </>,
    );
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });
});
