import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { CodeBlock } from './CodeBlock';
import { COPY_RESET_MS } from './CopyButton';
import { CODE_LANGUAGES } from './tokenize';
import { expectNoA11yViolations } from '../../test/a11y';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';

const JSX = `<Button color="danger">Delete</Button>`;

/** Replace navigator.clipboard for one test; `undefined` removes it. */
function stubClipboard(writeText: ((text: string) => Promise<void>) | undefined): void {
  Object.defineProperty(navigator, 'clipboard', {
    value: writeText ? { writeText } : undefined,
    configurable: true,
  });
}

/** Click, then let the clipboard promise settle and React apply the new state. */
async function click(element: HTMLElement): Promise<void> {
  await act(async () => {
    fireEvent.click(element);
  });
}

const copyButton = () => screen.getByRole('button');
const announcer = () => document.getElementById('bit-announcer');

afterEach(() => {
  document.getElementById('bit-announcer')?.remove();
  Reflect.deleteProperty(navigator, 'clipboard');
  vi.useRealTimers();
});

describe('CodeBlock', () => {
  it('names Copy after the label, so several code blocks are told apart', () => {
    render(<CodeBlock code="pnpm add @bit-ds/react" language="shell" label="Install command" />);
    expect(screen.getByRole('button', { name: 'Copy Install command' })).toHaveTextContent('Copy');
  });

  it('without a label, names Copy after the language', () => {
    render(<CodeBlock code="ls" language="shell" />);
    expect(screen.getByRole('button', { name: 'Copy shell code' })).toBeInTheDocument();
  });

  it('after copying, the name is the visible state, and announce() says it', async () => {
    vi.useFakeTimers();
    stubClipboard(() => Promise.resolve());
    render(<CodeBlock code="ls" language="shell" />);
    await click(screen.getByRole('button', { name: 'Copy shell code' }));
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(100));
    expect(announcer()).toHaveTextContent('Copied');
  });

  it('has no live region of its own', () => {
    const { container } = render(<CodeBlock code="ls" language="shell" />);
    expect(container.querySelector('[aria-live]')).toBeNull();
  });

  it('renders the block, the bar with the language and Copy, and a focusable labelled pre', () => {
    const { container } = render(<CodeBlock code={JSX} language="jsx" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toBe('bit-code__block');
    expect(root).toHaveAttribute('data-language', 'jsx');
    const bar = root.querySelector('.bit-code__bar')!;
    expect(bar.querySelector('.bit-code__lang')).toHaveTextContent('jsx');
    expect(copyButton()).toHaveAttribute('type', 'button');
    expect(copyButton()).toHaveAttribute('data-state', 'idle');
    expect(copyButton()).toHaveTextContent('Copy');
    expect(container.querySelector('[aria-live]')).toBeNull();
    const pre = root.querySelector('pre.bit-code__pre')!;
    expect(pre).toHaveAttribute('tabindex', '0');
    expect(pre).toHaveAttribute('aria-label', 'jsx code');
    // Amendment 1, P1: a named region, so every screen reader announces the label.
    expect(pre).toHaveAttribute('role', 'region');
    expect(screen.getByRole('region', { name: 'jsx code' })).toBe(pre);
    expect(pre.firstElementChild!.tagName).toBe('CODE');
  });

  it('label names the region, so same-language blocks on one page stay unique landmarks', async () => {
    const { container } = render(
      <>
        <CodeBlock code={JSX} language="jsx" label="React code" />
        <CodeBlock code="pnpm add @bit-ds/react" language="jsx" label="Install command" />
      </>,
    );
    const react = screen.getByRole('region', { name: 'React code' });
    const install = screen.getByRole('region', { name: 'Install command' });
    expect(react.tagName).toBe('PRE');
    expect(install.tagName).toBe('PRE');
    expect(react).not.toBe(install);
    for (const root of container.querySelectorAll('.bit-code__block')) expect(root).not.toHaveAttribute('label');
    await expectNoA11yViolations(container);
  });

  it('without label, the region is still named "<language> code"', () => {
    render(<CodeBlock code={JSX} language="jsx" />);
    expect(screen.getByRole('region', { name: 'jsx code' }).tagName).toBe('PRE');
  });

  it('an empty label falls back to "<language> code", never an empty-named region', () => {
    render(<CodeBlock code={JSX} language="jsx" label="" />);
    expect(screen.getByRole('region', { name: 'jsx code' }).tagName).toBe('PRE');
  });

  it('puts the ref, className and rest props on the root', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<CodeBlock ref={ref} code="x" language="css" className="extra" data-testid="cb" />);
    const root = container.firstElementChild as HTMLElement;
    expect(ref.current).toBe(root);
    expect(root.className).toBe('bit-code__block extra');
    expect(root).toHaveAttribute('data-testid', 'cb');
  });

  it('colors tokens as spans with data-kind and leaves plain text bare', () => {
    const { container } = render(<CodeBlock code={JSX} language="jsx" />);
    const code = container.querySelector('pre code')!;
    const spans = [...code.querySelectorAll('span.bit-code__token')];
    expect(spans.map((s) => [s.getAttribute('data-kind'), s.textContent])).toEqual([
      ['punct', '<'],
      ['component', 'Button'],
      ['attr', 'color'],
      ['punct', '='],
      ['string', '"danger"'],
      ['punct', '>'],
      ['punct', '</'],
      ['component', 'Button'],
      ['punct', '>'],
    ]);
    const bare = [...code.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent);
    expect(bare).toEqual([' ', 'Delete']);
  });

  it.each([
    ['jsx', `import { Button } from '@bit-ds/react';`, ['keyword', 'component', 'string']],
    ['html', '<div class="bit-card"><!-- x --></div>', ['tag', 'attr', 'string', 'comment']],
    ['css', '.bit-card { height: 40px; }', ['tag', 'prop', 'number']],
    ['shell', 'pnpm add @bit-ds/react # go', ['keyword', 'comment']],
  ] as const)('%s: the pre reads back the exact code, with its kinds colored', (language, code, kinds) => {
    const { container } = render(<CodeBlock code={code} language={language} />);
    expect(container.querySelector('pre')!.textContent).toBe(code);
    const seen = [...container.querySelectorAll('[data-kind]')].map((s) => s.getAttribute('data-kind'));
    for (const kind of kinds) expect(seen).toContain(kind);
  });

  it('copies the code: "Copied" on the button and in the status, then "Copy" again after 2000ms', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn(() => Promise.resolve());
    stubClipboard(writeText);
    render(<CodeBlock code={JSX} language="jsx" />);
    await click(copyButton());
    expect(writeText).toHaveBeenCalledWith(JSX);
    expect(copyButton()).toHaveAttribute('data-state', 'copied');
    expect(copyButton()).toHaveTextContent('Copied');
    act(() => vi.advanceTimersByTime(50));
    expect(announcer()).toHaveTextContent('Copied');
    act(() => vi.advanceTimersByTime(COPY_RESET_MS - 51));
    expect(copyButton()).toHaveAttribute('data-state', 'copied');
    act(() => vi.advanceTimersByTime(1));
    expect(copyButton()).toHaveAttribute('data-state', 'idle');
    expect(copyButton()).toHaveTextContent('Copy');
  });

  it('a refused write shows "Copy failed", then resets', async () => {
    vi.useFakeTimers();
    stubClipboard(() => Promise.reject(new Error('denied')));
    render(<CodeBlock code={JSX} language="jsx" />);
    await click(copyButton());
    expect(copyButton()).toHaveAttribute('data-state', 'failed');
    expect(copyButton()).toHaveTextContent('Copy failed');
    act(() => vi.advanceTimersByTime(50));
    expect(announcer()).toHaveTextContent('Copy failed');
    act(() => vi.advanceTimersByTime(COPY_RESET_MS));
    expect(copyButton()).toHaveAttribute('data-state', 'idle');
  });

  it('no clipboard at all (an insecure page) shows "Copy failed" and does not throw', async () => {
    stubClipboard(undefined);
    render(<CodeBlock code={JSX} language="jsx" />);
    await click(copyButton());
    expect(copyButton()).toHaveAttribute('data-state', 'failed');
  });

  it('a second click restarts the 2000ms', async () => {
    vi.useFakeTimers();
    stubClipboard(() => Promise.resolve());
    render(<CodeBlock code={JSX} language="jsx" />);
    await click(copyButton());
    act(() => vi.advanceTimersByTime(1500));
    await click(copyButton());
    act(() => vi.advanceTimersByTime(1500));
    expect(copyButton()).toHaveAttribute('data-state', 'copied');
    act(() => vi.advanceTimersByTime(500));
    expect(copyButton()).toHaveAttribute('data-state', 'idle');
  });

  it('unmounting clears the reset timer', async () => {
    vi.useFakeTimers();
    stubClipboard(() => Promise.resolve());
    const { unmount } = render(<CodeBlock code={JSX} language="jsx" />);
    await click(copyButton());
    // Let announce()'s own short timer finish, so only the reset timer is left.
    act(() => vi.advanceTimersByTime(50));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('unmounting while the clipboard is still busy starts no timer and does not throw', async () => {
    vi.useFakeTimers();
    let finish: () => void = () => {};
    stubClipboard(() => new Promise<void>((resolve) => (finish = resolve)));
    const { unmount } = render(<CodeBlock code={JSX} language="jsx" />);
    fireEvent.click(copyButton());
    unmount();
    await act(async () => finish());
    expect(vi.getTimerCount()).toBe(0);
  });

  it('copy={false} shows no button', () => {
    const { container } = render(<CodeBlock code="x" language="shell" copy={false} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(container.querySelector('.bit-code__lang')).toHaveTextContent('shell');
  });

  it('rejects the legacy DOM color attribute and does not render it', () => {
    // @ts-expect-error color is not part of CodeBlockProps
    const { container } = render(<CodeBlock code="x" language="css" color="danger" />);
    expect(container.firstElementChild).not.toHaveAttribute('color');
  });

  describe('actions', () => {
    const PM_OPTIONS = [
      { value: 'pnpm', label: 'pnpm' },
      { value: 'npm', label: 'npm' },
    ] as const;
    const switcher = <SegmentedControl legend="Package manager" legendHidden options={PM_OPTIONS} size="sm" />;

    it('renders the slot in a bit-code__actions wrapper inside the bar', () => {
      const { container } = render(
        <CodeBlock code="x" language="shell" actions={<button type="button">Extra</button>} />,
      );
      const actions = container.querySelector('.bit-code__actions')!;
      expect(actions).not.toBeNull();
      expect(actions.tagName).toBe('DIV');
      // The element grammar: bit-{block}__{element}, and CodeBlock's block is bit-code.
      expect(actions.className).toMatch(/^bit-code__[a-z]+$/);
      expect(actions.parentElement).toBe(container.querySelector('.bit-code__bar'));
      expect(actions).toContainElement(screen.getByRole('button', { name: 'Extra' }));
    });

    it('renders no wrapper when actions is absent', () => {
      const { container } = render(<CodeBlock code="x" language="shell" />);
      expect(container.querySelector('.bit-code__actions')).toBeNull();
      expect([...container.querySelector('.bit-code__bar')!.children].map((el) => el.className)).toEqual([
        'bit-code__lang',
        'bit-code__copy',
      ]);
    });

    it('puts the actions after the language label and before the Copy button', () => {
      const { container } = render(
        <CodeBlock code="x" language="shell" actions={<button type="button">Extra</button>} />,
      );
      const bar = container.querySelector('.bit-code__bar')!;
      expect([...bar.children].map((el) => el.className)).toEqual([
        'bit-code__lang',
        'bit-code__actions',
        'bit-code__copy',
      ]);
      const extra = screen.getByRole('button', { name: 'Extra' });
      const copy = screen.getByRole('button', { name: 'Copy shell code' });
      expect(extra.compareDocumentPosition(copy) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('copy={false} still renders the actions, with no Copy button', () => {
      const { container } = render(
        <CodeBlock code="x" language="shell" copy={false} actions={<button type="button">Extra</button>} />,
      );
      expect(container.querySelector('.bit-code__actions')).toContainElement(screen.getByRole('button', { name: 'Extra' }));
      expect(screen.queryByRole('button', { name: 'Copy shell code' })).toBeNull();
    });

    it('Copy copies the current code prop, so a switcher that swaps code swaps what Copy copies', async () => {
      const writeText = vi.fn(() => Promise.resolve());
      stubClipboard(writeText);
      const { rerender } = render(<CodeBlock code="pnpm add x" language="shell" actions={switcher} />);
      rerender(<CodeBlock code="npm install x" language="shell" actions={switcher} />);
      await click(screen.getByRole('button', { name: 'Copy shell code' }));
      expect(writeText).toHaveBeenCalledWith('npm install x');
    });

    it('has no accessibility violations with a SegmentedControl in the slot', async () => {
      const { container } = render(<CodeBlock code="pnpm add @bit-ds/react" language="shell" actions={switcher} />);
      expect(container.querySelector('.bit-code__actions fieldset.bit-segmented-control')).not.toBeNull();
      await expectNoA11yViolations(container);
    });
  });

  it.each(CODE_LANGUAGES)('%s: has no accessibility violations', async (language) => {
    const { container } = render(<CodeBlock code={JSX} language={language} />);
    await expectNoA11yViolations(container);
  });
});
