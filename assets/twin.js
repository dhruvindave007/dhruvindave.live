/* Run the twin: a browser replay of the Office Vision Twin rules. No libraries, no network. */
(function () {
  'use strict';
  var root = document.getElementById('twin');
  if (!root) return;
  var dead = false, stopAll = function () {};

  function fail(err) {
    if (dead) return;
    dead = true;
    try { stopAll(); } catch (e) { /* ignore */ }
    root.classList.remove('js');
    if (window.console && console.error) console.error('twin.js', err);
  }
  function safe(fn) {
    return function () { if (dead) return; try { return fn.apply(this, arguments); } catch (err) { fail(err); } };
  }
  try { init(); } catch (err) { fail(err); }

  function init() {
    var SVGNS = 'http://www.w3.org/2000/svg';
    var mq = function (q) { return window.matchMedia ? matchMedia(q) : { matches: false }; };
    var RM = mq('(prefers-reduced-motion: reduce)');
    var FINE = mq('(pointer: fine)');
    var MOBILE = mq('(max-width: 767px)');
    var $ = function (s) { return root.querySelector(s); };
    var $$ = function (s) { return Array.prototype.slice.call(root.querySelectorAll(s)); };

    var svg = $('.tw-svg'), peopleG = $('.tw-people'), logEl = $('.tw-log'), lastEl = $('.tw-ev__last');
    var details = $('.tw-ev'), queueEl = $('.tw-queue'), incEl = $('.tw-inc'), clockIn = $('#tw-clock');
    var announceEl = $('[data-tw-announce]');
    var clockOut = $('.tw-clock__v'), clkText = $('.tw-clk'), chipsEl = $('.tw-chips');
    if (!svg || !peopleG || !logEl || !queueEl || !clockIn) throw new Error('twin markup missing');

    var ROOMS = {
      meeting: { x: 20, y: 20, w: 180, h: 190, name: 'Meeting room', word: 'meeting room' },
      lobby: { x: 20, y: 210, w: 180, h: 170, name: 'Lobby', word: 'lobby' },
      office: { x: 200, y: 20, w: 300, h: 360, name: 'Open office', word: 'open office' },
      server: { x: 500, y: 200, w: 120, h: 180, name: 'Server room', word: 'server room' }
    };
    var DOORS = {
      D1: { from: 'lobby', to: 'office', cam: 'C2', a: [184, 300], b: [218, 300] },
      D2: { from: 'office', to: 'server', cam: 'C6', a: [482, 290], b: [518, 290] }
    };
    var START = [['lobby', 78, 292], ['lobby', 128, 338], ['office', 262, 112], ['office', 318, 56], ['office', 410, 112],
      ['office', 284, 192], ['office', 392, 214], ['office', 446, 300], ['office', 318, 322], ['meeting', 70, 80],
      ['meeting', 126, 154], ['meeting', 166, 112]];
    var WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
    var CHIPS = ['camera', 'detector', 'twin', 'rules', 'incident', 'llm', 'check'];
    var WINDOW = 4; // sim seconds a badge grant stays valid

    var st, people, pid;
    var counts = {}, countEls = {}, chipEls = {}, wireEls = {}, okEl = $('.tw-ok');
    $$('.tw-count').forEach(function (g) { countEls[g.getAttribute('data-room')] = g; });
    $$('.tw-chip').forEach(function (c) {
      var k = c.getAttribute('data-chip'); chipEls[k] = c;
      var w = c.previousElementSibling; if (w && w.classList.contains('tw-wire')) wireEls[k] = w;
    });

    /* ---------- run clock (only advances while the panel is visible) ---------- */
    var acc = 0, since = 0, running = false, visible = false, interval = 0, raf = 0, everSeen = false;
    function now() { return running ? acc + (performance.now() - since) : acc; }
    function setRunning(on) {
      if (on === running) return;
      if (on) { since = performance.now(); } else { acc = now(); }
      running = on;
      root.classList.toggle('is-paused', !on);
      if (on) {
        if (!everSeen) { everSeen = true; st.firstView = now(); }
        interval = setInterval(safe(tick), 200);
        raf = requestAnimationFrame(frame);
      } else {
        clearInterval(interval); cancelAnimationFrame(raf);
      }
    }
    stopAll = function () { running = false; clearInterval(interval); cancelAnimationFrame(raf); };

    /* ---------- helpers ---------- */
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function simSec() { return st.simBase + (now() - st.simRef) / 1000; }
    function hms(s) { s = Math.floor(s) % 86400; return pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60); }
    function hm(s) { return hms(s).slice(0, 5); }
    function setClock(mins) { setSim(mins * 60); }
    function setSim(sec) { st.simBase = sec; st.simRef = now(); st.lastMin = -1; st.credits = { D1: [], D2: [] }; st.grants = { D1: [], D2: [] }; st.entries = { D1: [], D2: [] }; clockUI(); }
    function isAfter() { var m = Math.floor(simSec() / 60) % 1440; return m < 480 || m >= 1200; }
    function later(ms, fn, tag) { st.queue.push({ at: now() + ms, fn: fn, tag: tag || '' }); }
    function el(name, cls, attrs) {
      var e = document.createElementNS(SVGNS, name);
      if (cls) e.setAttribute('class', cls);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      return e;
    }
    function h(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function restart(node, cls) { if (!node) return; node.classList.remove(cls); void node.getBoundingClientRect(); node.classList.add(cls); }
    function flash(node, cls, ms) {
      if (!node) return;
      restart(node, cls);
      clearTimeout(node._t);
      node._t = setTimeout(function () { node.classList.remove(cls); }, ms);
    }
    function randIn(room) {
      var r = ROOMS[room], m = 18;
      for (var i = 0; i < 12; i++) {
        var x = rnd(r.x + m, r.x + r.w - m), y = rnd(r.y + m + 12, r.y + r.h - m);
        if (room === 'server' && y < 268) continue; // keep the label clear
        return [x, y];
      }
      return [r.x + r.w / 2, r.y + r.h - 40];
    }
    function hit(x, y) {
      for (var k in ROOMS) { var r = ROOMS[k]; if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return k; }
      return null;
    }

    /* ---------- people ---------- */
    function makePerson(room, x, y, fresh) {
      var g = el('g', 'tw-p' + (fresh ? ' is-new' : ''));
      g.appendChild(el('circle', 'tw-p__hit', { r: 11 }));
      g.appendChild(el('circle', 'tw-p__ring', { r: 7 }));
      g.appendChild(el('circle', 'tw-p__dot', { r: 3 }));
      var p = { id: ++pid, room: room, x: x, y: y, leg: null, legs: [], busy: false, next: now() + rnd(300, 2600), el: g };
      g._p = p;
      peopleG.appendChild(g);
      people.push(p);
      place(p, x, y);
      return p;
    }
    function place(p, x, y) { p.el.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')'); }
    function pos(p, t) {
      var L = p.leg;
      if (!L) return [p.x, p.y];
      var k = L.dur ? Math.min(1, Math.max(0, (t - L.t0) / L.dur)) : 1;
      var e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      return [L.sx + (L.tx - L.sx) * e, L.sy + (L.ty - L.sy) * e];
    }
    function go(p, x, y, dur, done) {
      var L = { tx: x, ty: y, dur: RM.matches ? 0 : dur, done: done };
      if (!p.leg) { L.t0 = now(); L.sx = p.x; L.sy = p.y; p.leg = L; } else p.legs.push(L);
    }
    function halt(p) { var q = pos(p, now()); p.x = q[0]; p.y = q[1]; p.leg = null; p.legs = []; p.busy = false; }
    function advance(t) {
      for (var i = 0; i < people.length; i++) {
        var p = people[i], n = 0;
        while (p.leg && t >= p.leg.t0 + p.leg.dur && n++ < 8) {
          var L = p.leg, end = L.t0 + L.dur;
          p.x = L.tx; p.y = L.ty;
          p.leg = p.legs.shift() || null;
          if (p.leg) { p.leg.t0 = end; p.leg.sx = p.x; p.leg.sy = p.y; }
          if (L.done) L.done(p);
        }
      }
    }
    function render() {
      var t = now();
      for (var i = 0; i < people.length; i++) {
        var p = people[i];
        if (p.drag) continue;
        var q = pos(p, t);
        if (q[0] !== p.rx || q[1] !== p.ry) { p.rx = q[0]; p.ry = q[1]; place(p, q[0], q[1]); }
      }
    }
    function legDur(p, x, y) { var d = Math.hypot(x - p.x, y - p.y); return Math.max(350, Math.min(1000, d * 8)); }
    function removePerson(p) {
      people.splice(people.indexOf(p), 1);
      p.el.classList.add('is-gone');
      setTimeout(function () { if (p.el.parentNode) p.el.parentNode.removeChild(p.el); }, 400);
    }
    function flag(p) {
      p.el.classList.add('is-flag');
      clearTimeout(p.ft);
      p.ft = setTimeout(function () { p.el.classList.remove('is-flag'); }, 3200);
    }

    /* ---------- counts ---------- */
    function recount() { var c = { meeting: 0, lobby: 0, office: 0, server: 0 }; people.forEach(function (p) { c[p.room]++; }); return c; }
    function syncCounts(silent) {
      var c = recount();
      for (var k in c) {
        if (c[k] !== counts[k]) {
          var g = countEls[k];
          if (g) { g.querySelector('text').textContent = c[k]; if (!silent) restart(g.querySelector('.tw-pill'), 'is-bump'); }
        }
      }
      counts = c;
      svg.setAttribute('aria-label', 'Floor plan. Lobby ' + c.lobby + ', Open office ' + c.office + ', Meeting room ' + c.meeting + ', Server room ' + c.server + '.');
    }
    function moveRoom(p, room, logIt) {
      var before = counts[room];
      p.room = room;
      syncCounts();
      return logIt ? log('twin.count', 'room=' + room + ' ' + before + '->' + counts[room]) : null;
    }

    /* ---------- event log ---------- */
    function log(type, fields) {
      var id = 'E-' + st.nextEvent++, t = hms(simSec());
      var li = h('li');
      li.setAttribute('data-ev', id);
      if (type === 'incident.open') li.className = 'is-inc';
      else { li.setAttribute('aria-hidden', 'true'); if (type.indexOf('rule.') === 0) li.className = 'is-rule'; }
      li.appendChild(h('span', 'l-id', id));
      li.appendChild(h('span', 'l-t', t));
      li.appendChild(h('span', 'l-ty', type));
      li.appendChild(h('span', 'l-f', fields));
      if (st.hlIds && st.hlIds.indexOf(id) >= 0) li.classList.add('is-hl');
      logEl.insertBefore(li, logEl.firstChild);
      while (logEl.children.length > 12) logEl.removeChild(logEl.lastChild);
      var line = id + ' ' + t + ' ' + type + ' ' + fields;
      if (lastEl) lastEl.textContent = line;
      // the log sits in a <details> that is closed on phones, so announce new incidents from outside it
      if (type === 'incident.open' && announceEl && details && !details.open) announceEl.textContent = line;
      return id;
    }

    /* ---------- pipeline chips ---------- */
    function chips(from, to, delay) {
      var a = CHIPS.indexOf(from), b = CHIPS.indexOf(to);
      for (var i = a; i <= b; i++) (function (k, n) {
        setTimeout(safe(function () {
          if (n > a) flash(wireEls[k], 'is-on', 700);
          flash(chipEls[k], 'is-on', 700);
          if (MOBILE.matches && chipsEl && chipsEl.scrollWidth > chipsEl.clientWidth) {
            var c = chipEls[k];
            chipsEl.scrollTo({ left: c.offsetLeft - chipsEl.clientWidth / 2 + c.offsetWidth / 2, behavior: RM.matches ? 'auto' : 'smooth' });
          }
          if (k === 'check' && okEl) flash(okEl, 'is-on', 1500);
        }), (delay || 0) + (n - a) * 120);
      })(CHIPS[i], i);
    }

    /* ---------- svg flashes ---------- */
    function reader(door) { flash(svg.querySelector('.tw-reader-hl[data-door="' + door + '"]'), 'is-on', 320); }
    function cone(cam) { flash(svg.querySelector('.tw-cone-hl[data-cam="' + cam + '"]'), 'is-on', 320); }
    function roomPulse(room) { flash(svg.querySelector('.tw-room-hl[data-room="' + room + '"]'), 'is-pulse', 820); }

    /* ---------- rules ---------- */
    function prune(door, t) {
      var ok = function (g) { var a = t - g.t; return a >= 0 && a <= WINDOW; };
      st.credits[door] = st.credits[door].filter(ok);
      st.grants[door] = st.grants[door].filter(ok);
      st.entries[door] = st.entries[door].filter(function (e) { return t - e.t <= WINDOW + 1 && t >= e.t; });
    }
    function grant(door) {
      var t = simSec(), id = log('badge.granted', 'door=' + door + ' badge=B-' + (101 + Math.floor(Math.random() * 40)));
      prune(door, t);
      st.credits[door].push({ id: id, t: t });
      st.grants[door].push({ id: id, t: t });
      reader(door);
      if (!afterHours(door, [id])) chips('twin', 'rules');
    }
    function entry(door, p) {
      var d = DOORS[door], t = simSec();
      var e1 = log('cam.entry', 'door=' + door + ' cam=' + d.cam + ' n=1');
      cone(d.cam);
      moveRoom(p, d.to, true);
      prune(door, t);
      st.entries[door].push({ id: e1, t: t });
      var fired = false;
      if (st.credits[door].length) {
        st.credits[door].shift();
      } else if (st.grants[door].length) {
        tailgate(door, t, p); fired = true;
      } else {
        fired = true; flag(p);
        openIncident({ kind: 'unauthorised', sev: 'HIGH', title: 'Unauthorised entry', door: door, room: d.to,
          reason: '1 entry with no badge grant.', fields: 'door=' + door + ' entries=1 grants=0', ids: [e1],
          writeup: 'A person entered the ' + ROOMS[d.to].word + ' through ' + door + ' with no badge grant.' });
      }
      if (afterHours(door, [e1])) fired = true;
      if (!fired) chips('camera', 'rules');
      if (door === 'D2') scheduleEgress(p);
    }
    function exit(door, p) {
      var d = DOORS[door];
      log('cam.exit', 'door=' + door + ' cam=' + d.cam + ' n=1');
      cone(d.cam);
      moveRoom(p, d.from, true);
      chips('camera', 'twin');
    }
    function tailgate(door, t, p) {
      var gs = st.grants[door], w0 = Math.min.apply(null, gs.map(function (g) { return g.t; }));
      var ents = st.entries[door].filter(function (e) { return e.t >= w0 - 1e-6; });
      var n = ents.length, g = gs.length, gIds = gs.map(function (x) { return x.id; });
      var ids = gIds.concat(ents.map(function (e) { return e.id; }));
      var reason = n + ' entries on ' + g + ' badge grant' + (g > 1 ? 's' : '') + '.';
      var who = WORDS[n] || String(n);
      var wu = who.charAt(0).toUpperCase() + who.slice(1) + ' people entered the ' + ROOMS[DOORS[door].to].word + ' through ' + door +
        (n >= 3 ? ' after ' + g + ' badge grant' + (g > 1 ? 's' : '') + '.' : ' after a single badge grant.');
      var fields = 'door=' + door + ' entries=' + n + ' grants=' + g;
      flag(p);
      var open = st.incidents.filter(function (i) {
        return !i.closed && i.kind === 'tailgating' && i.door === door && i.grantIds.some(function (x) { return gIds.indexOf(x) >= 0; });
      })[0];
      if (open) {
        open.allIds.push(log('rule.tailgating', fields));
        open.ids = ids; open.reason = reason; open.writeup = wu;
        fillCard(open);
        chips('camera', 'check');
        roomPulse(open.room);
        return;
      }
      openIncident({ kind: 'tailgating', sev: 'HIGH', title: 'Tailgating', door: door, room: DOORS[door].to, reason: reason,
        fields: fields, ids: ids, grantIds: gIds, writeup: wu });
    }
    function afterHours(door, ids) {
      if (!isAfter()) return false;
      var t = simSec(), at = hm(t);
      var open = st.incidents.filter(function (i) { return !i.closed && i.kind === 'after_hours' && i.door === door && t - i.t < 10; })[0];
      if (open) { open.ids = open.ids.concat(ids); fillCard(open); return true; }
      var txt = 'Badge access at ' + door + ' at ' + at + ', outside permitted hours.';
      openIncident({ kind: 'after_hours', sev: 'MEDIUM', title: 'After hours', door: door, room: DOORS[door].to, reason: txt,
        fields: 'door=' + door + ' time=' + at, ids: ids, writeup: txt });
      return true;
    }

    /* ---------- incidents ---------- */
    function openIncident(o) {
      var rid = log('rule.' + o.kind, o.fields);
      var inc = o;
      inc.id = 'INC-' + pad(st.nextIncident++);
      inc.t = simSec(); inc.grantIds = o.grantIds || []; inc.closed = false; inc.written = false;
      inc.allIds = [rid, log('incident.open', inc.id + ' ' + o.sev)];
      inc.rank = ++st.rank;
      st.incidents.push(inc);
      buildCard(inc);
      chips('camera', 'check');
      roomPulse(inc.room);
      later(900, function () {
        if (inc.closed) return;
        inc.allIds.push(log('llm.writeup', inc.id + ' (template)'));
        inc.written = true;
        fillCard(inc);
      });
    }
    function buildCard(inc) {
      var a = h('article', 'tw-card' + (inc.sev === 'MEDIUM' ? ' is-med' : ''));
      a.tabIndex = 0;
      a.setAttribute('aria-label', inc.id + ', ' + inc.sev + ', ' + inc.title + ' at ' + inc.door);
      var row = h('button', 'tw-card__row', inc.id + ' · ' + inc.sev + ' · ' + inc.title + ' · ' + inc.door);
      row.type = 'button';
      row.setAttribute('aria-expanded', 'false');
      row.addEventListener('click', safe(function () { interact(); inc.rank = ++st.rank; layoutQueue(); a.focus(); }));
      var top = h('div', 'tw-card__top');
      top.appendChild(h('span', 'tw-sev tw-sev--' + inc.sev.toLowerCase(), inc.sev));
      top.appendChild(h('span', 'tw-card__t', inc.title + ' · ' + inc.door));
      top.appendChild(h('span', 'tw-card__time', hms(inc.t)));
      var r = h('p', 'tw-card__r');
      var ev = h('p', 'tw-card__ev');
      var wu = h('div', 'tw-card__wu');
      var wh = h('div', 'tw-card__wh', 'Write-up ');
      var tag = h('span', 'tw-tag', 'template');
      tag.title = 'Generated in your browser. In the real system Amazon Bedrock writes this.';
      tag.tabIndex = 0;
      tag.setAttribute('aria-label', 'template. Generated in your browser. In the real system Amazon Bedrock writes this.');
      wh.appendChild(tag);
      var wt = h('p', 'tw-card__wt is-pending', 'Writing…');
      wu.appendChild(wh); wu.appendChild(wt);
      var ft = h('div', 'tw-card__ft');
      var close = h('button', 'tw-close', 'Close incident');
      close.type = 'button';
      close.addEventListener('click', safe(function () { interact(); closeIncident(inc); }));
      ft.appendChild(close);
      ft.appendChild(h('span', 'tw-card__note', 'Operator closes it. The AI never does.'));
      [row, top, r, ev, wu, ft].forEach(function (n) { a.appendChild(n); });
      inc.el = a; inc.row = row; inc.rEl = r; inc.evEl = ev; inc.wtEl = wt;
      var on = safe(function () { highlight(inc, true); }), off = safe(function () { highlight(inc, false); });
      a.addEventListener('mouseenter', on); a.addEventListener('mouseleave', off);
      a.addEventListener('focusin', on); a.addEventListener('focusout', off);
      queueEl.insertBefore(a, queueEl.firstChild);
      fillCard(inc);
      layoutQueue();
      queueEl.scrollTop = 0;
    }
    function fillCard(inc) {
      if (!inc.el) return;
      inc.rEl.textContent = inc.reason;
      inc.evEl.textContent = '';
      inc.evEl.appendChild(h('b', '', 'Events'));
      inc.ids.slice(-6).forEach(function (id) { inc.evEl.appendChild(h('span', '', id)); });
      if (inc.written) { inc.wtEl.textContent = inc.writeup; inc.wtEl.classList.remove('is-pending'); }
      if (st.hlInc === inc) highlight(inc, true);
    }
    function layoutQueue() {
      var open = st.incidents.filter(function (i) { return !i.closed; });
      var keep = open.slice().sort(function (a, b) { return b.rank - a.rank; }).slice(0, 3);
      open.forEach(function (i) {
        var c = keep.indexOf(i) < 0;
        i.el.classList.toggle('is-collapsed', c);
        i.el.tabIndex = c ? -1 : 0;
        i.row.setAttribute('aria-expanded', String(!c));
      });
      incEl.classList.toggle('has-open', open.length > 0);
    }
    function closeIncident(inc) {
      if (inc.closed) return;
      inc.closed = true;
      highlight(inc, false);
      log('incident.closed', inc.id + ' by=operator');
      var a = inc.el, hadFocus = a.contains(document.activeElement);
      a.classList.add('is-closing');
      setTimeout(safe(function () {
        if (a.parentNode) a.parentNode.removeChild(a);
        layoutQueue();
        if (hadFocus) {
          var next = queueEl.querySelector('.tw-card:not(.is-collapsed)');
          (next || $('#tw-inc-h')).focus();
        }
      }), RM.matches ? 0 : 170);
    }
    function highlight(inc, on) {
      st.hlInc = on ? inc : null;
      var rm = svg.querySelector('.tw-room-hl[data-room="' + inc.room + '"]');
      var rd = svg.querySelector('.tw-reader-hl[data-door="' + inc.door + '"]');
      if (rm) rm.classList.toggle('is-hl', on);
      if (rd) rd.classList.toggle('is-hl', on);
      st.hlIds = on ? inc.ids.concat(inc.allIds) : null;
      Array.prototype.forEach.call(logEl.children, function (li) {
        li.classList.toggle('is-hl', !!(on && st.hlIds.indexOf(li.getAttribute('data-ev')) >= 0));
      });
    }

    /* ---------- walks ---------- */
    function free(room) { return people.filter(function (p) { return p.room === room && !p.busy && !p.drag; }); }
    function nearest(list, pt) {
      return list.sort(function (a, b) { return Math.hypot(a.x - pt[0], a.y - pt[1]) - Math.hypot(b.x - pt[0], b.y - pt[1]); })[0];
    }
    function spawn() {
      var p = makePerson('lobby', 26, 300, true);
      p.rx = null;
      moveRoom(p, 'lobby', false);
      log('twin.count', 'room=lobby ' + (counts.lobby - 1) + '->' + counts.lobby);
      return p;
    }
    function walkThrough(door, back) {
      var d = DOORS[door], src = back ? d.to : d.from, dst = back ? d.from : d.to;
      var a = back ? d.b : d.a, b = back ? d.a : d.b;
      var p = nearest(free(src), a);
      if (!p) { if (src !== 'lobby') return null; p = spawn(); }
      halt(p); p.busy = true;
      go(p, a[0], a[1], legDur(p, a[0], a[1]));
      go(p, b[0], b[1], 420, function (q) { if (back) exit(door, q); else entry(door, q); });
      var end = randIn(dst);
      go(p, end[0], end[1], 1200, function (q) { q.busy = false; q.next = now() + rnd(1500, 4000); });
      return p;
    }
    function scheduleEgress(p) {
      p.egress = true;
      later(rnd(6000, 10000), function () {
        if (people.indexOf(p) < 0 || p.room !== 'server' || p.drag) return;
        halt(p); p.busy = true;
        var d = DOORS.D2;
        go(p, d.b[0], d.b[1], legDur(p, d.b[0], d.b[1]));
        go(p, d.a[0], d.a[1], 420, function (q) { exit('D2', q); });
        var end = randIn('office');
        go(p, end[0], end[1], 1200, function (q) { q.busy = false; });
      });
    }
    function leaveBuilding() {
      var p = walkThrough('D1', true);
      if (!p) return;
      go(p, 30, 300, 1600, function (q) {
        q.busy = true;
        go(q, 6, 300, 400, function (r) {
          var before = counts.lobby;
          removePerson(r);
          syncCounts();
          log('twin.count', 'room=lobby ' + before + '->' + counts.lobby);
        });
      });
      // replace the final wander leg: head to the street door instead
      p.legs.splice(p.legs.length - 2, 1);
    }

    /* ---------- scenarios ---------- */
    var SCEN = {
      tailgating: [[0, function () { grant('D1'); }], [600, function () { walkThrough('D1'); }], [1400, function () { walkThrough('D1'); }]],
      nobadge: [[0, function () { walkThrough('D2'); }]],
      afterhours: [[0, function () { setClock(23 * 60 + 40); grant('D1'); }], [600, function () { walkThrough('D1'); }]]
    };
    // stop walkers on their way to a door: setSim() clears the grants they would be checked against
    function settle() { people.forEach(function (p) { if (p.busy && !p.drag) halt(p); }); }
    function run(name, auto) {
      cancelScript();
      st.queue = st.queue.filter(function (q) { return q.tag !== 'idle'; });
      settle();
      setSim(simSec());
      st.mode = 'scenario'; st.auto = !!auto;
      st.busyUntil = now() + 5000;
      var saved = simSec();
      st.scriptStart = now();
      st.restore = auto && name === 'afterhours' ? saved : null;
      pressed(name);
      SCEN[name].forEach(function (s) { later(s[0], s[1], 'script'); });
      later(4200, function () {
        pressed(null);
        if (st.restore != null) setSim(st.restore + 4.2);
        st.restore = null; st.auto = false;
        st.mode = auto ? 'idle' : 'user';
        st.lastInteraction = now();
        if (auto) { st.nextEntry = now() + 5000; st.nextFlow = now() + 7500; }
      }, 'script');
    }
    function cancelScript() {
      st.queue = st.queue.filter(function (q) { return q.tag !== 'script'; });
      pressed(null);
    }
    function pressed(name) {
      $$('.tw-seg__b').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-scen') === name)); });
    }

    /* ---------- idle director ---------- */
    function interact() {
      if (st.auto) {
        // an auto script was running: drop it, put the clock back and hand control to the visitor
        cancelScript();
        if (st.restore != null) { settle(); setSim(st.restore + (now() - st.scriptStart) / 1000); }
        st.restore = null;
        st.mode = 'user'; st.busyUntil = 0;
      }
      st.auto = false;
      if (st.mode !== 'scenario') st.mode = 'user';
      st.lastInteraction = now();
      st.didTail = true;
      st.touched = true;
    }
    function idle(t) {
      if (st.mode === 'user' && t - st.lastInteraction > 20000) {
        st.mode = 'idle'; st.nextScript = t + 6000; st.nextEntry = t + 5000; st.nextFlow = t + 7500;
      }
      if (st.mode !== 'idle' || RM.matches) return;
      var quiet = t >= st.quietUntil;
      if (!st.didTail && st.firstView != null && t - st.firstView >= 3000 && quiet) {
        st.didTail = true; st.nextScript = t + 20000; run('tailgating', true); return;
      }
      if (st.didTail && t >= st.nextScript && quiet) {
        st.nextScript = t + 20000;
        if (st.incidents.filter(function (i) { return !i.closed; }).length < 4) { run(st.cycle++ % 2 ? 'afterhours' : 'nobadge', true); return; }
      }
      if (t >= st.nextEntry) {
        st.nextEntry = t + 5000;
        if (t >= st.busyUntil) {
          st.quietUntil = t + 3600;
          grant('D1');
          later(600, function () { walkThrough('D1'); }, 'idle');
        }
      }
      if (t >= st.nextFlow) {
        st.nextFlow = t + 5000;
        if (t >= st.busyUntil) {
          if (counts.office > 7) leaveBuilding();
          if (counts.lobby < 2) { var p = spawn(), e = randIn('lobby'); p.busy = true; go(p, e[0], e[1], 1400, function (q) { q.busy = false; }); }
        }
      }
    }

    /* ---------- loops ---------- */
    function clockUI() {
      var s = simSec(), m = Math.floor(s / 60);
      if (clkText) clkText.textContent = hms(s);
      if (m !== st.lastMin) {
        st.lastMin = m;
        var txt = hm(s);
        clockOut.textContent = txt;
        clockIn.setAttribute('aria-valuetext', txt);
        if (!st.sliding) clockIn.value = Math.max(420, Math.min(1380, m % 1440));
        svg.classList.toggle('is-after', isAfter());
      }
    }
    function tick() {
      var t = now();
      var due = st.queue.filter(function (q) { return q.at <= t; });
      st.queue = st.queue.filter(function (q) { return q.at > t; });
      due.sort(function (a, b) { return a.at - b.at; }).forEach(function (q) { q.fn(); });
      advance(t);
      if (!RM.matches) {
        people.forEach(function (p) {
          if (!p.leg && !p.busy && !p.drag && t >= p.next) {
            var e = randIn(p.room), d = rnd(2000, 4000);
            go(p, e[0], e[1], d);
            p.next = t + d + rnd(400, 2600);
          }
        });
      }
      idle(t);
      clockUI();
      if (RM.matches) render();
    }
    var frame = safe(function () {
      advance(now());
      render();
      if (running) raf = requestAnimationFrame(frame);
    });

    /* ---------- reset / start ---------- */
    function reset() {
      st = {
        simBase: 9 * 3600 + 12 * 60, simRef: now(), lastMin: -1, credits: { D1: [], D2: [] }, grants: { D1: [], D2: [] },
        entries: { D1: [], D2: [] }, incidents: [], nextEvent: 1001, nextIncident: 1, rank: 0, queue: [],
        mode: st ? 'user' : 'idle', auto: false, lastInteraction: now(), busyUntil: 0, nextEntry: now() + 5000,
        nextFlow: now() + 7500, nextScript: 0, quietUntil: 0, cycle: 0, restore: null, scriptStart: 0, didTail: st ? true : false, firstView: st ? st.firstView : null
      };
      people = []; pid = 0;
      peopleG.textContent = '';
      START.forEach(function (s) { makePerson(s[0], s[1], s[2]); });
      counts = {};
      syncCounts(true);
      logEl.textContent = '';
      if (lastEl) lastEl.textContent = '';
      queueEl.textContent = '';
      incEl.classList.remove('has-open');
      $$('.tw-room-hl, .tw-reader-hl').forEach(function (n) { n.classList.remove('is-hl', 'is-pulse', 'is-on'); });
      pressed(null);
      clockUI();
      render();
    }

    /* ---------- drag (pointer: fine only) ---------- */
    var drag = null;
    function svgPt(e) {
      var m = svg.getScreenCTM();
      if (!m) return null;
      var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      return pt.matrixTransform(m.inverse());
    }
    function endDrag(cancel) {
      if (!drag) return;
      var p = drag.p, x = p.x, y = p.y, from = drag.room;
      svg.classList.remove('is-drag');
      p.drag = false;
      var to = cancel ? null : hit(x, y);
      if (!to || people.indexOf(p) < 0) { p.x = drag.ox; p.y = drag.oy; place(p, p.x, p.y); drag = null; return; }
      drag = null;
      p.next = now() + rnd(1500, 3000);
      if (to === from) return;
      if (from === 'lobby' && to === 'office') entry('D1', p);
      else if (from === 'office' && to === 'lobby') exit('D1', p);
      else if (from === 'office' && to === 'server') entry('D2', p);
      else if (from === 'server' && to === 'office') exit('D2', p);
      else { moveRoom(p, to, true); chips('camera', 'twin'); }
    }
    svg.addEventListener('pointerdown', safe(function (e) {
      if (!FINE.matches || e.button !== 0) return;
      var g = e.target.closest && e.target.closest('.tw-p');
      if (!g || !g._p || people.indexOf(g._p) < 0) return;
      e.preventDefault();
      interact();
      var p = g._p;
      halt(p);
      p.drag = true;
      drag = { p: p, ox: p.x, oy: p.y, room: p.room, id: e.pointerId };
      peopleG.appendChild(p.el);
      svg.classList.add('is-drag');
      try { svg.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
    }));
    svg.addEventListener('pointermove', safe(function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var q = svgPt(e); if (!q) return;
      var p = drag.p;
      p.x = Math.max(24, Math.min(616, q.x)); p.y = Math.max(24, Math.min(376, q.y));
      place(p, p.x, p.y);
    }));
    svg.addEventListener('pointerup', safe(function (e) { if (drag && e.pointerId === drag.id) endDrag(false); }));
    svg.addEventListener('pointercancel', safe(function () { endDrag(true); }));
    document.addEventListener('keydown', safe(function (e) { if (drag && e.key === 'Escape') endDrag(true); }));

    /* ---------- controls ---------- */
    root.addEventListener('click', safe(function (e) {
      var b = e.target.closest && e.target.closest('button');
      if (!b || !root.contains(b)) return;
      var act = b.getAttribute('data-act'), scen = b.getAttribute('data-scen');
      if (scen) { interact(); run(scen, false); return; }
      if (!act) return;
      interact();
      if (act === 'badge') grant(b.getAttribute('data-door'));
      else if (act === 'walk') walkThrough(b.getAttribute('data-door'));
      else if (act === 'reset') reset();
      else if (act === 'example') run('tailgating', false);
    }));
    root.addEventListener('focusin', safe(function (e) { if (e.target !== root) interact(); }));
    clockIn.addEventListener('input', safe(function () {
      interact();
      st.sliding = true;
      setClock(+clockIn.value);
      st.sliding = false;
    }));
    if (details) {
      var syncDetails = safe(function () { details.open = !MOBILE.matches; });
      details.querySelector('summary').addEventListener('click', safe(function (e) { if (!MOBILE.matches) e.preventDefault(); }));
      if (MOBILE.addEventListener) MOBILE.addEventListener('change', syncDetails);
      syncDetails();
    }

    /* ---------- visibility ---------- */
    reset();
    function update() { setRunning(!dead && visible && !document.hidden); }
    document.addEventListener('visibilitychange', safe(update));
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(safe(function (es) { visible = es[es.length - 1].intersectionRatio >= 0.099; update(); }), { threshold: [0, 0.1] })
        .observe(root.querySelector('.tw-panel') || root);
    } else { visible = true; update(); }
  }
})();
