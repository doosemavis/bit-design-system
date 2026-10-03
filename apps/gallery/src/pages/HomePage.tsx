import { BitLogo, Card, CardBody, CardHeader, CodeBlock, Stack, Text } from '@bit-ds/react';

const INSTALL = `pnpm add @bit-ds/react
import '@bit-ds/react/themes/power-up.css';
import '@bit-ds/react/styles.css';`;

const REACT_WAY = `<Card><CardHeader>Stats</CardHeader></Card>`;
const HTML_WAY = `<div class="bit-card bit-solid"><div class="bit-card__header">Stats</div></div>`;

const RULE_ROWS = [
  ['color="primary"', 'bit-primary', '--bit-color-primary'],
  ['variant="outline"', 'bit-outline', 'per component CSS'],
  ['size="lg"', 'bit-lg', '--bit-control-height-lg'],
] as const;

export function HomePage() {
  return (
    <Stack gap={32}>
      <Stack gap={12}>
        <Text as="h1">
          <BitLogo size="lg" />
        </Text>
        <Text size={18}>A React design system for people who are new to design systems.</Text>
      </Stack>

      <Card>
        <CardHeader>Install</CardHeader>
        <CardBody>
          <CodeBlock code={INSTALL} language="shell" />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>The naming rule</CardHeader>
        <CardBody>
          <Text>The prop you type is the class it emits is the token it reads.</Text>
          <table className="gallery-table">
            <thead>
              <tr>
                <th scope="col">You write</th>
                <th scope="col">Class</th>
                <th scope="col">Token</th>
              </tr>
            </thead>
            <tbody>
              {RULE_ROWS.map(([write, cls, token]) => (
                <tr key={cls}>
                  <td>
                    <code>{write}</code>
                  </td>
                  <td>
                    <code>{cls}</code>
                  </td>
                  <td>{token.startsWith('--') ? <code>{token}</code> : token}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>Two ways to use every static component</CardHeader>
        <CardBody>
          <Stack gap={8}>
            <CodeBlock code={REACT_WAY} language="jsx" />
            <CodeBlock code={HTML_WAY} language="html" />
            <Text color="neutral">Both render identically.</Text>
          </Stack>
        </CardBody>
      </Card>
    </Stack>
  );
}
