import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Menu } from './Menu';
import { MenuItem, MenuSeparator } from './MenuParts';
import { Button } from '../Button/Button';

const trigger = () => screen.getByRole('button', { name: 'Edit' });
const isOpen = () => trigger().getAttribute('aria-expanded') === 'true';
const focused = () => (document.activeElement?.querySelector('.bit-menu__label') ?? document.activeElement)?.textContent;

const onSelect = vi.fn();

/** Undo and Redo, a disabled Cut, then Copy, Paste and Paste special. */
function EditMenu() {
  return (
    <>
      <button type="button">Before</button>
      <Menu title="Edit" trigger={<Button>Edit</Button>}>
        <MenuItem onSelect={() => onSelect('undo')}>Undo</MenuItem>
        <MenuItem onSelect={() => onSelect('redo')}>Redo</MenuItem>
        <MenuSeparator />
        <MenuItem disabled onSelect={() => onSelect('cut')}>
          Cut
        </MenuItem>
        <MenuItem onSelect={() => onSelect('copy')}>Copy</MenuItem>
        <MenuItem onSelect={() => onSelect('paste')}>Paste</MenuItem>
        <MenuItem onSelect={() => onSelect('special')}>Paste special</MenuItem>
      </Menu>
      <button type="button">After</button>
    </>
  );
}

let now = 10_000;
beforeEach(() => {
  now = 10_000;
  onSelect.mockClear();
  vi.spyOn(Date, 'now').mockImplementation(() => now);
});
afterEach(() => vi.restoreAllMocks());

async function setup() {
  const user = userEvent.setup();
  render(<EditMenu />);
  trigger().focus();
  return user;
}

describe('Menu keyboard: opening from the trigger', () => {
  it.each([['{Enter}'], [' '], ['{ArrowDown}']])('%s opens it on the first item', async (key) => {
    const user = await setup();
    await user.keyboard(key);
    expect(isOpen()).toBe(true);
    expect(focused()).toBe('Undo');
  });

  it('ArrowUp opens it on the last item', async () => {
    const user = await setup();
    await user.keyboard('{ArrowUp}');
    expect(isOpen()).toBe(true);
    expect(focused()).toBe('Paste special');
  });

  it('Space opens it once: its keyup click does not close it again', async () => {
    const user = await setup();
    await user.keyboard(' ');
    expect(isOpen()).toBe(true);
  });

  it('other keys on the trigger do nothing', async () => {
    const user = await setup();
    await user.keyboard('u');
    await user.keyboard('{ArrowLeft}');
    expect(isOpen()).toBe(false);
  });
});

describe('Menu keyboard: moving', () => {
  it('ArrowDown and ArrowUp move one item, skip the disabled one, and wrap at both ends', async () => {
    const user = await setup();
    await user.keyboard('{Enter}');
    await user.keyboard('{ArrowDown}');
    expect(focused()).toBe('Redo');
    await user.keyboard('{ArrowDown}');
    expect(focused()).toBe('Copy');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(focused()).toBe('Paste special');
    await user.keyboard('{ArrowDown}');
    expect(focused()).toBe('Undo');
    await user.keyboard('{ArrowUp}');
    expect(focused()).toBe('Paste special');
    await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}');
    expect(focused()).toBe('Redo');
  });

  it('Home and End go to the first and last items', async () => {
    const user = await setup();
    await user.keyboard('{Enter}{End}');
    expect(focused()).toBe('Paste special');
    await user.keyboard('{Home}');
    expect(focused()).toBe('Undo');
  });

  it('typing a letter goes to the next item starting with it, cycling, and skips disabled items', async () => {
    const user = await setup();
    await user.keyboard('{Enter}');
    await user.keyboard('p');
    expect(focused()).toBe('Paste');
    now += 1000;
    await user.keyboard('p');
    expect(focused()).toBe('Paste special');
    now += 1000;
    await user.keyboard('p');
    expect(focused()).toBe('Paste');
    now += 1000;
    await user.keyboard('c');
    expect(focused()).toBe('Copy');
  });

  it('typing several letters quickly matches the whole prefix; no match stays put', async () => {
    const user = await setup();
    await user.keyboard('{Enter}');
    await user.keyboard('r');
    expect(focused()).toBe('Redo');
    now += 1000;
    await user.keyboard('z');
    expect(focused()).toBe('Redo');
  });

  it('a Space typed within a search is part of it, not a choice', async () => {
    const user = await setup();
    await user.keyboard('{Enter}');
    await user.keyboard('paste');
    now += 100;
    await user.keyboard(' s');
    expect(focused()).toBe('Paste special');
    expect(onSelect).not.toHaveBeenCalled();
    expect(isOpen()).toBe(true);
  });
});

