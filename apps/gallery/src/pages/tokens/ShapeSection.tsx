import { Code, SEMANTIC_TOKENS, Stack, Text } from '@bit-ds/react';
import type { CSSProperties } from 'react';
import type { TokenValues } from './tokenValues';

const RADII = SEMANTIC_TOKENS.filter((name) => name.startsWith('--bit-radius-'));
const SHADOWS = SEMANTIC_TOKENS.filter((name) => name.startsWith('--bit-shadow-'));

function ShapeTile({ token, style, values }: { token: string; style: CSSProperties; values: TokenValues }) {
  return (
    <Stack gap={8} align="start">
      <span className="gallery-shape" style={style} aria-hidden="true" />
      <Code>{token}</Code>
      <Text as="span" size={13} color="neutral">
        {values.values.get(token)}
      </Text>
    </Stack>
  );
}

/** A tile per radius and per shadow, drawn with the token itself, labelled with its name and value. */
export function ShapeSection({ values }: { values: TokenValues }) {
  return (
    <div className="gallery-grid">
      {RADII.map((token) => (
        <ShapeTile key={token} token={token} style={{ borderRadius: `var(${token})` }} values={values} />
      ))}
      {SHADOWS.map((token) => (
        <ShapeTile key={token} token={token} style={{ boxShadow: `var(${token})` }} values={values} />
      ))}
    </div>
  );
}
