import { Alert, Button, Heading, Stack } from '@bit-ds/react';
import { useDocumentTitle } from './useDocumentTitle';

interface PageErrorProps {
  /** Tests pass a spy; the app reloads the browser tab, which fetches the page's code again. */
  onReload?: () => void;
}

function reloadTab(): void {
  window.location.reload();
}

/**
 * The route errorElement: shown inside the shell when a page throws or its lazy chunk fails to load
 * (a dropped connection, or a deploy that replaced the chunk). The header and sidebar stay usable.
 */
export function PageError({ onReload = reloadTab }: PageErrorProps) {
  useDocumentTitle('Something went wrong');
  return (
    <Stack gap={16} align="start">
      <Heading size={40}>Something went wrong</Heading>
      <Alert color="danger" role="alert">
        This page didn't load. Check your connection and try again.
      </Alert>
      <Button onClick={onReload}>Reload page</Button>
    </Stack>
  );
}
