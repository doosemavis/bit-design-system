export declare const PACKAGE_NAME: '@bit-ds/react';
export declare const PACKAGE_MANAGERS: readonly ['pnpm', 'npm', 'yarn'];
export declare const INSTALL_COMMANDS: Readonly<Record<'pnpm' | 'npm' | 'yarn', string>>;
export declare const STYLE_IMPORTS: string;
export declare const GLOBAL_CSS_IMPORTS: string;
export declare function fullFile(parts: { importLine: string; element: string }): string;