describe('Menu keyboard: choosing and leaving', () => {
  it('Enter chooses the focused item, closes, and returns focus to the trigger', async () => {
    const user = await setup();
    await user.keyboard('{Enter}{ArrowDown}{Enter}');
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('redo');
    expect(isOpen()).toBe(false);
    expect(trigger()).toHaveFocus();
  });

  it('Space chooses the focused item too', async () => {
    const user = await setup();
    await user.keyboard('{Enter}');
    now += 1000;
    await user.keyboard(' ');
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('undo');
    expect(isOpen()).toBe(false);
  });

  it('Esc closes without choosing and returns focus to the trigger', async () => {
    const user = await setup();
    await user.keyboard('{Enter}{ArrowDown}{Escape}');
    expect(onSelect).not.toHaveBeenCalled();
    expect(isOpen()).toBe(false);
    expect(trigger()).toHaveFocus();
  });

  it('Esc is stopped there: a listener on the document never hears it', async () => {
    const outer = vi.fn();
    document.addEventListener('keydown', outer);
    const user = await setup();
    await user.keyboard('{Enter}');
    outer.mockClear();
    await user.keyboard('{Escape}');
    expect(outer).not.toHaveBeenCalled();
    document.removeEventListener('keydown', outer);
  });

  it('Tab closes it and focus moves on to the next control', async () => {
    const user = await setup();
    await user.keyboard('{Enter}');
    await user.tab();
    expect(isOpen()).toBe(false);
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('Shift+Tab closes it and focus moves back to the trigger', async () => {
    const user = await setup();
    await user.keyboard('{Enter}');
    await user.tab({ shift: true });
    expect(isOpen()).toBe(false);
    expect(trigger()).toHaveFocus();
  });

  it('a menu with no enabled item focuses the menu itself, and Esc still closes it', async () => {
    const user = userEvent.setup();
    render(
      <Menu title="Empty" trigger={<Button>Empty</Button>}>
        <MenuItem disabled>Nothing yet</MenuItem>
      </Menu>,
    );
    await user.click(screen.getByRole('button', { name: 'Empty' }));
    expect(screen.getByRole('menu')).toHaveFocus();
    await user.keyboard('{ArrowDown}{Enter}');
    expect(screen.getByRole('menu')).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Empty' })).toHaveFocus();
  });

  it("the trigger's own keydown can stop the menu by preventing the default", async () => {
    const user = userEvent.setup();
    render(
      <Menu title="Edit" trigger={<Button onKeyDown={(event) => event.preventDefault()}>Edit</Button>}>
        <MenuItem>Undo</MenuItem>
      </Menu>,
    );
    trigger().focus();
    await user.keyboard('{ArrowDown}');
    expect(isOpen()).toBe(false);
  });

  it('focus moved back to the trigger closes the menu; ArrowUp then opens it on the last item', async () => {
    const user = await setup();
    await user.keyboard('{Enter}');
    act(() => trigger().focus());
    expect(isOpen()).toBe(false);
    await user.keyboard('{ArrowUp}');
    expect(focused()).toBe('Paste special');
    expect(isOpen()).toBe(true);
  });

  it("the window's own onKeyDown can take a key first by preventing its default", async () => {
    const user = userEvent.setup();
    render(
      <Menu title="Edit" trigger={<Button>Edit</Button>} onKeyDown={(event) => event.key === 'ArrowDown' && event.preventDefault()}>
        <MenuItem>Undo</MenuItem>
        <MenuItem>Redo</MenuItem>
      </Menu>,
    );
    trigger().focus();
    await user.keyboard('{Enter}{ArrowDown}');
    expect(focused()).toBe('Undo');
  });

  it('a menuitem you render yourself takes part in the arrows and typeahead, by its whole text', async () => {
    const user = userEvent.setup();
    render(
      <Menu title="Edit" trigger={<Button>Edit</Button>}>
        <MenuItem>Undo</MenuItem>
        <div role="menuitem" tabIndex={-1}>
          Zoom
        </div>
      </Menu>,
    );
    trigger().focus();
    await user.keyboard('{Enter}z');
    expect(focused()).toBe('Zoom');
    await user.keyboard('{ArrowDown}');
    expect(focused()).toBe('Undo');
  });
});

describe('Menu keyboard in right-to-left pages', () => {
  it('works the same: up and down are not mirrored', async () => {
    const user = userEvent.setup();
    render(
      <div dir="rtl">
        <EditMenu />
      </div>,
    );
    trigger().focus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(focused()).toBe('Redo');
  });
});
