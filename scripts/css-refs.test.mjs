import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THIRD_PARTY_FONT_HOSTS, cssRefs, isRemote, remoteImports, thirdPartyFontHosts, unresolvedRefs } from '../packages/react/scripts/css-refs.mjs';
import { FONT_FILES, THEME_FONTS } from '../packages/react/scripts/expected-fonts.mjs';

const FACE = `@font-face {
  font-family: "Nunito";
  src: url("./fonts/nunito-latin-600-normal.woff2") format("woff2");
}`;

test('css refs: finds url() targets quoted, single-quoted and bare, and @import strings (Vite minifies url() away)', () => {
  const css = `${FACE}
.a { background: url('img/a.png'); }
.b { background: url( b.svg ); }
@import "./other.css";
@import"https://fonts.googleapis.com/css2?family=Nunito";`;
  assert.deepEqual(cssRefs(css), [
    './fonts/nunito-latin-600-normal.woff2',
    'img/a.png',
    'b.svg',
    './other.css',
    'https://fonts.googleapis.com/css2?family=Nunito',
  ]);
});

test('css refs: an http, https or protocol-relative ref is remote; local paths and data: URIs are not', () => {
  for (const ref of ['https://fonts.gstatic.com/s/x.woff2', 'http://example.com/a.css', '//cdn.example.com/a.woff2']) assert.equal(isRemote(ref), true, ref);
  for (const ref of ['./fonts/a.woff2', 'fonts/a.woff2', '/assets/a.woff2', 'data:font/woff2;base64,AAAA', '#mask']) assert.equal(isRemote(ref), false, ref);
});

test('css refs: remoteImports catches the old Google Fonts @import in both its source and minified forms', () => {
  const source = '@import url("https://fonts.googleapis.com/css2?family=Lilita+One&display=swap");\n:root { --x: 1; }';
  const minified = '@import"https://fonts.googleapis.com/css2?family=Lilita+One&display=swap";:root{--x:1}';
  for (const css of [source, minified]) assert.deepEqual(remoteImports(css), ['https://fonts.googleapis.com/css2?family=Lilita+One&display=swap']);
  assert.deepEqual(remoteImports(`@import "./local.css";\n${FACE}`), []);
});

test('css refs: thirdPartyFontHosts names each Google Fonts host a text mentions, anywhere in it', () => {
  assert.deepEqual(THIRD_PARTY_FONT_HOSTS, ['fonts.googleapis.com', 'fonts.gstatic.com']);
  assert.deepEqual(thirdPartyFontHosts('// preconnect to https://fonts.gstatic.com and fonts.googleapis.com'), ['fonts.googleapis.com', 'fonts.gstatic.com']);
  assert.deepEqual(thirdPartyFontHosts(FACE), []);
});

test('css refs: unresolvedRefs resolves each local ref against the CSS file and lists the ones not in the file set', () => {
  const css = `${FACE}
.x { background: url("../img/x.png?v=1#frag"); }
.y { mask: url(#m); background: url(data:image/png;base64,AAAA); }
.z { background: url("https://example.com/z.png"); }`;
  const files = new Set(['package/dist/themes/power-up.css', 'package/dist/themes/fonts/nunito-latin-600-normal.woff2']);
  assert.deepEqual(unresolvedRefs('package/dist/themes/power-up.css', css, files), ['../img/x.png?v=1#frag']);
  files.add('package/dist/img/x.png');
  assert.deepEqual(unresolvedRefs('package/dist/themes/power-up.css', css, files), []);
});

test('css refs: a root-absolute ref (what Vite writes into built CSS) resolves from the root of the file set', () => {
  const css = '@font-face{font-family:"Nunito";src:url(/assets/nunito-latin-600-normal-Ab12.woff2)format("woff2")}';
  assert.deepEqual(unresolvedRefs('assets/index-Cd34.css', css, new Set(['assets/index-Cd34.css'])), ['/assets/nunito-latin-600-normal-Ab12.woff2']);
  assert.deepEqual(unresolvedRefs('assets/index-Cd34.css', css, new Set(['assets/nunito-latin-600-normal-Ab12.woff2'])), []);
});

test('expected fonts: the five families at the weights the Google import loaded, latin and latin-ext, plus each license', () => {
  assert.deepEqual(
    THEME_FONTS.map(({ family, weights }) => `${family} ${weights.join('/')}`),
    ['Lilita One 400', 'Nunito 600/700/800', 'Press Start 2P 400', 'Audiowide 400', 'JetBrains Mono 400/700'],
  );
  assert.equal(FONT_FILES.filter((f) => f.endsWith('.woff2')).length, 16);
  assert.ok(FONT_FILES.includes('nunito-latin-ext-800-normal.woff2'));
  assert.ok(FONT_FILES.includes('press-start-2p-latin-400-normal.woff2'));
  assert.deepEqual(
    FONT_FILES.filter((f) => f.endsWith('.txt')),
    ['OFL-lilita-one.txt', 'OFL-nunito.txt', 'OFL-press-start-2p.txt', 'OFL-audiowide.txt', 'OFL-jetbrains-mono.txt'],
  );
});
