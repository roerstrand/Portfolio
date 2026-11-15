const test = require('node:test');
const assert = require('node:assert/strict');
const {
    matchesFilter,
    filterStatus,
    pointerRatio,
    layerOffset,
    flipDelta,
    staggerDelays,
    parseGallery,
    previewLinks,
} = require('../js/logic.js');

test('matchesFilter shows every category for "all"', () => {
    assert.equal(matchesFilter('software', 'all'), true);
    assert.equal(matchesFilter('research', 'all'), true);
});

test('matchesFilter keeps only the chosen category', () => {
    assert.equal(matchesFilter('software', 'software'), true);
    assert.equal(matchesFilter('research', 'software'), false);
});

test('filterStatus names the filter and pluralises the count', () => {
    assert.equal(filterStatus(7, 'All'), 'All: showing 7 projects');
    assert.equal(filterStatus(1, 'Software'), 'Software: showing 1 project');
});

test('pointerRatio maps the centre to zero and the edges to ±1', () => {
    const rect = { left: 100, top: 50, width: 200, height: 100 };
    assert.deepEqual(pointerRatio(200, 100, rect), { x: 0, y: 0 });
    assert.deepEqual(pointerRatio(100, 50, rect), { x: -1, y: -1 });
    assert.deepEqual(pointerRatio(300, 150, rect), { x: 1, y: 1 });
});

test('pointerRatio clamps positions outside the element', () => {
    const rect = { left: 0, top: 0, width: 100, height: 100 };
    assert.deepEqual(pointerRatio(-500, 900, rect), { x: -1, y: 1 });
});

test('pointerRatio returns zero for an element without size', () => {
    assert.deepEqual(pointerRatio(10, 10, { left: 0, top: 0, width: 0, height: 0 }), { x: 0, y: 0 });
});

test('layerOffset scales the ratio by the layer depth', () => {
    assert.deepEqual(layerOffset({ x: 0.5, y: -1 }, 8), { x: 4, y: -8 });
    assert.deepEqual(layerOffset({ x: 1 / 3, y: 0 }, 10), { x: 3.33, y: 0 });
});

test('flipDelta gives the offset from the new position back to the old one', () => {
    assert.deepEqual(flipDelta({ left: 300, top: 900 }, { left: 20, top: 400 }), { x: 280, y: 500 });
    assert.deepEqual(flipDelta({ left: 5, top: 5 }, { left: 5, top: 5 }), { x: 0, y: 0 });
});

test('staggerDelays restarts the delay on every new row', () => {
    assert.deepEqual(staggerDelays([100, 100, 100, 500, 500], 70), [0, 70, 140, 0, 70]);
});

test('staggerDelays treats near-equal tops as the same row', () => {
    assert.deepEqual(staggerDelays([100, 104, 96], 50), [0, 50, 100]);
    assert.deepEqual(staggerDelays([100, 130], 50), [0, 0]);
});

test('parseGallery reads source and caption pairs', () => {
    assert.deepEqual(parseGallery('./a.png|Admin dashboard; ./b.png|Storefront'), [
        { src: './a.png', caption: 'Admin dashboard' },
        { src: './b.png', caption: 'Storefront' },
    ]);
});

test('parseGallery returns an empty list for missing input', () => {
    assert.deepEqual(parseGallery(''), []);
    assert.deepEqual(parseGallery(undefined), []);
});

test('previewLinks lists the primary destination and the code link', () => {
    assert.deepEqual(
        previewLinks({ primaryHref: 'https://live.example', primaryLabel: 'Open live site', codeHref: 'https://github.com/x' }),
        [
            { href: 'https://live.example', label: 'Open live site' },
            { href: 'https://github.com/x', label: 'Code' },
        ],
    );
});

test('previewLinks does not repeat a code link that is the primary destination', () => {
    assert.deepEqual(
        previewLinks({ primaryHref: 'https://github.com/x', primaryLabel: 'View code on GitHub', codeHref: 'https://github.com/x' }),
        [{ href: 'https://github.com/x', label: 'View code on GitHub' }],
    );
});
