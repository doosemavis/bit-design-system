import { useRef, useState } from 'react';
import {
  Badge,
  Button,
  Code,
  Field,
  Input,
  SEMANTIC_TOKENS,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Text,
} from '@bit-ds/react';
import { CopyButton } from '../../ui/CopyButton';
import type { TokenValues } from './tokenValues';

/** Names containing the filter text, ignoring case and surrounding spaces. An empty filter keeps them all. */
export function filterTokens(names: readonly string[], filter: string): readonly string[] {
  const query = filter.trim().toLowerCase();
  return query === '' ? names : names.filter((name) => name.toLowerCase().includes(query));
}

/** Every public token: a filter with its count, then name, current value and Copy (`var(--name)`). */
export function AllTokens({ values }: { values: TokenValues }) {
  const [filter, setFilter] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const shown = filterTokens(SEMANTIC_TOKENS, filter);
  const clear = () => {
    setFilter('');
    input.current?.focus();
  };
  return (
    <Stack gap={12}>
      <Stack direction="row" gap={12} align="end" wrap>
        <Field label="Filter">
          <Input ref={input} type="search" value={filter} onChange={(event) => setFilter(event.target.value)} />
        </Field>
        <Badge role="status" variant="outline" shape="square">
          {`${shown.length} of ${SEMANTIC_TOKENS.length} tokens`}
        </Badge>
      </Stack>
      {shown.length === 0 ? (
        <Stack gap={8} align="start">
          <Text>No tokens match “{filter.trim()}”.</Text>
          <Text color="neutral">
            Token names look like <Code>--bit-color-primary</Code> or <Code>--bit-space-16px</Code>. Try part of one, such as
            color or space.
          </Text>
          <Button variant="outline" color="neutral" size="sm" onClick={clear}>
            Clear filter
          </Button>
        </Stack>
      ) : (
        <Table aria-label="Token values">
          <TableHead>
            <TableRow>
              <TableCell>Token</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>
                <div className="gallery-copy-head">
                  <span>Copy</span>
                  {/* Hidden and inert. Its width sizes the column for the widest state, "Copy failed". */}
                  <span aria-hidden="true" className="gallery-copy-ghost">
                    <Button size="sm" variant="outline" tabIndex={-1}>
                      Copy failed
                    </Button>
                  </span>
                </div>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shown.map((name) => (
              <TableRow key={name}>
                <TableCell>
                  <Code>{name}</Code>
                </TableCell>
                <TableCell>{values.values.get(name)}</TableCell>
                <TableCell>
                  <div className="gallery-copy-cell">
                    <CopyButton text={`var(${name})`} label={`Copy var(${name})`} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Stack>
  );
}
