(function () {
    const L = window.PortfolioLogic;
    const I = window.PortfolioI18n;
    if (!L || !I) {
        return;
    }

    const EASE = 'cubic-bezier(0.2, 0.7, 0.2, 1)';
    const root = document.documentElement;
    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = () => reduceQuery.matches;
    const isFineMouse = event => event.pointerType === 'mouse' && finePointerQuery.matches && !reduced();
    const canMorph = () => !reduced() && typeof document.startViewTransition === 'function';

    const ARCH = {
        angular: ['nginx', 'fastapi'],
        nginx: ['angular', 'fastapi'],
        fastapi: ['nginx', 'identity', 'cmdb', 'incident', 'change', 'audit', 'metrics'],
        identity: ['fastapi', 'postgres'],
        cmdb: ['fastapi', 'incident', 'redis', 'rabbitmq', 'postgres', 'audit'],
        incident: ['fastapi', 'cmdb', 'audit', 'postgres'],
        change: ['fastapi', 'audit'],
        audit: ['fastapi', 'cmdb', 'incident', 'change'],
        postgres: ['identity', 'cmdb', 'incident'],
        redis: ['cmdb'],
        rabbitmq: ['cmdb'],
        metrics: ['fastapi', 'identity', 'cmdb', 'incident', 'change', 'audit'],
        jaeger: [],
    };

    let lang = 'en';
    const textCache = new WeakMap();
    const attrCache = new WeakMap();

    const t = (key, vars) => {
        let value = L.translate(I, lang, key);
        if (vars) {
            Object.keys(vars).forEach(name => {
                value = value.replace(`{${name}}`, vars[name]);
            });
        }
        return value;
    };

    const announce = (region, message) => {
        region.textContent = '';
        window.requestAnimationFrame(() => {
            region.textContent = message;
        });
    };

    function applyLanguage(scope) {
        scope.querySelectorAll('[data-i18n]').forEach(el => {
            if (!textCache.has(el)) {
                textCache.set(el, el.textContent.trim().replace(/\s+/g, ' '));
            }
            const key = el.dataset.i18n;
            const value = (I[lang] && I[lang][key]) ?? I.en[key] ?? textCache.get(el);
            if (el.textContent !== value) {
                el.textContent = value;
            }
        });
        scope.querySelectorAll('[data-i18n-attr]').forEach(el => {
            if (!attrCache.has(el)) {
                attrCache.set(el, {});
            }
            const originals = attrCache.get(el);
            el.dataset.i18nAttr.split(';').forEach(pair => {
                const [attr, key] = pair.split(':').map(part => part.trim());
                if (!(attr in originals)) {
                    originals[attr] = el.getAttribute(attr) || '';
                }
                const value = (I[lang] && I[lang][key]) ?? I.en[key] ?? originals[attr];
                el.setAttribute(attr, value);
            });
        });
    }

    function initLanguage() {
        const toggle = document.querySelector('[data-lang-toggle]');
        const params = new URLSearchParams(window.location.search);
        let stored = null;
        try {
            stored = window.localStorage.getItem('lang');
        } catch (error) {
        }
        lang = L.resolveLanguage({ param: params.get('lang'), stored });

        const set = (next, persist) => {
            lang = next;
            root.lang = next;
            applyLanguage(document);
            if (toggle) {
                toggle.querySelectorAll('[data-lang]').forEach(button => {
                    button.setAttribute('aria-pressed', String(button.dataset.lang === next));
                });
            }
            if (persist) {
                try {
                    window.localStorage.setItem('lang', next);
                } catch (error) {
                }
                const url = new URL(window.location.href);
                if (next === 'en') {
                    url.searchParams.delete('lang');
                } else {
                    url.searchParams.set('lang', next);
                }
                window.history.replaceState(window.history.state, '', url);
            }
        };

        set(lang, params.has('lang'));
        if (toggle) {
            toggle.hidden = false;
            toggle.addEventListener('click', event => {
                const button = event.target.closest('[data-lang]');
                if (button && button.dataset.lang !== lang) {
                    set(button.dataset.lang, true);
                }
            });
        }
    }

    function initViewer(viewer) {
        const frame = viewer.querySelector('[data-viewer-frame]');
        const image = viewer.querySelector('[data-viewer-img]');
        const caption = viewer.querySelector('[data-viewer-caption]');
        const buttons = [...viewer.querySelectorAll('[data-view]')];
        const zoom = viewer.querySelector('[data-viewer-zoom]');
        const defaults = { src: image.getAttribute('src'), altKey: 'alt.martialAdmin' };

        const setZoom = on => {
            frame.classList.toggle('is-zoomed', on);
            if (!zoom) {
                return;
            }
            const label = zoom.querySelector('[data-viewer-zoom-label]');
            label.dataset.i18n = on ? 'zoom.out' : 'zoom.in';
            label.textContent = t(label.dataset.i18n);
            zoom.querySelector('i').className = on ? 'fas fa-magnifying-glass-minus' : 'fas fa-magnifying-glass-plus';
            if (on) {
                frame.tabIndex = 0;
                frame.setAttribute('role', 'region');
                frame.setAttribute('aria-label', t('zoom.region'));
                frame.scrollTop = 0;
                frame.scrollLeft = 0;
            } else {
                frame.removeAttribute('tabindex');
                frame.removeAttribute('role');
                frame.removeAttribute('aria-label');
            }
        };

        const select = (button, animate) => {
            buttons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
            const src = button.dataset.src || defaults.src;
            const altKey = button.dataset.alt || defaults.altKey;
            if (image.getAttribute('src') !== src) {
                image.src = src;
                image.dataset.i18nAttr = `alt:${altKey}`;
                image.alt = t(altKey);
                if (animate && !reduced()) {
                    image.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 260, easing: EASE });
                }
            }
            const view = L.viewTransform(Number(button.dataset.scale), Number(button.dataset.top));
            frame.style.setProperty('--s', view.scale);
            frame.style.setProperty('--ty', view.ty);
            frame.dataset.glare = button.dataset.glare || '0';
            caption.dataset.i18n = button.dataset.caption;
            caption.textContent = t(button.dataset.caption);
            if (animate && !reduced()) {
                caption.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 260, easing: EASE });
            }
            viewer.dataset.current = button.dataset.view;
            setZoom(false);
        };

        buttons.forEach(button => button.addEventListener('click', () => select(button, true)));
        if (zoom) {
            zoom.addEventListener('click', () => setZoom(!frame.classList.contains('is-zoomed')));
        }
        select(buttons.find(b => b.getAttribute('aria-pressed') === 'true') || buttons[0], false);

        return {
            show(view) {
                const button = buttons.find(b => b.dataset.view === view);
                if (button) {
                    select(button, false);
                }
            },
            current: () => viewer.dataset.current,
        };
    }

    function initArch(arch) {
        const nodes = [...arch.querySelectorAll('[data-node]')];
        const title = arch.querySelector('[data-arch-title]');
        const text = arch.querySelector('[data-arch-text]');
        const rel = arch.querySelector('[data-arch-rel]');

        const select = name => {
            const related = ARCH[name] || [];
            nodes.forEach(node => {
                node.setAttribute('aria-pressed', String(node.dataset.node === name));
                node.classList.toggle('is-related', related.includes(node.dataset.node));
            });
            title.dataset.i18n = `arch.${name}.title`;
            text.dataset.i18n = `arch.${name}.text`;
            title.textContent = t(title.dataset.i18n);
            text.textContent = t(text.dataset.i18n);
            const items = related.length ? related : [null];
            rel.replaceChildren(...items.map((item, index) => {
                const span = document.createElement('span');
                span.dataset.i18n = item ? `arch.${item}.title` : 'arch.none';
                span.textContent = t(span.dataset.i18n);
                const fragment = document.createDocumentFragment();
                if (index > 0) {
                    fragment.append(', ');
                }
                fragment.append(span);
                return fragment;
            }));
        };

        nodes.forEach(node => node.addEventListener('click', () => select(node.dataset.node)));
        select('fastapi');
    }

    function initHero() {
        const hero = document.querySelector('[data-hero]');
        const viewerEl = hero && hero.querySelector('[data-viewer]');
        if (!hero || !viewerEl) {
            return null;
        }
        const viewer = initViewer(viewerEl);
        let frame = 0;
        let ratio = { x: 0, y: 0 };

        const render = () => {
            frame = 0;
            const set = (name, depthX, depthY) => {
                hero.style.setProperty(`--${name}-x`, `${L.layerOffset(ratio, depthX).x}px`);
                hero.style.setProperty(`--${name}-y`, `${L.layerOffset(ratio, depthY).y}px`);
            };
            set('plate', 12, 10);
            set('chip', 18, 14);
            set('shadow', 8, 8);
            set('light', -34, -22);
            set('glare', 60, 0);
        };
        const schedule = () => {
            if (!frame) {
                frame = window.requestAnimationFrame(render);
            }
        };

        hero.addEventListener('pointermove', event => {
            if (!isFineMouse(event)) {
                return;
            }
            ratio = L.pointerRatio(event.clientX, event.clientY, hero.getBoundingClientRect());
            schedule();
        });
        hero.addEventListener('pointerleave', () => {
            ratio = { x: 0, y: 0 };
            schedule();
        });

        return viewer;
    }

    function initExploreLink() {
        const link = document.querySelector('[data-explore]');
        const section = document.getElementById('projects');
        const heading = document.getElementById('projects-title');
        if (!link || !section || !heading) {
            return;
        }
        link.addEventListener('click', event => {
            event.preventDefault();
            section.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
            heading.focus({ preventScroll: true });
        });
    }

    function initFilters(grid, cards) {
        const bar = document.querySelector('[data-filter-bar]');
        const status = document.querySelector('[data-filter-status]');
        if (!bar || !status) {
            return;
        }
        const buttons = [...bar.querySelectorAll('[data-filter]')];
        bar.hidden = false;

        const apply = (filter, label) => {
            const first = new Map();
            cards.forEach(card => {
                if (!card.hidden) {
                    first.set(card, card.getBoundingClientRect());
                }
            });
            cards.forEach(card => {
                card.hidden = !L.matchesFilter(card.dataset.category, filter);
            });
            grid.dataset.activeFilter = filter;
            buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));

            const visible = cards.filter(card => !card.hidden);
            announce(status, L.filterStatus(visible.length, label, lang));
            if (reduced()) {
                return;
            }
            visible.forEach(card => {
                card.classList.remove('is-pending');
                const last = card.getBoundingClientRect();
                const before = first.get(card);
                if (before) {
                    const delta = L.flipDelta(before, last);
                    if (delta.x || delta.y) {
                        card.animate([{ transform: `translate(${delta.x}px, ${delta.y}px)` }, { transform: 'translate(0, 0)' }], { duration: 260, easing: EASE, composite: 'add' });
                    }
                } else {
                    card.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 240, easing: EASE, composite: 'add' });
                }
            });
        };

        buttons.forEach(button => button.addEventListener('click', () => {
            if (button.getAttribute('aria-pressed') !== 'true') {
                apply(button.dataset.filter, button.textContent.trim());
            }
        }));
    }

    function initCardEntrance(cards) {
        if (reduced() || !('IntersectionObserver' in window)) {
            return;
        }
        const fold = window.innerHeight * 0.92;
        const pending = cards.filter(card => card.getBoundingClientRect().top > fold);
        pending.forEach(card => card.classList.add('is-pending'));

        const observer = new IntersectionObserver(entries => {
            const entering = entries
                .filter(entry => entry.isIntersecting)
                .map(entry => entry.target)
                .sort((a, b) => {
                    const ra = a.getBoundingClientRect();
                    const rb = b.getBoundingClientRect();
                    return ra.top - rb.top || ra.left - rb.left;
                });
            const delays = L.staggerDelays(entering.map(card => card.getBoundingClientRect().top), 80, 24);
            entering.forEach((card, index) => {
                observer.unobserve(card);
                if (!card.classList.contains('is-pending')) {
                    return;
                }
                card.classList.remove('is-pending');
                const timing = { delay: delays[index], easing: EASE, fill: 'backwards', composite: 'add' };
                card.animate([{ opacity: 0, transform: 'translateY(26px)' }, { opacity: 1, transform: 'translateY(0)' }], { ...timing, duration: 480 });
                const media = card.querySelector('.card-media img');
                if (media) {
                    media.animate([{ transform: 'translateY(16px)' }, { transform: 'translateY(0)' }], { ...timing, duration: 640 });
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
        pending.forEach(card => observer.observe(card));
    }

    function initCardPointer(cards) {
        cards.forEach(card => {
            card.addEventListener('pointermove', event => {
                if (!isFineMouse(event)) {
                    return;
                }
                const rect = card.getBoundingClientRect();
                const ratio = L.pointerRatio(event.clientX, event.clientY, rect);
                card.style.setProperty('--mx', `${Math.round(event.clientX - rect.left)}px`);
                card.style.setProperty('--my', `${Math.round(event.clientY - rect.top)}px`);
                card.style.setProperty('--dx', ratio.x);
                card.style.setProperty('--dy', ratio.y);
            });
            card.addEventListener('pointerleave', () => {
                card.style.setProperty('--dx', 0);
                card.style.setProperty('--dy', 0);
            });
        });
    }

    function initProjectView(heroViewer) {
        const dialog = document.querySelector('[data-pv]');
        if (!dialog || typeof dialog.showModal !== 'function') {
            return;
        }
        const content = dialog.querySelector('[data-pv-content]');
        const title = dialog.querySelector('[data-pv-title]');
        const eyebrow = dialog.querySelector('[data-pv-eyebrow]');
        const liveSlot = dialog.querySelector('[data-pv-live-slot]');
        const closeButton = dialog.querySelector('[data-pv-close]');
        const heroMedia = document.querySelector('[data-hero-media]');
        const state = { stack: [], opener: null, fromHero: false, scrollY: 0, pendingOpener: null, pendingFromHero: false };

        title.tabIndex = -1;

        const template = slug => document.getElementById(`pv-${slug}`);

        const render = slug => {
            const tpl = template(slug);
            const fragment = tpl.content.cloneNode(true);
            applyLanguage(fragment);
            content.replaceChildren(fragment);
            liveSlot.replaceChildren(...content.querySelectorAll('[data-pv-live]'));
            dialog.dataset.project = slug;

            if (tpl.dataset.titleKey) {
                title.dataset.i18n = tpl.dataset.titleKey;
                title.textContent = t(tpl.dataset.titleKey);
            } else {
                delete title.dataset.i18n;
                title.textContent = tpl.dataset.title;
            }
            eyebrow.dataset.i18n = tpl.dataset.eyebrowKey;
            eyebrow.textContent = t(tpl.dataset.eyebrowKey);

            let viewer = null;
            content.querySelectorAll('[data-viewer]').forEach(el => {
                viewer = initViewer(el);
            });
            content.querySelectorAll('[data-arch]').forEach(initArch);
            dialog.querySelector('.pv__inner').scrollTop = 0;
            return viewer;
        };

        const media = () => content.querySelector('[data-pv-media]');
        const decode = async el => {
            if (el && el.decode) {
                try {
                    await el.decode();
                } catch (error) {
                }
            }
        };

        const show = async slug => {
            state.opener = state.pendingOpener || document.querySelector(`[data-grid] [data-open-project="${slug}"]`) || document.querySelector(`[data-open-project="${slug}"]`);
            state.fromHero = state.pendingFromHero;
            state.pendingOpener = null;
            state.pendingFromHero = false;
            state.scrollY = window.scrollY;
            if ('scrollRestoration' in window.history) {
                window.history.scrollRestoration = 'manual';
            }

            const viewer = render(slug);
            if (viewer && state.fromHero && heroViewer) {
                viewer.show(heroViewer.current());
            }
            root.classList.add('preview-open');
            await decode(media());

            if (state.fromHero && heroMedia && canMorph()) {
                heroMedia.style.viewTransitionName = 'project-media';
                const transition = document.startViewTransition(() => {
                    heroMedia.style.viewTransitionName = '';
                    media().style.viewTransitionName = 'project-media';
                    dialog.showModal();
                    title.focus({ preventScroll: true });
                });
                try {
                    await transition.finished;
                } catch (error) {
                }
                const m = media();
                if (m) {
                    m.style.viewTransitionName = '';
                }
            } else {
                dialog.classList.toggle('pv--fade', !reduced());
                dialog.showModal();
                title.focus({ preventScroll: true });
            }
        };

        const swap = async slug => {
            render(slug);
            title.focus({ preventScroll: true });
            if (!reduced()) {
                content.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 240, easing: EASE });
            }
        };

        const finish = async () => {
            if (!dialog.open) {
                return;
            }
            const returnToHero = state.fromHero && dialog.dataset.project === 'martial-store' && heroMedia && canMorph();
            if (returnToHero) {
                const m = media();
                if (m) {
                    m.style.viewTransitionName = 'project-media';
                }
                const transition = document.startViewTransition(() => {
                    if (m) {
                        m.style.viewTransitionName = '';
                    }
                    dialog.close();
                    heroMedia.style.viewTransitionName = 'project-media';
                });
                try {
                    await transition.finished;
                } catch (error) {
                }
                heroMedia.style.viewTransitionName = '';
            } else {
                dialog.close();
            }
        };

        const requestClose = () => {
            if (!dialog.open) {
                return;
            }
            if (state.stack.length) {
                window.history.go(-state.stack.length);
            } else {
                finish();
            }
        };

        const route = () => {
            const { project } = L.parseRoute(window.location.hash);
            if (project && template(project)) {
                if (dialog.open) {
                    if (state.stack[state.stack.length - 2] === project) {
                        state.stack.pop();
                    } else {
                        state.stack.push(project);
                    }
                    swap(project);
                } else {
                    state.stack = [project];
                    show(project);
                }
            } else if (dialog.open) {
                state.stack = [];
                finish();
            }
        };

        document.addEventListener('click', event => {
            const link = event.target.closest('[data-open-project]');
            if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                return;
            }
            if (!dialog.open) {
                state.pendingOpener = link;
                state.pendingFromHero = link.hasAttribute('data-from-hero');
            }
            const card = link.closest('.project-card');
            if (card && !reduced()) {
                const img = card.querySelector('.card-media img');
                if (img) {
                    img.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-6px)' }, { transform: 'translateY(0)' }], { duration: 260, easing: EASE, composite: 'add' });
                }
                card.animate([{ '--glare': 0 }, { '--glare': 1 }, { '--glare': 0 }], { duration: 320, easing: EASE });
            }
        });

        dialog.addEventListener('close', () => {
            root.classList.remove('preview-open');
            content.replaceChildren();
            liveSlot.replaceChildren();
            if (Math.abs(window.scrollY - state.scrollY) > 1) {
                window.scrollTo({ top: state.scrollY, behavior: 'instant' });
            }
            window.setTimeout(() => {
                if ('scrollRestoration' in window.history) {
                    window.history.scrollRestoration = 'auto';
                }
            }, 0);
            const target = state.opener && state.opener.isConnected && !state.opener.closest('[hidden]') ? state.opener : null;
            if (target) {
                target.focus({ preventScroll: true });
            }
        });
        dialog.addEventListener('cancel', event => {
            event.preventDefault();
            requestClose();
        });
        dialog.addEventListener('click', event => {
            if (event.target === dialog) {
                requestClose();
            }
        });
        closeButton.addEventListener('click', requestClose);
        window.addEventListener('hashchange', route);

        const initial = L.parseRoute(window.location.hash).project;
        if (initial && template(initial)) {
            const url = new URL(window.location.href);
            url.hash = '';
            window.history.replaceState(null, '', url.href.replace(/#$/, ''));
            window.history.pushState(null, '', L.routeFor(initial));
            state.stack = [initial];
            show(initial);
        }
    }

    function initCopyEmail() {
        const button = document.querySelector('[data-copy-email]');
        const status = document.querySelector('[data-copy-status]');
        if (!button || !status) {
            return;
        }
        const canCopy = (navigator.clipboard && window.isSecureContext) || document.queryCommandSupported?.('copy');
        if (!canCopy) {
            return;
        }
        const label = button.querySelector('[data-copy-label]');
        const icon = button.querySelector('[data-copy-icon]');
        const address = button.dataset.copyEmail;
        let timer = 0;

        const legacyCopy = () => {
            const field = document.createElement('textarea');
            field.value = address;
            field.setAttribute('readonly', '');
            field.className = 'sr-only';
            document.body.append(field);
            field.select();
            const ok = document.execCommand('copy');
            field.remove();
            return ok;
        };

        const setLabel = key => {
            label.dataset.i18n = key;
            label.textContent = t(key);
        };

        const feedback = ok => {
            window.clearTimeout(timer);
            button.classList.toggle('is-copied', ok);
            setLabel(ok ? 'copy.done' : 'copy.fail');
            icon.className = ok ? 'fas fa-check' : 'fas fa-triangle-exclamation';
            announce(status, ok ? t('copy.statusDone', { address }) : t('copy.statusFail'));
            timer = window.setTimeout(() => {
                button.classList.remove('is-copied');
                setLabel('copy.idle');
                icon.className = 'far fa-copy';
            }, 3000);
        };

        button.hidden = false;
        button.addEventListener('click', async () => {
            let ok = false;
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(address);
                    ok = true;
                } else {
                    ok = legacyCopy();
                }
            } catch (error) {
                ok = legacyCopy();
            }
            feedback(ok);
        });
    }

    function initContactReveal() {
        const panel = document.querySelector('[data-contact-panel]');
        if (!panel) {
            return;
        }
        if (reduced() || !('IntersectionObserver' in window)) {
            panel.classList.add('is-lit');
            return;
        }
        const observer = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) {
                panel.classList.add('is-lit');
                observer.disconnect();
            }
        }, { threshold: 0.35 });
        observer.observe(panel);
    }

    initLanguage();
    const heroViewer = initHero();
    initExploreLink();
    const grid = document.querySelector('[data-grid]');
    const cards = grid ? [...grid.querySelectorAll('.project-card')] : [];
    if (grid) {
        initFilters(grid, cards);
        initCardEntrance(cards);
        initCardPointer(cards);
    }
    initProjectView(heroViewer);
    initCopyEmail();
    initContactReveal();
})();
