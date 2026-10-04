// version-banner.js is a classic browser script with no imports and no build step. When a
// CommonJS `module` is present it exports its core instead of booting, so this loads it in a vm.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { SITE_BASE } from '../apps/gallery/src/content/versionLines.mjs';

const source = readFileSync(new URL('./version-banner.js', import.meta.url), 'utf8');
// The script logs (never throws) when it cannot render; the tests collect those warnings.
const warnings = [];
const load = () => {
  const sandbox = { module: { exports: {} }, console: { warn: (...args) => warnings.push(args) } };
  vm.runInNewContext(source, sandbox);
  return sandbox.module.exports;
};
const { renderBanner, parseVersions, SITE_BASE: BANNER_BASE } = load();

// --- a minimal fake DOM: just what the banner touches -------------------------------------------
class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.attributes = {};
    this.children = [];
    this.listeners = {};
    this.style = {};
    this.textContent = '';
    this.className = '';
  }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }
  getAttribute(name) {
    return name in this.attributes ? this.attributes[name] : null;
  }
  hasAttribute(name) {
    return name in this.attributes;
  }
  appendChild(child) {
    this.children.push(child);
    return child;
  }
  insertBefore(child, ref) {
    const index = ref ? this.children.indexOf(ref) : -1;
    if (index < 0) this.children.push(child);
    else this.children.splice(index, 0, child);
    return child;
  }
  get firstChild() {
    return this.children[0] ?? null;
  }
  addEventListener(type, fn) {
    this.listeners[type] = fn;
  }
  get text() {
    return this.textContent + this.children.map((c) => c.text).join('');
  }
  findAll(tag) {
    return this.children.flatMap((c) => [...(c.tagName === tag ? [c] : []), ...c.findAll(tag)]);
  }
}

const fakeDoc = () => {
  const doc = {
    documentElement: new FakeElement('html'),
    body: new FakeElement('body'),
    createElement: (tag) => new FakeElement(tag),
    getElementById: (id) => [doc.body, ...doc.body.findAll('DIV')].find((el) => el.id === id) ?? null,
  };
  doc.body.appendChild(new FakeElement('div')).id = 'root';
  return doc;
};
const fakeLocation = (pathname, hash = '#/components/button') => {
  const assigned = [];
  return { pathname, hash, assign: (url) => assigned.push(url), assigned };
};

const line = (l, version, path) => ({ line: l, version, date: '', path, react: '^19.0.0', reactDom: '^19.0.0' });
const VERSIONS = {
  latest: '0.2',
  lines: [line('0.2', '0.2.0', '/bit-design-system/'), line('0.1', '0.1.3', '/bit-design-system/v0.1/')],
};

test('the banner and the gallery agree on the site base', () => assert.equal(BANNER_BASE, SITE_BASE));

test('renders nothing when the build has its own picker (data-bit-version-picker)', () => {
  const doc = fakeDoc();
  doc.documentElement.setAttribute('data-bit-version-picker', '');
  assert.equal(renderBanner({ doc, versions: VERSIONS, location: fakeLocation('/bit-design-system/v0.1/') }), null);
  assert.equal(doc.body.children.length, 1);
});

test('renders nothing on the latest path', () => {
  const doc = fakeDoc();
  assert.equal(renderBanner({ doc, versions: VERSIONS, location: fakeLocation('/bit-design-system/') }), null);
  assert.equal(doc.body.children.length, 1);
});

test('renders nothing outside the site base', () => {
  const doc = fakeDoc();
  assert.equal(renderBanner({ doc, versions: VERSIONS, location: fakeLocation('/elsewhere/') }), null);
});

