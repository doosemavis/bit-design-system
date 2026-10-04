import type { ReactNode } from 'react';
import { Heading, Stack, Text } from '@bit-ds/react';

interface PageHeaderProps {
  /** The small pixel-type line above the title: the sidebar group the page sits in. */
  eyebrow: string;
  /** The page's h1. */
  title: string;
  /** What follows the title: the intro line, and on component pages the import chip and badges. */
  children?: ReactNode;
}

/** The top of a gallery page: eyebrow, h1, then whatever introduces the page. */
export function PageHeader({ eyebrow, title, children }: PageHeaderProps) {
  return (
    <Stack gap={8} align="start">
      <Text as="p" size={11} color="neutral" className="gallery-eyebrow">
        {eyebrow}
      </Text>
      <Heading level={1}>{title}</Heading>
      {children}
    </Stack>
  );
}
