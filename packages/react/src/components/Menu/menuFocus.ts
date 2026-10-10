import { matchTypeahead } from '../Select/typeahead';

const ITEM = '[role="menuitem"]';
/** The class on an item's label, which typeahead reads (not the icon or the shortcut). */
export const LABEL_CLASS = 'bit-menu__label';

export const isDisabled = (item: Element): boolean => item.getAttribute('aria-disabled') === 'true';

/** Every item in the list, in order. */
export function menuItems(list: HTMLElement): HTMLElement[] {
  return [...list.querySelectorAll<HTMLElement>(ITEM)];
}

/** The items that can take focus: every item but the disabled ones. */
export function enabledItems(list: HTMLElement): HTMLElement[] {
  return menuItems(list).filter((item) => !isDisabled(item));
}

/** Where an arrow, Home or End key sends focus from `current`, wrapping at the ends; null for any other key or no items. */
export function keyTarget(list: HTMLElement, key: string, current: Element | null): HTMLElement | null {
  const items = enabledItems(list);
  if (items.length === 0) return null;
  const at = items.indexOf(current as HTMLElement);
  if (key === 'ArrowDown') return items[(at + 1) % items.length]!;
  if (key === 'ArrowUp') return items[at <= 0 ? items.length - 1 : at - 1]!;
  if (key === 'Home') return items[0]!;
  if (key === 'End') return items[items.length - 1]!;
  return null;
}

/** The item whose label starts with `query` (see matchTypeahead), searching from `current`; null when none does. */
export function typeaheadTarget(list: HTMLElement, query: string, current: Element | null): HTMLElement | null {
  const items = menuItems(list);
  const labels = items.map((item) => ({
    // A MenuItem's label; any other menuitem (one you render yourself) by all its text.
    label: (item.querySelector(`.${LABEL_CLASS}`) ?? item).textContent!,
    disabled: isDisabled(item),
  }));
  const found = matchTypeahead(labels, query, items.indexOf(current as HTMLElement));
  return found === -1 ? null : items[found]!;
}
