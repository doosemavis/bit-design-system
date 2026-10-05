// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GLOBAL_CSS_IMPORTS, INSTALL_COMMANDS, PACKAGE_MANAGERS, PACKAGE_NAME, STYLE_IMPORTS, fullFile } from './snippets.mjs';

const pkg = JSON.parse(readFileSync(new URL('../../../../packages/react/package.json', import.meta.url), 'utf8')) as { name: string };

describe('snippets.mjs', () => {
  it('names the real package', () => expect(PACKAGE_NAME).toBe(pkg.name));
  it('has one install command per package manager, each ending in the package name', () => {
    expect([...PACKAGE_MANAGERS]).toEqual(['pnpm', 'npm', 'yarn']);
    expect(INSTALL_COMMANDS).toEqual({ pnpm: 'pnpm add @bit-ds/react', npm: 'npm install @bit-ds/react', yarn: 'yarn add @bit-ds/react' });
  });
  it('imports the theme first, then the styles', () => {
    expect(STYLE_IMPORTS).toBe("import '@bit-ds/react/themes/power-up.css';\nimport '@bit-ds/react/styles.css';");
  });
  it('the global stylesheet route is the same two files as CSS @imports, theme first', () => {
    expect(GLOBAL_CSS_IMPORTS).toBe("@import '@bit-ds/react/themes/power-up.css';\n@import '@bit-ds/react/styles.css';");
  });
  it('fullFile wraps an element in a pasteable Example component, without the once-per-app style imports', () => {
    expect(fullFile({ importLine: "import { Button } from '@bit-ds/react';", element: '<Button>Save</Button>' })).toBe(
      "import { Button } from '@bit-ds/react';\n\nexport function Example() {\n  return (\n    <Button>Save</Button>\n  );\n}\n",
    );
  });
});
