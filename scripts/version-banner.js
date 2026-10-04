/* Old-version banner for the frozen copies of the docs site (bit-design-system/v<line>/).
 *
 * build-versioned-site.mjs copies this file to the site root and adds
 * <script src="/bit-design-system/version-banner.js" defer> to every archived page. It fetches
 * versions.json and, unless this copy is the latest, puts a solid warning bit Alert at the top
 * of <body> with a plain <select> that switches versions. It uses only class names that exist
 * in bit 0.1.0's CSS (bit-alert, bit-select, bit-link, bit-field__label, bit-warning, bit-sm).
 *
 * Dependency-free with no build step. It never throws: bad data shows the banner without the
 * select. A build that has its own picker sets data-bit-version-picker on <html>, and is skipped.
 * Under CommonJS (the node tests) it exports its core instead of running.
 */
/* global module, window, console */
(function (root) {
  'use strict';

  var SITE_BASE = '/bit-design-system/';
  var BANNER_ID = 'bit-version-banner';
  var SELECT_ID = 'bit-version-banner-select';
  // Only the site root or one v<line>/ folder below it: never another origin or a javascript: URL.
  // The same pattern as the gallery's isVersionsFile (apps/gallery/src/content/versionLines.mjs).
  var SAFE_PATH = /^\/bit-design-system\/(v[0-9][0-9.]*\/)?$/;
  var LINE = /^\d+(\.\d+)?$/;
  var VERSION = /^\d+\.\d+\.\d+$/;

  function isEntry(entry) {
    return (
      !!entry &&
      typeof entry === 'object' &&
      typeof entry.line === 'string' &&
      LINE.test(entry.line) &&
      typeof entry.version === 'string' &&
      VERSION.test(entry.version) &&
      typeof entry.path === 'string' &&
      SAFE_PATH.test(entry.path)
    );
  }

  /** The usable part of versions.json, or null when its shape is wrong. */
  function parseVersions(data) {
    if (!data || typeof data !== 'object' || typeof data.latest !== 'string' || !Array.isArray(data.lines)) return null;
    var lines = data.lines.filter(isEntry);
    return lines.length > 0 ? { latest: data.latest, lines: lines } : null;
  }

  // The copy this page belongs to: the site root, or the v<line>/ folder right below it.
  function ownPathOf(pathname) {
    if (typeof pathname !== 'string' || pathname.indexOf(SITE_BASE) !== 0) return null;
    var match = /^v[0-9][0-9.]*\//.exec(pathname.slice(SITE_BASE.length));
    return SITE_BASE + (match ? match[0] : '');
  }

  function find(lines, predicate) {
    for (var i = 0; i < lines.length; i += 1) if (predicate(lines[i])) return lines[i];
    return null;
  }

  function el(doc, tag, className, text) {
    var node = doc.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function versionSelect(doc, data, ownPath, ownLine, location) {
    var row = el(doc, 'div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '8px';
    var label = el(doc, 'label', 'bit-field__label', 'Version');
    label.setAttribute('for', SELECT_ID);
    var wrap = el(doc, 'span', 'bit-select bit-sm');
    wrap.style.width = 'auto';
    var select = el(doc, 'select', 'bit-select__control');
    select.id = SELECT_ID;
    var listed = false;
    data.lines.forEach(function (entry) {
      var latest = entry.path === SITE_BASE;
      var option = el(doc, 'option', '', entry.line + (latest ? ' (latest)' : '') + ' · ' + entry.version);
      option.value = entry.path;
      if (entry.path === ownPath) listed = true;
      select.appendChild(option);
    });
    if (!listed) {
      var own = el(doc, 'option', '', ownLine + ' (this copy)');
      own.value = ownPath;
      select.appendChild(own);
    }
    select.value = ownPath;
    select.addEventListener('change', function () {
      if (SAFE_PATH.test(select.value)) location.assign(select.value + (location.hash || ''));
    });
    wrap.appendChild(select);
    row.appendChild(label);
    row.appendChild(wrap);
    return row;
  }

  /**
   * Renders the banner into doc.body and returns it, or returns null when it should not show:
   * the build has its own picker, the page is the latest copy, or it is already there.
   */
  function renderBanner(opts) {
    try {
      var doc = opts && opts.doc;
      var location = opts && opts.location;
      if (!doc || !doc.documentElement || !doc.body || !location) return null;
      if (doc.documentElement.hasAttribute('data-bit-version-picker')) return null;
      if (doc.getElementById && doc.getElementById(BANNER_ID)) return null;
      var ownPath = ownPathOf(location.pathname);
      if (!ownPath) return null;
      var data = parseVersions(opts.versions);
      // The latest copy is always the root; two entries can share the latest line (the as-older rehearsal).
      if (ownPath === SITE_BASE) return null;
      var latestPath = SITE_BASE;
      var own = data && find(data.lines, function (l) { return l.path === ownPath; });
      var ownLine = ownPath.slice(SITE_BASE.length + 1, -1) || '?';
      var name = 'v' + (own ? own.version : ownLine);

      var banner = el(doc, 'div', 'bit-alert bit-solid bit-warning');
      banner.id = BANNER_ID;
      banner.setAttribute('role', 'status');
      banner.style.borderRadius = '0';
      var body = el(doc, 'div', 'bit-alert__body');
      body.style.display = 'flex';
      body.style.flexWrap = 'wrap';
      body.style.alignItems = 'center';
      body.style.gap = '8px 16px';
      body.appendChild(el(doc, 'span', '', "You're viewing the docs for " + name + '. Components here behave as they did in ' + name + '.'));
      var link = el(doc, 'a', 'bit-link', 'Go to the latest docs');
      link.setAttribute('href', latestPath + (location.hash || ''));
      // In a solid alert the link takes the alert's contrast colour, not the page's link colour.
      link.style.color = 'inherit';
      body.appendChild(link);
      if (data) body.appendChild(versionSelect(doc, data, ownPath, ownLine, location));
      banner.appendChild(body);
      doc.body.insertBefore(banner, doc.body.firstChild);
      return banner;
    } catch (error) {
      if (typeof console !== 'undefined') console.warn('version-banner: could not render', error);
      return null;
    }
  }

  // Waits for load, so a build with its own picker has mounted it (and set the attribute) first.
  function boot(win) {
    var show = function (versions) {
      renderBanner({ doc: win.document, versions: versions, location: win.location });
    };
    var start = function () {
      if (typeof win.fetch !== 'function') return show(null);
      win
        .fetch(SITE_BASE + 'versions.json', { cache: 'no-cache' })
        .then(function (response) {
          return response.ok ? response.json() : null;
        })
        .then(show, function (error) {
          if (typeof console !== 'undefined') console.warn('version-banner: versions.json unavailable', error);
          show(null);
        });
    };
    try {
      if (win.document.readyState === 'complete') start();
      else win.addEventListener('load', start);
    } catch (error) {
      if (typeof console !== 'undefined') console.warn('version-banner: could not start', error);
    }
  }

  var api = { SITE_BASE: SITE_BASE, ownPathOf: ownPathOf, parseVersions: parseVersions, renderBanner: renderBanner, boot: boot };
  if (typeof module === 'object' && module && module.exports) module.exports = api;
  else if (root && root.document) boot(root);
})(typeof window !== 'undefined' ? window : undefined);
