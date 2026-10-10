import { createContext, useContext } from 'react';

/** Where a NavbarLink is drawn: in the row of links, or as an item of the folded Menu. Private. */
export type NavbarPlace = 'row' | 'menu';

export const NavbarContext = createContext<NavbarPlace | null>(null);

/** The surrounding Navbar's place for its links, or a clear error naming the part that is outside one. */
export function useNavbarPlace(partName: string): NavbarPlace {
  const place = useContext(NavbarContext);
  if (!place) throw new Error(`bit: <${partName}> must be inside a <Navbar>.`);
  return place;
}
