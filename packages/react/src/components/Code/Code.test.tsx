import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Code } from './Code';
import { expectNoA11yViolations } from '../../test/a11y';

describe('Code', () => {
  it('renders a <code class="bit-code">', () => {
    render(<Code>color="danger"</Code>);
    const code = screen.getByText('color="danger"');
    expect(code.tagName).toBe('CODE');
    expect(code.className).toBe('bit-code');
  });

  it('appends className last, forwards the ref and passes rest props', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Code ref={ref} className="extra" title="a prop">
        size
      </Code>,
    );
    const code = screen.getByText('size');
    expect(code.className).toBe('bit-code extra');
    expect(ref.current).toBe(code);
    expect(code).toHaveAttribute('title', 'a prop');
  });

  it('rejects the legacy DOM color attribute and does not render it', () => {
    // @ts-expect-error color is not part of CodeProps
    render(<Code color="danger">x</Code>);
    expect(screen.getByText('x')).not.toHaveAttribute('color');
  });

  it('has no accessibility violations inside running text', async () => {
    const { container } = render(
      <p>
        Set <Code>color="danger"</Code> on any component.
      </p>,
    );
    await expectNoA11yViolations(container);
  });
});
