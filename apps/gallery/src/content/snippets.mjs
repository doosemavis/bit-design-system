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

/**
 * The same two files as CSS `@import`s, for an app's global stylesheet instead of its entry file. Vite and
 * Next.js both keep the theme's fonts `@import` first when they inline these (checked 2026-10-05).
 */
export const GLOBAL_CSS_IMPORTS = `@import '${PACKAGE_NAME}/themes/power-up.css';\n@import '${PACKAGE_NAME}/styles.css';`;

const BODY_INDENT = '    ';

/**
 * A component file you can paste: the component import and an `Example` returning the element. The style imports
 * are left out: an app adds them once (Getting started), not in every file.
 */
export function fullFile({ importLine, element }) {
  const body = element
    .split('\n')
    .map((line) => BODY_INDENT + line)
    .join('\n');
  return `${importLine}\n\nexport function Example() {\n  return (\n${body}\n  );\n}\n`;
}
