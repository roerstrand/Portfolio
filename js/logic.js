(function (root) {
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const round2 = value => Math.round(value * 100) / 100 + 0;

    function matchesFilter(category, filter) {
        return filter === 'all' || category === filter;
    }

    function filterStatus(count, label) {
        return `${label}: showing ${count} ${count === 1 ? 'project' : 'projects'}`;
    }

    function pointerRatio(clientX, clientY, rect) {
        if (!rect.width || !rect.height) {
            return { x: 0, y: 0 };
        }
        const x = ((clientX - rect.left) / rect.width) * 2 - 1;
        const y = ((clientY - rect.top) / rect.height) * 2 - 1;
        return { x: round2(clamp(x, -1, 1)), y: round2(clamp(y, -1, 1)) };
    }

    function layerOffset(ratio, depth) {
        return { x: round2(ratio.x * depth), y: round2(ratio.y * depth) };
    }

    function flipDelta(first, last) {
        return { x: first.left - last.left, y: first.top - last.top };
    }

    function staggerDelays(tops, step, tolerance = 8) {
        let rowTop = null;
        let indexInRow = 0;
        return tops.map(top => {
            if (rowTop === null || Math.abs(top - rowTop) > tolerance) {
                rowTop = top;
                indexInRow = 0;
            } else {
                indexInRow += 1;
            }
            return indexInRow * step;
        });
    }

    function parseGallery(value) {
        if (!value) {
            return [];
        }
        return value
            .split(';')
            .map(entry => entry.trim())
            .filter(Boolean)
            .map(entry => {
                const [src, caption = ''] = entry.split('|').map(part => part.trim());
                return { src, caption };
            });
    }

    function previewLinks({ primaryHref, primaryLabel, codeHref }) {
        const links = [{ href: primaryHref, label: primaryLabel }];
        if (codeHref && codeHref !== primaryHref) {
            links.push({ href: codeHref, label: 'Code' });
        }
        return links;
    }

    const api = {
        matchesFilter,
        filterStatus,
        pointerRatio,
        layerOffset,
        flipDelta,
        staggerDelays,
        parseGallery,
        previewLinks,
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    root.PortfolioLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
