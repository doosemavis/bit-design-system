import { createHash } from 'node:crypto';
import type { Plugin } from 'vite';

/*
 * The docs site's Content-Security-Policy. GitHub Pages can't send headers, so the production
 * build puts it in a <meta http-equiv> at the top of <head>. index.html's one inline script (the
 * saved color mode, applied before paint) is allowed by its sha256, computed from the built HTML,
 * so the hash can never drift from the script. Dev skips the policy: Vite's HMR needs inline
 * scripts and a websocket.
 *
 * A <meta> policy can't carry frame-ancestors, report-uri or sandbox; browsers ignore them there.
 */

/** The policy, before buildCsp adds the inline-script hashes to script-src. */
export const CSP_DIRECTIVES: readonly (readonly [string, string])[] = [
  ['default-src', "'self'"],
  ['script-src', "'self'"],
  ['style-src', "'self' 'unsafe-inline'"],
  ['img-src', "'self' data:"],
  ['font-src', "'self' data:"],
  ['connect-src', "'self'"],
  ['object-src', "'none'"],
  ['base-uri', "'none'"],
  ['form-action', "'self'"],
];

const INLINE_SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
const HAS_SRC = /\bsrc\s*=/i;

/** The text of each <script> without a src, exactly as the browser hashes it. */
export const inlineScripts = (html: string): string[] =>
  [...html.matchAll(INLINE_SCRIPT)].filter(([, attrs]) => !HAS_SRC.test(attrs ?? '')).map(([, , body]) => body ?? '');

/** A CSP hash source for one script's text: 'sha256-<base64>'. */
export const scriptHash = (script: string): string =>
  `'sha256-${createHash('sha256').update(script, 'utf8').digest('base64')}'`;

/** The policy string, allowing exactly the given inline scripts. */
export const buildCsp = (scripts: readonly string[]): string =>
  CSP_DIRECTIVES.map(([name, value]) =>
    name === 'script-src' ? [name, value, ...scripts.map(scriptHash)].join(' ') : `${name} ${value}`,
  ).join('; ');

const META_PREFIX = '<meta http-equiv="Content-Security-Policy"';
const CHARSET = /<meta\s+charset=[^>]*>/i;
const HEAD = /<head\b[^>]*>/i;

/**
 * Returns the HTML with the CSP <meta> right after <meta charset> (or <head>), so it governs
 * everything below it, the inline script included. Throws on HTML that already has one or has
 * no <head>, so a broken template fails the build instead of shipping without a policy.
 */
export const injectCsp = (html: string): string => {
  if (html.includes(META_PREFIX)) throw new Error('csp: index.html already has a Content-Security-Policy meta');
  const anchor = CHARSET.exec(html) ?? HEAD.exec(html);
  if (!anchor) throw new Error('csp: index.html has no <head> to put the Content-Security-Policy meta in');
  const meta = `${META_PREFIX} content="${buildCsp(inlineScripts(html))}" />`;
  const at = anchor.index + anchor[0].length;
  return `${html.slice(0, at)}\n    ${meta}${html.slice(at)}`;
};

/** Adds the CSP meta to the production build's index.html. Runs last, on the final HTML. */
export const cspPlugin = (): Plugin => ({
  name: 'bit-csp-meta',
  apply: 'build',
  transformIndexHtml: { order: 'post', handler: injectCsp },
});
