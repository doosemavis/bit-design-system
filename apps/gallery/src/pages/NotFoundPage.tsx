import { Button, Heading, Stack, Text } from '@bit-ds/react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <Stack gap={16} align="start">
      <Heading level={1}>Page not found</Heading>
      <Text>That route does not exist. The sidebar lists every page.</Text>
      <Button asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </Stack>
  );
}
