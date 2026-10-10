import { cloneElement, useState } from 'react';
import type { ReactElement } from 'react';
import { Button } from '@bit-ds/react';
import type { DialogProps } from '@bit-ds/react';

/**
 * The Dialog page's preview: a Button that opens the Dialog the controls built, which keeps its own open state.
 * The Dialog mounts on the first open, so the page's samples (the preview and one per Variants cell) don't add
 * their titles to the page's headings before anyone opens one. Once opened it stays mounted, so it can fold away.
 */
export function DialogDemo({ dialog }: { dialog: ReactElement<DialogProps> }) {
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(false);
  return (
    <>
      <Button
        onClick={() => {
          setOpened(true);
          setOpen(true);
        }}
      >
        Open dialog
      </Button>
      {opened ? cloneElement(dialog, { open, onOpenChange: setOpen }) : null}
    </>
  );
}
