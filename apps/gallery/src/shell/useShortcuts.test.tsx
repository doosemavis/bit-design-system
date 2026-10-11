import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderAt } from '../test/renderRoute';
import { stubClipboard } from '../test/clipboard';
import { isTypingTarget } from './useShortcuts';

async function openAt(path: string, h1: string) {
  const utils = renderAt(path);
  await screen.findByRole('heading', { level: 1, name: h1 });
  return utils;
}

const announcer = () => document.getElementById('bit-announcer');
const exampleCode = () => screen.getByRole('region', { name: 'Example code' });

afterEach(() => {
  document.getElementById('bit-announcer')?.remove();
  document.getSelection()?.removeAllRanges();
  Reflect.deleteProperty(navigator, 'clipboard');
});

describe('isTypingTarget', () => {
  function make(html: string): Element {
    const host = document.createElement('div');
    host.innerHTML = html;
    return host.firstElementChild!;
  }

  it('is true for fields, select-like widgets and editable text', () => {
    for (const html of [
      '<input type="text">',
      '<input type="search">',
      '<textarea></textarea>',
      '<select></select>',
      '<div contenteditable="true"></div>',
      '<button role="combobox"></button>',
      '<div role="listbox"></div>',
      '<div role="menu"></div>',
    ]) {
      expect(isTypingTarget(make(html)), html).toBe(true);
    }
  });

  it('is false for buttons, links, the page itself and nothing', () => {
    expect(isTypingTarget(make('<button>Go</button>'))).toBe(false);
    expect(isTypingTarget(make('<a href="#x">x</a>'))).toBe(false);
    expect(isTypingTarget(document.body)).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});

describe('"/" opens search', () => {
  it('from the page, without typing the slash into the box', async () => {
    await openAt('/tokens', 'Tokens');
    await userEvent.keyboard('/');
    const box = within(screen.getByRole('dialog', { name: 'Search' })).getByRole('combobox');
    expect(box).toHaveFocus();
    expect(box).toHaveValue('');
  });

  it('but not while typing in a text field: the slash goes into the field', async () => {
    await openAt('/tokens', 'Tokens');
    const field = document.createElement('input');
    field.setAttribute('aria-label', 'Scratch');
    document.body.append(field);
    await userEvent.type(field, 'a/b');
    expect(field).toHaveValue('a/b');
    expect(screen.queryByRole('dialog')).toBeNull();
    field.remove();
  });
});

describe('Alt+C copies the playground code', () => {
  it('on a component page: copies the code, the Copy button reads "Copied", and it is announced', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    stubClipboard(writeText);
    await openAt('/components/button', 'Button');
    await userEvent.keyboard('{Alt>}c{/Alt}');
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(exampleCode().textContent));
    await waitFor(() => expect(announcer()).toHaveTextContent('Copied'));
    expect(exampleCode().parentElement!.querySelector('button')).toHaveTextContent('Copied');
  });

  it('when the clipboard refuses: selects the code so it can be copied by hand, and says so', async () => {
    stubClipboard(() => Promise.reject(new Error('denied')));
    await openAt('/components/button', 'Button');
    await userEvent.keyboard('{Alt>}c{/Alt}');
    await waitFor(() => expect(document.getSelection()?.toString()).toBe(exampleCode().textContent));
    await waitFor(() => expect(announcer()).toHaveTextContent('Copy failed. The code is selected: press Ctrl+C to copy it.'));
    expect(exampleCode()).toHaveFocus();
  });

  it('does nothing on a page without a playground', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    stubClipboard(writeText);
    await openAt('/tokens', 'Tokens');
    await userEvent.keyboard('{Alt>}c{/Alt}');
    expect(writeText).not.toHaveBeenCalled();
  });
});
