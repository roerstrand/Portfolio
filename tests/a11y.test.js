const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
require('../js/i18n.js');
const dict = globalThis.PortfolioI18n;

const body = html.slice(html.indexOf('<body'));
const focusable = /<(a|button|input|select|textarea|summary)\b[^>]*>/g;

test('the first focusable element is a skip link to the main content', () => {
    const first = focusable.exec(body)[0];
    focusable.lastIndex = 0;
    assert.match(first, /^<a\b/);
    assert.match(first, /href="#main"/);
    assert.match(first, /class="skip-link"/);
});

test('main is the skip target and can take focus without joining the tab order', () => {
    assert.match(html, /<main\b[^>]*\bid="main"/);
    assert.match(html, /<main\b[^>]*\btabindex="-1"/);
});

test('no element uses a positive tabindex that would break the reading order', () => {
    assert.doesNotMatch(html, /tabindex="[1-9]\d*"/);
});

test('the back to top link points at a focusable target at the top of the page', () => {
    const link = /<a\b[^>]*class="to-top"[^>]*>/.exec(html);
    assert.ok(link, 'back to top link is missing');
    assert.match(link[0], /href="#top"/);
    assert.match(html, /<header\b[^>]*\bid="top"[^>]*\btabindex="-1"/);
});

test('the back to top link has a translated accessible name', () => {
    const link = /<a\b[^>]*class="to-top"[^>]*>[\s\S]*?<\/a>/.exec(html)[0];
    assert.match(link, /class="sr-only" data-i18n="top.label"/);
});

test('skip and back to top texts exist in English and Swedish', () => {
    ['skip.main', 'top.label'].forEach(key => {
        assert.ok(dict.en[key], `en is missing ${key}`);
        assert.ok(dict.sv[key], `sv is missing ${key}`);
        assert.notEqual(dict.en[key], dict.sv[key]);
    });
});
