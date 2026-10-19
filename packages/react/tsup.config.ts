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
  // TypeScript 6 deprecates `baseUrl` (7 removes it), and `paths` resolves from this package without
  // it, but tsup 8 sets `baseUrl: '.'` on every dts build itself, so the deprecation is silenced here.
  // Drop ignoreDeprecations once tsup stops adding baseUrl (needed anyway before TypeScript 7).
  dts: {
    resolve: ['@bit-ds/core/tokens'],
    compilerOptions: {
      ignoreDeprecations: '6.0',
      paths: { '@bit-ds/core/tokens': ['../core/src/tokens.ts'] },
    },
  },
  sourcemap: true,
  clean: true,
  target: 'es2022',
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  // The hooks and ModeToggle run on the client; the directive lets React Server Components import the package.
  banner: { js: "'use client';" },
  // Inline the workspace core package (only tokens.ts is ever imported from it).
  noExternal: ['@bit-ds/core'],
});
