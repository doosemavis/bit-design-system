import { cloneElement, useState } from 'react';
import type { ReactElement } from 'react';
import { Button } from '@bit-ds/react';
import type { DialogProps } from '@bit-ds/react';

/** The Dialog page's preview: a Button that opens the Dialog the controls built, which keeps its own open state. */
export function DialogDemo({ dialog }: { dialog: ReactElement<DialogProps> }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      {cloneElement(dialog, { open, onOpenChange: setOpen })}
    </>
  );
}
