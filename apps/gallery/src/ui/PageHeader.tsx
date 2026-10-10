import type { ReactNode } from 'react';
import { Heading, Stack } from '@bit-ds/react';
import { useDocumentTitle } from '../shell/useDocumentTitle';

interface PageHeaderProps {
  /** The page's h1. */
  title: string;
  /** What follows the title: the intro line, and on component pages the import chip and badges. */
  children?: ReactNode;
}

/** The top of a gallery page: h1, then whatever introduces the page. The h1 names the browser tab too. */
export function PageHeader({ title, children }: PageHeaderProps) {
  useDocumentTitle(title);
  return (
    <Stack gap={8} align="start">
      <Heading size={40}>{title}</Heading>
      {children}
    </Stack>
  );
}
