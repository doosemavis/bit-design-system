import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  // Inlines core's types into the emitted .d.ts/.d.cts too: core is a devDependency,
  // so a tarball install has no `@bit-ds/core` to resolve `import ... from '@bit-ds/core/tokens'`
  // against. tsup's dts resolver matches the exact import specifier, so the entry has to be
  // '@bit-ds/core/tokens' (the only subpath ever imported), not the bare '@bit-ds/core'. That
  // resolver also can't follow @bit-ds/core's package.json `exports` map (`"./tokens":
  // "./src/tokens.ts"`) on its own, so `paths` points it straight at the real file.
  dts: {
    resolve: ['@bit-ds/core/tokens'],
    compilerOptions: {
      baseUrl: '.',
      paths: { '@bit-ds/core/tokens': ['../core/src/tokens.ts'] },
    },
  },
  sourcemap: true,
  clean: true,
  target: 'es2022',
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  // Inline the workspace core package (only tokens.ts is ever imported from it).
  noExternal: ['@bit-ds/core'],
});
