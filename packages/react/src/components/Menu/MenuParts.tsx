import { Children, cloneElement, forwardRef, isValidElement } from 'react';
import type { HTMLAttributes, MouseEvent, PointerEvent, ReactElement, ReactNode } from 'react';
import { element, withClassName } from '../../system/toClasses';
import { createSlot } from '../../system/Slot';
import type { IconData } from '../../icons/types';
import { Icon } from '../Icon/Icon';
import { useMenu } from './MenuContext';
import { LABEL_CLASS } from './menuFocus';

// Always chained: a router link's own click prevents the default (to navigate in the app), and the menu must still close.
const Slot = createSlot('MenuItem', { alwaysChainHandlers: true });

export interface MenuItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color' | 'onSelect'> {
  /** An icon before the label: an `iconX` export. Decorative; the label names the item. */
  icon?: IconData;
  /** A keyboard shortcut shown at the end, in mono and muted, such as "⌘N". It only shows the shortcut; your app binds it. */
  shortcut?: ReactNode;
  /** A destructive action (delete, sign out everywhere): red text. Rendered as `data-danger`. */
  danger?: boolean;
  /** Can't be chosen and is skipped by the arrow keys, but stays in the list. Rendered as `aria-disabled`. */
  disabled?: boolean;
  /** Called when the item is chosen by click, Enter or Space. The menu then closes; call `event.preventDefault()` here to keep it open. */
  onSelect?: (event: MouseEvent<HTMLElement>) => void;
  /** Render the single child (an `<a>`, a router link) as the item, with the icon, label and shortcut inside it. */
  asChild?: boolean;
  /** The label. With asChild, one element whose children are the label. */
  children: ReactNode;
}

export type MenuSeparatorProps = Omit<HTMLAttributes<HTMLDivElement>, 'color' | 'children'>;

/** Stops a click on a disabled item before any handler sees it, so a link item can't navigate. */
function blockClick(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
}

/** One action in a Menu: an optional icon, the label, an optional shortcut. */
export const MenuItem = forwardRef<HTMLDivElement, MenuItemProps>(function MenuItem(
  { icon, shortcut, danger = false, disabled = false, onSelect, asChild = false, className, children, onClick, onPointerMove, ...rest },
  ref,
) {
  const menu = useMenu('MenuItem');
  const content = (label: ReactNode) => (
    <>
      {icon ? <Icon icon={icon} size={menu.size} className={element('menu', 'icon')} /> : null}
      <span className={LABEL_CLASS}>{label}</span>
      {shortcut ? <span className={element('menu', 'shortcut')}>{shortcut}</span> : null}
    </>
  );
  const props: HTMLAttributes<HTMLElement> & { 'data-danger'?: string } = {
    role: 'menuitem',
    tabIndex: -1,
    className: withClassName(element('menu', 'item'), className),
    'aria-disabled': disabled || undefined,
    'data-danger': danger ? '' : undefined,
    ...rest,
    ...(disabled ? { onClickCapture: blockClick } : {}),
    onClick: (event: MouseEvent<HTMLElement>) => {
      onClick?.(event as MouseEvent<HTMLDivElement>);
      // Only onSelect's own preventDefault keeps the menu open, not one made earlier (a router link's).
      const before = event.defaultPrevented;
      onSelect?.(event);
      if (before || !event.defaultPrevented) menu.close();
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      onPointerMove?.(event as PointerEvent<HTMLDivElement>);
      // The item under the pointer is the active one, as the arrow keys would make it.
      if (!disabled && document.activeElement !== event.currentTarget) event.currentTarget.focus({ preventScroll: true });
    },
  };
  if (asChild) {
    const items = Children.toArray(children);
    const [first] = items;
    if (items.length !== 1 || !isValidElement<{ children?: ReactNode }>(first)) {
      throw new Error('[bit] MenuItem asChild needs exactly one child element.');
    }
    const child = first as ReactElement<{ children?: ReactNode }>;
    return (
      <Slot ref={ref} {...props}>
        {cloneElement(child, undefined, content(child.props.children))}
      </Slot>
    );
  }
  return (
    <div ref={ref} {...(props as HTMLAttributes<HTMLDivElement>)}>
      {content(children)}
    </div>
  );
});

/** A line between groups of items. */
export const MenuSeparator = forwardRef<HTMLDivElement, MenuSeparatorProps>(function MenuSeparator({ className, ...rest }, ref) {
  useMenu('MenuSeparator');
  return <div ref={ref} role="separator" className={withClassName(element('menu', 'separator'), className)} {...rest} />;
});
