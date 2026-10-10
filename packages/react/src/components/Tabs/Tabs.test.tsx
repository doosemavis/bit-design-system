import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs } from './Tabs';
import { Tab, TabList, TabPanel } from './TabParts';
import type { TabsProps } from './Tabs';
import { expectNoA11yViolations } from '../../test/a11y';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function Demo({ disabledFirst = false, ...props }: Partial<TabsProps> & { disabledFirst?: boolean }) {
  return (
    <Tabs {...props}>
      <TabList aria-label="Docs">
        <Tab value="overview" disabled={disabledFirst}>Overview</Tab>
        <Tab value="usage">Usage</Tab>
        <Tab value="props" disabled>Props</Tab>
        <Tab value="a11y">A11y</Tab>
      </TabList>
      <TabPanel value="overview">Overview panel</TabPanel>
      <TabPanel value="usage">Usage panel</TabPanel>
      <TabPanel value="props">Props panel</TabPanel>
      <TabPanel value="a11y">A11y panel</TabPanel>
    </Tabs>
  );
}

const tab = (name: string) => screen.getByRole('tab', { name });

describe('Tabs: structure and ARIA', () => {
  it('links each tab to its panel and back; only the chosen panel shows, the rest stay mounted and hidden', () => {
    const { container } = render(<Demo defaultValue="usage" />);
    expect(screen.getByRole('tablist', { name: 'Docs' })).toBeInTheDocument();
    expect(tab('Usage')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'false');
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveTextContent('Usage panel');
    expect(tab('Usage')).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', tab('Usage').id);
    expect(panel).toHaveAttribute('tabindex', '0');
    expect(container.querySelectorAll('[role="tabpanel"][hidden]')).toHaveLength(3);
  });

  it('only the chosen tab is a Tab stop', () => {
    render(<Demo defaultValue="usage" />);
    expect(tab('Usage')).toHaveAttribute('tabindex', '0');
    expect(tab('Overview')).toHaveAttribute('tabindex', '-1');
    expect(tab('A11y')).toHaveAttribute('tabindex', '-1');
  });

  it('with no defaultValue the first enabled tab is chosen, without calling onValueChange', () => {
    const onValueChange = vi.fn();
    render(<Demo disabledFirst onValueChange={onValueChange} />);
    expect(tab('Usage')).toHaveAttribute('aria-selected', 'true');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('with several lists and no defaultValue, the first list to adopt wins', () => {
    render(
      <Tabs>
        <TabList aria-label="One">
          <Tab value="a">A</Tab>
        </TabList>
        <TabList aria-label="Two">
          <Tab value="b">B</Tab>
        </TabList>
      </Tabs>,
    );
    expect(tab('A')).toHaveAttribute('aria-selected', 'true');
    expect(tab('B')).toHaveAttribute('aria-selected', 'false');
  });

  it('a controlled value no tab has shows no panel, and the first enabled tab is the Tab stop', () => {
    render(<Demo value="nope" />);
    expect(screen.queryByRole('tabpanel')).toBeNull();
    expect(tab('Overview')).toHaveAttribute('tabindex', '0');
  });

  it('a disabled chosen tab does not take the only Tab stop: the first enabled tab does', () => {
    render(<Demo value="props" />);
    expect(tab('Props')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Overview')).toHaveAttribute('tabindex', '0');
    expect(tab('Usage')).toHaveAttribute('tabindex', '-1');
  });

  it('the label is wrapped in a span (for the inside focus ring); the slot is hidden from screen readers', () => {
    const { container } = render(<Demo />);
    expect(tab('Overview').firstElementChild).toHaveClass('bit-tabs__label');
    expect(container.querySelector('.bit-tabs__slot')).toHaveAttribute('aria-hidden', 'true');
  });

  it('warns in development when TabList has no name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Tabs>
        <TabList>
          <Tab value="a">A</Tab>
        </TabList>
      </Tabs>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('<TabList> needs aria-label or aria-labelledby'));
    warn.mockRestore();
  });

  it('does not warn about a missing TabList name in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Tabs>
        <TabList>
          <Tab value="a">A</Tab>
        </TabList>
      </Tabs>,
    );
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('parts outside Tabs throw a clear error', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Tab value="a">A</Tab>)).toThrow('bit: <Tab> must be inside <Tabs>.');
    error.mockRestore();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Demo />);
    await expectNoA11yViolations(container);
  });
});

