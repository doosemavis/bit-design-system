import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { element, withClassName } from '../../system/toClasses';
import { Button } from '../Button/Button';
import type { ButtonProps } from '../Button/Button';
import { useDialog, useRegisterPart } from './DialogContext';

export interface DialogHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  /** The title. It names the dialog for screen readers. */
  children: ReactNode;
  /** The × button's accessible name. Default: 'Close'. */
  closeLabel?: string;
}

export type DialogPartProps = Omit<HTMLAttributes<HTMLDivElement>, 'color'>;

/** A Button that closes its Dialog. Outline neutral by default; any Button prop works. */
export type DialogCloseProps = ButtonProps;

export const DialogClose = forwardRef<HTMLButtonElement, DialogCloseProps>(function DialogClose(
  { variant = 'outline', color = 'neutral', onClick, ...rest },
  ref,
) {
  const dialog = useDialog('DialogClose');
  return (
    <Button
      ref={ref}
      variant={variant}
      color={color}
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) dialog.close();
      }}
    />
  );
});

/** The purple title bar: the title (an h2 that names the dialog) and the × button. */
export const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(function DialogHeader(
  { children, closeLabel = 'Close', className, ...rest },
  ref,
) {
  const dialog = useDialog('DialogHeader');
  useRegisterPart(dialog, 'header');
  return (
    <div ref={ref} className={withClassName(element('dialog', 'header'), className)} {...rest}>
      <h2 id={dialog.titleId} className={element('dialog', 'title')}>
        {children}
      </h2>
      <DialogClose size="sm" className={element('dialog', 'close')} aria-label={closeLabel}>
        <span aria-hidden="true">×</span>
      </DialogClose>
    </div>
  );
});

/** The content. It describes the dialog for screen readers. */
export const DialogBody = forwardRef<HTMLDivElement, DialogPartProps>(function DialogBody({ className, ...rest }, ref) {
  const dialog = useDialog('DialogBody');
  useRegisterPart(dialog, 'body');
  return <div ref={ref} id={dialog.bodyId} className={withClassName(element('dialog', 'body'), className)} {...rest} />;
});

/** The actions, end-aligned. */
export const DialogFooter = forwardRef<HTMLDivElement, DialogPartProps>(function DialogFooter({ className, ...rest }, ref) {
  useDialog('DialogFooter');
  return <div ref={ref} className={withClassName(element('dialog', 'footer'), className)} {...rest} />;
});
