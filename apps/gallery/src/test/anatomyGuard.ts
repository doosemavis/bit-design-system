import type { Manifest } from '../manifests/types';

/** The component's CSS file name: the anatomy override, else the kebab-case of the name (IconButton → icon-button.css). */
export function cssFileFor(manifest: Manifest): string {
  return manifest.anatomy?.css ?? `${manifest.name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}.css`;
}

/** The stylesheet without its comments, so a token named only in a comment never counts as read. */
export function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Every custom property a stylesheet reads with var(). */
export function varReads(css: string): Set<string> {
  return new Set([...css.matchAll(/var\(\s*(--[\w-]+)/g)].map((match) => match[1]!));
}

/** Every value a stylesheet declares for one custom property. */
export function declarations(css: string, property: string): string[] {
  const escaped = property.replace(/-/g, '\\-');
  return [...css.matchAll(new RegExp(`${escaped}\\s*:\\s*([^;]+);`, 'g'))].map((match) => match[1]!);
}

/**
 * Every anatomy token must be a theme token, and the component must read it: directly, or through a `--_bit-*`
 * property it reads whose declaration (in its own file or in system/*.css) reads the token. One hop, by design.
 */
export function anatomyErrors(
  manifest: Manifest,
  componentCss: string | null,
  systemCss: readonly string[],
  themeTokens: readonly string[],
): string[] {
  const anatomy = manifest.anatomy;
  if (!anatomy) return [];
  const file = cssFileFor(manifest);
  if (componentCss === null) return [`${manifest.slug} anatomy: packages/core/src/components/${file} does not exist`];
  const own = stripComments(componentCss);
  const reads = varReads(own);
  const privates = [...reads].filter((name) => name.startsWith('--_bit-'));
  const sheets = [own, ...systemCss.map(stripComments)];
  const readThroughPrivate = (token: string) =>
    privates.some((name) => sheets.some((css) => declarations(css, name).some((value) => varReads(value).has(token))));
  return anatomy.parts.flatMap((part) =>
    part.tokens.flatMap((token) => {
      if (!themeTokens.includes(token)) return [`${manifest.slug} anatomy "${part.label}": ${token} is not a theme token`];
      if (reads.has(token) || readThroughPrivate(token)) return [];
      return [`${manifest.slug} anatomy "${part.label}": ${token} is not read by ${file}, directly or through a --_bit-* property it reads`];
    }),
  );
}

/** Every `off` key must be a token its part lists, or the part would switch off something the callout never names. */
export function offErrors(manifest: Manifest): string[] {
  return (manifest.anatomy?.parts ?? []).flatMap((part) =>
    Object.keys(part.off ?? {})
      .filter((key) => !part.tokens.includes(key))
      .map((key) => `${manifest.slug} anatomy "${part.label}": off sets ${key}, which the part doesn't list`),
  );
}
