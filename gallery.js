/*
  The Kala Culture Tattoos - home page photo gallery
  ---------------------------------------------------------------
  HOW TO ADD NEW PHOTOS (no code needed):
    1. Open your GitHub repo and go into the "gallery" folder.
    2. Click Add file > Upload files and drop the new photos in.
       Use .webp or .jpg, ideally under 200 KB each.
    3. Commit. The photos appear in the gallery automatically.
       (A visitor who has already opened the site may take up to
       30 minutes to see them, then it refreshes by itself.)

  Order: photos with a higher number in the file name are shown first.
  So after 31.webp, name your next photo 32.webp and it comes first.
  Photos with no number in the name (e.g. "wedding-day.webp") are
  treated as the newest and shown first.

  Photos inside sub-folders of "gallery" (and images/clients) are
  picked up too, so nothing already uploaded has to be moved.
*/
(function () {
  'use strict';

  var CFG = {
    owner: 'thekalaculture0-crypto',
    repo: 'kala-culture-tattoos',
    branches: ['main', 'master'],
    folders: ['gallery/', 'images/clients/'],
    maxPhotos: 60,
    cacheMinutes: 30,
    speed: [44, 34]            // pixels per second for row 1 and row 2
  };

  var CACHE_KEY = 'kct_gallery_v1';
  var IMG_RE = /\.(webp|jpe?g|png|avif|gif)$/i;

  // Used only if GitHub cannot be reached (offline, rate limit). Broken ones are skipped automatically.
  function seq(folder, from, to) {
    var a = [];
    for (var i = from; i <= to; i++) a.push(folder + '/' + i + '.webp');
    return a;
  }
  var FALLBACK = [].concat(
    seq('gallery/custom-designs', 3, 9), seq('gallery/realism', 1, 7), seq('gallery/fine-line', 1, 9),
    seq('gallery/cover-up', 1, 7), seq('gallery/matching', 1, 5),
    seq('images/clients', 1, 10).map(function (p) { return p.replace(/\/(\d+)\.webp$/, function (m, n) { return '/client-' + (n < 10 ? '0' : '') + n + '.webp'; }); })
  );

  var STYLES = [
    ['custom', 'Custom tattoo design'], ['realism', 'Realism tattoo'], ['fine', 'Fine line tattoo'],
    ['colour', 'Colour tattoo'], ['color', 'Colour tattoo'], ['cover', 'Cover-up tattoo'],
    ['matching', 'Matching tattoo'], ['couple', 'Matching tattoo']
  ];

  function styleOf(path) {
    var p = path.toLowerCase();
    for (var i = 0; i < STYLES.length; i++) if (p.indexOf(STYLES[i][0]) > -1) return STYLES[i][1];
    return 'Tattoo';
  }
  function numOf(path) {
    var name = path.split('/').pop().replace(/\.[^.]+$/, '');
    var m = name.match(/(\d+)(?!.*\d)/);
    return m ? parseInt(m[1], 10) : 1e9;
  }
  function toItems(paths) {
    var seen = {}, items = [];
    paths.forEach(function (p) {
      if (seen[p] || !IMG_RE.test(p)) return;
      seen[p] = 1;
      items.push({ path: p, url: encodeURI(p), label: styleOf(p), n: numOf(p) });
    });
    items.sort(function (a, b) { return (b.n - a.n) || (a.path < b.path ? -1 : 1); });
    items = items.slice(0, CFG.maxPhotos);
    items.forEach(function (it, i) {
      it.alt = it.label + ' in Vadodara by The Kala Culture Tattoos, Vasna Bhayli (photo ' + (i + 1) + ')';
    });
    return items;
  }

  /* ---------------------------------------------------------- loading the list */
  function readCache() {
    try {
      var c = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (c && c.paths && c.paths.length) return c;
    } catch (e) {}
    return null;
  }
  function writeCache(paths) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), paths: paths })); } catch (e) {}
  }
  function fetchTree(i) {
    i = i || 0;
    if (!window.fetch || i >= CFG.branches.length) return Promise.reject();
    var url = 'https://api.github.com/repos/' + CFG.owner + '/' + CFG.repo + '/git/trees/' + CFG.branches[i] + '?recursive=1';
    return fetch(url, { headers: { Accept: 'application/vnd.github+json' } }).then(function (r) {
      if (r.status === 404) return fetchTree(i + 1);
      if (!r.ok) throw new Error('api');
      return r.json();
    }).then(function (j) {
      if (!j || !j.tree) throw new Error('tree');
      return j.tree.filter(function (f) {
        return f.type === 'blob' && IMG_RE.test(f.path) && CFG.folders.some(function (d) { return f.path.indexOf(d) === 0; });
      }).map(function (f) { return f.path; });
    });
  }
  function timeout(ms) { return new Promise(function (_, rej) { setTimeout(rej, ms); }); }

  /* ---------------------------------------------------------- state */
  var rowsEl = document.getElementById('tgRows');
  var wrap = document.getElementById('tattoo-gallery');
  var items = [];
  var rowEls = [];
  var sig = '';
  var lb;

  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }

  /* ---------------------------------------------------------- rendering */
  function card(it, clone) {
    var b = el('button', 'tg-card');
    b.type = 'button';
    b.setAttribute('data-url', it.url);
    if (clone) { b.setAttribute('aria-hidden', 'true'); b.tabIndex = -1; }
    else b.setAttribute('aria-label', 'Open photo: ' + it.label);
    var im = new Image();
    im.alt = clone ? '' : it.alt;
    im.loading = 'lazy';
    im.decoding = 'async';
    im.src = it.url;
    b.appendChild(im);
    var tag = el('span', 'tg-tag');
    tag.textContent = it.label;
    b.appendChild(tag);
    return b;
  }

  function buildSet(list, rep, clone) {
    var set = el('div', 'tg-set');
    for (var r = 0; r < rep; r++) list.forEach(function (it) { set.appendChild(card(it, clone || r > 0)); });
    return set;
  }

  function render() {
    if (!rowsEl) return;
    rowsEl.innerHTML = '';
    rowEls = [];
    if (!items.length) { wrap.classList.add('tg-empty'); return; }
    wrap.classList.remove('tg-empty');

    var nRows = items.length > 9 ? 2 : 1;
    var lists = [];
    for (var r = 0; r < nRows; r++) lists.push([]);
    items.forEach(function (it, i) { lists[i % nRows].push(it); });

    var viewport = rowsEl.clientWidth || window.innerWidth;
    lists.forEach(function (list, r) {
      var row = el('div', 'tg-row');
      var track = el('div', 'tg-track' + (r % 2 ? ' tg-rev' : ''));
      row.appendChild(track);
      rowsEl.appendChild(row);

      // measure one pass, then repeat it until it is wider than the screen
      var probe = buildSet(list, 1, false);
      track.appendChild(probe);
      var w1 = probe.getBoundingClientRect().width || 1;
      var rep = Math.max(1, Math.ceil((viewport * 1.1) / w1));
      track.innerHTML = '';
      var a = buildSet(list, rep, false);
      var b = buildSet(list, rep, true);
      track.appendChild(a);
      track.appendChild(b);
      row._speed = CFG.speed[r % 2];
      row._track = track;
      row._set = a;
      rowEls.push(row);
    });
    measure();
  }

  function measure() {
    rowEls.forEach(function (row) {
      var w = row._set.getBoundingClientRect().width;
      if (!w) return;
      row.style.setProperty('--tg-w', w + 'px');
      row.style.setProperty('--tg-dur', (w / row._speed).toFixed(1) + 's');
    });
  }

  function setItems(list) {
    var s = list.map(function (i) { return i.path; }).join('|');
    if (s === sig) return;
    sig = s;
    items = list;
    render();
    applyBackgrounds();
  }

  /* ---------------------------------------------------------- broken images */
  var fixTimer;
  if (rowsEl) {
    rowsEl.addEventListener('error', function (e) {
      var t = e.target;
      if (!t || t.tagName !== 'IMG') return;
      var url = t.parentNode.getAttribute('data-url');
      items = items.filter(function (i) { return i.url !== url; });
      Array.prototype.forEach.call(rowsEl.querySelectorAll('.tg-card'), function (c) {
        if (c.getAttribute('data-url') === url) c.parentNode.removeChild(c);
      });
      clearTimeout(fixTimer);
      fixTimer = setTimeout(function () {
        if (!items.length) { wrap.classList.add('tg-empty'); return; }
        measure();
      }, 200);
    }, true);

    rowsEl.addEventListener('click', function (e) {
      var c = e.target.closest ? e.target.closest('.tg-card') : null;
      if (!c) return;
      var url = c.getAttribute('data-url');
      for (var i = 0; i < items.length; i++) if (items[i].url === url) { openLightbox(i); return; }
    });
  }

  var rz;
  window.addEventListener('resize', function () {
    clearTimeout(rz);
    rz = setTimeout(function () { if (items.length) render(); }, 300);
  });

  // pause the animation when the gallery is off screen
  if (wrap && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      wrap.classList.toggle('tg-offscreen', !en[0].isIntersecting);
    }, { rootMargin: '100px' }).observe(wrap);
  }

  /* ---------------------------------------------------------- lightbox */
  var idx = 0, lastFocus = null, touchX = null;
  function buildLightbox() {
    lb = el('div', 'tg-lightbox');
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Tattoo photo viewer');
    lb.innerHTML =
      '<button type="button" class="tg-lb-close" aria-label="Close photo">✕</button>' +
      '<button type="button" class="tg-lb-nav tg-lb-prev" aria-label="Previous photo">‹</button>' +
      '<figure class="tg-lb-fig"><img class="tg-lb-img" alt=""><figcaption class="tg-lb-cap"></figcaption></figure>' +
      '<button type="button" class="tg-lb-nav tg-lb-next" aria-label="Next photo">›</button>';
    document.body.appendChild(lb);
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.className === 'tg-lb-fig') closeLightbox();
    });
    lb.querySelector('.tg-lb-close').addEventListener('click', closeLightbox);
    lb.querySelector('.tg-lb-prev').addEventListener('click', function () { show(idx - 1); });
    lb.querySelector('.tg-lb-next').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) > 45) show(idx + (dx < 0 ? 1 : -1));
    });
  }
  function show(i) {
    if (!items.length) return closeLightbox();
    idx = (i + items.length) % items.length;
    var it = items[idx];
    var img = lb.querySelector('.tg-lb-img');
    img.classList.remove('in');
    img.src = it.url;
    img.alt = it.alt;
    lb.querySelector('.tg-lb-cap').textContent = it.label + '  ·  ' + (idx + 1) + ' / ' + items.length;
    requestAnimationFrame(function () { img.classList.add('in'); });
    var nx = new Image(); nx.src = items[(idx + 1) % items.length].url;
  }
  function openLightbox(i) {
    if (!lb) buildLightbox();
    lastFocus = document.activeElement;
    lb.classList.add('open');
    wrap.classList.add('tg-paused');
    document.body.style.overflow = 'hidden';
    show(i);
    lb.querySelector('.tg-lb-close').focus();
  }
  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove('open');
    wrap.classList.remove('tg-paused');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.addEventListener('keydown', function (e) {
    if (!lb || !lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowRight') show(idx + 1);
    else if (e.key === 'ArrowLeft') show(idx - 1);
  });

  /* ---------------------------------------------------------- specialty cards: photo behind each card */
  var cards = Array.prototype.slice.call(document.querySelectorAll('#services .feature-card[data-style]'));
  function pickBg(card) {
    var key = card.getAttribute('data-style');
    var hit = null;
    for (var i = 0; i < items.length; i++) {
      var p = items[i].path.toLowerCase();
      if (p.indexOf(key) > -1 || (key === 'colour' && p.indexOf('color') > -1)) { hit = items[i].url; break; }
    }
    return hit || encodeURI(card.getAttribute('data-bg') || '');
  }
  function paintBg(card) {
    var url = pickBg(card);
    if (!url || card.__bg === url) return;
    card.__bg = url;
    var im = new Image();
    im.onload = function () { card.style.setProperty('--specialty-bg', 'url("' + url + '")'); };
    im.src = url;
  }
  function applyBackgrounds() { cards.forEach(function (c) { if (c.__vis) paintBg(c); }); }
  if (cards.length && !(navigator.connection && navigator.connection.saveData)) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (x) {
          if (x.isIntersecting) { io.unobserve(x.target); x.target.__vis = true; paintBg(x.target); }
        });
      }, { rootMargin: '150px 0px' });
      cards.forEach(function (c) { io.observe(c); });
    } else {
      cards.forEach(function (c) { c.__vis = true; paintBg(c); });
    }
  }

  /* ---------------------------------------------------------- start */
  if (!rowsEl) return;
  var cached = readCache();
  var fresh = cached && (Date.now() - cached.t) < CFG.cacheMinutes * 60000;

  if (cached) setItems(toItems(cached.paths));

  if (!fresh) {
    var req = fetchTree().then(function (paths) {
      if (paths.length) { writeCache(paths); return paths; }
      throw new Error('empty');
    });
    if (cached) {
      req.then(function (p) { setItems(toItems(p)); }, function () {});
    } else {
      // first visit: wait a moment for GitHub, otherwise show the built-in list and update next time
      Promise.race([req, timeout(1600)]).then(function (p) { setItems(toItems(p)); }, function () {
        setItems(toItems(FALLBACK));
        req.then(function (p) { setItems(toItems(p)); }, function () {});
      });
    }
  }
})();
