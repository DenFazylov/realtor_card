/* Shared page behavior and lightweight snap-carousel controls. */

document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.section:not([hidden])');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('show');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        sections.forEach(section => observer.observe(section));
    } else {
        sections.forEach(section => section.classList.add('show'));
    }

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function (event) {
            const href = this.getAttribute('href');
            if (!href || href === '#') return;

            const target = document.querySelector(href);
            if (!target) return;

            event.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    const heroBg = document.querySelector('.hero-bg');
    if (heroBg) {
        let ticking = false;
        const updateHero = () => {
            heroBg.style.transform = `translateY(${window.scrollY * 0.18}px) scale(1.08)`;
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateHero);
                ticking = true;
            }
        }, { passive: true });
    }

    const video = document.querySelector('video');
    if (video) {
        video.setAttribute('playsinline', '');
        video.setAttribute('controlsList', 'nodownload');
    }
});

window.initSnapCarousel = function initSnapCarousel({ track, dots, prev, next }) {
    if (!track) return null;

    const cards = Array.from(track.children);
    if (!cards.length) return null;

    let currentIndex = 0;
    let rafId = null;

    const getCardLeft = index => cards[index].offsetLeft - cards[0].offsetLeft;

    const nearestIndex = () => {
        let bestIndex = 0;
        let bestDistance = Infinity;

        cards.forEach((_, index) => {
            const distance = Math.abs(getCardLeft(index) - track.scrollLeft);
            if (distance < bestDistance) {
                bestDistance = distance;
                bestIndex = index;
            }
        });

        return bestIndex;
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

        if (prev) prev.disabled = currentIndex === 0;
        if (next) next.disabled = currentIndex === cards.length - 1;
    };

    const scrollToIndex = index => {
        const safeIndex = Math.max(0, Math.min(index, cards.length - 1));
        track.scrollTo({ left: getCardLeft(safeIndex), behavior: 'smooth' });
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

    track.addEventListener('scroll', () => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => updateUi(nearestIndex()));
    }, { passive: true });

    if (prev) prev.addEventListener('click', () => scrollToIndex(currentIndex - 1));
    if (next) next.addEventListener('click', () => scrollToIndex(currentIndex + 1));

    window.addEventListener('resize', () => {
        requestAnimationFrame(() => updateUi(nearestIndex()));
    }, { passive: true });

    updateUi(0);
    return { scrollToIndex, update: () => updateUi(nearestIndex()) };
};