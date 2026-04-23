/* ==============================================
   PORTFOLIO — JavaScript
   ============================================== */
(function () {
    'use strict';

    // ------------------------------------------
    // Scroll reveal via IntersectionObserver
    // ------------------------------------------
    function initReveal() {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
        );

        document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
    }

    // ------------------------------------------
    // Navigation scroll effect
    // ------------------------------------------
    function initNav() {
        const nav = document.getElementById('mainNav');
        const toggle = document.getElementById('navToggle');
        const links = document.getElementById('navLinks');

        window.addEventListener('scroll', () => {
            nav.classList.toggle('scrolled', window.scrollY > 60);
        });

        if (toggle && links) {
            toggle.addEventListener('click', () => {
                toggle.classList.toggle('active');
                links.classList.toggle('open');
            });

            links.querySelectorAll('.nav-link').forEach((link) => {
                link.addEventListener('click', () => {
                    toggle.classList.remove('active');
                    links.classList.remove('open');
                });
            });
        }
    }

    // ------------------------------------------
    // Custom cursor
    // ------------------------------------------
    function initCursor() {
        const dot = document.getElementById('cursorDot');
        if (!dot || window.matchMedia('(pointer: coarse)').matches) return;

        let mx = 0, my = 0;

        document.addEventListener('mousemove', (e) => {
            mx = e.clientX;
            my = e.clientY;
        });

        function render() {
            dot.style.left = mx + 'px';
            dot.style.top = my + 'px';
            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);

        // Hover states
        const hoverTargets = document.querySelectorAll('a, button, .project');
        hoverTargets.forEach((el) => {
            el.addEventListener('mouseenter', () => dot.classList.add('hovering'));
            el.addEventListener('mouseleave', () => dot.classList.remove('hovering'));
        });
    }

    // ------------------------------------------
    // Smooth anchor scrolling
    // ------------------------------------------
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
            anchor.addEventListener('click', (e) => {
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    // ------------------------------------------
    // Init
    // ------------------------------------------
    document.addEventListener('DOMContentLoaded', () => {
        initReveal();
        initNav();
        initCursor();
        initSmoothScroll();
    });
})();
