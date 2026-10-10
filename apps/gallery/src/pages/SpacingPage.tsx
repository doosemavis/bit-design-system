import {
  Badge,
  Box,
  Card,
  CardBody,
  Code,
  CodeBlock,
  Heading,
  SPACE_STEPS,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Text,
} from '@bit-ds/react';

const STACK_EXAMPLE = `<Stack direction="row" gap={16}>
  <Badge>One</Badge>
  <Badge>Two</Badge>
  <Badge>Three</Badge>
</Stack>`;

const BOX_EXAMPLE = `<Box paddingX={24} paddingY={8}>
  <Badge>Banner</Badge>
</Box>`;

const BOX_PROPS = [
  { props: 'padding · margin', sides: 'All four sides', example: 'padding={16}' },
  { props: 'paddingX · marginX', sides: 'Left and right', example: 'paddingX={24}' },
  { props: 'paddingY · marginY', sides: 'Top and bottom', example: 'marginY={32}' },
  { props: '…Top · …Right · …Bottom · …Left', sides: 'One side', example: 'marginTop={48}' },
] as const;

/** Each bar is a Box with paddingLeft set to the step and no content, so the scale draws itself. */
function Ruler() {
  return (
    <Card>
      <CardBody>
        <Stack gap={8}>
          {SPACE_STEPS.map((step) => (
            <Box key={step} className="gallery-ruler">
              <Text as="span" color="neutral">
                {step}
              </Text>
              <Box paddingLeft={step} className="gallery-ruler__bar" aria-hidden="true" />
              <Code>{`--bit-space-${step}px`}</Code>
            </Box>
          ))}
        </Stack>
      </CardBody>
    </Card>
  );
}

function StackOrBox() {
  return (
    <Box className="gallery-grid">
      <Card>
        <CardBody>
          <Stack gap={12}>
            <Heading as="h3" size={16}>
              Stack: space between things
            </Heading>
            <Stack direction="row" gap={16}>
              <Badge>One</Badge>
              <Badge>Two</Badge>
              <Badge>Three</Badge>
            </Stack>
            <CodeBlock code={STACK_EXAMPLE} language="jsx" label="Stack example code" />
          </Stack>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <Stack gap={12}>
            <Heading as="h3" size={16}>
              Box: space around one thing
            </Heading>
            {/* A row, so the Box hugs its Badge instead of stretching across the card. */}
            <Stack direction="row">
              <Box paddingX={24} paddingY={8} className="gallery-outline">
                <Badge>Banner</Badge>
              </Box>
            </Stack>
            <CodeBlock code={BOX_EXAMPLE} language="jsx" label="Box example code" />
          </Stack>
        </CardBody>
      </Card>
    </Box>
  );
}

function BoxProps() {
  return (
    <Table aria-label="Box props">
      <TableHead>
        <TableRow>
          <TableCell>Props</TableCell>
          <TableCell>Sides</TableCell>
          <TableCell>Example</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {BOX_PROPS.map(({ props, sides, example }) => (
          <TableRow key={props}>
            <TableCell>
              <Text weight="bold">{props}</Text>
            </TableCell>
            <TableCell>
              <Text color="neutral">
                {sides}
              </Text>
            </TableCell>
            <TableCell>
              <Code>{example}</Code>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Foundations: the space scale, when to reach for Stack or Box, and Box's props. Built only from bit components. */
export function SpacingPage() {
  return (
    <Stack gap={32}>
      <Stack gap={8}>
        <Heading as="h1">Spacing</Heading>
        <Text size={18}>
          One scale for every gap, pad and margin: 4, 8, 12, 16, 24, 32, 48 and 64. <Code>Stack</Code> spaces things
          apart, and <Code>Box</Code> pads and offsets a single thing.
        </Text>
      </Stack>
      <Stack gap={12}>
        <Heading>The scale</Heading>
        <Ruler />
      </Stack>
      <Stack gap={12}>
        <Heading>Stack or Box?</Heading>
        <StackOrBox />
      </Stack>
      <Stack gap={12}>
        <Heading>Box props</Heading>
        <BoxProps />
        <Text color="neutral">
          When props overlap, the most specific wins: <Code>paddingTop</Code> beats <Code>paddingY</Code>, which beats{' '}
          <Code>padding</Code>.
        </Text>
      </Stack>
    </Stack>
  );
}
