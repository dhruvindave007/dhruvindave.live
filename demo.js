/* "Try the recommender": the MusicAI exact cosine k-NN, running on an exported subset of the catalogue. */
(function () {
  'use strict';
  var N_FEAT = 10;
  var CSS_EO = 'cubic-bezier(.2,.7,.1,1)';

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  function primary(a) { return String(a).split(',')[0].trim().toLowerCase(); }

  function mount(el, opts) {
    if (el._mounted) return;
    el._mounted = true;
    var reduced = (opts && opts.reduced) || function () { return false; };

    fetch('/assets/musicai-sample.json').then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    }).then(function (j) { init(el, j, reduced); }).catch(function () {
      el.innerHTML = '<p class="small demo__err">The sample could not load. See the code on <a href="https://github.com/dhruvindave007/MusicAI">GitHub</a>.</p>';
    });
  }

  function init(el, data, reduced) {
    var rows = data.tracks;
    var N = rows.length;
    var names = new Array(N), artists = new Array(N), moodOf = new Int8Array(N);
    var lname = new Array(N), lall = new Array(N), key = new Array(N), pa = new Array(N);
    var vec = new Float32Array(N * N_FEAT);
    for (var i = 0; i < N; i++) {
      var r = rows[i];
      names[i] = r[0];
      artists[i] = r[1];
      moodOf[i] = r[2];
      lname[i] = String(r[0]).toLowerCase();
      lall[i] = lname[i] + ', ' + String(r[1]).toLowerCase();
      pa[i] = primary(r[1]);
      key[i] = lname[i].trim() + '|' + pa[i];
      for (var f = 0; f < N_FEAT; f++) vec[i * N_FEAT + f] = r[3 + f];
    }

    var uid = 'demo' + Math.floor(Math.random() * 1e6);
    el.innerHTML =
      '<div class="combo">' +
      '<label class="lbl" for="' + uid + '-in">Search a track</label>' +
      '<input id="' + uid + '-in" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="' + uid + '-list" aria-activedescendant="" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Try &ldquo;' + esc(names[0]) + '&rdquo;">' +
      '<ul id="' + uid + '-list" role="listbox" aria-label="Suggestions" hidden></ul>' +
      '</div>' +
      '<p class="demo__q small"></p>' +
      '<div class="demo__bar"><div class="demo__tog" role="group" aria-label="Candidates">' +
      '<button type="button" class="tog" aria-pressed="true" data-mode="all">All tracks</button>' +
      '<button type="button" class="tog" aria-pressed="false" data-mode="mood">Same mood</button></div></div>' +
      '<ol class="results" aria-label="Similar tracks"></ol>' +
      '<p class="demo__live small"></p>' +
      '<p class="vh" role="status" aria-live="polite"></p>';

    var input = el.querySelector('input');
    var list = el.querySelector('ul');
    var q = el.querySelector('.demo__q');
    var ol = el.querySelector('.results');
    var live = el.querySelector('.demo__live');
    var status = el.querySelector('[role="status"]');
    var togs = el.querySelectorAll('.tog');

    var mode = 'all';
    var cur = 0;
    var sugg = [];
    var active = -1;

    function label(i) { return names[i] + ', ' + artists[i]; }

    /* ---- the model: dot product against every vector, keep the top ten ---- */
    function recommend(qi, m) {
      var base = qi * N_FEAT, topI = [], topS = [];
      for (var j = 0; j < N; j++) {
        if (j === qi || key[j] === key[qi]) continue;
        if (m === 'mood' && moodOf[j] !== moodOf[qi]) continue;
        var o = j * N_FEAT, s = 0;
        for (var k = 0; k < N_FEAT; k++) s += vec[o + k] * vec[base + k];
        if (topI.length < 10 || s > topS[topS.length - 1]) {
          var p = topI.length;
          if (p === 10) { p = 9; }
          else { topI.push(0); topS.push(0); }
          while (p > 0 && topS[p - 1] < s) { topI[p] = topI[p - 1]; topS[p] = topS[p - 1]; p--; }
          topI[p] = j; topS[p] = s;
        }
      }
      return { idx: topI, sim: topS };
    }

    function render(animate) {
      var res = recommend(cur, mode);
      var same = 0, html = '';
      for (var i = 0; i < res.idx.length; i++) {
        var j = res.idx[i];
        var s = res.sim[i];
        var isSame = pa[j] === pa[cur];
        if (isSame) same++;
        html += '<li><span class="nm">' + esc(names[j]) + '</span>' +
          '<span class="sim"><span class="vh">similarity </span>' + s.toFixed(2) + '</span>' +
          '<span class="ar">' + esc(artists[j]) + (isSame ? '<span class="tag">same artist</span>' : '') + '</span>' +
          '<span class="meter" aria-hidden="true"><i style="width:' + (Math.max(0, Math.min(1, s)) * 100).toFixed(1) + '%"></i></span></li>';
      }
      ol.innerHTML = html;
      q.innerHTML = 'Query: <b>' + esc(label(cur)) + '</b>. Mood: ' + esc(data.moods[moodOf[cur]]) + '.';
      live.innerHTML = 'Same artist here: <b>' + same + '</b>/10. Across 2,000 test queries the full model averaged 5.65/10; random picks averaged 1.65.';
      status.textContent = res.idx.length + ' similar tracks for ' + label(cur) + '. ' + same + ' by the same artist.';
      if (animate && !reduced()) {
        var lis = ol.children;
        for (var n = 0; n < lis.length; n++) {
          lis[n].animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }],
            { duration: 300, delay: n * 30, easing: CSS_EO, fill: 'backwards' });
          var bar = lis[n].querySelector('.meter i');
          bar.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
            { duration: 300, delay: n * 30, easing: CSS_EO, fill: 'backwards' });
        }
      }
    }

    function choose(i) {
      cur = i;
      input.value = label(i);
      closeList();
      render(true);
    }

    /* ---- combobox (ARIA 1.2) ---- */
    function suggest(text) {
      var t = text.trim().toLowerCase();
      if (!t) return [];
      var pre = [], sub = [];
      for (var i = 0; i < N && pre.length < 8; i++) {
        if (lname[i].indexOf(t) === 0) pre.push(i);
      }
      if (pre.length < 8) {
        for (var j = 0; j < N && pre.length + sub.length < 8; j++) {
          if (lname[j].indexOf(t) !== 0 && lall[j].indexOf(t) !== -1) sub.push(j);
        }
      }
      return pre.concat(sub).slice(0, 8);
    }
    function openList() {
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    }
    function closeList() {
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      input.setAttribute('aria-activedescendant', '');
      active = -1;
    }
    function drawList() {
      var html = '';
      if (!sugg.length) {
        html = '<li role="presentation" class="small" style="cursor:default">No match in the 3,000-track sample.</li>';
      } else {
        for (var i = 0; i < sugg.length; i++) {
          html += '<li role="option" id="' + uid + '-o' + i + '" data-i="' + sugg[i] + '" aria-selected="' + (i === active) + '">' + esc(label(sugg[i])) + '</li>';
        }
      }
      list.innerHTML = html;
    }
    function setActive(a) {
      active = a;
      var opts = list.querySelectorAll('[role="option"]');
      for (var i = 0; i < opts.length; i++) opts[i].setAttribute('aria-selected', String(i === a));
      input.setAttribute('aria-activedescendant', a >= 0 && opts[a] ? opts[a].id : '');
      if (a >= 0 && opts[a] && opts[a].scrollIntoView) opts[a].scrollIntoView({ block: 'nearest' });
    }

    input.addEventListener('input', function () {
      sugg = suggest(input.value);
      active = -1;
      if (!input.value.trim()) { closeList(); return; }
      drawList();
      openList();
      status.textContent = sugg.length ? sugg.length + ' suggestions' : 'No suggestions';
    });
    input.addEventListener('focus', function () { input.select(); });
    input.addEventListener('keydown', function (e) {
      var open = !list.hidden;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!open) {
          sugg = suggest(input.value);
          if (!sugg.length) return;
          drawList(); openList(); setActive(0);
        } else if (sugg.length) setActive((active + 1) % sugg.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (open && sugg.length) setActive(active <= 0 ? sugg.length - 1 : active - 1);
      } else if (e.key === 'Enter') {
        if (open && active >= 0) { e.preventDefault(); choose(sugg[active]); }
        else if (open && sugg.length) { e.preventDefault(); choose(sugg[0]); }
      } else if (e.key === 'Escape') {
        if (open) { e.preventDefault(); e.stopPropagation(); closeList(); }
        else if (input.value) { input.value = ''; }
      } else if (e.key === 'Tab') {
        closeList();
      }
    });
    input.addEventListener('blur', function () { setTimeout(closeList, 120); });
    list.addEventListener('mousedown', function (e) { e.preventDefault(); });
    list.addEventListener('click', function (e) {
      var li = e.target.closest('[role="option"]');
      if (li) choose(+li.getAttribute('data-i'));
    });

    Array.prototype.forEach.call(togs, function (b) {
      b.addEventListener('click', function () {
        mode = b.getAttribute('data-mode');
        Array.prototype.forEach.call(togs, function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        render(true);
      });
    });

    /* open on the most popular track so the list is never empty */
    input.value = label(0);
    render(false);
  }

  window.MusicDemo = { mount: mount };
})();
