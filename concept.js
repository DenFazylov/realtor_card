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

        let raf = 0;
        const render = () => {
            const rect = hero.getBoundingClientRect();
            const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)));
            image.style.transform = `translate3d(0, ${progress * 7}%, 0) scale(${1.04 + progress * .035})`;
            raf = 0;
        };
        const requestRender = () => {
            if (!raf) raf = requestAnimationFrame(render);
        };

        window.addEventListener('scroll', requestRender, { passive: true });
        window.addEventListener('resize', requestRender, { passive: true });
        render();
    }

    function initScrollDrivenTitles() {
        if (reducedMotion) return;

        const clamp = value => Math.max(0, Math.min(1, value));
        const smoothstep = value => value * value * (3 - 2 * value);

        const configs = [
            { element: document.querySelector('.hero-name'), anchor: document.querySelector('.concept-hero'), direction: -1, hero: true },
            { element: document.querySelector('.about-headline > span:first-child'), anchor: document.querySelector('.about-headline'), direction: -1 },
            { element: document.querySelector('.about-headline > span:last-child'), anchor: document.querySelector('.about-headline'), direction: 1 },
            { element: document.querySelector('.intro-video-copy h2'), anchor: document.querySelector('.intro-video-block'), direction: -1 },
            { element: document.querySelector('#offers .section-heading-concept h2'), anchor: document.querySelector('#offers'), direction: -1 },
            { element: document.querySelector('#reviews .section-heading-concept h2'), anchor: document.querySelector('#reviews'), direction: 1 },
            { element: document.querySelector('.quote-band p'), anchor: document.querySelector('.quote-band'), direction: -1 }
        ].filter(item => item.element && item.anchor);

        if (!configs.length) return;

        configs.forEach(item => {
            item.element.style.willChange = 'transform';
            item.element.style.transition = 'none';
        });

        let raf = 0;

        const render = () => {
            const scrollY = window.scrollY;
            const vh = Math.max(1, window.innerHeight);
            const vw = Math.max(1, window.innerWidth);

            configs.forEach(item => {
                if (item.anchor.hidden || item.anchor.offsetParent === null) return;

                let progress;
                if (item.hero) {
                    progress = clamp(scrollY / (vh * 0.82));
                } else {
                    const anchorRect = item.anchor.getBoundingClientRect();
                    const anchorTop = anchorRect.top + scrollY;
                    const start = anchorTop - vh * 0.72;
                    const end = anchorTop + Math.min(anchorRect.height * 0.32, vh * 0.34);
                    progress = clamp((scrollY - start) / Math.max(1, end - start));
                }

                const eased = smoothstep(progress);
                const width = item.element.getBoundingClientRect().width;
                const distance = (vw + width + 70) * eased * item.direction;

                item.element.style.transform = item.hero
                    ? `translate3d(${distance}px, -48%, 0)`
                    : `translate3d(${distance}px, 0, 0)`;
            });

            raf = 0;
        };

        const requestRender = () => {
            if (!raf) raf = requestAnimationFrame(render);
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