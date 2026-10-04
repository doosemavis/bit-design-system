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
 * The two stylesheet imports every app adds once, theme first: the theme's Google Fonts `@import` must stay
 * at the top when a bundler joins the CSS.
 */
export const STYLE_IMPORTS = `import '${PACKAGE_NAME}/themes/power-up.css';\nimport '${PACKAGE_NAME}/styles.css';`;

/** Above the style imports in the full file: they belong in the app's entry file, once. */
export const STYLE_COMMENT = '// once per app: skip if already in your entry file';

const BODY_INDENT = '    ';

/** A file you can paste and run: the style imports, the component import, and an `Example` returning the element. */
export function fullFile({ importLine, element }) {
  const body = element
    .split('\n')
    .map((line) => BODY_INDENT + line)
    .join('\n');
  return `${STYLE_COMMENT}\n${STYLE_IMPORTS}\n${importLine}\n\nexport function Example() {\n  return (\n${body}\n  );\n}\n`;
}
