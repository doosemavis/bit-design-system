import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { Box, Button, Stack } from '@bit-ds/react';

export interface DisclosureProps {
  /** The button's text, and the region's accessible name. */
  title: string;
  /** Start open. Closed by default. */
  defaultOpen?: boolean;
  children: ReactNode;
}

/**
 * A button that shows and hides a region. bit has no disclosure yet, so this is a ghost Button with aria-expanded.
 * The button sits in a start-aligned Stack so it keeps its own size inside a stretching column.
 */
export function Disclosure({ title, defaultOpen = false, children }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const regionId = useId();
  const buttonId = useId();
  return (
    <>
      <Stack align="start">
        <Button
          id={buttonId}
          variant="ghost"
          aria-expanded={open}
          aria-controls={regionId}
          onClick={() => setOpen((current) => !current)}
        >
          {title}
        </Button>
      </Stack>
      <Box id={regionId} role="region" aria-labelledby={buttonId} hidden={!open}>
        {children}
      </Box>
    </>
  );
}
