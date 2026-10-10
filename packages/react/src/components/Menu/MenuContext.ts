import { createContext, useContext } from 'react';

/** What a Menu tells its items. Private: not exported from the package. */
export interface MenuContextValue {
  /** Close the menu, sending focus back to the trigger first (Esc, an item chosen). */
  close: () => void;
  /** The menu's size, so an item's icon matches its text. */
  size: 'sm' | 'md';
}

export const MenuContext = createContext<MenuContextValue | null>(null);

/** The surrounding Menu, or a clear error naming the part that is outside one. */
export function useMenu(partName: string): MenuContextValue {
  const menu = useContext(MenuContext);
  if (!menu) throw new Error(`bit: <${partName}> must be inside a <Menu>.`);
  return menu;
}
