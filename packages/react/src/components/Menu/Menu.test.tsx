import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import type { Ref } from 'react';
import { Menu } from './Menu';
import type { MenuProps } from './Menu';
import { MenuItem, MenuSeparator } from './MenuParts';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { Dialog } from '../Dialog/Dialog';
import { iconAdd, iconDelete, iconMoreVert, iconSave } from '../../icons/icons.generated';
import { expectNoA11yViolations } from '../../test/a11y';

const trigger = () => screen.getByRole('button', { name: 'File' });
const menu = () => screen.getByRole('menu', { hidden: true });
const isOpen = () => trigger().getAttribute('aria-expanded') === 'true';

function FileMenu(props: Partial<MenuProps> & { ref?: Ref<HTMLDivElement>; onNew?: () => void; onDelete?: () => void }) {
  const { onNew, onDelete, ...rest } = props;
  return (
    <Menu title="File" trigger={<Button>File</Button>} {...rest}>
      <MenuItem icon={iconAdd} shortcut="⌘N" onSelect={onNew}>
        New game
      </MenuItem>
      <MenuItem icon={iconSave} shortcut="⌘S">
        Save
      </MenuItem>
      <MenuItem disabled>Duplicate</MenuItem>
      <MenuSeparator />
      <MenuItem icon={iconDelete} danger onSelect={onDelete}>
        Delete save
      </MenuItem>
    </Menu>
  );
}

