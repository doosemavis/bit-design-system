import { Children, cloneElement, forwardRef, isValidElement } from 'react';
import type { AnchorHTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { element, withClassName } from '../../system/toClasses';
import { createSlot, mergeProps } from '../../system/Slot';
import { MenuItem } from '../Menu/MenuParts';
import { useNavbarPlace } from './NavbarContext';

const Slot = createSlot('NavbarLink');

/** The single child of an asChild link, or the same error Slot gives. */
function onlyChild(children: ReactNode): ReactElement<Record<string, unknown>> {
  const items = Children.toArray(children);
  const [first] = items;
  if (items.length !== 1 || !isValidElement<Record<string, unknown>>(first)) {
    throw new Error('[bit] NavbarLink asChild needs exactly one child element.');
  }
  return first;
}

export interface NavbarLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'color'> {
  /** The page you're on: rendered as `aria-current="page"`, filled primary (pill) or a raised chip (bar). */
  current?: boolean;
  /** Render the single child (a router link) as the link, with NavbarLink's classes and props merged in. */
  asChild?: boolean;
}

/**
 * One link in a Navbar. In the row it is a list item's link; folded, the same link is an item of the Navbar's
 * Menu (role="menuitem"), so a router link passed with asChild works in both.
 */
export const NavbarLink = forwardRef<HTMLAnchorElement, NavbarLinkProps>(function NavbarLink(
  { current = false, asChild = false, className, children, ...rest },
  ref,
) {
  const place = useNavbarPlace('NavbarLink');
  const ariaCurrent = current ? ('page' as const) : undefined;
  if (place === 'menu') {
    // The link's own props go on the link; MenuItem lends it the item's role, classes and keys.
    let link: ReactElement;
    if (asChild) {
      const child = onlyChild(children);
      link = cloneElement(child, mergeProps(rest, child.props));
    } else {
      link = <a {...rest}>{children}</a>;
    }
    return (
      <MenuItem asChild ref={ref as Ref<HTMLDivElement>} className={className} aria-current={ariaCurrent}>
        {link}
      </MenuItem>
    );
  }
  const Comp = asChild ? Slot : 'a';
  return (
    <li className={element('navbar', 'item')}>
      <Comp ref={ref} className={withClassName(element('navbar', 'link'), className)} aria-current={ariaCurrent} {...rest}>
        {children}
      </Comp>
    </li>
  );
});
