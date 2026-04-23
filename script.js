/* ============================================
   DHRUVIN DAVE PORTFOLIO — JavaScript
   ============================================ */

(function () {
    'use strict';

    // ==========================================
    // PARTICLE SYSTEM
    // ==========================================
    class ParticleSystem {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.particles = [];
            this.mouseX = 0;
            this.mouseY = 0;
            this.resize();
            this.init();
            window.addEventListener('resize', () => this.resize());
            document.addEventListener('mousemove', (e) => {
                this.mouseX = e.clientX;
                this.mouseY = e.clientY;
            });
        }

        resize() {
            this.width = this.canvas.width = window.innerWidth;
            this.height = this.canvas.height = window.innerHeight;
        }

        init() {
            const count = Math.min(60, Math.floor((this.width * this.height) / 25000));
            this.particles = [];
            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3,
                    radius: Math.random() * 1.5 + 0.5,
                    opacity: Math.random() * 0.3 + 0.1,
                });
            }
        }

        update() {
            this.particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = this.width;
                if (p.x > this.width) p.x = 0;
                if (p.y < 0) p.y = this.height;
                if (p.y > this.height) p.y = 0;
            });
        }

        draw() {
            this.ctx.clearRect(0, 0, this.width, this.height);

            // Draw connections
            for (let i = 0; i < this.particles.length; i++) {
                for (let j = i + 1; j < this.particles.length; j++) {
                    const dx = this.particles[i].x - this.particles[j].x;
                    const dy = this.particles[i].y - this.particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 150) {
                        const opacity = (1 - dist / 150) * 0.08;
                        this.ctx.beginPath();
                        this.ctx.strokeStyle = `rgba(108, 92, 231, ${opacity})`;
                        this.ctx.lineWidth = 0.5;
                        this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                        this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                        this.ctx.stroke();
                    }
                }
            }

            // Draw particles
            this.particles.forEach((p) => {
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(162, 155, 254, ${p.opacity})`;
                this.ctx.fill();
            });
        }

        animate() {
            this.update();
            this.draw();
            requestAnimationFrame(() => this.animate());
        }
    }

    // ==========================================
    // TYPING EFFECT
    // ==========================================
    class TypingEffect {
        constructor(element, phrases, options = {}) {
            this.element = element;
            this.phrases = phrases;
            this.typeSpeed = options.typeSpeed || 80;
            this.deleteSpeed = options.deleteSpeed || 40;
            this.pauseTime = options.pauseTime || 2000;
            this.currentPhrase = 0;
            this.currentChar = 0;
            this.isDeleting = false;
            this.type();
        }

        type() {
            const phrase = this.phrases[this.currentPhrase];

            if (this.isDeleting) {
                this.currentChar--;
                this.element.textContent = phrase.substring(0, this.currentChar);
            } else {
                this.currentChar++;
                this.element.textContent = phrase.substring(0, this.currentChar);
            }

            let delay = this.isDeleting ? this.deleteSpeed : this.typeSpeed;

            if (!this.isDeleting && this.currentChar === phrase.length) {
                delay = this.pauseTime;
                this.isDeleting = true;
            } else if (this.isDeleting && this.currentChar === 0) {
                this.isDeleting = false;
                this.currentPhrase = (this.currentPhrase + 1) % this.phrases.length;
                delay = 400;
            }

            setTimeout(() => this.type(), delay);
        }
    }

    // ==========================================
    // COUNTER ANIMATION
    // ==========================================
    function animateCounters() {
        const counters = document.querySelectorAll('[data-count]');
        counters.forEach((counter) => {
            const target = parseInt(counter.dataset.count);
            const duration = 2000;
            const start = performance.now();
            const startVal = 0;

            function update(now) {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                counter.textContent = Math.round(startVal + (target - startVal) * eased);

                if (progress < 1) {
                    requestAnimationFrame(update);
                }
            }

            requestAnimationFrame(update);
        });
    }

    // ==========================================
    // SCROLL ANIMATIONS (Intersection Observer)
    // ==========================================
    function initScrollAnimations() {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const delay = parseInt(entry.target.dataset.delay) || 0;
                        setTimeout(() => {
                            entry.target.classList.add('animate-in');
                        }, delay);
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px',
            }
        );

        document.querySelectorAll('[data-animate]').forEach((el) => {
            observer.observe(el);
        });
    }

    // ==========================================
    // NAVIGATION
    // ==========================================
    function initNavigation() {
        const nav = document.getElementById('mainNav');
        const toggle = document.getElementById('navToggle');
        const links = document.getElementById('navLinks');
        let lastScroll = 0;

        // Scroll effect
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;

            if (scrollY > 50) {
                nav.classList.add('nav--scrolled');
            } else {
                nav.classList.remove('nav--scrolled');
            }

            lastScroll = scrollY;

            // Update active nav link
            updateActiveLink();
        });

        // Mobile toggle
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('nav__toggle--active');
            links.classList.toggle('nav__links--open');
        });

        // Close on link click
        links.querySelectorAll('.nav__link:not(.nav__link--github)').forEach((link) => {
            link.addEventListener('click', () => {
                toggle.classList.remove('nav__toggle--active');
                links.classList.remove('nav__links--open');
            });
        });
    }

    function updateActiveLink() {
        const sections = ['about', 'skills', 'projects', 'contact'];
        const scrollPos = window.scrollY + 200;

        sections.forEach((id) => {
            const section = document.getElementById(id);
            const link = document.querySelector(`.nav__link[data-section="${id}"]`);
            if (!section || !link) return;

            if (
                section.offsetTop <= scrollPos &&
                section.offsetTop + section.offsetHeight > scrollPos
            ) {
                link.classList.add('nav__link--active');
            } else {
                link.classList.remove('nav__link--active');
            }
        });
    }

    // ==========================================
    // CURSOR GLOW
    // ==========================================
    function initCursorGlow() {
        const glow = document.getElementById('cursorGlow');
        if (!glow) return;
        
        // Only enable on desktop
        if (window.innerWidth < 768) return;

        document.addEventListener('mousemove', (e) => {
            requestAnimationFrame(() => {
                glow.style.left = e.clientX + 'px';
                glow.style.top = e.clientY + 'px';
            });
        });
    }

    // ==========================================
    // SMOOTH SCROLL
    // ==========================================
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                    });
                }
            });
        });
    }

    // ==========================================
    // INITIALIZE EVERYTHING
    // ==========================================
    document.addEventListener('DOMContentLoaded', () => {
        // Particles
        const canvas = document.getElementById('particleCanvas');
        if (canvas) {
            const ps = new ParticleSystem(canvas);
            ps.animate();
        }

        // Typing effect
        const typingElement = document.getElementById('typingText');
        if (typingElement) {
            new TypingEffect(typingElement, [
                'AI-powered applications.',
                'full-stack web apps.',
                'machine learning models.',
                'intelligent systems.',
                'civic tech platforms.',
                'data-driven solutions.',
            ]);
        }

        // Initialize
        initScrollAnimations();
        initNavigation();
        initCursorGlow();
        initSmoothScroll();

        // Animate counters when hero is visible
        const heroObserver = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    animateCounters();
                    heroObserver.disconnect();
                }
            },
            { threshold: 0.5 }
        );
        const heroStats = document.querySelector('.hero__stats');
        if (heroStats) {
            heroObserver.observe(heroStats);
        }
    });
})();