describe('Menu', () => {
  it('renders a closed window after the trigger, wired with aria-haspopup, aria-expanded and aria-controls', () => {
    render(<FileMenu />);
    expect(trigger()).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(trigger()).toHaveAttribute('aria-controls', menu().id);
    const layer = menu().closest('.bit-menu')!;
    expect(layer).toHaveAttribute('hidden');
    expect(layer.className).toBe('bit-menu bit-md');
    expect(trigger().nextElementSibling).toBe(layer);
  });

  it('the title strip names the menu and is not an item', async () => {
    const user = userEvent.setup();
    render(<FileMenu />);
    await user.click(trigger());
    expect(screen.getByRole('menu', { name: 'File' })).toBeVisible();
    const title = document.querySelector('.bit-menu__title')!;
    expect(title).toHaveTextContent('File');
    expect(menu()).toHaveAttribute('aria-labelledby', title.id);
    expect(menu().contains(title)).toBe(false);
    expect(within(menu()).getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['New game⌘N', 'Save⌘S', 'Duplicate', 'Delete save']);
  });

  it('an aria-label names the menu instead of the strip', async () => {
    const user = userEvent.setup();
    render(<FileMenu aria-label="Game file" />);
    await user.click(trigger());
    expect(screen.getByRole('menu', { name: 'Game file' })).toBeVisible();
    expect(menu()).not.toHaveAttribute('aria-labelledby');
  });

  it('items: an icon, the label, a shortcut; danger and disabled are attributes, never classes', () => {
    render(<FileMenu />);
    const items = within(menu()).getAllByRole('menuitem', { hidden: true });
    expect(items[0]!.className).toBe('bit-menu__item');
    expect(items[0]!.querySelector('svg.bit-menu__icon.bit-icon')).not.toBeNull();
    expect(items[0]!.querySelector('.bit-menu__label')).toHaveTextContent('New game');
    expect(items[0]!.querySelector('.bit-menu__shortcut')).toHaveTextContent('⌘N');
    expect(items[0]).toHaveAttribute('tabindex', '-1');
    expect(items[2]).toHaveAttribute('aria-disabled', 'true');
    expect(items[3]).toHaveAttribute('data-danger', '');
    expect(items[3]!.className).toBe('bit-menu__item');
    expect(menu().querySelector('[role="separator"]')!.className).toBe('bit-menu__separator');
  });

  it('size sm sets bit-sm and draws the item icons at sm; className goes last; a bit-size in className wins', () => {
    const { rerender } = render(<FileMenu size="sm" className="extra" />);
    expect(menu().closest('.bit-menu')!.className).toBe('bit-menu bit-sm extra');
    expect(menu().querySelector('.bit-menu__icon')).toHaveClass('bit-sm');
    rerender(<FileMenu className="bit-sm" />);
    expect(menu().closest('.bit-menu')!.className).toBe('bit-menu bit-sm');
  });

  it('forwards the ref to the window and spreads other props onto it; align end is data-align', () => {
    const ref = createRef<HTMLDivElement>();
    render(<FileMenu ref={ref} data-testid="window" align="end" />);
    expect(ref.current).toBe(screen.getByTestId('window'));
    expect(ref.current).toHaveAttribute('data-align', 'end');
  });

  it('keeps the trigger’s own props, handlers and ref', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(
      <Menu title="File" trigger={<Button ref={ref} onClick={onClick} variant="outline">File</Button>}>
        <MenuItem>New game</MenuItem>
      </Menu>,
    );
    await user.click(trigger());
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(ref.current).toBe(trigger());
    expect(trigger()).toHaveClass('bit-outline');
    expect(isOpen()).toBe(true);
  });

  it('a click opens it and focuses the first item; a second click closes it', async () => {
    const user = userEvent.setup();
    render(<FileMenu />);
    await user.click(trigger());
    expect(isOpen()).toBe(true);
    expect(screen.getByRole('menuitem', { name: /New game/ })).toHaveFocus();
    await user.click(trigger());
    expect(isOpen()).toBe(false);
    expect(menu().closest('.bit-menu')).toHaveAttribute('hidden');
  });

  it('clicking an item runs onSelect, closes and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    const onNew = vi.fn();
    render(<FileMenu onNew={onNew} />);
    await user.click(trigger());
    await user.click(screen.getByRole('menuitem', { name: /New game/ }));
    expect(onNew).toHaveBeenCalledTimes(1);
    expect(isOpen()).toBe(false);
    expect(trigger()).toHaveFocus();
  });

  it('preventDefault in onSelect keeps it open', async () => {
    const user = userEvent.setup();
    render(
      <Menu title="View" trigger={<Button>View</Button>}>
        <MenuItem onSelect={(event) => event.preventDefault()}>Zoom in</MenuItem>
      </Menu>,
    );
    const view = screen.getByRole('button', { name: 'View' });
    await user.click(view);
    await user.click(screen.getByRole('menuitem', { name: 'Zoom in' }));
    expect(view).toHaveAttribute('aria-expanded', 'true');
  });

  it('a disabled item does nothing on click and the menu stays open', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Menu title="File" trigger={<Button>File</Button>}>
        <MenuItem>New game</MenuItem>
        <MenuItem disabled onSelect={onSelect}>
          Duplicate
        </MenuItem>
      </Menu>,
    );
    await user.click(trigger());
    await user.click(screen.getByRole('menuitem', { name: 'Duplicate' }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(isOpen()).toBe(true);
  });

  it('a press inside the window (the title, a separator) keeps focus and keeps it open', async () => {
    const user = userEvent.setup();
    render(<FileMenu />);
    await user.click(trigger());
    await user.click(document.querySelector('.bit-menu__title')!);
    await user.click(document.querySelector('.bit-menu__separator')!);
    expect(isOpen()).toBe(true);
    expect(screen.getByRole('menuitem', { name: /New game/ })).toHaveFocus();
  });

  it('a click outside closes it, and focus stays where it went', async () => {
    const user = userEvent.setup();
    render(
      <>
        <FileMenu />
        <button type="button">Elsewhere</button>
      </>,
    );
    await user.click(trigger());
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(isOpen()).toBe(false);
    expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus();
  });

  it('the pointer over an item makes it the active (focused) one; not a disabled item', async () => {
    const user = userEvent.setup();
    render(<FileMenu />);
    await user.click(trigger());
    await user.hover(screen.getByRole('menuitem', { name: /Save/ }));
    expect(screen.getByRole('menuitem', { name: /Save/ })).toHaveFocus();
    await user.hover(screen.getByRole('menuitem', { name: 'Duplicate' }));
    expect(screen.getByRole('menuitem', { name: /Save/ })).toHaveFocus();
  });

  describe('open state', () => {
    it('controlled: open shows it, onOpenChange asks, and the parent decides', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      const { rerender } = render(<FileMenu open={false} onOpenChange={onOpenChange} />);
      await user.click(trigger());
      expect(onOpenChange).toHaveBeenLastCalledWith(true);
      expect(isOpen()).toBe(false);
      rerender(<FileMenu open onOpenChange={onOpenChange} />);
      expect(isOpen()).toBe(true);
      expect(screen.getByRole('menuitem', { name: /New game/ })).toHaveFocus();
      await user.keyboard('{Escape}');
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
      expect(onOpenChange).toHaveBeenCalledTimes(2);
    });

    it('defaultOpen starts it open; onOpenChange still reports', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<FileMenu defaultOpen onOpenChange={onOpenChange} />);
      expect(isOpen()).toBe(true);
      await user.keyboard('{Escape}');
      expect(isOpen()).toBe(false);
      expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    });

    it('closed by the parent while focus is inside: focus goes back to the trigger', () => {
      function Parent() {
        const [open, setOpen] = useState(true);
        return (
          <>
            <button type="button" onClick={() => setOpen(false)}>
              Close from outside
            </button>
            <FileMenu open={open} onOpenChange={setOpen} />
          </>
        );
      }
      render(<Parent />);
      expect(screen.getByRole('menuitem', { name: /New game/ })).toHaveFocus();
      // A timer or a socket message closes it: no focus move first.
      fireEvent.click(screen.getByRole('button', { name: 'Close from outside' }));
      expect(isOpen()).toBe(false);
      expect(trigger()).toHaveFocus();
    });
  });

  it('works with an IconButton trigger', async () => {
    const user = userEvent.setup();
    render(
      <Menu title="Game" align="end" trigger={<IconButton icon={iconMoreVert} label="More" />}>
        <MenuItem>Rename</MenuItem>
      </Menu>,
    );
    const more = screen.getByRole('button', { name: 'More' });
    expect(more).toHaveAttribute('aria-haspopup', 'menu');
    await user.click(more);
    expect(screen.getByRole('menu', { name: 'Game' })).toBeVisible();
    expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveFocus();
  });

  it('Esc inside a Dialog closes the menu, not the Dialog', async () => {
    const user = userEvent.setup();
    const onDialogChange = vi.fn();
    render(
      <Dialog open onOpenChange={onDialogChange}>
        <FileMenu />
      </Dialog>,
    );
    await user.click(trigger());
    await user.keyboard('{Escape}');
    expect(isOpen()).toBe(false);
    expect(onDialogChange).not.toHaveBeenCalled();
  });

  it('throws a clear error when the trigger is not an element, and for parts outside a Menu', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Menu title="x" trigger={'x' as never}>{null}</Menu>)).toThrow('trigger must be one element');
    expect(() => render(<MenuItem>x</MenuItem>)).toThrow('<MenuItem> must be inside a <Menu>');
    expect(() => render(<MenuSeparator />)).toThrow('<MenuSeparator> must be inside a <Menu>');
    quiet.mockRestore();
  });

  it('has no accessibility violations, closed or open', async () => {
    const user = userEvent.setup();
    const { container } = render(<FileMenu />);
    await expectNoA11yViolations(container);
    await user.click(trigger());
    await expectNoA11yViolations(container);
  });
});

