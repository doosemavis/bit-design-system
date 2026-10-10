import { createContext } from 'react';

/**
 * True inside Text, Heading, Button and Link. A Text there renders a `<span>`, because a `<p>` can't sit inside
 * them: `<Text>You have <Text weight="bold">3 coins</Text> left.</Text>` is a span inside a p.
 */
export const InlineText = createContext(false);
