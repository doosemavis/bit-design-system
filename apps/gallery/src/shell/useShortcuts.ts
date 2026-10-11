import { useEffect, useRef } from 'react';
import { announce } from '@bit-ds/react';
import { clipboardKeys, selectText } from '../ui/keys';

/**
 * Where typing a character means typing it: fields, editable text, and widgets that take letters themselves
 * (a Select's or Menu's typeahead). A one-key shortcut stays out of the way there.
 */
const TYPING = [
  'input',
  'textarea',
  'select',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="textbox"]',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="menu"]',
].join(', ');

/** True when a key pressed on `target` belongs to what has focus, not to the page. */
export function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(TYPING) !== null;
}

/** How long to wait for the Copy button's result before giving up on it. */
const COPY_RESULT_MS = 5000;

/**
 * If the clipboard refuses, select the code and focus it (which scrolls it into view), so the system copy keys
 * copy it by hand, and say so. CodeBlock's Copy button reports its result in data-state.
 */
function recoverOnFailure(button: HTMLElement, code: HTMLElement): void {
  const observer = new MutationObserver(() => {
    const state = button.dataset.state;
    if (state === 'idle') return;
    observer.disconnect();
    clearTimeout(timer);
    if (state !== 'failed') return;
    code.focus();
    selectText(code);
    announce(`Copy failed. The code is selected: press ${clipboardKeys().spoken} to copy it.`);
  });
  observer.observe(button, { attributes: true, attributeFilter: ['data-state'] });
  const timer = setTimeout(() => observer.disconnect(), COPY_RESULT_MS);
}

/**
 * Presses the playground CodeBlock's own Copy button, so the shortcut shows and announces "Copied" exactly as a
 * click does. False when the page has no playground code.
 */
export function copyPlaygroundCode(): boolean {
  const panel = document.querySelector('.gallery-codepanel');
  const button = panel?.querySelector<HTMLElement>('.bit-code__copy');
  const code = panel?.querySelector<HTMLElement>('.bit-code__pre');
  if (!button || !code) return false;
  recoverOnFailure(button, code);
  button.click();
  return true;
}

interface Shortcuts {
  /** Opens the search dialog. */
  openSearch: () => void;
}

/**
 * The page-wide keys. ⌘K or Ctrl+K (either, everywhere) and / open search; / only when focus isn't in a field,
 * so it can still be typed. Alt+C (⌥C) copies a component page's playground code: a modifier key, so it never
 * fires while typing a word (WCAG 2.1.4), isn't a screen reader's browse-mode letter, and has no browser
 * default. On a Mac ⌥C types "ç", so it is matched by the physical key, and skipped in fields too.
 */
export function useShortcuts({ openSearch }: Shortcuts): void {
  const latest = useRef(openSearch);
  useEffect(() => {
    latest.current = openSearch;
  });
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const command = event.metaKey || event.ctrlKey;
      if (command && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        latest.current();
        return;
      }
      // A game board's keys, an open modal (search included) and fields keep their own keys.
      if (event.defaultPrevented || event.isComposing || isTypingTarget(event.target) || document.querySelector('dialog[open]')) return;
      // Shift is allowed: some layouts type / with it (Shift+7 on a German keyboard).
      if (event.key === '/' && !command && !event.altKey) {
        event.preventDefault();
        latest.current();
      } else if (event.code === 'KeyC' && event.altKey && !command && !event.shiftKey && copyPlaygroundCode()) {
        event.preventDefault();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);
}
