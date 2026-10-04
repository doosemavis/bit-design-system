// @vitest-environment node
import { ESLint } from 'eslint';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const eslint = new ESLint({ cwd: root });
const fixture = (name: string) => `${root}apps/gallery/src/${name}`;

async function banned(code: string, name = '__lint_fixture__.tsx') {
  const [result] = await eslint.lintText(code, { filePath: fixture(name) });
  return result!.messages.filter((m) => m.ruleId === 'no-restricted-syntax').map((m) => m.message);
}

describe('gallery raw-tag ban', { timeout: 30_000 }, () => {
  it.each([
    ['button', '<Button>'],
    ['a', '<Link>'],
    ['input', '<Input>'],
    ['textarea', '<Input>'],
    ['select', '<Select>'],
    ['table', '<Table>'],
    ['code', '<Code>'],
    ['pre', '<CodeBlock>'],
    ['h1', '<Heading>'],
    ['h6', '<Heading>'],
  ])('<%s> is banned and the message names %s', async (tag, component) => {
    const found = await banned(`export const X = () => <${tag} />;`);
    expect(found).toHaveLength(1);
    expect(found[0]).toContain(component);
  });

  it('bit components and plain layout tags pass', async () => {
    expect(await banned('export const X = () => <div><span><Button /><Link /></span></div>;')).toEqual([]);
  });

  it('tests may use raw tags', async () => {
    expect(await banned('export const X = () => <button />;', '__lint_fixture__.test.tsx')).toEqual([]);
  });
});
