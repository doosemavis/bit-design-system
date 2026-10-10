// The production build's Content-Security-Policy <meta>. Parsed with the DOM (not csp.ts's own
// regex) and hashed here with node:crypto, so a drift between the policy and the inline script fails.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CSP_DIRECTIVES, buildCsp, cspPlugin, injectCsp, inlineScripts } from '../csp';

// jsdom's URL isn't node's, so the path is built from a string.
const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../index.html'), 'utf8');
const built = injectCsp(source);

const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html');
const policyOf = (doc: Document) =>
  doc.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content') ?? '';
const directive = (policy: string, name: string) =>
  policy
    .split(';')
    .map((d) => d.trim().split(/\s+/))
    .find(([n]) => n === name)
    ?.slice(1) ?? [];
const sha256 = (text: string) => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;

describe('CSP meta in the built index.html', () => {
  const doc = parse(built);
  const policy = policyOf(doc);
  const inline = [...doc.querySelectorAll('script:not([src])')].map((s) => s.textContent ?? '');

  it('has exactly one CSP meta, in <head>, before every script', () => {
    const metas = doc.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
    expect(metas).toHaveLength(1);
    expect(metas[0]!.parentElement).toBe(doc.head);
    expect(built.indexOf('http-equiv="Content-Security-Policy"')).toBeLessThan(built.indexOf('<script'));
  });

  it('allows the saved color-mode script by its sha256, and nothing else inline', () => {
    expect(inline).toHaveLength(1);
    expect(inline[0]).toContain("localStorage.getItem('bit-color-mode')");
    expect(directive(policy, 'script-src')).toEqual(["'self'", sha256(inline[0]!)]);
  });

  it('never allows unsafe-inline or unsafe-eval scripts', () => {
    expect(directive(policy, 'script-src')).not.toContain("'unsafe-inline'");
    expect(policy).not.toContain("'unsafe-eval'");
  });

  it('sets every directive of the policy', () => {
    expect(directive(policy, 'default-src')).toEqual(["'self'"]);
    expect(directive(policy, 'style-src')).toEqual(["'self'", "'unsafe-inline'"]);
    expect(directive(policy, 'img-src')).toEqual(["'self'", 'data:']);
    expect(directive(policy, 'font-src')).toEqual(["'self'", 'data:']);
    expect(directive(policy, 'connect-src')).toEqual(["'self'"]);
    expect(directive(policy, 'object-src')).toEqual(["'none'"]);
    expect(directive(policy, 'base-uri')).toEqual(["'none'"]);
    expect(directive(policy, 'form-action')).toEqual(["'self'"]);
    expect(policy.split(';')).toHaveLength(CSP_DIRECTIVES.length);
  });

  it('changes the hash when the script changes, so the two cannot drift', () => {
    const edited = injectCsp(source.replace("'bit-color-mode'", "'bit-color-mode-2'"));
    expect(directive(policyOf(parse(edited)), 'script-src')).not.toEqual(directive(policy, 'script-src'));
  });

  it('keeps the rest of the page as it was', () => {
    expect(built.replace(/\n {4}<meta http-equiv="Content-Security-Policy"[^>]*>/, '')).toBe(source);
  });
});

describe('csp.ts helpers', () => {
  it('hashes only scripts without a src', () => {
    const html = '<head><script type="module" src="/a.js"></script><script>one()</script><script\n>two()</script></head>';
    expect(inlineScripts(html)).toEqual(['one()', 'two()']);
  });

  it('builds script-src from self alone when there is no inline script', () => {
    expect(directive(buildCsp([]), 'script-src')).toEqual(["'self'"]);
  });

  it('falls back to right after <head> when there is no <meta charset>', () => {
    expect(injectCsp('<html><head><title>t</title></head></html>')).toMatch(/^<html><head>\n {4}<meta http-equiv="Content-Security-Policy"/);
  });

  it('fails the build rather than ship a page without a policy, or with two', () => {
    expect(() => injectCsp('<p>no head</p>')).toThrow(/no <head>/);
    expect(() => injectCsp(built)).toThrow(/already has/);
  });
});

describe('cspPlugin', () => {
  const plugin = cspPlugin();

  it('runs on the production build only, so dev keeps HMR', () => {
    expect(plugin.apply).toBe('build');
  });

  it('transforms index.html last, after every other plugin', () => {
    expect(plugin.transformIndexHtml).toEqual({ order: 'post', handler: injectCsp });
  });
});
