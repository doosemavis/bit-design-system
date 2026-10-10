import { Children, cloneElement, forwardRef, isValidElement, useCallback, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { FocusEvent, HTMLAttributes, KeyboardEvent, MouseEvent, ReactElement, ReactNode, Ref } from 'react';
import { element, toClasses } from '../../system/toClasses';
import { composeRefs, mergeProps } from '../../system/Slot';
import { useAnchoredLayer } from '../../system/useAnchoredLayer';
import { EMPTY_BUFFER, TYPEAHEAD_MS, nextBuffer } from '../Select/typeahead';
import { MenuContext } from './MenuContext';
import type { MenuContextValue } from './MenuContext';
import { enabledItems, isDisabled, keyTarget, typeaheadTarget } from './menuFocus';
import { placeMenu } from './placeMenu';

const sizes = ['sm', 'md'] as const;

export interface MenuProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'color' | 'children'> {
  /** The button that opens the menu: one element that takes focus (a Button, an IconButton). It keeps its own props, handlers and ref. */
  trigger: ReactElement;
  /** The words in the purple title strip at the top of the window. They name the menu for screen readers. */
  title: ReactNode;
  /** MenuItem and MenuSeparator. */
  children: ReactNode;
  /** Whether the menu is open, when the parent owns it. Pair it with onOpenChange. */
  open?: boolean;
  /** Whether it starts open, when the Menu owns it. Default: false. */
  defaultOpen?: boolean;
  /** Called with true when the menu asks to open, and false when it asks to close. */
  onOpenChange?: (open: boolean) => void;
  /** Text size of the items: sm 14px, md 16px. Class: `bit-{size}`. */
  size?: (typeof sizes)[number];
  /** Which edge of the trigger the menu lines up with. Start is the left in left-to-right pages. Default: 'start'. */
  align?: 'start' | 'end';
}

/** A key that types a character: one character, with no Ctrl, Meta or Alt. */
const printable = (event: KeyboardEvent) => event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;

/** The one trigger element, or a clear error. */
function onlyTrigger(trigger: ReactNode): ReactElement<Record<string, unknown>> {
  const found = Children.toArray(trigger).find(isValidElement) as ReactElement<Record<string, unknown>> | undefined;
  if (!found) throw new Error('bit Menu: trigger must be one element (a Button or an IconButton)');
  return found;
}

/**
 * A menu of actions (the WAI-ARIA menu button pattern) in the Retro window look: a purple title strip in the
 * pixel font, then the items, in the top layer by its trigger. Arrows, Home, End and the first letter move
 * focus; Enter or Space chooses; Esc closes and returns focus to the trigger; Tab or a click outside closes.
 * Class: `bit-menu` on the window, which takes `className`, the ref and every other prop.
 */
export const Menu = forwardRef<HTMLDivElement, MenuProps>(function Menu(
  {
    trigger,
    title,
    children,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    size = 'md',
    align = 'start',
    className,
    onKeyDown,
    onMouseDown,
    onBlur,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    ...rest
  },
  ref,
) {
  const child = onlyTrigger(trigger);
  const baseId = useId();
  const listId = `${baseId}-menu`;
  const titleId = `${baseId}-title`;
  const [own, setOwn] = useState(defaultOpen);
  const open = openProp ?? own;
  const triggerRef = useRef<HTMLElement | null>(null);
  const layerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const setLayerRef = useMemo(() => composeRefs(ref, layerRef), [ref]);
  // Which item takes focus when the menu next opens.
  const pending = useRef<'first' | 'last'>('first');
  // True from a press on the trigger until it ends: the focus that press moves must not close the menu,
  // because the click that follows toggles it.
  const pressingTrigger = useRef(false);
  // True while focus is sent back to the trigger on purpose, so the blur that causes isn't read as leaving.
  const returning = useRef(false);
  const typed = useRef(EMPTY_BUFFER);

  // The latest props, so setOpen stays stable for the layer's onLeave.
  const latest = useRef({ controlled: openProp !== undefined, onOpenChange });
  useLayoutEffect(() => {
    latest.current = { controlled: openProp !== undefined, onOpenChange };
  });
  const setOpen = useCallback((next: boolean) => {
    if (!latest.current.controlled) setOwn(next);
    latest.current.onOpenChange?.(next);
  }, []);

  const focusTrigger = useCallback(() => {
    returning.current = true;
    triggerRef.current?.focus();
    returning.current = false;
  }, []);
  // Esc and a chosen item: focus goes back to the trigger first, then the menu closes.
  const close = useCallback(() => {
    focusTrigger();
    setOpen(false);
  }, [focusTrigger, setOpen]);
  const leave = useCallback(() => setOpen(false), [setOpen]);

  useAnchoredLayer(open, triggerRef, layerRef, { place: placeMenu, onLeave: leave });

  // On opening, focus the first item (or the last, from ArrowUp): roving focus lives on the items. With no
  // enabled item, the menu itself takes focus, so Esc still closes it. Closed by the parent while focus is
  // still inside, focus goes back to the trigger, not to the page's start. In the effect, not its cleanup:
  // React puts focus back after the commit's DOM changes, which would undo a move made in a cleanup.
  const wasOpen = useRef(false);
  useLayoutEffect(() => {
    const opened = open && !wasOpen.current;
    const closed = !open && wasOpen.current;
    wasOpen.current = open;
    if (closed && layerRef.current!.contains(document.activeElement)) focusTrigger();
    if (!opened) return;
    const list = listRef.current!;
    const items = enabledItems(list);
    const target = pending.current === 'last' ? items[items.length - 1] : items[0];
    pending.current = 'first';
    (target ?? list).focus({ preventScroll: true });
  }, [open, focusTrigger]);

  // Only ever called closed: focus on the trigger while open has already closed the menu (the blur below).
  function openAt(where: 'first' | 'last') {
    pending.current = where;
    setOpen(true);
  }

  function onTriggerKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      // Prevented, so the button's own click (Enter, Space) doesn't toggle the menu shut again.
      event.preventDefault();
      openAt('first');
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openAt('last');
    }
  }

  function onTriggerPointerDown() {
    pressingTrigger.current = true;
    const done = () => {
      document.removeEventListener('pointerup', done, true);
      document.removeEventListener('pointercancel', done, true);
      // After this press's click, which reads the flag through the toggle.
      setTimeout(() => (pressingTrigger.current = false), 0);
    };
    document.addEventListener('pointerup', done, true);
    document.addEventListener('pointercancel', done, true);
  }

  function onLayerKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const list = listRef.current!;
    const current = document.activeElement;
    const { key } = event;
    const typing = Date.now() - typed.current.at <= TYPEAHEAD_MS;
    const moveTo = keyTarget(list, key, current);
    if (key === 'Escape') {
      // Stopped too, so a surrounding Dialog doesn't close as well.
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (moveTo) {
      event.preventDefault();
      moveTo.focus();
    } else if (key === 'Enter' || (key === ' ' && !typing)) {
      event.preventDefault();
      // A click runs the item's onSelect, follows a link item's href, and closes the menu.
      if (current instanceof HTMLElement && list.contains(current) && current !== list && !isDisabled(current)) current.click();
    } else if (printable(event)) {
      event.preventDefault();
      typed.current = nextBuffer(typed.current, key, Date.now());
      typeaheadTarget(list, typed.current.text, current)?.focus();
    }
    // Tab is left alone: focus moves on as usual, and the blur below closes the menu.
  }

  function onLayerBlur(event: FocusEvent<HTMLDivElement>) {
    onBlur?.(event);
    if (!open || returning.current || pressingTrigger.current) return;
    if (event.relatedTarget instanceof Node && layerRef.current!.contains(event.relatedTarget)) return;
    setOpen(false);
  }

  const context = useMemo<MenuContextValue>(() => ({ close, size }), [close, size]);

  const childProps = child.props;
  const childRef = childProps.ref as Ref<HTMLElement> | undefined;
  const triggerSetRef = useMemo(() => composeRefs<HTMLElement>(triggerRef, childRef), [childRef]);
  const triggerProps = mergeProps(
    {
      onKeyDown: onTriggerKeyDown,
      // Space clicks a button on key up; the keydown already did the work.
      onKeyUp: (event: KeyboardEvent) => {
        if (event.key === ' ') event.preventDefault();
      },
      onPointerDown: onTriggerPointerDown,
      onClick: () => (open ? setOpen(false) : openAt('first')),
    },
    childProps,
  );

  return (
    <MenuContext.Provider value={context}>
      {cloneElement(child, {
        ...triggerProps,
        ref: triggerSetRef,
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': listId,
      })}
      <div
        ref={setLayerRef}
        className={toClasses('menu', [{ name: 'size', allowed: sizes, value: size }], className)}
        data-align={align === 'end' ? 'end' : undefined}
        hidden={!open}
        {...rest}
        onKeyDown={onLayerKeyDown}
        onBlur={onLayerBlur}
        // A press inside (the title, a separator, an item) must not move focus: an item's click closes the menu itself.
        onMouseDown={(event: MouseEvent<HTMLDivElement>) => {
          onMouseDown?.(event);
          event.preventDefault();
        }}
      >
        <div id={titleId} className={element('menu', 'title')}>
          {title}
        </div>
        <div
          ref={listRef}
          id={listId}
          role="menu"
          tabIndex={-1}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy ?? (ariaLabel ? undefined : titleId)}
          className={element('menu', 'list')}
        >
          {children}
        </div>
      </div>
    </MenuContext.Provider>
  );
});
