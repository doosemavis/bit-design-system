import { Button, Stack, Text } from '@bit-ds/react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <Stack gap={4}>
      <Text as="h1" size="2xl">
        Page not found
      </Text>
      <Text>That route does not exist. The sidebar lists every page.</Text>
      <div>
        <Button asChild>
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </Stack>
  );
}
