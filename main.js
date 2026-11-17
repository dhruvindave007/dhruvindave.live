/* Cited: evidence panels, motion and theme. Vanilla JS, no build step. */
(function () {
  'use strict';
  window.__ran = true;

  var doc = document;
  var root = doc.documentElement;
  var RM = matchMedia('(prefers-reduced-motion: reduce)');
  var DESK = matchMedia('(min-width: 1280px)');
  var EO = [0.2, 0.7, 0.1, 1];
  var EIO = [0.6, 0, 0.2, 1];
  var CSS_EO = 'cubic-bezier(.2,.7,.1,1)';
  var CSS_IO = 'cubic-bezier(.6,0,.2,1)';

  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function reduced() { return RM.matches; }
  function done(a, fn) {
    var p = a && a.finished ? a.finished : Promise.resolve();
    p.then(fn, fn);
  }

  /* One animation helper. Motion One when it loaded, the Web Animations API otherwise. */
  function fx(el, kf, o) {
    var ease = o.ease === 'io' ? CSS_IO : CSS_EO;
    if (window.Motion && window.Motion.animate && !o.native) {
      try {
        return window.Motion.animate(el, kf, {
          duration: o.d / 1000,
          delay: (o.delay || 0) / 1000,
          easing: o.ease === 'io' ? EIO : EO
        });
      } catch (err) { /* fall through */ }
    }
    return el.animate(kf, { duration: o.d, delay: o.delay || 0, easing: ease, fill: 'both' });
  }
  function settle(el, cls) {
    if (cls) el.classList.add(cls);
    try { el.getAnimations().forEach(function (a) { a.cancel(); }); } catch (err) { /* old engine */ }
    el.style.opacity = '';
    el.style.transform = '';
  }

  /* ------------------------------------------------------------ theme */
  function syncTheme() {
    var cur = root.getAttribute('data-theme') || 'system';
    $$('[data-theme-set]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-theme-set') === cur));
    });
  }
  function setTheme(v) {
    if (v === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', v);
    try { localStorage.setItem('theme', v); } catch (err) { /* storage blocked */ }
    syncTheme();
  }
  doc.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-theme-set]');
    if (b) setTheme(b.getAttribute('data-theme-set'));
  });
  syncTheme();

  /* ------------------------------------------------------------ hero (M1, M2) */
  function intro() {
    var lines = $$('.hero .display .l > span');
    var sub = $('.hero .sub');
    var act = $('.hero__act');
    if (!lines.length) return;
    if (reduced()) {
      lines.forEach(function (s, i) {
        done(fx(s, { opacity: [0, 1] }, { d: 150, delay: i * 90 }), function () { settle(s, 'in'); });
      });
      return;
    }
    lines.forEach(function (s, i) {
      done(fx(s, { transform: ['translateY(105%)', 'translateY(0%)'] }, { d: 800, delay: i * 90 }), function () { settle(s, 'in'); });
    });
    [[sub, 250], [act, 330]].forEach(function (pair) {
      var el = pair[0];
      if (!el) return;
      done(fx(el, { opacity: [0, 1], transform: ['translateY(16px)', 'translateY(0px)'] }, { d: 500, delay: pair[1] }),
        function () { settle(el, 'in'); });
    });
  }

  /* ------------------------------------------------------------ section reveal (M9) */
  function reveals() {
    var seen = new WeakSet();
    function reveal(el, i) {
      if (seen.has(el)) return;
      seen.add(el);
      if (reduced()) { el.classList.add('in'); return; }
      done(fx(el, { opacity: [0, 1], transform: ['translateY(24px)', 'translateY(0px)'] }, { d: 600, delay: i * 70 }),
        function () { settle(el, 'in'); });
    }
    var io = new IntersectionObserver(function (entries) {
      var k = 0;
      entries.forEach(function (en) {
        var above = !en.isIntersecting && en.boundingClientRect.top < 0;
        if (!en.isIntersecting && !above) return;
        io.unobserve(en.target);
        var t = en.target;
        var items = t.hasAttribute('data-rvg') ? $$('[data-rv]', t) : [t];
        items.forEach(function (el, i) {
          if (above) { seen.add(el); el.classList.add('in'); } else reveal(el, i + k);
        });
        if (!above) k += items.length;
      });
    }, { rootMargin: '0px 0px -20% 0px', threshold: 0 });
    $$('[data-rvg]').forEach(function (g) { io.observe(g); });
    $$('[data-rv]').forEach(function (el) { if (!el.closest('[data-rvg]')) io.observe(el); });
  }

  /* ------------------------------------------------------------ cite underline (M3, signature) */
  function citeDraw() {
    if (reduced()) return;
    var ts = $$('.cite__t');
    ts.forEach(function (t) { t.classList.add('pre'); });
    var io = new IntersectionObserver(function (entries) {
      var groups = new Map();
      entries.forEach(function (en) {
        var t = en.target;
        var above = !en.isIntersecting && en.boundingClientRect.top < 0;
        if (!en.isIntersecting && !above) return;
        io.unobserve(t);
        if (above) { t.classList.remove('pre'); return; }
        var p = t.closest('p') || doc.body;
        var n = groups.get(p) || 0;
        groups.set(p, n + 1);
        var a = fx(t, { backgroundSize: ['0% 2px', '100% 2px'] }, { d: 600, delay: n * 120, ease: 'io', native: true });
        done(a, function () { t.classList.remove('pre'); try { a.cancel(); } catch (err) { /* noop */ } });
      });
    }, { threshold: 1 });
    ts.forEach(function (t) { io.observe(t); });
  }

  /* ------------------------------------------------------------ panels: motion that runs when a panel is seen */
  function countUp(el, to, delay) {
    var dec = (to.split('.')[1] || '').length;
    var end = parseFloat(to);
    var start = null;
    el.textContent = (0).toFixed(dec);
    function step(ts) {
      if (start === null) start = ts + delay;
      var t = Math.min(Math.max((ts - start) / 700, 0), 1);
      var k = 1 - Math.pow(1 - t, 3);
      el.textContent = t >= 1 ? to : (end * k).toFixed(dec);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function bars(scope) {
    if (reduced()) return;
    $$('.chart', scope).forEach(function (svg) {
      if (svg.closest('.metric') && !svg.closest('.metric').classList.contains('is-on')) return;
      $$('.bar', svg).forEach(function (r, i) {
        var a = fx(r, { transform: ['scaleX(0)', 'scaleX(1)'] }, { d: 700, delay: i * 80, native: true });
        done(a, function () { try { a.cancel(); } catch (err) { /* noop */ } });
      });
      $$('.val', svg).forEach(function (v, i) { countUp(v, v.getAttribute('data-to'), i * 80); });
    });
  }

  function arch(svg) {
    if (reduced()) return;
    var nodes = $$('.node', svg);
    var edges = $$('.edge', svg);
    nodes.forEach(function (n) {
      var s = +n.getAttribute('data-s');
      var a = fx(n, { opacity: [0, 1] }, { d: 280, delay: s * 120, native: true });
      done(a, function () { try { a.cancel(); } catch (err) { /* noop */ } });
    });
    edges.forEach(function (ed) {
      var s = +ed.getAttribute('data-s');
      var a = fx(ed, { strokeDashoffset: [1, 0] }, { d: 240, delay: s * 120 + 110, ease: 'io', native: true });
      done(a, function () { try { a.cancel(); } catch (err) { /* noop */ } });
    });
  }

  function ladder(p, svg) {
    var dot = $('.dot', svg);
    var notes = $$('.note', svg);   /* L4 note first, then L3 */
    var top = -248;
    if (reduced()) { dot.style.transform = 'translateY(' + top + 'px)'; return; }
    if (p._anims) { p._anims.forEach(function (a) { a.play(); }); return; }
    var hold = 'linear';
    var mv = CSS_IO;
    var ys = [0, -62, -124, -186, -248];
    var offs = [[0, 0.12], [0.22, 0.34], [0.44, 0.56], [0.66, 0.78], [0.88, 1]];
    var kf = [];
    ys.forEach(function (y, i) {
      kf.push({ offset: offs[i][0], transform: 'translateY(' + y + 'px)', opacity: i === 0 ? 0 : 1, easing: hold });
      kf.push({ offset: offs[i][1], transform: 'translateY(' + y + 'px)', opacity: i === 4 ? 0 : 1, easing: i === 4 ? hold : mv });
    });
    /* quick fade-in at the very start, ease between holds */
    kf[0].opacity = 0; kf[1].opacity = 1;
    var a1 = dot.animate(kf, { duration: 5000, iterations: Infinity });
    var as = [a1];
    function noteKf(from) {
      return [{ offset: 0, opacity: 0 }, { offset: from, opacity: 0 }, { offset: from + 0.06, opacity: 1 }, { offset: 0.97, opacity: 1 }, { offset: 1, opacity: 0 }];
    }
    if (notes[1]) as.push(notes[1].animate(noteKf(0.66), { duration: 5000, iterations: Infinity }));
    if (notes[0]) as.push(notes[0].animate(noteKf(0.88), { duration: 5000, iterations: Infinity }));
    p._anims = as;
  }

  function zoom(p) {
    var sh = $('.shot--zoom img', p);
    if (!sh || reduced()) return;
    if (p._zoom) { p._zoom.play(); return; }
    p._zoom = sh.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.03)' }],
      { duration: 14000, direction: 'alternate', iterations: Infinity, easing: 'linear' });
  }

  var evalLoaded = false;
  function loadEval(p) {
    if (evalLoaded) return;
    evalLoaded = true;
    fetch('/assets/musicai-eval.json').then(function (r) { return r.json(); }).then(function (j) {
      var n = j.neighbors;
      var map = { artist: 'artist_hit_rate', lang: 'language_precision', div: 'intra_list_diversity' };
      Object.keys(map).forEach(function (m) {
        var svg = $('.metric[data-metric="' + m + '"] .chart', p);
        if (!svg) return;
        var vals = [n.knn[map[m]], n.random[map[m]], n.popularity[map[m]]];
        $$('.bar', svg).forEach(function (r, i) {
          var w = Math.max(vals[i] * 250, 1.5);
          r.setAttribute('width', w.toFixed(2));
          var t = $$('.val', svg)[i];
          if (t) t.setAttribute('x', (w + 8).toFixed(2));
        });
      });
    }).catch(function () { /* the static chart already has the values */ });
  }

  var demoState = 0;
  var demoWait = [];
  function loadDemo(cb) {
    if (demoState === 2) { cb(); return; }
    demoWait.push(cb);
    if (demoState === 1) return;
    demoState = 1;
    var s = doc.createElement('script');
    s.src = '/demo.js';
    s.onload = function () { demoState = 2; demoWait.splice(0).forEach(function (f) { f(); }); };
    s.onerror = function () { demoState = 0; demoWait.splice(0).forEach(function (f) { f(true); }); };
    doc.head.appendChild(s);
  }

  var hooks = {
    show: function (p) {
      if (p._shown) {
        if (p._anims) p._anims.forEach(function (a) { a.play(); });
        if (p._zoom) p._zoom.play();
        return;
      }
      p._shown = true;
      var scope = p;
      if ($('.chart', p)) bars(scope);
      var svg = $('svg[data-anim]', p);
      if (svg && svg.getAttribute('data-anim') === 'arch') arch(svg);
      if (svg && svg.getAttribute('data-anim') === 'ladder') ladder(p, svg);
      zoom(p);
      if (p.dataset.panel === 'mus-eval') loadEval(p);
      if (p.dataset.panel === 'mus-demo') {
        loadDemo(function (err) {
          var el = $('[data-demo]', p);
          if (err || !window.MusicDemo) { el.innerHTML = '<p class="small demo__err">The demo could not load. See the code on <a href="https://github.com/dhruvindave007/MusicAI">GitHub</a>.</p>'; return; }
          window.MusicDemo.mount(el, { reduced: reduced });
        });
      }
      p.classList.remove('pre');
    },
    hide: function (p) {
      if (p._anims) p._anims.forEach(function (a) { a.pause(); });
      if (p._zoom) p._zoom.pause();
    }
  };

  var panels = {};
  $$('.panel').forEach(function (p) {
    panels[p.dataset.panel] = p;
    p._home = p.parentNode;
    if (p.dataset.panel === 'ovt-ui' || p.dataset.panel === 'ovt-signin') { var s = $('.shot', p); if (s) s.classList.add('shot--zoom'); }
  });

  var panelIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var p = en.target;
      if (en.isIntersecting) hooks.show(p); else hooks.hide(p);
    });
  }, { threshold: 0.15 });

  function prime(p) {
    if (!reduced() && ($('.chart', p) || $('svg[data-anim]', p))) p.classList.add('pre');
  }
  prime && Object.keys(panels).forEach(function (k) { prime(panels[k]); });

  doc.addEventListener('visibilitychange', function () {
    Object.keys(panels).forEach(function (k) {
      var p = panels[k];
      if (doc.hidden) hooks.hide(p); else if (p._shown && p.isConnected && p.offsetParent !== null) hooks.show(p);
    });
  });

  /* metric toggles (M6) */
  doc.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.seg[data-metric]');
    if (!b) return;
    var p = b.closest('.panel');
    var m = b.getAttribute('data-metric');
    $$('.seg', p).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    var target = null;
    $$('.metric', p).forEach(function (el) {
      var on = el.getAttribute('data-metric') === m;
      el.classList.toggle('is-on', on);
      if (on) target = el;
    });
    var tt = $('[data-title]', p);
    if (tt && target) tt.textContent = target.getAttribute('data-title');
    if (target) bars(target);
  });

  /* ------------------------------------------------------------ evidence: pane, inline slots and sheet */
  var evidence = $('#evidence');
  var stage = evidence && $('.stage', evidence);
  var sheet = $('#sheet');
  var state = { proj: 'ovt', desk: 'ovt-ui' };

  function place(p, container) {
    settle(p);
    container.appendChild(p);
    prime(p);
    panelIO.observe(p);
  }
  function home(p) {
    panelIO.unobserve(p);
    hooks.hide(p);
    p._shown = false;
    p._anims && p._anims.forEach(function (a) { a.cancel(); });
    p._anims = null;
    if (p._zoom) { p._zoom.cancel(); p._zoom = null; }
    settle(p);
    p.classList.remove('pre');
    if (p._home) p._home.appendChild(p);
  }
  function syncCites() {
    var open = {};
    Object.keys(panels).forEach(function (k) {
      var p = panels[k];
      var par = p.parentNode;
      if (par && (par === stage || (par.classList && (par.classList.contains('proj__slot') || par.classList.contains('sheet__body'))))) open[k] = true;
    });
    $$('.cite[data-panel]').forEach(function (c) {
      c.setAttribute('aria-expanded', open[c.dataset.panel] ? 'true' : 'false');
    });
  }
  function flash(cite) {
    var t = $('.cite__t', cite);
    if (!t || reduced()) return;
    fx(t, { backgroundColor: ['color-mix(in srgb, var(--accent) 30%, transparent)', 'color-mix(in srgb, var(--accent) 14%, transparent)'] },
      { d: 500, native: true });
  }

  var tok = 0;
  function showDesk(id, cite) {
    var next = panels[id];
    if (!stage || !next) return;
    var cur = stage.firstElementChild;
    if (cite) flash(cite);
    if (cur === next) return;
    state.desk = id;
    var my = ++tok;
    function put() {
      if (my !== tok) return;
      if (cur && cur.parentNode === stage) home(cur);
      place(next, stage);
      if (reduced()) fx(next, { opacity: [0, 1] }, { d: 120 });
      else fx(next, { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0px)'] }, { d: 280 });
      syncCites();
    }
    if (!cur) { put(); return; }
    var out = reduced()
      ? fx(cur, { opacity: [1, 0] }, { d: 120 })
      : fx(cur, { opacity: [1, 0], transform: ['translateY(0px)', 'translateY(-8px)'] }, { d: 160, ease: 'io' });
    done(out, put);
  }

  /* sheet (M5) */
  var sheetOpener = null;
  var sheetPanel = null;
  var closing = false;
  function openSheet(id, opener) {
    var p = panels[id];
    if (!sheet || !p || sheet.open) return;
    sheetOpener = opener;
    sheetPanel = p;
    var from = p.parentNode;
    if (from === stage) { /* never happens: pane cites use the pane */ }
    home(p);
    place(p, $('.sheet__body', sheet));
    var h = $('.panel__title', p);
    if (h) { h.id = h.id || 't-' + id; sheet.setAttribute('aria-labelledby', h.id); sheet.removeAttribute('aria-label'); }
    sheet.style.transform = '';
    sheet.showModal();
    $('.sheet__body', sheet).scrollTop = 0;
    syncCites();
    if (!reduced()) {
      sheet.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 360, easing: CSS_EO });
      try { sheet.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 360, easing: CSS_EO, pseudoElement: '::backdrop' }); } catch (err) { /* noop */ }
    }
  }
  function finishClose() {
    var p = sheetPanel;
    sheet.close();
    sheet.style.transform = '';
    closing = false;
    if (p) {
      home(p);
      if (!DESK.matches && p.parentNode && p.dataset.panel) {
        var proj = p._home && p._home.closest && p._home.closest('.proj');
        if (proj && proj.dataset.default === p.dataset.panel) place(p, $('.proj__slot', proj));
      }
    }
    sheetPanel = null;
    syncCites();
    if (sheetOpener && sheetOpener.focus) sheetOpener.focus();
  }
  function closeSheet() {
    if (!sheet || !sheet.open || closing) return;
    closing = true;
    if (reduced()) { finishClose(); return; }
    var a = sheet.animate([{ transform: sheet.style.transform || 'translateY(0)' }, { transform: 'translateY(100%)' }], { duration: 220, easing: CSS_IO, fill: 'forwards' });
    try { sheet.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: CSS_IO, fill: 'forwards', pseudoElement: '::backdrop' }); } catch (err) { /* noop */ }
    done(a, function () { a.cancel(); finishClose(); });
  }
  if (sheet) {
    sheet.addEventListener('cancel', function (e) { e.preventDefault(); closeSheet(); });
    $('.sheet__close', sheet).addEventListener('click', closeSheet);
    sheet.addEventListener('click', function (e) { if (e.target === sheet) closeSheet(); });
    var body = $('.sheet__body', sheet);
    var y0 = null, dy = 0;
    sheet.addEventListener('touchstart', function (e) {
      var onBar = e.target.closest('.sheet__bar');
      y0 = (onBar || body.scrollTop <= 0) ? e.touches[0].clientY : null;
      dy = 0;
    }, { passive: true });
    sheet.addEventListener('touchmove', function (e) {
      if (y0 === null) return;
      dy = e.touches[0].clientY - y0;
      if (dy > 0) { sheet.style.transform = 'translateY(' + dy + 'px)'; if (e.cancelable) e.preventDefault(); }
      else { sheet.style.transform = ''; }
    }, { passive: false });
    sheet.addEventListener('touchend', function () {
      if (y0 === null) return;
      y0 = null;
      if (dy > 80) closeSheet();
      else if (dy > 0) {
        var a = sheet.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'translateY(0)' }], { duration: 200, easing: CSS_EO });
        sheet.style.transform = '';
        done(a, function () {});
      }
      dy = 0;
    });
  }

  /* cite clicks */
  doc.addEventListener('click', function (e) {
    var cite = e.target.closest && e.target.closest('.cite[data-panel]');
    if (!cite) return;
    var id = cite.dataset.panel;
    var p = panels[id];
    if (!p) return;
    if (DESK.matches && cite.closest('#work') && stage) { showDesk(id, cite); return; }
    if (p.parentNode && p.parentNode.classList && p.parentNode.classList.contains('proj__slot')) {
      flash(cite);
      p.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
      return;
    }
    openSheet(id, cite);
  });

  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var c = e.target.closest && e.target.closest('.cite[data-panel]');
    if (c && c.getAttribute('role') === 'button') { e.preventDefault(); c.click(); }
  });

  function relayout() {
    if (!evidence) {
      Object.keys(panels).forEach(function (k) { panelIO.observe(panels[k]); });
      return;
    }
    if (sheet && sheet.open) { closing = false; var sp = sheetPanel; sheet.close(); sheetPanel = null; if (sp) home(sp); }
    Object.keys(panels).forEach(function (k) { home(panels[k]); });
    if (DESK.matches) {
      place(panels[state.desk], stage);
    } else {
      $$('.proj').forEach(function (pr) { place(panels[pr.dataset.default], $('.proj__slot', pr)); });
    }
    syncCites();
  }
  if (DESK.addEventListener) DESK.addEventListener('change', relayout);
  else if (DESK.addListener) DESK.addListener(relayout);

  /* project crossing mid-screen sets the default evidence (desktop) */
  if (evidence) {
    var projIO = new IntersectionObserver(function (entries) {
      if (!DESK.matches) return;
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var pr = en.target.dataset.project;
        if (pr === state.proj) return;
        state.proj = pr;
        showDesk(en.target.dataset.default);
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    $$('.proj').forEach(function (pr) { projIO.observe(pr); });
  }

  /* ------------------------------------------------------------ video (M13) */
  $$('video.vid').forEach(function (v) {
    if (reduced()) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !doc.hidden) {
          v.preload = 'auto';
          var pr = v.play();
          if (pr && pr.catch) pr.catch(function () { /* autoplay refused: poster stays */ });
        } else v.pause();
      });
    }, { threshold: 0.25 });
    io.observe(v);
    doc.addEventListener('visibilitychange', function () { if (doc.hidden) v.pause(); });
  });

  /* ------------------------------------------------------------ go */
  relayout();
  intro();
  reveals();
  citeDraw();
})();