describe('Menu asChild items', () => {
  it('renders the child (a link) as the item, with the icon, label and shortcut inside, and closes on click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <Menu title="Go" trigger={<Button>Go</Button>}>
        <MenuItem asChild icon={iconAdd} shortcut="G">
          <a href="#scores" onClick={onClick} aria-current="page">
            Scores
          </a>
        </MenuItem>
      </Menu>,
    );
    await user.click(screen.getByRole('button', { name: 'Go' }));
    const link = screen.getByRole('menuitem', { name: /Scores/ });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '#scores');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link.className).toBe('bit-menu__item');
    expect(link.querySelector('.bit-menu__label')).toHaveTextContent('Scores');
    expect(link.querySelector('.bit-menu__icon')).not.toBeNull();
    // A router link prevents the default to navigate in the app; the menu still closes.
    await user.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Go' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('a disabled link item never reaches its own click handler', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Menu title="Go" trigger={<Button>Go</Button>}>
        <MenuItem>Home</MenuItem>
        <MenuItem asChild disabled>
          <a href="#shop" onClick={onClick}>
            Shop
          </a>
        </MenuItem>
      </Menu>,
    );
    await user.click(screen.getByRole('button', { name: 'Go' }));
    await user.click(screen.getByRole('menuitem', { name: 'Shop' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('asChild needs exactly one element', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <Menu title="Go" trigger={<Button>Go</Button>}>
          <MenuItem asChild>text</MenuItem>
        </Menu>,
      ),
    ).toThrow('asChild needs exactly one child element');
    quiet.mockRestore();
  });
});

describe('Menu in the top layer', () => {
  // jsdom hides a [popover] that isn't open and has no popover API, and since 30.1.2 it won't focus
  // into a hidden element. So the stand-in shows the window the way a browser would, or focus never
  // reaches the list and Escape never closes it.
  const show = vi.fn(function (this: HTMLElement) {
    this.style.display = 'block';
  });
  const hide = vi.fn(function (this: HTMLElement) {
    this.style.removeProperty('display');
  });
  beforeEach(() => {
    show.mockClear();
    hide.mockClear();
    Object.defineProperty(HTMLElement.prototype, 'showPopover', { configurable: true, writable: true, value: show });
    Object.defineProperty(HTMLElement.prototype, 'hidePopover', { configurable: true, writable: true, value: hide });
  });
  afterEach(() => {
    cleanup();
    Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
    Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
  });

  it('shows the window as a manual popover on open and hides it on close', async () => {
    const user = userEvent.setup();
    render(<FileMenu />);
    expect(show).not.toHaveBeenCalled();
    await user.click(trigger());
    expect(show).toHaveBeenCalledTimes(1);
    expect(show.mock.contexts[0]).toBe(menu().closest('.bit-menu'));
    expect(menu().closest('.bit-menu')).toHaveAttribute('popover', 'manual');
    await user.keyboard('{Escape}');
    expect(hide).toHaveBeenCalledTimes(1);
  });
});
