import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { Box, Button, Stack, Text } from '@bit-ds/react';

interface DisclosureProps {
  /** The button's text, and the region's accessible name. */
  title: string;
  /** Start open. Closed by default. */
  defaultOpen?: boolean;
  children: ReactNode;
}

/**
 * A button that shows and hides a region. bit has no disclosure yet, so this is a ghost Button with aria-expanded.
 * The button sits in a start-aligned Stack so it keeps its own size inside a stretching column. A ▸/▾ glyph shows
 * the state, and the open region is indented under the button.
 */
export function Disclosure({ title, defaultOpen = false, children }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const buttonId = `${id}-button`;
  const regionId = `${id}-region`;
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
          {/* Like ModeToggle's ☀/☾: the glyph is decoration, so the name stays the title. The Button's gap spaces it. */}
          <Text as="span" aria-hidden="true">
            {open ? '▾' : '▸'}
          </Text>
          {title}
        </Button>
      </Stack>
      {/* Indented to sit under the button's content, so the open region reads as the button's. */}
      <Box id={regionId} role="region" aria-labelledby={buttonId} hidden={!open} paddingLeft={16}>
        {children}
      </Box>
    </>
  );
}
