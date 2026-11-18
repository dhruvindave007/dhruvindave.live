/* dhruvindave.live home: replay, copy email, row preview, clock, image fade. Each part is optional. */
(function () {
  'use strict';
  var d = document;
  var mm = function (q) { return window.matchMedia ? matchMedia(q) : { matches: false }; };
  var RM = mm('(prefers-reduced-motion: reduce)');
  var later = function (fn, ms) { return setTimeout(fn, RM.matches ? 0 : ms); };

  /* Office Vision Twin replay: desktop with a fine pointer only */
  try {
    var media = d.querySelector('.ovt-media'), tpl = d.getElementById('twin-tpl');
    var actions = d.querySelector('.feature .actions');
    if (media && tpl && tpl.content && actions &&
        mm('(min-width: 900px) and (hover: hover) and (pointer: fine)').matches) {
      var shot = media.querySelector('.ovt-shot'), cap = d.querySelector('.replay-cap');
      var btn = d.createElement('button');
      btn.type = 'button'; btn.className = 'replay-btn';
      btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'twin');
      btn.textContent = 'Play the replay';
      actions.appendChild(btn);
      var twin = null, loaded = false, busy = false;

      var load = function (done) {
        if (loaded) { done(); return; }
        var link = d.createElement('link');
        link.rel = 'stylesheet'; link.href = '/twin.css';
        link.onload = function () {
          var s = d.createElement('script');
          s.src = '/twin.js';
          s.onload = function () { loaded = true; done(); };
          s.onerror = function () { loaded = true; done(); };
          d.body.appendChild(s);
        };
        link.onerror = function () { busy = false; };
        d.head.appendChild(link);
      };
      var open = function () {
        if (busy) return; busy = true;
        shot.classList.add('is-out');
        later(function () {
          shot.hidden = true;
          if (!twin) {
            media.appendChild(tpl.content.cloneNode(true));
            twin = d.getElementById('twin');
            twin.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
          }
          twin.hidden = false;
          twin.classList.add('is-pre');
          load(function () {
            requestAnimationFrame(function () {
              twin.classList.remove('is-pre');
              cap.hidden = false;
              if (media.getBoundingClientRect().top < 0) media.scrollIntoView({ block: 'start', behavior: RM.matches ? 'auto' : 'smooth' });
              btn.setAttribute('aria-expanded', 'true');
              btn.textContent = 'Close the replay';
              busy = false;
            });
          });
        }, 160);
      };
      var close = function () {
        if (busy || !twin || twin.hidden) return;
        twin.hidden = true; cap.hidden = true;
        shot.hidden = false;
        requestAnimationFrame(function () { shot.classList.remove('is-out'); });
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = 'Play the replay';
        btn.focus();
      };
      btn.addEventListener('click', function () { (twin && !twin.hidden) ? close() : open(); });
    }
  } catch (e) { /* replay is optional */ }

  /* copy email */
  try {
    var line = d.querySelector('.email-line'), mail = line && line.querySelector('.email');
    var status = d.querySelector('[data-copy-status]');
    if (line && mail && navigator.clipboard && navigator.clipboard.writeText) {
      var cb = d.createElement('button');
      cb.type = 'button'; cb.className = 'copy';
      cb.innerHTML = '<span class="copy-label">Copy</span><svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2 6.4l2.6 2.6L10 3.4"/></svg>';
      cb.setAttribute('aria-label', 'Copy email address');
      line.appendChild(cb);
      var label = cb.querySelector('.copy-label'), timer = 0;
      var swap = function (text) {
        label.classList.add('is-fading');
        later(function () { label.textContent = text; label.classList.remove('is-fading'); }, 120);
      };
      cb.addEventListener('click', function () {
        navigator.clipboard.writeText(mail.textContent.trim()).then(function () {
          clearTimeout(timer);
          cb.classList.remove('is-done'); void cb.offsetWidth; cb.classList.add('is-done');
          swap('Copied');
          if (status) status.textContent = 'Email address copied';
          timer = setTimeout(function () {
            cb.classList.remove('is-done'); swap('Copy');
            if (status) status.textContent = '';
          }, 1600);
        }, function () { /* copy refused: the mailto link still works */ });
      });
    }
  } catch (e) { /* copy is optional */ }

  /* project row preview: desktop, fine pointer */
  try {
    var list = d.querySelector('.projects');
    if (list && mm('(hover: hover) and (pointer: fine) and (min-width: 900px)').matches) {
      var box = d.createElement('div'), img = d.createElement('img');
      box.className = 'peek'; box.setAttribute('aria-hidden', 'true');
      img.alt = ''; img.width = 280; img.decoding = 'async';
      box.appendChild(img); d.body.appendChild(box);
      var W = 280, H = 0, mx = 0, my = 0, x = 0, y = 0, raf = 0, on = false, warm = false;
      var target = function () {
        var tx = mx + 24, ty = my + 16;
        if (tx + W > innerWidth - 8) tx = mx - 24 - W;
        if (ty + H > innerHeight - 8) ty = Math.max(8, my - 16 - H);
        return [tx, ty];
      };
      var place = function () { box.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)'; };
      var loop = function () {
        var t = target();
        x += (t[0] - x) * 0.18; y += (t[1] - y) * 0.18; place();
        raf = (on || Math.abs(t[0] - x) > .5 || Math.abs(t[1] - y) > .5) ? requestAnimationFrame(loop) : 0;
      };
      list.addEventListener('pointerenter', function () {
        if (warm) return; warm = true;
        Array.prototype.forEach.call(list.querySelectorAll('[data-peek]'), function (a) { var p = new Image(); p.src = a.getAttribute('data-peek'); });
      });
      Array.prototype.forEach.call(list.querySelectorAll('.row-link'), function (a) {
        var src = a.getAttribute('data-peek');
        a.addEventListener('pointerenter', function (e) {
          if (e.pointerType && e.pointerType !== 'mouse') return;
          if (!src) { on = false; box.classList.remove('is-on'); return; }
          mx = e.clientX; my = e.clientY;
          if (img.getAttribute('src') !== src) img.src = src;
          H = W * (src.indexOf('afs') >= 0 ? 655 / 800 : 800 / 1280);
          var t = target();
          if (!box.classList.contains('is-on')) { x = t[0]; y = t[1]; place(); }
          on = true; box.classList.add('is-on');
          if (!RM.matches && !raf) raf = requestAnimationFrame(loop);
        });
        a.addEventListener('pointermove', function (e) {
          mx = e.clientX; my = e.clientY;
          if (RM.matches && on) { var t = target(); x = t[0]; y = t[1]; place(); }
        });
        a.addEventListener('pointerleave', function () { on = false; box.classList.remove('is-on'); });
      });
      addEventListener('scroll', function () { if (on) { on = false; box.classList.remove('is-on'); } }, { passive: true });
    }
  } catch (e) { /* preview is optional */ }

  /* footer clock: Ahmedabad time */
  try {
    var clock = d.querySelector('.foot .clock'), ct = clock && clock.querySelector('.clock-t');
    if (clock && ct && window.Intl && Intl.DateTimeFormat) {
      var fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
      var tick = function () { var n = new Date(); ct.textContent = fmt.format(n); ct.setAttribute('datetime', n.toISOString()); };
      tick(); clock.hidden = false;
      setTimeout(function () { tick(); setInterval(tick, 60000); }, 60000 - Date.now() % 60000);
    }
  } catch (e) { /* clock is optional */ }

  /* images fade in on load (visible by default without JS) */
  try {
    if (!RM.matches) {
      Array.prototype.forEach.call(d.querySelectorAll('main img'), function (im) {
        if (im.complete) return;
        im.classList.add('pending');
        var done = function () { im.classList.add('loaded'); im.classList.remove('pending'); };
        im.addEventListener('load', done, { once: true });
        im.addEventListener('error', done, { once: true });
      });
    }
  } catch (e) { /* fade is optional */ }
})();
