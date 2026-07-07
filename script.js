/*
 * script.js
 *
 * Adds interactivity to the personal portfolio site:
 *  - Reveals sections when they scroll into view
 *  - Smoothly scrolls to anchor links
 *  - Implements a subtle parallax effect on the hero background
 *  - Creates a ripple effect on contact cards
 *  - Configures video playback attributes
 */

document.addEventListener('DOMContentLoaded', () => {
    // Reveal sections on scroll using Intersection Observer
    const sections = document.querySelectorAll('.section');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    sections.forEach(section => observer.observe(section));

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // Parallax effect on the hero background
    const heroBg = document.querySelector('.hero-bg');
    let ticking = false;
    function updateHero() {
        const y = window.scrollY;
        heroBg.style.transform = `translateY(${y * 0.22}px) scale(1.08)`;
        ticking = false;
    }
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateHero);
            ticking = true;
        }
    });

    // Ripple effect on clickable elements (cards and contact items' icons)
    document.querySelectorAll('.card, .contact-item a').forEach(el => {
        el.addEventListener('pointerdown', function (e) {
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            const rect = this.getBoundingClientRect();
            ripple.style.left = (e.clientX - rect.left) + 'px';
            ripple.style.top = (e.clientY - rect.top) + 'px';
            this.appendChild(ripple);
            setTimeout(() => { ripple.remove(); }, 600);
        });
    });

    // Configure the video element to prevent download controls
    const video = document.querySelector('video');
    if (video) {
        video.setAttribute('playsinline', '');
        video.setAttribute('controlsList', 'nodownload');
    }

    // Remove focus outlines after clicking links (for mobile aesthetics)
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('mouseup', () => {
            link.blur();
        });
    });
});