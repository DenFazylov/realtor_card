(() => {
    'use strict';

    const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQapGesjuEieyilywgpOSdv9kKVBLjIn_Ebzemsp8MTE9vBjIB5ML2L20xzyEamM_eY4KLlI1ltpkqP/pub?gid=0&single=true&output=csv';

    const section = document.getElementById('offers');
    const grid = document.getElementById('offers-grid');

    if (!section || !grid) return;

    // Small CSV parser with support for commas, quotes and line breaks inside quoted cells.
    function parseCsv(text) {
        const rows = [];
        let row = [];
        let field = '';
        let quoted = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const next = text[i + 1];

            if (quoted) {
                if (char === '"' && next === '"') {
                    field += '"';
                    i++;
                } else if (char === '"') {
                    quoted = false;
                } else {
                    field += char;
                }
                continue;
            }

            if (char === '"') {
                quoted = true;
            } else if (char === ',') {
                row.push(field);
                field = '';
            } else if (char === '\n') {
                row.push(field.replace(/\r$/, ''));
                rows.push(row);
                row = [];
                field = '';
            } else {
                field += char;
            }
        }

        if (field.length || row.length) {
            row.push(field.replace(/\r$/, ''));
            rows.push(row);
        }

        return rows;
    }

    function csvToObjects(text) {
        const rows = parseCsv(text.trim());
        if (rows.length < 2) return [];

        const headers = rows[0].map(value => value.trim().toLowerCase());

        return rows.slice(1)
            .filter(row => row.some(cell => cell.trim() !== ''))
            .map(row => {
                const item = {};
                headers.forEach((header, index) => {
                    item[header] = (row[index] || '').trim();
                });
                return item;
            });
    }

    function isActive(value) {
        return String(value).trim().toLowerCase() === 'true';
    }

    function safeHttpUrl(value) {
        if (!value) return '';
        try {
            const url = new URL(value, window.location.href);
            return (url.protocol === 'http:' || url.protocol === 'https:') ? url.href : '';
        } catch {
            return '';
        }
    }

    function makePlaceholder() {
        const placeholder = document.createElement('div');
        placeholder.className = 'offer-image-placeholder';
        placeholder.textContent = 'Фото скоро появится';
        return placeholder;
    }

    function createOfferCard(item) {
        const card = document.createElement('article');
        card.className = 'offer-card';

        const media = document.createElement('div');
        media.className = 'offer-media';

        const imageUrl = safeHttpUrl(item.image);
        if (imageUrl) {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = item.title ? `Фото: ${item.title}` : 'Фото объекта';
            img.loading = 'lazy';
            img.decoding = 'async';
            img.referrerPolicy = 'no-referrer';
            img.addEventListener('error', () => {
                media.replaceChildren(makePlaceholder());
            }, { once: true });
            media.appendChild(img);
        } else {
            media.appendChild(makePlaceholder());
        }

        const body = document.createElement('div');
        body.className = 'offer-body';

        const title = document.createElement('h3');
        title.className = 'offer-title';
        title.textContent = item.title || 'Объект недвижимости';

        const price = document.createElement('div');
        price.className = 'offer-price';
        price.textContent = item.price || 'Цена по запросу';

        body.append(title, price);

        const linkUrl = safeHttpUrl(item.link);
        if (linkUrl) {
            const button = document.createElement('a');
            button.className = 'offer-button';
            button.href = linkUrl;
            button.target = '_blank';
            button.rel = 'noopener noreferrer';
            button.textContent = 'Подробнее';
            body.appendChild(button);
        }

        card.append(media, body);
        return card;
    }

    async function loadOffers() {
        try {
            const response = await fetch(CSV_URL, { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const csv = await response.text();
            const offers = csvToObjects(csv).filter(item => isActive(item.active));

            if (!offers.length) return;

            const fragment = document.createDocumentFragment();
            offers.forEach(item => fragment.appendChild(createOfferCard(item)));
            grid.replaceChildren(fragment);
            section.hidden = false;
            section.classList.add('show');
        } catch (error) {
            // The offers block stays hidden; the rest of the site keeps working.
            console.warn('Не удалось загрузить актуальные предложения:', error);
        }
    }

    loadOffers();
})();
