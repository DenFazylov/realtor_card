(() => {
    'use strict';

    const section = document.getElementById('reviews');
    const track = document.getElementById('reviews-track');
    const dots = document.getElementById('reviews-dots');
    const prev = document.getElementById('reviews-prev');
    const next = document.getElementById('reviews-next');
    const lightbox = document.getElementById('review-lightbox');
    const lightboxImage = document.getElementById('review-lightbox-image');
    const lightboxClose = document.getElementById('review-lightbox-close');

    if (!section || !track) return;

    const MAX_REVIEWS = 30;
    const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

    function probeImage(url) {
        return new Promise(resolve => {
            const image = new Image();
            image.onload = () => resolve(url);
            image.onerror = () => resolve(null);
            image.src = `${url}?check=${Date.now()}`;
        });
    }

    async function findReviewImage(index) {
        for (const extension of EXTENSIONS) {
            const url = `assets/reviews/review-${index}.${extension}`;
            const result = await probeImage(url);
            if (result) return result;
        }
        return null;
    }

    async function discoverReviews() {
        const urls = [];

        for (let index = 1; index <= MAX_REVIEWS; index++) {
            const url = await findReviewImage(index);
            if (!url) break;
            urls.push(url);
        }

        return urls;
    }

    function openLightbox(url, index) {
        if (!lightbox || !lightboxImage) return;
        lightboxImage.src = url;
        lightboxImage.alt = `Отзыв клиента ${index + 1}`;
        lightbox.hidden = false;
        document.body.classList.add('lightbox-open');
        lightboxClose?.focus();
    }

    function closeLightbox() {
        if (!lightbox || !lightboxImage) return;
        lightbox.hidden = true;
        lightboxImage.src = '';
        document.body.classList.remove('lightbox-open');
    }

    function createReviewCard(url, index) {
        const button = document.createElement('button');
        button.className = 'review-card';
        button.type = 'button';
        button.setAttribute('aria-label', `Открыть отзыв ${index + 1}`);

        const image = document.createElement('img');
        image.src = url;
        image.alt = `Отзыв клиента ${index + 1}`;
        image.loading = 'lazy';
        image.decoding = 'async';

        button.appendChild(image);
        button.addEventListener('click', () => openLightbox(url, index));
        return button;
    }

    lightboxClose?.addEventListener('click', closeLightbox);

    lightbox?.addEventListener('click', event => {
        if (event.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && lightbox && !lightbox.hidden) {
            closeLightbox();
        }
    });

    async function initReviews() {
        const reviews = await discoverReviews();
        if (!reviews.length) return;

        const fragment = document.createDocumentFragment();
        reviews.forEach((url, index) => fragment.appendChild(createReviewCard(url, index)));
        track.replaceChildren(fragment);

        section.hidden = false;
        section.classList.add('show');

        if (typeof window.initSnapCarousel === 'function') {
            window.initSnapCarousel({ track, dots, prev, next });
        }
    }

    initReviews();
})();