describe('Tabs: keyboard and pointer', () => {
  it('automatic: arrows move and choose, wrapping and skipping disabled tabs; Home and End jump', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Demo defaultValue="overview" onValueChange={onValueChange} />);
    act(() => tab('Overview').focus());
    await user.keyboard('{ArrowRight}');
    expect(tab('Usage')).toHaveFocus();
    expect(tab('Usage')).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowRight}');
    expect(tab('A11y')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(tab('Overview')).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(tab('A11y')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(tab('Overview')).toHaveFocus();
    await user.keyboard('{End}');
    expect(tab('A11y')).toHaveFocus();
    expect(onValueChange.mock.calls.map((call) => call[0])).toEqual(['usage', 'a11y', 'overview', 'a11y', 'overview', 'a11y']);
  });

  it('manual: arrows only move focus; Enter or Space chooses; the Tab stop stays on the chosen tab', async () => {
    const user = userEvent.setup();
    render(<Demo defaultValue="overview" activation="manual" />);
    act(() => tab('Overview').focus());
    await user.keyboard('{ArrowRight}');
    expect(tab('Usage')).toHaveFocus();
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Overview')).toHaveAttribute('tabindex', '0');
    await user.keyboard('{Enter}');
    expect(tab('Usage')).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowRight}');
    await user.keyboard(' ');
    expect(tab('A11y')).toHaveAttribute('aria-selected', 'true');
  });

  it('in a right-to-left page the arrows swap', async () => {
    const user = userEvent.setup();
    render(
      <div dir="rtl">
        <Demo defaultValue="overview" />
      </div>,
    );
    act(() => tab('Overview').focus());
    await user.keyboard('{ArrowLeft}');
    expect(tab('Usage')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(tab('Overview')).toHaveFocus();
  });

  it('reads the computed direction, so CSS direction: rtl swaps the arrows too', async () => {
    const user = userEvent.setup();
    render(
      <div style={{ direction: 'rtl' }}>
        <Demo defaultValue="overview" />
      </div>,
    );
    act(() => tab('Overview').focus());
    await user.keyboard('{ArrowLeft}');
    expect(tab('Usage')).toHaveFocus();
  });

  it('a dir="ltr" inside a right-to-left page keeps the arrows as they are', async () => {
    const user = userEvent.setup();
    render(
      <div dir="rtl">
        <div dir="ltr">
          <Demo defaultValue="overview" />
        </div>
      </div>,
    );
    act(() => tab('Overview').focus());
    await user.keyboard('{ArrowRight}');
    expect(tab('Usage')).toHaveFocus();
  });

  it('a Tab click or keydown handler can opt out of choosing, and other keys do nothing in manual mode', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    const onKeyDown = vi.fn((event: { key: string; preventDefault: () => void }) => event.key === 'Enter' && event.preventDefault());
    render(
      <Tabs defaultValue="a" activation="manual" onValueChange={onValueChange}>
        <TabList aria-label="X">
          <Tab value="a">A</Tab>
          <Tab value="b" onClick={onClick} onKeyDown={onKeyDown}>B</Tab>
        </TabList>
      </Tabs>,
    );
    await user.click(tab('B'));
    act(() => tab('B').focus());
    await user.keyboard('{Enter}');
    await user.keyboard('x');
    expect(onClick).toHaveBeenCalled();
    expect(onKeyDown).toHaveBeenCalled();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('clicking chooses; a disabled tab cannot be chosen; choosing the current tab does not call onValueChange', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Demo defaultValue="overview" onValueChange={onValueChange} />);
    await user.click(tab('Overview'));
    await user.click(tab('Props'));
    expect(onValueChange).not.toHaveBeenCalled();
    await user.click(tab('Usage'));
    expect(onValueChange).toHaveBeenCalledWith('usage');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Usage panel');
  });

  it('controlled: value wins; choosing only reports', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Demo value="overview" onValueChange={onValueChange} />);
    await user.click(tab('Usage'));
    expect(onValueChange).toHaveBeenCalledWith('usage');
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'true');
  });

  it('other keys do nothing, and a TabList keydown handler can opt out', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="a">
        <TabList aria-label="X" onKeyDown={(event) => event.key === 'End' && event.preventDefault()}>
          <Tab value="a">A</Tab>
          <Tab value="b">B</Tab>
        </TabList>
      </Tabs>,
    );
    act(() => tab('A').focus());
    await user.keyboard('{End}');
    await user.keyboard('x');
    expect(tab('A')).toHaveFocus();
  });
});

describe('Tabs: the plug-in animation', () => {
  it('does not play on the first render; plays on a change, alternating a and b; clears on the slot animationend', async () => {
    const user = userEvent.setup();
    const { container } = render(<Demo defaultValue="overview" />);
    const slot = container.querySelector('.bit-tabs__slot')!;
    expect(slot).not.toHaveAttribute('data-boot');
    await user.click(tab('Usage'));
    expect(slot).toHaveAttribute('data-boot', 'a');
    expect(tab('Usage')).toHaveAttribute('data-boot', 'a');
    expect(tab('Overview')).not.toHaveAttribute('data-boot');
    await user.click(tab('A11y'));
    expect(slot).toHaveAttribute('data-boot', 'b');
    act(() => {
      slot.dispatchEvent(new Event('animationend', { bubbles: true }));
    });
    expect(slot).not.toHaveAttribute('data-boot');
  });

  it('clears after 900ms even when no animationend comes (reduced motion)', () => {
    vi.useFakeTimers();
    const { container } = render(<Demo defaultValue="overview" />);
    act(() => tab('Usage').click());
    expect(container.querySelector('.bit-tabs__slot')).toHaveAttribute('data-boot', 'a');
    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(container.querySelector('.bit-tabs__slot')).not.toHaveAttribute('data-boot');
  });

  it('places the slot light under the chosen tab and follows resizes', () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = observe;
        disconnect = disconnect;
      },
    );
    const { container, unmount } = render(<Demo defaultValue="overview" />);
    expect((container.querySelector('.bit-tabs__slot') as HTMLElement).style.getPropertyValue('--_bit-tabs-x')).toBe('0px');
    expect(observe).toHaveBeenCalled();
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});
