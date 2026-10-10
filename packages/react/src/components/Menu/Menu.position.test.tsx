import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Menu } from './Menu';
import type { MenuProps } from './Menu';
import { MenuItem } from './MenuParts';
import { Button } from '../Button/Button';

const windowEl = () => document.querySelector<HTMLElement>('.bit-menu')!;
const isOpen = () => screen.getByRole('button', { name: 'File' }).getAttribute('aria-expanded') === 'true';

let triggerBox = { top: 100, left: 300, width: 80, height: 40 };
let menuBox = { width: 200, height: 160 };

function rect(box: { top?: number; left?: number; width: number; height: number }): DOMRect {
  const top = box.top ?? 0;
  const left = box.left ?? 0;
  return { top, left, width: box.width, height: box.height, bottom: top + box.height, right: left + box.width, x: left, y: top, toJSON: () => ({}) };
}

beforeEach(() => {
  triggerBox = { top: 100, left: 300, width: 80, height: 40 };
  menuBox = { width: 200, height: 160 };
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return rect(this.classList.contains('bit-menu') ? menuBox : triggerBox);
  });
  vi.stubGlobal('innerWidth', 1000);
  vi.stubGlobal('innerHeight', 800);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function open(props: Partial<MenuProps> = {}, dir?: 'rtl') {
  const user = userEvent.setup();
  const menu = (
    <Menu title="File" trigger={<Button>File</Button>} {...props}>
      <MenuItem>New game</MenuItem>
    </Menu>
  );
  render(dir ? <div dir={dir}>{menu}</div> : menu);
  await user.click(screen.getByRole('button', { name: 'File' }));
  return user;
}

describe('Menu position', () => {
  it('opens 6px below the trigger, its left edge on the trigger’s, then marks itself entered', async () => {
    await open();
    expect(windowEl().style.top).toBe('146px');
    expect(windowEl().style.left).toBe('300px');
    expect(windowEl().style.getPropertyValue('--_bit-menu-room')).toBe(`${800 - 140 - 6 - 8}px`);
    expect(windowEl()).toHaveAttribute('data-placement', 'bottom');
    expect(windowEl()).toHaveAttribute('data-entered');
  });

  it('align end lines its right edge up with the trigger’s', async () => {
    await open({ align: 'end' });
    expect(windowEl().style.left).toBe(`${380 - 200}px`);
  });

  it('right to left: start is the right edge, end the left', async () => {
    await open({}, 'rtl');
    expect(windowEl().style.left).toBe(`${380 - 200}px`);
  });

  it('right to left with align end: the left edge', async () => {
    await open({ align: 'end' }, 'rtl');
    expect(windowEl().style.left).toBe('300px');
  });

  it('flips above when there is no room below and more above', async () => {
    triggerBox = { ...triggerBox, top: 700 };
    await open();
    expect(windowEl()).toHaveAttribute('data-placement', 'top');
    expect(windowEl().style.top).toBe(`${700 - 6 - 160}px`);
  });

  it('stays 8px inside the viewport', async () => {
    triggerBox = { ...triggerBox, left: 900 };
    await open();
    expect(windowEl().style.left).toBe(`${1000 - 200 - 8}px`);
  });

  it('follows the trigger on scroll, and closes when the trigger scrolls out of view', async () => {
    await open();
    triggerBox = { ...triggerBox, top: 200 };
    fireEvent.scroll(document.body);
    expect(windowEl().style.top).toBe('246px');
    triggerBox = { ...triggerBox, top: -200 };
    fireEvent.scroll(document.body);
    expect(isOpen()).toBe(false);
  });

  it('placing again keeps the menu’s scroll position', async () => {
    await open();
    let scrollTop = 40;
    Object.defineProperty(windowEl(), 'scrollTop', { configurable: true, get: () => scrollTop, set: (v: number) => (scrollTop = v) });
    fireEvent(window, new Event('resize'));
    expect(scrollTop).toBe(40);
  });
});
