import { createContext, useContext, useEffect } from 'react';

export type DialogPart = 'header' | 'body';

/** What a Dialog tells its parts. Private: not exported from the package. */
export interface DialogContextValue {
  titleId: string;
  bodyId: string;
  /** Ask the Dialog to close: it calls onOpenChange(false). */
  close: () => void;
  /** A part says it is rendered, so the Dialog points aria-labelledby or aria-describedby at it. Returns the undo. */
  register: (part: DialogPart) => () => void;
}

export const DialogContext = createContext<DialogContextValue | null>(null);

/** The surrounding Dialog, or a clear error naming the part that is outside one. */
export function useDialog(partName: string): DialogContextValue {
  const dialog = useContext(DialogContext);
  if (!dialog) throw new Error(`bit: <${partName}> must be inside a <Dialog>.`);
  return dialog;
}

/** Register a part with its Dialog for as long as it is mounted. */
export function useRegisterPart(dialog: DialogContextValue, part: DialogPart): void {
  const { register } = dialog;
  useEffect(() => register(part), [register, part]);
}
