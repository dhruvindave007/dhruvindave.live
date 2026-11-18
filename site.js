(() => {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* entrances: CSS scroll timelines where supported, IntersectionObserver otherwise */
  const scrollDriven = window.CSS && CSS.supports('animation-timeline: view()');
  if (!scrollDriven && !reduce && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('io');
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    $$('main > section:not(.intro) > *, .timeline li').forEach((el) => io.observe(el));
  }

  /* the MusicAI recording plays only while it is on screen */
  const vids = $$('video[data-autoplay]');
  if (!reduce && 'IntersectionObserver' in window) {
    const vo = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.preload = 'auto'; e.target.play().catch(() => {}); } else e.target.pause();
    }), { threshold: 0.35 });
    vids.forEach((v) => vo.observe(v));
  }

  /* be the model: cite lines, score them live against the gold evidence */
  const log = document.querySelector('[data-log]');
  if (!log) return;
  const verdict = document.querySelector('[data-verdict]');
  const count = document.querySelector('[data-count]');
  const initial = verdict.textContent;
  const gold = $$('li[data-k="g"]', log).length;
  const f2 = (x) => x.toFixed(2);

  const picked = () => $$('li', log).filter((li) => li.querySelector('button').getAttribute('aria-pressed') === 'true');
  const scores = () => {
    const p = picked();
    const hit = p.filter((li) => li.dataset.k === 'g').length;
    const prec = p.length ? hit / p.length : 0;
    const rec = hit / gold;
    const f1 = prec + rec ? (2 * prec * rec) / (prec + rec) : 0;
    return { p, hit, prec, rec, f1, dec: p.filter((li) => li.dataset.k === 'd').length };
  };
  const show = (on) => {
    const s = scores();
    count.textContent = `${s.p.length} cited`;
    for (const [k, v] of [['p', s.prec], ['r', s.rec], ['f', s.f1]]) {
      document.querySelector(`[data-m="${k}"]`).textContent = on ? f2(v) : '–';
      document.querySelector(`[data-bar="${k}"]`).style.setProperty('--v', on ? v : 0);
    }
    return s;
  };

  log.addEventListener('click', (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    if (log.classList.contains('is-checked')) check(); else show(false);
  });
  const check = () => {
    log.classList.add('is-checked');
    const s = show(true);
    verdict.textContent = s.f1 === 1
      ? 'Perfect. The full disk and the crash it caused, both on web-11, and nothing else. Keyword search scored 0.50.'
      : !s.p.length
        ? 'Nothing cited. The answer is web-11: L0513 shows its disk full, L0515 the crash.'
        : `The answer is web-11: L0513 is the full disk, L0515 the crash.${s.dec ? ` ${s.dec} of your lines ${s.dec === 1 ? 'is a decoy' : 'are decoys'}.` : ''} Keyword search scored 0.50.`;
  };
  document.querySelector('[data-check]').addEventListener('click', check);
  document.querySelector('[data-reset]').addEventListener('click', () => {
    $$('button[aria-pressed]', log).forEach((b) => b.setAttribute('aria-pressed', 'false'));
    log.classList.remove('is-checked');
    verdict.textContent = initial;
    show(false);
  });
})();
