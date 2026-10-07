/**
 * The one source for every install and import snippet: the package name, install commands, style imports and
 * the pasteable full file. Plain ESM so the gallery (via install.ts, styleImports.ts, code/fullFile.ts) and
 * Node scripts (the consumer smoke test) import the same text. Types live in snippets.d.mts.
 */
export const PACKAGE_NAME = '@bit-ds/react';

export const PACKAGE_MANAGERS = ['pnpm', 'npm', 'yarn'];

export const INSTALL_COMMANDS = {
  pnpm: `pnpm add ${PACKAGE_NAME}`,
  npm: `npm install ${PACKAGE_NAME}`,
  yarn: `yarn add ${PACKAGE_NAME}`,
};

/**
 * The two stylesheet imports every app adds once, theme first by convention: the tokens, then the components
 * that read them. The theme has no `@import` (its fonts are self-hosted), so a bundler may join them in either order.
 */
export const STYLE_IMPORTS = `import '${PACKAGE_NAME}/themes/power-up.css';\nimport '${PACKAGE_NAME}/styles.css';`;

/**
 * The same two files as CSS `@import`s, for an app's global stylesheet instead of its entry file. When Vite
 * inlines them it rebases the theme's font `url()`s to the package; the consumer smoke test builds this route.
 */
export const GLOBAL_CSS_IMPORTS = `@import '${PACKAGE_NAME}/themes/power-up.css';\n@import '${PACKAGE_NAME}/styles.css';`;

const BODY_INDENT = '    ';

/**
 * A component file you can paste: the component import and an `Example` returning the element. The style imports
 * are left out: an app adds them once (Getting started), not in every file. `setup` (hook lines such as
 * `const [open, setOpen] = useState(false);`) goes inside the component, above the return.
 */
export function fullFile({ importLine, element, setup = '' }) {
  const body = element
    .split('\n')
    .map((line) => BODY_INDENT + line)
    .join('\n');
  const setupLines = setup
    ? `${setup
        .split('\n')
        .map((line) => `  ${line}`)
        .join('\n')}\n\n`
    : '';
  return `${importLine}\n\nexport function Example() {\n${setupLines}  return (\n${body}\n  );\n}\n`;
}
