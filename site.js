/* dhruvindave.live: nav, reveal-once, in-view video, copy email, shipped bars */
(() => {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;

  /* nav: mark the section in view; pause the hero ambient dots when the hero is off screen */
  if (hasIO) {
    const links = new Map($$('.bar__nav a[href^="#"]').map((a) => [a.getAttribute('href').slice(1), a]));
    const navIO = new IntersectionObserver((es) => es.forEach((e) => {
      const a = links.get(e.target.id);
      if (!a) return;
      if (e.isIntersecting) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    }), { rootMargin: '-45% 0px -50% 0px' });
    links.forEach((_, id) => { const s = document.getElementById(id); if (s) navIO.observe(s); });

    const hero = document.querySelector('.hero');
    if (hero) new IntersectionObserver(([e]) => hero.classList.toggle('is-off', !e.isIntersecting)).observe(hero);
  }

  /* reveal once: content stays visible unless this script runs and arms it */
  const items = $$('[data-reveal]');
  if (hasIO && !reduce && items.length) {
    root.classList.add('rv');
    const vh = () => window.innerHeight || 800;
    const rio = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      if (e.intersectionRatio >= 0.2 || e.intersectionRect.height >= vh() * 0.2) {
        e.target.classList.add('is-in');
        rio.unobserve(e.target);
      }
    }), { threshold: [0, 0.05, 0.1, 0.15, 0.2] });
    items.forEach((el) => rio.observe(el));
  } else {
    items.forEach((el) => el.classList.add('is-in'));
  }

  /* shipped: the ~10 s bar shrinks from full width to 14% once, when it comes into view */
  const bars = document.querySelector('[data-bars]');
  if (bars && hasIO && !reduce) {
    const bio = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { bars.classList.add('is-run'); bio.disconnect(); }
    }, { threshold: 0.6 });
    bio.observe(bars);
  }

  /* MusicAI recording plays muted only while it is on screen */
  const vids = $$('video[data-inview]');
  if (vids.length && hasIO && !reduce) {
    const vio = new IntersectionObserver((es) => es.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting) {
        if (v.preload !== 'auto') v.preload = 'auto';
        v.muted = true;
        const p = v.play();
        if (p && p.catch) p.catch(() => {});
      } else if (!v.paused) v.pause();
    }), { threshold: 0.35 });
    vids.forEach((v) => vio.observe(v));
    document.addEventListener('visibilitychange', () => { if (document.hidden) vids.forEach((v) => v.pause()); });
  }

  /* copy email */
  const fallbackCopy = (text) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
    ta.remove();
    return ok;
  };
  $$('[data-copy]').forEach((btn) => {
    const status = btn.parentElement.querySelector('[data-copy-status]');
    let t;
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      let ok = false;
      try {
        if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); ok = true; }
      } catch (_) { ok = false; }
      if (!ok) ok = fallbackCopy(text);
      if (!ok) return;
      btn.classList.add('is-done');
      if (status) status.textContent = 'Email address copied';
      clearTimeout(t);
      t = setTimeout(() => { btn.classList.remove('is-done'); if (status) status.textContent = ''; }, 1600);
    });
  });
})();
