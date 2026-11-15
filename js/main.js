(function () {
    const L = window.PortfolioLogic;
    if (!L) {
        return;
    }

    const EASE = 'cubic-bezier(0.2, 0.7, 0.2, 1)';
    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = () => reduceQuery.matches;
    const isFineMouse = event => event.pointerType === 'mouse' && finePointerQuery.matches && !reduced();

    const announce = (region, message) => {
        region.textContent = '';
        window.requestAnimationFrame(() => {
            region.textContent = message;
        });
    };

    function initHeroParallax() {
        const hero = document.querySelector('[data-hero]');
        if (!hero) {
            return;
        }
        let frame = 0;
        let ratio = { x: 0, y: 0 };

        const render = () => {
            frame = 0;
            const set = (name, depthX, depthY) => {
                hero.style.setProperty(`--${name}-x`, `${L.layerOffset(ratio, depthX).x}px`);
                hero.style.setProperty(`--${name}-y`, `${L.layerOffset(ratio, depthY).y}px`);
            };
            set('portrait', 5, 4);
            set('shadow', 12, 10);
            set('light', -36, -24);
            set('glare', 150, 18);
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
            if (window.location.hash !== '#projects') {
                window.history.pushState(null, '', '#projects');
            }
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
            buttons.forEach(button => {
                button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
            });

            const visible = cards.filter(card => !card.hidden);
            announce(status, L.filterStatus(visible.length, label));

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
                        card.animate(
                            [{ transform: `translate(${delta.x}px, ${delta.y}px)` }, { transform: 'translate(0, 0)' }],
                            { duration: 260, easing: EASE, composite: 'add' },
                        );
                    }
                } else {
                    card.animate(
                        [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }],
                        { duration: 240, easing: EASE, composite: 'add' },
                    );
                }
            });
        };

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                if (button.getAttribute('aria-pressed') === 'true') {
                    return;
                }
                apply(button.dataset.filter, button.textContent.trim());
            });
        });
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
                card.animate(
                    [{ opacity: 0, transform: 'translateY(26px)' }, { opacity: 1, transform: 'translateY(0)' }],
                    { ...timing, duration: 480 },
                );
                const media = card.querySelector('.card-media img');
                if (media) {
                    media.animate(
                        [{ transform: 'translateY(16px)' }, { transform: 'translateY(0)' }],
                        { ...timing, duration: 640 },
                    );
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

    function initPreview() {
        const dialog = document.querySelector('[data-preview-dialog]');
        if (!dialog || typeof dialog.showModal !== 'function') {
            return;
        }
        const title = dialog.querySelector('[data-preview-title]');
        const stage = dialog.querySelector('[data-preview-stage]');
        const image = dialog.querySelector('[data-preview-img]');
        const caption = dialog.querySelector('[data-preview-caption]');
        const thumbs = dialog.querySelector('[data-preview-thumbs]');
        const zoom = dialog.querySelector('[data-preview-zoom]');
        const zoomLabel = dialog.querySelector('[data-preview-zoom-label]');
        const zoomIcon = zoom.querySelector('i');
        const links = dialog.querySelector('[data-preview-links]');
        const closeButton = dialog.querySelector('[data-preview-close]');
        const root = document.documentElement;
        const state = { card: null, opener: null, images: [], index: 0, zoomable: false, scrollY: 0, closing: false };

        const canMorph = () => !reduced() && typeof document.startViewTransition === 'function';
        const cardImage = () => state.card.querySelector('.card-media img');

        const setZoom = on => {
            const active = on && state.zoomable;
            stage.classList.toggle('is-zoomed', active);
            zoomLabel.textContent = active ? 'Zoom out' : 'Zoom in';
            zoomIcon.className = active ? 'fas fa-magnifying-glass-minus' : 'fas fa-magnifying-glass-plus';
            if (active) {
                stage.tabIndex = 0;
                stage.setAttribute('role', 'region');
                stage.setAttribute('aria-label', 'Zoomed image, scroll to pan');
                stage.scrollTop = 0;
                stage.scrollLeft = (stage.scrollWidth - stage.clientWidth) / 2;
            } else {
                stage.removeAttribute('tabindex');
                stage.removeAttribute('role');
                stage.removeAttribute('aria-label');
            }
        };

        const showImage = index => {
            state.index = index;
            const item = state.images[index];
            image.src = item.src;
            image.alt = item.alt;
            caption.textContent = item.caption;
            caption.hidden = !item.caption;
            [...thumbs.children].forEach((thumb, i) => thumb.setAttribute('aria-pressed', String(i === index)));
            setZoom(false);
        };

        const render = card => {
            const media = card.querySelector('.card-media img');
            const gallery = L.parseGallery(card.dataset.gallery);
            state.images = gallery.length
                ? gallery.map(item => ({ ...item, alt: item.caption }))
                : [{ src: media.getAttribute('src'), caption: '', alt: media.alt }];
            state.zoomable = card.hasAttribute('data-zoomable');

            title.textContent = card.querySelector('.card-title').textContent.trim();
            zoom.hidden = !state.zoomable;
            dialog.classList.toggle('preview--zoomable', state.zoomable);
            dialog.classList.toggle('preview--logo', card.querySelector('.card-media--logo') !== null);

            thumbs.replaceChildren(...(state.images.length > 1 ? state.images.map((item, i) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'preview__thumb';
                const thumb = document.createElement('img');
                thumb.src = item.src;
                thumb.alt = '';
                const label = document.createElement('span');
                label.className = 'sr-only';
                label.textContent = item.caption;
                button.append(thumb, label);
                button.addEventListener('click', () => showImage(i));
                return button;
            }) : []));
            thumbs.hidden = state.images.length < 2;

            const primary = card.querySelector('.card-primary');
            const code = card.querySelector('[data-code]');
            const items = L.previewLinks({
                primaryHref: primary.href,
                primaryLabel: card.dataset.primaryLabel || 'Open project',
                codeHref: code ? code.href : '',
            });
            links.replaceChildren(...items.map(item => {
                const a = document.createElement('a');
                a.className = 'btn-glass';
                a.href = item.href;
                if (!item.href.startsWith('mailto:')) {
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                }
                const icon = document.createElement('i');
                icon.setAttribute('aria-hidden', 'true');
                icon.className = item.label === 'Code' || item.href.includes('github.com') ? 'fab fa-github' : 'fas fa-arrow-up-right-from-square';
                a.append(icon, document.createTextNode(` ${item.label}`));
                return a;
            }));

            showImage(0);
        };

        const open = async (card, opener) => {
            if (dialog.open) {
                return;
            }
            state.card = card;
            state.opener = opener;
            state.scrollY = window.scrollY;
            render(card);
            try {
                await image.decode();
            } catch (error) {
            }
            root.classList.add('preview-open');

            if (canMorph()) {
                const source = cardImage();
                source.style.viewTransitionName = 'preview-media';
                const transition = document.startViewTransition(() => {
                    source.style.viewTransitionName = '';
                    image.style.viewTransitionName = 'preview-media';
                    dialog.showModal();
                    closeButton.focus();
                });
                try {
                    await transition.finished;
                } catch (error) {
                }
                image.style.viewTransitionName = '';
            } else {
                dialog.classList.toggle('preview--fade', !reduced());
                dialog.showModal();
                closeButton.focus();
            }
        };

        const close = async () => {
            if (!dialog.open || state.closing) {
                return;
            }
            state.closing = true;
            const target = cardImage();
            const canReturn = canMorph() && target && !state.card.hidden && !stage.classList.contains('is-zoomed');
            if (canReturn) {
                image.style.viewTransitionName = 'preview-media';
                const transition = document.startViewTransition(() => {
                    image.style.viewTransitionName = '';
                    dialog.close();
                    target.style.viewTransitionName = 'preview-media';
                });
                try {
                    await transition.finished;
                } catch (error) {
                }
                target.style.viewTransitionName = '';
            } else {
                dialog.close();
            }
            state.closing = false;
        };

        dialog.addEventListener('close', () => {
            root.classList.remove('preview-open');
            setZoom(false);
            if (Math.abs(window.scrollY - state.scrollY) > 1) {
                window.scrollTo({ top: state.scrollY, behavior: 'instant' });
            }
            if (state.opener) {
                state.opener.focus({ preventScroll: true });
            }
        });

        dialog.addEventListener('cancel', event => {
            event.preventDefault();
            close();
        });

        dialog.addEventListener('click', event => {
            if (event.target === dialog) {
                close();
            }
        });

        closeButton.addEventListener('click', close);
        zoom.addEventListener('click', () => setZoom(!stage.classList.contains('is-zoomed')));
        image.addEventListener('click', () => {
            if (state.zoomable) {
                setZoom(!stage.classList.contains('is-zoomed'));
            }
        });

        document.querySelectorAll('[data-preview]').forEach(button => {
            button.hidden = false;
            button.addEventListener('click', () => open(button.closest('.project-card'), button));
        });
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

        const feedback = (ok) => {
            window.clearTimeout(timer);
            button.classList.toggle('is-copied', ok);
            label.textContent = ok ? 'Email address copied' : 'Copy failed, use the Email link';
            icon.className = ok ? 'fas fa-check' : 'fas fa-triangle-exclamation';
            announce(status, ok ? `Email address ${address} copied to clipboard` : 'Copying failed. Use the Email link instead.');
            timer = window.setTimeout(() => {
                button.classList.remove('is-copied');
                label.textContent = 'Copy email address';
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

    const grid = document.querySelector('[data-grid]');
    const cards = grid ? [...grid.querySelectorAll('.project-card')] : [];

    initHeroParallax();
    initExploreLink();
    if (grid) {
        initFilters(grid, cards);
        initCardEntrance(cards);
        initCardPointer(cards);
    }
    initPreview();
    initCopyEmail();
    initContactReveal();
})();
