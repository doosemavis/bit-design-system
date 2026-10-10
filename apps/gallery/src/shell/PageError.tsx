import { Alert, Button, Heading, Stack } from '@bit-ds/react';

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
  return (
    <Stack gap={16} align="start">
      <Heading as="h1">Something went wrong</Heading>
      <Alert color="danger" role="alert">
        This page didn't load. Check your connection and try again.
      </Alert>
      <Button onClick={onReload}>Reload page</Button>
    </Stack>
  );
}
