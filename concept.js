(() => {
    'use strict';

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const polishStyles = document.createElement('link');
    polishStyles.rel = 'stylesheet';
    polishStyles.href = 'concept-polish.css?v=3';
    document.head.appendChild(polishStyles);

    function initMenu() {
        const button = document.getElementById('menu-toggle');
        const panel = document.getElementById('menu-panel');
        if (!button || !panel) return;

        const label = button.querySelector('.menu-toggle-label');

        const setOpen = open => {
            document.body.classList.toggle('menu-open', open);
            button.setAttribute('aria-expanded', String(open));
            panel.setAttribute('aria-hidden', String(!open));
            button.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
            if (label) label.textContent = open ? 'Закрыть' : 'Меню';
        };

        button.addEventListener('click', () => setOpen(!document.body.classList.contains('menu-open')));
        panel.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && document.body.classList.contains('menu-open')) {
                setOpen(false);
                button.focus();
            }
        });
    }

    function initAnchorScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', event => {
                const href = link.getAttribute('href');
                if (!href || href === '#') return;
                const target = document.querySelector(href);
                if (!target) return;
                event.preventDefault();
                target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
            });
        });
    }

    function initReveal() {
        const items = document.querySelectorAll('.reveal');
        if (!items.length) return;

        if (reducedMotion || !('IntersectionObserver' in window)) {
            items.forEach(item => item.classList.add('is-visible'));
            return;
        }

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

        items.forEach(item => observer.observe(item));
    }

    function initHeroParallax() {
        if (reducedMotion) return;
        const image = document.querySelector('.hero-image');
        const hero = document.querySelector('.concept-hero');
        if (!image || !hero) return;

        let scheduled = false;
        const render = () => {
            const rect = hero.getBoundingClientRect();
            const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)));
            image.style.transform = `translate3d(0, ${progress * 7}%, 0) scale(${1.04 + progress * .035})`;
            scheduled = false;
        };

        window.addEventListener('scroll', () => {
            if (scheduled) return;
            scheduled = true;
            requestAnimationFrame(render);
        }, { passive: true });
        render();
    }

    /* Deliberately strong, visible scroll-linked horizontal motion. */
    function initScrollDrivenTitles() {
        const clamp = value => Math.max(0, Math.min(1, value));
        const targets = [];
        const add = (element, direction, distanceVW = 135) => {
            if (!element) return;
            element.style.willChange = 'transform';
            targets.push({ element, direction, distanceVW });
        };

        const heroName = document.querySelector('.hero-name');
        add(heroName, -1, 145);

        const aboutLines = document.querySelectorAll('.about-headline > span');
        add(aboutLines[0], -1, 130);
        add(aboutLines[1], 1, 130);

        add(document.querySelector('.intro-video-copy h2'), -1, 130);
        add(document.querySelector('#offers .section-heading-concept h2'), -1, 140);
        add(document.querySelector('#reviews .section-heading-concept h2'), 1, 140);
        add(document.querySelector('.quote-band p'), -1, 115);

        if (!targets.length) return;

        let raf = 0;
        const render = () => {
            const vh = window.innerHeight || 1;
            const vw = window.innerWidth || 1;

            targets.forEach(target => {
                let progress = 0;

                if (target.element === heroName) {
                    /* On the first screen the name starts moving immediately. */
                    progress = clamp(window.scrollY / (vh * 0.62));
                } else {
                    /*
                     * Start while the heading is still low in the viewport (88% height)
                     * and finish while it is still visibly on screen (24% height).
                     * This makes the sideways departure impossible to miss.
                     */
                    const rect = target.element.getBoundingClientRect();
                    const startY = vh * 0.88;
                    const endY = vh * 0.24;
                    progress = clamp((startY - rect.top) / Math.max(1, startY - endY));
                }

                /* Smooth but aggressive travel: over one full viewport width. */
                const eased = 1 - Math.pow(1 - progress, 2.2);
                const x = eased * vw * (target.distanceVW / 100) * target.direction;

                if (target.element === heroName) {
                    target.element.style.transform = `translate3d(${x}px, -48%, 0)`;
                } else {
                    target.element.style.transform = `translate3d(${x}px, 0, 0)`;
                }
            });

            raf = 0;
        };

        const requestRender = () => {
            if (raf) return;
            raf = requestAnimationFrame(render);
        };

        window.addEventListener('scroll', requestRender, { passive: true });
        window.addEventListener('resize', requestRender, { passive: true });
        render();
    }

    function initVideo() {
        const video = document.querySelector('.intro-video-shell video');
        if (!video) return;
        video.setAttribute('playsinline', '');
        video.setAttribute('controlsList', 'nodownload');
    }

    document.addEventListener('DOMContentLoaded', () => {
        initMenu();
        initAnchorScroll();
        initReveal();
        initHeroParallax();
        initScrollDrivenTitles();
        initVideo();
    });

    window.initSnapCarousel = function initSnapCarousel({ track, dots, prev, next }) {
        if (!track) return null;
        const cards = Array.from(track.children);
        if (!cards.length) return null;

        let currentIndex = 0;
        let scrollRaf = null;
        let scrollable = false;
        const cardLeft = index => cards[index].offsetLeft - cards[0].offsetLeft;

        const syncLayout = () => {
            track.style.paddingRight = '2px';
            const last = cards[cards.length - 1];
            const naturalWidth = cardLeft(cards.length - 1) + last.offsetWidth;
            scrollable = naturalWidth > track.clientWidth + 3;
            if (scrollable) {
                const endSpace = Math.max(track.clientWidth - last.offsetWidth, 2);
                track.style.paddingRight = `${endSpace}px`;
            }
            if (prev) prev.hidden = !scrollable;
            if (next) next.hidden = !scrollable;
        };

        const nearestIndex = () => {
            let index = 0;
            let best = Infinity;
            cards.forEach((card, cardIndex) => {
                const distance = Math.abs(cardLeft(cardIndex) - track.scrollLeft);
                if (distance < best) {
                    best = distance;
                    index = cardIndex;
                }
            });
            return index;
        };

        const updateUi = index => {
            currentIndex = Math.max(0, Math.min(index, cards.length - 1));
            if (dots) {
                dots.querySelectorAll('.carousel-dot').forEach((dot, dotIndex) => {
                    const active = dotIndex === currentIndex;
                    dot.classList.toggle('is-active', active);
                    dot.setAttribute('aria-current', active ? 'true' : 'false');
                });
            }
            if (prev) prev.disabled = !scrollable || currentIndex === 0;
            if (next) next.disabled = !scrollable || currentIndex === cards.length - 1;
        };

        const scrollToIndex = index => {
            const safeIndex = Math.max(0, Math.min(index, cards.length - 1));
            track.scrollTo({ left: cardLeft(safeIndex), behavior: reducedMotion ? 'auto' : 'smooth' });
            updateUi(safeIndex);
        };

        if (dots) {
            dots.replaceChildren();
            cards.forEach((_, index) => {
                const dot = document.createElement('button');
                dot.className = 'carousel-dot';
                dot.type = 'button';
                dot.setAttribute('aria-label', `Перейти к карточке ${index + 1}`);
                dot.addEventListener('click', () => scrollToIndex(index));
                dots.appendChild(dot);
            });
        }

        syncLayout();
        updateUi(0);
        track.addEventListener('scroll', () => {
            if (scrollRaf) cancelAnimationFrame(scrollRaf);
            scrollRaf = requestAnimationFrame(() => updateUi(nearestIndex()));
        }, { passive: true });
        prev?.addEventListener('click', () => scrollToIndex(currentIndex - 1));
        next?.addEventListener('click', () => scrollToIndex(currentIndex + 1));
        window.addEventListener('resize', () => {
            requestAnimationFrame(() => {
                syncLayout();
                updateUi(nearestIndex());
            });
        }, { passive: true });

        return { scrollToIndex, update: () => updateUi(nearestIndex()) };
    };
})();