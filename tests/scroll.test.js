const test = require('node:test');
const assert = require('node:assert/strict');
const { scrollProgress, shouldShowBackToTop } = require('../js/logic.js');

test('scrollProgress is zero at the top and one at the bottom', () => {
    assert.equal(scrollProgress(0, 3000, 1000), 0);
    assert.equal(scrollProgress(2000, 3000, 1000), 1);
});

test('scrollProgress gives the share of the scrollable distance', () => {
    assert.equal(scrollProgress(500, 3000, 1000), 0.25);
    assert.equal(scrollProgress(1000 / 3, 2000, 1000), 0.33);
});

test('scrollProgress clamps overscroll and handles pages that cannot scroll', () => {
    assert.equal(scrollProgress(-40, 3000, 1000), 0);
    assert.equal(scrollProgress(2400, 3000, 1000), 1);
    assert.equal(scrollProgress(0, 800, 1000), 0);
});

test('shouldShowBackToTop waits until most of the first screen is scrolled past', () => {
    assert.equal(shouldShowBackToTop(0, 1000), false);
    assert.equal(shouldShowBackToTop(600, 1000), false);
    assert.equal(shouldShowBackToTop(601, 1000), true);
});
