/* =========================================================
   DOPEST AUDIT — visuals
   Every visual is tied to what the section is about:
     diarization  -> hero: audio split into speakers (what Pyannote does)
     crawl        -> 01 technical SEO: a site being crawled, issues flagged
     cluster      -> 02 content: isolated articles becoming a topic cluster
     serp         -> 03 paid search: a results page where the ad appears
     trend/intent/ai/kwtable -> real Semrush numbers from data.js
   ========================================================= */
(function () {
  'use strict';

  var D = window.AUDIT_DATA || {};
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LIME = '#8DED11';
  var AMBER = '#F5A524';
  var MONO = '"Inter", -apple-system, "Segoe UI", sans-serif';

  /* ---------- helpers ---------- */
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.min(b === undefined ? 1 : b, Math.max(a === undefined ? 0 : a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function rngf(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function displayFont() {
    var f = getComputedStyle(document.documentElement).getPropertyValue('--display').trim();
    return f || 'Inter, sans-serif';
  }
  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function inView(el, cb, threshold) {
    if (!('IntersectionObserver' in window)) { cb(); return; }
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { cb(); io.disconnect(); }
    }, { threshold: threshold || 0.3 });
    io.observe(el);
  }

  /* Canvas loop: DPR aware, resizes itself, only animates while visible */
  function canvasLoop(canvas, render) {
    var ctx = canvas.getContext('2d');
    var w = 0, h = 0, visible = false, raf = 0, t0 = performance.now();
    function resize() {
      var r = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function frame(now) {
      ctx.clearRect(0, 0, w, h);
      render(ctx, w, h, now - t0, canvas);
      if (visible && !REDUCED) raf = requestAnimationFrame(frame);
    }
    resize();
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { resize(); frame(performance.now()); }).observe(canvas);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        cancelAnimationFrame(raf);
        if (visible) raf = requestAnimationFrame(frame);
      }, { threshold: 0.05 }).observe(canvas);
    }
    frame(performance.now());
  }

  /* =======================================================
     HERO — speaker diarization
     A waveform is split into who-spoke-when lanes, the way
     Pyannote does it. Playhead sweeps and labels each turn.
     ======================================================= */
  function diarization(canvas) {
    var SP = [
      { n: 'SPEAKER_00', c: LIME },
      { n: 'SPEAKER_01', c: '#ffffff' },
      { n: 'SPEAKER_02', c: '#7f8b9a' }
    ];
    var DUR = 64.2, LOOP = 22000, cache = {};

    function build(N) {
      if (cache[N]) return cache[N];
      var r = rngf(23), segs = [], seg = [], amp = [], i, j;
      for (i = 0; i < N; i++) { seg.push(-1); amp.push(0.05); }
      i = 0;
      var last = -1;
      while (i < N) {
        var sp;
        do { sp = Math.floor(r() * 3); } while (sp === last);
        var end = Math.min(N, i + Math.max(4, Math.round(N * (0.05 + r() * 0.11))));
        segs.push({ sp: sp, start: i, end: end });
        for (j = i; j < end; j++) {
          seg[j] = segs.length - 1;
          var t = (j - i) / (end - i);
          var env = Math.sin(Math.PI * clamp(t * 0.9 + 0.05));
          amp[j] = clamp(0.2 + 0.8 * env * (0.4 + 0.6 * r()), 0.08, 1);
        }
        last = sp; i = end;
        if (r() < 0.4) i += Math.max(1, Math.round(N * 0.012));
      }
      cache[N] = { N: N, segs: segs, seg: seg, amp: amp };
      return cache[N];
    }

    canvasLoop(canvas, function (ctx, w, h, t) {
      var m = build(w > 760 ? 200 : 90);
      var N = m.N;
      var gut = w > 760 ? 104 : 0;
      var x0 = gut, span = w - x0;
      var axisH = 22;
      var topH = (h - axisH) * 0.44;
      var mid = topH / 2 + 22;
      var p = REDUCED ? 0.57 : (t % LOOP) / LOOP;
      var bw = span / N;
      var j, s;

      /* waveform */
      for (j = 0; j < N; j++) {
        var played = (j + 0.5) / N < p;
        var near = Math.abs((j + 0.5) / N - p) * N;
        var hh = m.amp[j] * (topH / 2 - 6);
        if (!REDUCED && near < 6) hh *= 1 + 0.2 * Math.sin(t / 80 + j) * (1 - near / 6);
        hh = Math.max(hh, 1.5);
        var sg = m.seg[j] >= 0 ? m.segs[m.seg[j]] : null;
        ctx.fillStyle = played && sg ? SP[sg.sp].c : 'rgba(255,255,255,0.16)';
        if (played && !sg) ctx.fillStyle = 'rgba(255,255,255,0.25)';
        rr(ctx, x0 + j * bw + bw * 0.22, mid - hh, bw * 0.56, hh * 2, bw * 0.28);
        ctx.fill();
      }

      /* lanes */
      var laneTop = topH + 36;
      var laneGap = 10;
      var laneH = (h - axisH - laneTop - laneGap * 2) / 3;
      var k;
      ctx.textBaseline = 'middle';
      ctx.font = '10.5px ' + MONO;
      for (k = 0; k < 3; k++) {
        var ly = laneTop + k * (laneH + laneGap);
        if (gut) {
          ctx.fillStyle = SP[k].c;
          ctx.globalAlpha = 0.9;
          ctx.beginPath(); ctx.arc(4, ly + laneH / 2, 3, 0, 7); ctx.fill();
          ctx.globalAlpha = 0.6;
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'left';
          ctx.fillText(SP[k].n, 16, ly + laneH / 2 + 0.5);
          ctx.globalAlpha = 1;
        }
        for (s = 0; s < m.segs.length; s++) {
          var sgm = m.segs[s];
          if (sgm.sp !== k) continue;
          var sx = x0 + sgm.start * bw, sw = (sgm.end - sgm.start) * bw - 2;
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          rr(ctx, sx, ly, sw, laneH, 5); ctx.fill();
          var fillW = clamp(p * N - sgm.start, 0, sgm.end - sgm.start) * bw - (p * N >= sgm.end ? 2 : 0);
          if (fillW > 1) {
            ctx.fillStyle = SP[k].c;
            ctx.globalAlpha = k === 0 ? 0.95 : 0.82;
            rr(ctx, sx, ly, Math.min(fillW, sw), laneH, 5); ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
      }

      /* axis */
      ctx.fillStyle = 'rgba(255,255,255,0.32)';
      ctx.font = '10px ' + MONO;
      ctx.textBaseline = 'alphabetic';
      for (k = 0; k <= 6; k++) {
        var sec = Math.round((DUR / 6) * k);
        var tx = x0 + (span * k) / 6;
        ctx.textAlign = k === 0 ? 'left' : (k === 6 ? 'right' : 'center');
        ctx.fillText('0' + Math.floor(sec / 60) + ':' + (sec % 60 < 10 ? '0' : '') + (sec % 60), tx, h - 4);
      }

      /* playhead */
      var px = x0 + p * span;
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px, 28); ctx.lineTo(px, h - axisH); ctx.stroke();

      var ci = Math.min(N - 1, Math.floor(p * N));
      var cur = m.seg[ci] >= 0 ? m.segs[m.seg[ci]] : null;
      var secs = p * DUR;
      var mins = Math.floor(secs / 60), rest = secs - mins * 60;
      var stamp = '0' + mins + ':' + (rest < 10 ? '0' : '') + rest.toFixed(1);
      var txt = (cur ? SP[cur.sp].n : 'SILENCE') + '  ' + stamp;
      ctx.font = '600 10.5px ' + MONO;
      var cw = ctx.measureText(txt).width + 22;
      var cx = clamp(px - cw / 2, x0, w - cw);
      ctx.fillStyle = cur ? (cur.sp === 0 ? LIME : (cur.sp === 1 ? '#fff' : '#9aa5b3')) : 'rgba(255,255,255,0.4)';
      rr(ctx, cx, 0, cw, 24, 12); ctx.fill();
      ctx.fillStyle = '#050505';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(txt, cx + cw / 2, 12.5);
    });
  }

  /* =======================================================
     01 — Technical SEO: site crawl
     134 URLs discovered ring by ring, 12 flagged amber.
     ======================================================= */
  function crawl(canvas) {
    var C = D.crawl || { urls: 134, findings: 12, blockers: 0 };
    var r = rngf(5);
    var names = ['Product', 'Docs', 'Blog', 'Community', 'Pricing', 'Company'];
    var base = [18, 41, 30, 12, 8, 18];
    var leafTotal = Math.max(6, C.urls - 7);
    var counts = base.map(function (b) { return Math.round(b * leafTotal / 127); });
    var diff = leafTotal - counts.reduce(function (a, b) { return a + b; }, 0);
    counts[counts.length - 1] += diff;

    var nodes = [{ x: 0, y: 0, p: -1, k: 'root', t: 0, flag: -1 }];
    var sigma = Math.PI * 2 / 6;
    var radii = [0.58, 0.74, 0.9];
    var leaves = [];
    names.forEach(function (name, k) {
      var a0 = -Math.PI / 2 + k * sigma;
      var ah = a0 + sigma / 2;
      var hubIdx = nodes.length;
      nodes.push({ x: Math.cos(ah) * 0.3, y: Math.sin(ah) * 0.3, p: 0, k: 'hub', t: 250 + k * 140, flag: -1, label: name, a: ah });
      var n = counts[k];
      var split = [Math.round(n * 0.3), Math.round(n * 0.34)];
      split.push(n - split[0] - split[1]);
      split.forEach(function (m, ring) {
        for (var j = 0; j < m; j++) {
          var a = a0 + sigma * (0.1 + 0.8 * (j + 0.5) / m) + (r() - 0.5) * 0.02;
          var rad = radii[ring] + (r() - 0.5) * 0.03;
          var node = { x: Math.cos(a) * rad, y: Math.sin(a) * rad, p: hubIdx, k: 'leaf', t: 900 + ring * 850 + k * 70 + r() * 1100, flag: -1 };
          leaves.push(nodes.length);
          nodes.push(node);
        }
      });
    });
    /* choose flagged leaves, deterministic */
    var pool = leaves.slice();
    for (var i = pool.length - 1; i > 0; i--) {
      var j2 = Math.floor(r() * (i + 1));
      var tmp = pool[i]; pool[i] = pool[j2]; pool[j2] = tmp;
    }
    pool.slice(0, C.findings).forEach(function (idx, n) { nodes[idx].flag = 6200 + n * 170; });

    var LOOP = 14500;
    var F = displayFont();

    canvasLoop(canvas, function (ctx, w, h, t) {
      var tt = REDUCED ? 10000 : t % LOOP;
      var fade = tt > 13700 ? 1 - (tt - 13700) / 800 : 1;
      var narrowC = w < 520;
      var R = Math.min(w, h) / 2 - (narrowC ? 62 : 70);
      var cx = w / 2, cy = h / 2 + (narrowC ? 26 : 0);
      ctx.globalAlpha = fade;

      /* edges */
      var i, n, par, prog, X, Y, PX, PY;
      for (i = 1; i < nodes.length; i++) {
        n = nodes[i]; par = nodes[n.p];
        prog = easeOut(clamp((tt - n.t) / 500));
        if (prog <= 0) continue;
        PX = cx + par.x * R; PY = cy + par.y * R;
        X = cx + n.x * R; Y = cy + n.y * R;
        var fresh = 1 - clamp((tt - n.t) / 900);
        ctx.strokeStyle = fresh > 0 ? 'rgba(141,237,17,' + (0.1 + fresh * 0.4) + ')' : 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PX, PY);
        ctx.lineTo(lerp(PX, X, prog), lerp(PY, Y, prog));
        ctx.stroke();
      }

      /* nodes */
      var found = 0, flagged = 0;
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        var age = tt - n.t;
        if (age < 0) continue;
        found++;
        X = cx + n.x * R; Y = cy + n.y * R;
        var pop = easeOut(clamp(age / 380));
        var base = n.k === 'root' ? 7.5 : (n.k === 'hub' ? 5 : 2.8);
        var rad = base * pop;
        var isFlag = n.flag > 0 && tt >= n.flag;
        if (isFlag) flagged++;

        if (isFlag) {
          var fa = tt - n.flag;
          var pr = easeOut(clamp(fa / 1100));
          ctx.strokeStyle = 'rgba(245,165,36,' + (1 - pr) * 0.9 + ')';
          ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.arc(X, Y, rad + pr * 14, 0, 7); ctx.stroke();
          ctx.fillStyle = AMBER;
          ctx.beginPath(); ctx.arc(X, Y, rad * 1.25, 0, 7); ctx.fill();
        } else {
          ctx.fillStyle = n.k === 'root' ? LIME : (n.k === 'hub' ? '#fff' : 'rgba(255,255,255,0.62)');
          ctx.beginPath(); ctx.arc(X, Y, rad, 0, 7); ctx.fill();
          var flash = 1 - clamp(age / 900);
          if (flash > 0 && n.k !== 'root') {
            ctx.fillStyle = 'rgba(141,237,17,' + flash + ')';
            ctx.beginPath(); ctx.arc(X, Y, rad * (1 + flash * 0.5), 0, 7); ctx.fill();
          }
        }
        if (n.k === 'root') {
          ctx.strokeStyle = 'rgba(141,237,17,0.35)';
          ctx.beginPath(); ctx.arc(X, Y, rad + 6 + Math.sin(tt / 500) * 1.5, 0, 7); ctx.stroke();
        }
      }

      /* section labels */
      ctx.font = '10px ' + MONO;
      ctx.textBaseline = 'middle';
      for (i = 1; i < nodes.length; i++) {
        n = nodes[i];
        if (n.k !== 'hub' || tt < n.t + 500) continue;
        var lx = cx + Math.cos(n.a) * (R + 16), ly = cy + Math.sin(n.a) * (R + 16);
        ctx.fillStyle = 'rgba(255,255,255,' + 0.45 * clamp((tt - n.t - 500) / 500) + ')';
        ctx.textAlign = Math.abs(Math.cos(n.a)) < 0.3 ? 'center' : (Math.cos(n.a) > 0 ? 'left' : 'right');
        ctx.fillText(n.label.toUpperCase(), lx, ly);
      }

      /* HUD */
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,255,255,0.38)';
      ctx.font = '10.5px ' + MONO;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('URLS CRAWLED', 24, 34);
      ctx.fillStyle = '#fff';
      ctx.font = '500 ' + (narrowC ? 32 : 42) + 'px ' + F;
      ctx.fillText(String(found), 24, narrowC ? 68 : 80);

      var hy = h - 24;
      ctx.font = '11px ' + MONO;
      var healthy = found - flagged;
      var items = [
        ['#fff', healthy + ' healthy'],
        [AMBER, flagged + ' to improve'],
        [LIME, (C.blockers || 0) + ' blockers']
      ];
      var tw = 0;
      items.forEach(function (it) { tw += ctx.measureText(it[1]).width + 30; });
      var scale = tw > w - 40 ? (w - 40) / tw : 1;
      ctx.save();
      ctx.translate(24, hy);
      ctx.scale(scale, scale);
      var ox = 0;
      items.forEach(function (it) {
        ctx.fillStyle = it[0];
        ctx.beginPath(); ctx.arc(ox + 3, -4, 3.2, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.textAlign = 'left';
        ctx.fillText(it[1], ox + 14, 0);
        ox += ctx.measureText(it[1]).width + 34;
      });
      ctx.restore();
      ctx.globalAlpha = 1;
    });
  }

  /* =======================================================
     02 — Content strategy: isolated articles -> topic cluster
     Scroll-scrubbed: scrolling pulls the articles together.
     ======================================================= */
  function cluster(canvas) {
    var Cd = D.cluster || { pillar: 'Speaker diarization', topics: ['A', 'B', 'C', 'D', 'E', 'F'] };
    var r = rngf(9);
    var nodes = [];
    var NS = Cd.topics.length;

    nodes.push({ k: 'pillar', a: 0, rad: 0, p: -1, label: Cd.pillar });
    var i, j;
    for (i = 0; i < NS; i++) {
      nodes.push({ k: 'sub', a: -Math.PI / 2 + (i + 0.5) * (Math.PI * 2 / NS), rad: 0.4, p: 0, label: Cd.topics[i] });
    }
    for (i = 0; i < NS; i++) {
      for (j = 0; j < 4; j++) {
        nodes.push({ k: 'art', a: nodes[1 + i].a + (j - 1.5) * 0.3, rad: 0.86, p: 1 + i });
      }
    }
    /* scatter positions with minimum spacing */
    var placed = [];
    nodes.forEach(function (n) {
      var tries = 0, x, y, ok;
      do {
        x = 0.07 + r() * 0.86; y = 0.1 + r() * 0.8; ok = true;
        for (var q = 0; q < placed.length; q++) {
          var dx = placed[q][0] - x, dy = placed[q][1] - y;
          if (dx * dx + dy * dy < 0.0085) { ok = false; break; }
        }
        tries++;
      } while (!ok && tries < 60);
      placed.push([x, y]);
      n.sx = x; n.sy = y; n.ph = r() * 6.28;
    });
    /* cross links between neighbouring subs */
    var cross = [];
    for (i = 0; i < NS; i++) cross.push([1 + i, 1 + ((i + 1) % NS)]);
    var totalLinks = NS + NS * 4 + cross.length;

    var F = displayFont();
    var smooth = REDUCED ? 1 : 0;

    canvasLoop(canvas, function (ctx, w, h, t, cv) {
      var rect = cv.getBoundingClientRect();
      var vh = window.innerHeight || 800;
      var center = rect.top + rect.height / 2;
      var target = REDUCED ? 1 : clamp((vh * 0.9 - center) / (vh * 0.42));
      smooth += (target - smooth) * 0.14;
      var e = easeInOut(clamp(smooth));
      var narrow = w < 520;
      var Rx = w / 2 - (narrow ? 30 : 44), Ry = h / 2 - 40;
      var cx = w / 2, cy = h / 2 + (narrow ? 14 : 0);

      var pos = nodes.map(function (n) {
        var drift = (1 - e) * 6;
        var sx = n.sx * w + Math.sin(t / 1700 + n.ph) * drift;
        var sy = n.sy * h + Math.cos(t / 1900 + n.ph) * drift;
        var rr2 = n.rad * (narrow && n.k === 'sub' ? 1.2 : 1);
        var gx = cx + Math.cos(n.a) * rr2 * Rx;
        var gy = cy + Math.sin(n.a) * rr2 * Ry;
        return [lerp(sx, gx, e), lerp(sy, gy, e)];
      });

      var q = clamp((e - 0.5) / 0.45);
      var q2 = clamp((e - 0.4) / 0.4);

      /* links */
      function link(a, b, prog, alpha, dash) {
        if (prog <= 0) return;
        ctx.strokeStyle = 'rgba(141,237,17,' + alpha + ')';
        ctx.lineWidth = 1;
        ctx.setLineDash(dash || []);
        ctx.beginPath();
        ctx.moveTo(pos[a][0], pos[a][1]);
        ctx.lineTo(lerp(pos[a][0], pos[b][0], prog), lerp(pos[a][1], pos[b][1], prog));
        ctx.stroke();
        ctx.setLineDash([]);
      }
      for (i = 1; i <= NS; i++) link(0, i, easeOut(q2), 0.5);
      nodes.forEach(function (n, idx) { if (n.k === 'art') link(idx, n.p, easeOut(q), 0.38); });
      cross.forEach(function (c) { link(c[0], c[1], easeOut(q), 0.22, [3, 4]); });

      /* nodes */
      nodes.forEach(function (n, idx) {
        var x = pos[idx][0], y = pos[idx][1];
        if (n.k === 'art') {
          var wd = 11, ht = 14;
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          rr(ctx, x - wd / 2, y - ht / 2, wd, ht, 2.5); ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          ctx.lineWidth = 1; rr(ctx, x - wd / 2, y - ht / 2, wd, ht, 2.5); ctx.stroke();
          if (q > 0) {
            ctx.strokeStyle = 'rgba(141,237,17,' + q * 0.85 + ')';
            rr(ctx, x - wd / 2, y - ht / 2, wd, ht, 2.5); ctx.stroke();
          }
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.fillRect(x - 3, y - 3, 6, 1); ctx.fillRect(x - 3, y, 6, 1); ctx.fillRect(x - 3, y + 3, 4, 1);
        } else {
          var big = n.k === 'pillar';
          var rad = lerp(7, big ? 13 : 8, e);
          /* document glyph while isolated */
          if (e < 0.999) {
            ctx.globalAlpha = 1 - e;
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            rr(ctx, x - 5.5, y - 7, 11, 14, 2.5); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.lineWidth = 1; rr(ctx, x - 5.5, y - 7, 11, 14, 2.5); ctx.stroke();
            ctx.globalAlpha = 1;
          }
          if (e > 0.001) {
            ctx.globalAlpha = e;
            if (big) {
              ctx.strokeStyle = 'rgba(141,237,17,0.35)';
              ctx.lineWidth = 1;
              ctx.beginPath(); ctx.arc(x, y, rad + 7 + Math.sin(t / 600) * 1.6, 0, 7); ctx.stroke();
              ctx.fillStyle = LIME;
            } else {
              ctx.fillStyle = '#fff';
            }
            ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
      });

      /* labels (outward from each sub-topic, with a halo for legibility) */
      var la = clamp((e - 0.72) / 0.25);
      function tag(text, x, y, align, base, font, color) {
        var lines = [text];
        if (narrow && text.indexOf(' ') > 0) {
          var words = text.split(' '), half = Math.ceil(words.length / 2);
          lines = [words.slice(0, half).join(' '), words.slice(half).join(' ')];
        }
        var lh = narrow ? 13 : 15, total = lines.length * lh;
        var top = base === 'bottom' ? y - total : (base === 'top' ? y : y - total / 2);
        ctx.font = font; ctx.textAlign = align; ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round'; ctx.lineWidth = 5;
        lines.forEach(function (ln, li) {
          var ty = top + li * lh + lh / 2;
          ctx.strokeStyle = 'rgba(9,9,11,' + la + ')';
          ctx.strokeText(ln, x, ty);
          ctx.fillStyle = color; ctx.fillText(ln, x, ty);
        });
      }
      if (la > 0) {
        nodes.forEach(function (n, idx) {
          if (n.k !== 'sub') return;
          var ca = Math.cos(n.a), sa = Math.sin(n.a);
          var lx = pos[idx][0] + ca * 15, ly = pos[idx][1] + sa * 15;
          tag(n.label, lx, ly, ca > 0.3 ? 'left' : (ca < -0.3 ? 'right' : 'center'), sa < -0.3 ? 'bottom' : (sa > 0.3 ? 'top' : 'middle'),
              (narrow ? '500 11px' : '500 12.5px') + ' Inter, sans-serif', 'rgba(255,255,255,' + la * 0.92 + ')');
        });
        tag(Cd.pillar, pos[0][0], pos[0][1] + 24, 'center', 'top', '600 13.5px Inter, sans-serif', 'rgba(141,237,17,' + la + ')');
      }

      /* HUD */
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = 'rgba(255,255,255,0.38)';
      ctx.font = '10.5px ' + MONO;
      ctx.fillText('CLUSTER TOPICS', 24, 32);
      ctx.fillStyle = e > 0.5 ? LIME : '#fff';
      ctx.font = '500 ' + (narrow ? 18 : 22) + 'px ' + F;
      var topicCount = Math.round(NS * (e < 0.4 ? 0 : clamp((e - 0.4) / 0.5)));
      ctx.fillText(String(topicCount) + ' / ' + String(NS), 24, narrow ? 54 : 58);

      ctx.font = '11px ' + MONO;
      ctx.textAlign = 'right';
      ctx.fillStyle = e > 0.5 ? LIME : 'rgba(255,255,255,0.5)';
      ctx.fillText(e > 0.5 ? 'TOPICAL CLUSTER' : 'ISOLATED ARTICLES', w - 24, 34);
    });
  }

  /* =======================================================
     03 — Paid search: results page where the ad appears
     ======================================================= */
  function serp(root) {
    var typed = $('.typed', root);
    var engineBtns = $$('.engine button', root);
    var queries = (D.serp && D.serp.queries) || [{ engine: 'Google', q: 'speaker diarization api' }];

    function setEngine(name) {
      engineBtns.forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-engine') === name); });
    }
    if (REDUCED) {
      typed.textContent = queries[0].q;
      root.classList.add('on');
      return;
    }

    var visible = false;
    var userPick = null;
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.25 }).observe(root);

    function sleep(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }
    function whenVisible() {
      return new Promise(function (res) {
        (function chk() { visible ? res() : setTimeout(chk, 250); })();
      });
    }

    engineBtns.forEach(function (b) {
      b.addEventListener('click', function () { userPick = b.getAttribute('data-engine'); setEngine(userPick); });
    });

    (async function loop() {
      var i = 0;
      while (true) {
        await whenVisible();
        var s = queries[i % queries.length];
        root.classList.remove('on');
        typed.textContent = '';
        setEngine(userPick || s.engine);
        await sleep(500);
        for (var c = 0; c < s.q.length; c++) {
          typed.textContent += s.q.charAt(c);
          await sleep(58 + Math.random() * 40);
        }
        await sleep(450);
        root.classList.add('on');
        await sleep(6200);
        i++;
        userPick = null;
      }
    })();
  }

  /* =======================================================
     Real data: keyword trend chart (hover for values)
     ======================================================= */
  function trend(el) {
    var T = D.keywordTrend;
    if (!T) return;
    var W = 800, H = 470, pl = 46, pr = 14, pt = 20, pb = 40;
    var vals = T.values, n = vals.length;
    var max = Math.ceil(Math.max.apply(null, vals) / 100) * 100;
    function X(i) { return pl + i * (W - pl - pr) / (n - 1); }
    function Y(v) { return pt + (1 - v / max) * (H - pt - pb); }

    /* smooth line (Catmull-Rom -> cubic bezier) */
    var pts = vals.map(function (v, i) { return [X(i), Y(v)]; });
    var d = 'M' + pts[0][0] + ' ' + pts[0][1];
    for (var i = 0; i < n - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ' C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ',' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ',' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    var area = d + ' L' + X(n - 1) + ' ' + Y(0) + ' L' + X(0) + ' ' + Y(0) + ' Z';

    var grid = '';
    for (var g = 0; g <= max; g += 100) {
      grid += '<line class="g-line" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(g) + '" y2="' + Y(g) + '"/>' +
              '<text class="g-txt" x="' + (pl - 10) + '" y="' + (Y(g) + 4) + '" text-anchor="end">' + g + '</text>';
    }
    var xl = '';
    T.labels.forEach(function (l, i) {
      if (i % 3 === 0) {
        xl += '<text class="g-txt" x="' + X(i) + '" y="' + (H - 8) + '" text-anchor="' + (i === 0 ? 'start' : 'middle') + '">' + l + '</text>';
      }
    });
    var last = pts[n - 1];
    el.innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Organic keywords ranking over time">' +
        '<defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8DED11" stop-opacity=".22"/><stop offset="1" stop-color="#8DED11" stop-opacity="0"/></linearGradient></defs>' +
        grid + xl +
        '<path class="t-area" d="' + area + '" fill="url(#tg)"/>' +
        '<path class="t-line" pathLength="1" d="' + d + '"/>' +
        '<g class="t-end"><circle cx="' + last[0] + '" cy="' + last[1] + '" r="5" fill="#8DED11"/>' +
        '<text x="' + last[0] + '" y="' + (last[1] + 36) + '" text-anchor="end" fill="#fff" font-size="20" font-weight="600" font-family="Inter,sans-serif">' + vals[n - 1] + ' today</text></g>' +
        '<line class="t-cross" y1="' + pt + '" y2="' + (H - pb) + '" x1="0" x2="0"/>' +
        '<circle class="t-dot" r="5" cx="0" cy="0"/>' +
      '</svg><div class="tip"></div>';

    var svg = $('svg', el), cross = $('.t-cross', el), dot = $('.t-dot', el), tip = $('.tip', el);
    svg.addEventListener('pointermove', function (ev) {
      var b = svg.getBoundingClientRect();
      var sx = (ev.clientX - b.left) / b.width * W;
      var idx = clamp(Math.round((sx - pl) / ((W - pl - pr) / (n - 1))), 0, n - 1);
      var px = X(idx), py = Y(vals[idx]);
      cross.setAttribute('x1', px); cross.setAttribute('x2', px);
      dot.setAttribute('cx', px); dot.setAttribute('cy', py);
      tip.style.left = (px / W * b.width) + 'px';
      tip.style.top = (py / H * b.height) + 'px';
      tip.innerHTML = vals[idx] + ' keywords<small>' + T.labels[idx].replace("'", ' 20') + '</small>';
      el.classList.add('hover');
    });
    svg.addEventListener('pointerleave', function () { el.classList.remove('hover'); });
    inView(el, function () { el.classList.add('in'); }, 0.35);
  }

  /* Keywords by intent */
  function intent(el) {
    var rows = D.intent;
    if (!rows) return;
    var html = '<div class="stack">' + rows.map(function (r) {
      return '<span style="--w:' + r.pct + '%;background:' + r.color + '"></span>';
    }).join('') + '</div><ul class="rows">' + rows.map(function (r) {
      return '<li><i style="background:' + r.color + '"></i><span>' + r.label + '</span><em>' + r.keywords + ' keywords</em><b>' + r.pct + '%</b></li>';
    }).join('') + '</ul>';
    el.insertAdjacentHTML('beforeend', html);
    inView(el, function () { el.classList.add('in'); }, 0.4);
  }

  /* AI search mentions */
  function ai(el) {
    var A = D.ai;
    if (!A) return;
    var max = Math.max.apply(null, A.surfaces.map(function (s) { return s.mentions; }));
    el.innerHTML =
      '<div class="panel-title"><h3>AI search mentions</h3><span class="label">ChatGPT · Google · Gemini</span></div>' +
      '<div class="ai-top"><span class="big">' + A.visibility + '<small>/100</small></span>' +
      '<span>AI visibility · ' + A.mentions + ' mentions · ' + A.citedPages + ' cited pages</span></div>' +
      '<div class="ai-rows">' + A.surfaces.map(function (s, i) {
        return '<div class="ai-row"><span>' + s.name + '</span><span class="track"><i style="--w:' + (s.mentions / max * 100) + '%;--d:' + (i * 0.12) + 's"></i></span><b>' + s.mentions + '</b></div>';
      }).join('') + '</div>';
    inView(el, function () { el.classList.add('in'); }, 0.4);
  }

  /* Keyword economics table */
  function kwtable(el) {
    var K = D.keywords;
    if (!K) return;
    el.innerHTML =
      '<table><thead><tr><th>Keyword</th><th>Position</th><th>Monthly volume</th><th>CPC (USD)</th></tr></thead><tbody>' +
      K.map(function (k) {
        return '<tr><td>' + k.kw + '</td><td>' + k.pos + '</td><td>' + k.volume + '</td><td class="cpc">$' + k.cpc.toFixed(2) + '</td></tr>';
      }).join('') +
      '</tbody></table>';
    inView(el, function () { el.classList.add('in'); }, 0.3);
  }

  /* ---------- boot ---------- */
  var map = { diarization: diarization, crawl: crawl, cluster: cluster, serp: serp, trend: trend, intent: intent, ai: ai, kwtable: kwtable };
  $$('[data-viz]').forEach(function (el) {
    var fn = map[el.getAttribute('data-viz')];
    if (fn) { try { fn(el); } catch (err) { console.error('viz failed:', el.getAttribute('data-viz'), err); } }
  });
})();
