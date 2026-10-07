import type { ReactNode } from 'react';
import { Heading, Stack } from '@bit-ds/react';

interface PageHeaderProps {
  /** The page's h1. */
  title: string;
  /** What follows the title: the intro line, and on component pages the import chip and badges. */
  children?: ReactNode;
}

/** The top of a gallery page: h1, then whatever introduces the page. */
export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <Stack gap={8} align="start">
      <Heading level={1}>{title}</Heading>
      {children}
    </Stack>
  );
}