test('on an older path: a solid warning alert first in <body>, with a select of one option per line', () => {
  const doc = fakeDoc();
  const banner = renderBanner({ doc, versions: VERSIONS, location: fakeLocation('/bit-design-system/v0.1/index.html') });
  assert.ok(banner, 'a banner element');
  assert.equal(doc.body.firstChild, banner, 'it sits above the app root');
  assert.equal(banner.className, 'bit-alert bit-solid bit-warning');
  assert.equal(banner.getAttribute('role'), 'status');
  assert.match(banner.text, /You're viewing the docs for v0\.1\.3\. Components here behave as they did in v0\.1\.3\./);
  const [select] = banner.findAll('SELECT');
  assert.equal(select.className, 'bit-select__control');
  const options = select.findAll('OPTION');
  assert.deepEqual(
    options.map((o) => [o.textContent, o.value]),
    [
      ['0.2 (latest) · 0.2.0', '/bit-design-system/'],
      ['0.1 · 0.1.3', '/bit-design-system/v0.1/'],
    ],
  );
  assert.equal(select.value, '/bit-design-system/v0.1/', 'the current copy is selected');
  const [label] = banner.findAll('LABEL');
  assert.equal(label.textContent, 'Version');
  assert.equal(label.getAttribute('for'), select.id);
  const [link] = banner.findAll('A');
  assert.equal(link.className, 'bit-link');
  assert.equal(link.getAttribute('href'), '/bit-design-system/#/components/button', 'the latest link keeps the page');
});

test('changing the select goes to that copy, on the same hash route', () => {
  const doc = fakeDoc();
  const location = fakeLocation('/bit-design-system/v0.1/', '#/tokens');
  const banner = renderBanner({ doc, versions: VERSIONS, location });
  const [select] = banner.findAll('SELECT');
  select.value = '/bit-design-system/';
  select.listeners.change();
  assert.deepEqual(location.assigned, ['/bit-design-system/#/tokens']);
});

test('renders only once per page', () => {
  const doc = fakeDoc();
  const location = fakeLocation('/bit-design-system/v0.1/');
  renderBanner({ doc, versions: VERSIONS, location });
  assert.equal(renderBanner({ doc, versions: VERSIONS, location }), null);
  assert.equal(doc.body.children.length, 2);
});

test('a copy missing from versions.json is still labelled from its path and offered as "this copy"', () => {
  const doc = fakeDoc();
  const versions = { latest: '0.1', lines: [line('0.1', '0.1.0', '/bit-design-system/')] };
  const banner = renderBanner({ doc, versions, location: fakeLocation('/bit-design-system/v0.1/') });
  assert.match(banner.text, /docs for v0\.1\./);
  const [select] = banner.findAll('SELECT');
  assert.deepEqual(
    select.findAll('OPTION').map((o) => [o.textContent, o.value]),
    [
      ['0.1 (latest) · 0.1.0', '/bit-design-system/'],
      ['0.1 (this copy)', '/bit-design-system/v0.1/'],
    ],
  );
  assert.equal(select.value, '/bit-design-system/v0.1/');
});

for (const [name, versions] of [
  ['null', null],
  ['a string', 'nope'],
  ['no lines', { latest: '0.1' }],
  ['lines not an array', { latest: '0.1', lines: {} }],
  ['a latest that is not a string', { latest: 1, lines: [] }],
]) {
  test(`malformed versions.json (${name}): never throws, shows the banner and a link, no select`, () => {
    const doc = fakeDoc();
    const banner = renderBanner({ doc, versions, location: fakeLocation('/bit-design-system/v0.1/') });
    assert.ok(banner);
    assert.equal(banner.findAll('SELECT').length, 0);
    assert.equal(banner.findAll('A')[0].getAttribute('href'), '/bit-design-system/#/components/button');
  });
}

test('parseVersions drops entries with a bad shape or an unsafe path', () => {
  const parsed = parseVersions({
    latest: '0.2',
    lines: [
      line('0.2', '0.2.0', '/bit-design-system/'),
      line('0.1', '0.1.3', 'javascript:alert(1)'),
      line('0.1', '0.1.3', 'https://evil.example/bit-design-system/v0.1/'),
      { line: '0.0', version: 7, path: '/bit-design-system/v0.0/' },
      null,
      line('1', '1.0.0', '/bit-design-system/v1/'),
    ],
  });
  assert.deepEqual(
    parsed.lines.map((l) => l.path),
    ['/bit-design-system/', '/bit-design-system/v1/'],
  );
});

test('renderBanner never throws, even with a broken document', () => {
  assert.equal(renderBanner({ doc: {}, versions: VERSIONS, location: fakeLocation('/bit-design-system/v0.1/') }), null);
  assert.equal(renderBanner({}), null);
  const doc = fakeDoc();
  doc.createElement = () => {
    throw new Error('no DOM');
  };
  warnings.length = 0;
  assert.equal(renderBanner({ doc, versions: VERSIONS, location: fakeLocation('/bit-design-system/v0.1/') }), null);
  assert.equal(warnings.length, 1, 'the failure is logged, not swallowed');
  assert.match(String(warnings[0][0]), /version-banner: could not render/);
});
