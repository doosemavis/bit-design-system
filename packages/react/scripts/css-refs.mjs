// What a stylesheet points at: its url() targets and @import strings. verify-dist.mjs and the consumer smoke
// test (scripts/smoke-consumer.mjs) use these to prove the shipped CSS loads nothing from a third party and
// that every file it names is in the package. Plain string work, no CSS parser, so any Node >= 20 runs it.
import { posix } from 'node:path';

/** The Google Fonts hosts the theme used to load from (security audit A1). None may appear in what ships. */
export const THIRD_PARTY_FONT_HOSTS = Object.freeze(['fonts.googleapis.com', 'fonts.gstatic.com']);

// A url() target (groups 1-2), or a bare string after @import (groups 3-4): Vite minifies
// `@import url("x")` to `@import"x"`, so both forms count.
const REF = /url\(\s*(['"]?)([^'")]*?)\1\s*\)|@import\s*(['"])([^'"]+)\3/g;

/** Every url() target and @import string in the CSS, in source order. */
export const cssRefs = (css) => [...css.matchAll(REF)].map((m) => m[2] ?? m[4]).filter(Boolean);

/** True for an http(s) or protocol-relative URL: something the browser would fetch from another host. */
export const isRemote = (ref) => /^(?:https?:)?\/\//i.test(ref);

/** The remote URLs the CSS @imports, in either the source or the minified form. */
export const remoteImports = (css) =>
  [...css.matchAll(/@import\s*(?:url\(\s*)?(['"]?)([^'")\s;]+)\1/g)].map((m) => m[2]).filter(isRemote);

/** Each THIRD_PARTY_FONT_HOSTS host the text mentions anywhere (CSS, JS, HTML or a comment). */
export const thirdPartyFontHosts = (text) => THIRD_PARTY_FONT_HOSTS.filter((host) => text.includes(host));

/**
 * The local refs in `css` that don't resolve to a path in `files`. `cssPath` is the stylesheet's own path in the
 * same scheme as `files` (posix, e.g. a tarball listing), and each ref resolves against its folder, query and
 * fragment dropped; a root-absolute ref (`/assets/x.woff2`, as Vite writes them) resolves from the root of
 * `files`. Remote URLs, data: URIs and fragment-only refs (`url(#mask)`) are skipped.
 */
export const unresolvedRefs = (cssPath, css, files) =>
  cssRefs(css)
    .filter((ref) => !isRemote(ref) && !/^data:/i.test(ref) && !ref.startsWith('#'))
    .filter((ref) => {
      const path = ref.replace(/[?#].*$/, '');
      return !files.has(path.startsWith('/') ? posix.normalize(path.slice(1)) : posix.join(posix.dirname(cssPath), path));
    });
