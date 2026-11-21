/* Home page interactions: hero portrait drift, about tabs and counters,
   treatment filter, stacking cards, lit timeline, review carousel and the
   live clinic clock.
   Safe to run again after js/speed.js swaps pages in place. */
(function () {
  "use strict";
  if (window.__xHomeCleanup) { try { window.__xHomeCleanup(); } catch (e) {} }
  var timers = [];
  var raf = 0;
  window.__xHomeCleanup = function () {
    timers.forEach(function (t) { clearInterval(t); clearTimeout(t); });
    timers = [];
    if (raf) cancelAnimationFrame(raf);
  };

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lang = window.__SITE_LANG__ || document.documentElement.lang || "en";

  function init() {
    if (!document.querySelector(".x-home")) return;
    initTabs();
    initCounters();
    initFilter();
    initReviews();
    initWhyCards();
    initBaSwitch();
    initClock();
    initHeroParallax();
    initTilt();
    initMotion();
    onScroll();
    window.addEventListener("scroll", requestTick, { passive: true });
    window.addEventListener("resize", requestTick, { passive: true });
  }

  /* ---------- About: tabs with a sliding indicator ---------- */
  function initTabs() {
    var root = document.querySelector("[data-tabs]");
    if (!root) return;
    var tabs = Array.prototype.slice.call(root.querySelectorAll("[data-tab]"));
    var panels = root.querySelectorAll("[data-panel]");
    var ink = root.querySelector(".x-tabs__ink");
    var cur = 0;
    function place() {
      var t = tabs[cur];
      if (!ink || !t) return;
      ink.style.setProperty("--x", t.offsetLeft + "px");
      ink.style.setProperty("--w", t.offsetWidth + "px");
    }
    function select(i, focus) {
      cur = (i + tabs.length) % tabs.length;
      tabs.forEach(function (t, j) {
        var on = j === cur;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p, j) {
        var on = j === cur;
        p.hidden = !on;
        p.classList.toggle("is-active", on);
      });
      if (focus) tabs[cur].focus();
      place();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(i); });
      t.addEventListener("keydown", function (e) {
        var rtl = document.documentElement.dir === "rtl";
        if (e.key === "ArrowRight") { e.preventDefault(); select(cur + (rtl ? -1 : 1), true); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); select(cur + (rtl ? 1 : -1), true); }
        else if (e.key === "Home") { e.preventDefault(); select(0, true); }
        else if (e.key === "End") { e.preventDefault(); select(tabs.length - 1, true); }
      });
    });
    place();
    window.addEventListener("resize", place, { passive: true });
    if ("ResizeObserver" in window) {
      var ro = new ResizeObserver(place);
      tabs.forEach(function (t) { ro.observe(t); });
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
    timers.push(setTimeout(place, 600));
  }

  /* ---------- About: count the facts up once they are visible ---------- */
  function initCounters() {
    var nums = document.querySelectorAll("[data-count]");
    if (!nums.length || reduce || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target, end = parseInt(el.getAttribute("data-count"), 10) || 0, t0 = 0;
        var wait = el.closest(".x-stage__stats, .x-ab__stat") ? 900 : 0;
        function step(ts) {
          if (!t0) t0 = ts;
          var k = Math.min(1, (ts - t0) / 1400);
          el.textContent = String(Math.round(end * (1 - Math.pow(1 - k, 3))));
          if (k < 1) requestAnimationFrame(step);
        }
        el.textContent = "0";
        timers.push(setTimeout(function () { requestAnimationFrame(step); }, wait));
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { io.observe(n); });
  }

  /* ---------- Treatments: category filter + pointer spotlight ---------- */
  function initFilter() {
    var grid = document.querySelector("[data-tgrid]");
    var bar = document.querySelector("[data-filter]");
    if (!grid || !bar) return;
    var cards = grid.querySelectorAll(".x-tcard, .s-card");
    var btns = bar.querySelectorAll("[data-filter-btn]");
    var ind = bar.querySelector(".x-filter__ind");
    function moveInd() {
      var a = bar.querySelector(".x-filter__btn.is-active");
      if (!ind || !a) return;
      bar.style.setProperty("--ix", a.offsetLeft + "px");
      bar.style.setProperty("--iw", a.offsetWidth + "px");
      bar.classList.add("has-ind");
    }
    moveInd();
    window.addEventListener("resize", moveInd);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveInd);
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        var cat = b.getAttribute("data-filter-btn");
        setTimeout(moveInd, 0);
        btns.forEach(function (o) {
          var on = o === b;
          o.classList.toggle("is-active", on);
          o.setAttribute("aria-pressed", on ? "true" : "false");
        });
        grid.classList.toggle("is-filtered", cat !== "all");
        cards.forEach(function (c, i) {
          var show = cat === "all" || c.getAttribute("data-cat") === cat;
          c.hidden = !show;
          c.classList.remove("is-pop");
          if (show) {
            c.classList.add("is-in");
            c.style.animationDelay = (i % 4) * 0.05 + "s";
            void c.offsetWidth;
            c.classList.add("is-pop");
          }
        });
      });
    });
    var last = null;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function resetTilt(l) { l.style.setProperty("--rx", "0deg"); l.style.setProperty("--ry", "0deg"); }
    grid.addEventListener("pointermove", function (e) {
      var link = e.target.closest && e.target.closest(".x-tcard__link");
      if (!link) return;
      var r = link.getBoundingClientRect();
      link.style.setProperty("--mx", (e.clientX - r.left) + "px");
      link.style.setProperty("--my", (e.clientY - r.top) + "px");
      if (e.pointerType === "mouse" && !reduce) {
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        link.style.setProperty("--rx", (py * -6).toFixed(2) + "deg");
        link.style.setProperty("--ry", (px * 8).toFixed(2) + "deg");
      }
      if (last && last !== link) resetTilt(last);
      last = link;
    });
    grid.addEventListener("pointerleave", function () { if (last) resetTilt(last); last = null; });
  }

  /* ---------- Scroll-driven bits: stacking cards + timeline ---------- */
  var ticking = false;
  function requestTick() {
    if (ticking) return;
    ticking = true;
    raf = requestAnimationFrame(function () { ticking = false; onScroll(); });
  }
  // Read every position first, then write: mixing reads and writes forced
  // a fresh layout for each card on every scroll frame.
  function onScroll() {
    var vh = window.innerHeight || 800;
    var cards = reduce ? [] : document.querySelectorAll("[data-stack-card]");
    var rects = [];
    for (var i = 0; i < cards.length; i++) rects.push(cards[i].getBoundingClientRect());
    var line = document.querySelector("[data-timeline]");
    var steps = line ? line.querySelectorAll("[data-step]") : [];
    var lr = line ? line.getBoundingClientRect() : null;
    var stepTops = [];
    for (var j = 0; j < steps.length; j++) stepTops.push(steps[j].getBoundingClientRect().top);

    for (var k = 0; k < cards.length - 1; k++) {
      var r = rects[k], nr = rects[k + 1];
      var overlap = r.height ? Math.min(1, Math.max(0, (r.bottom - nr.top) / r.height)) : 0;
      var sv = (1 - overlap * 0.06).toFixed(4);
      if (cards[k].__s !== sv) { cards[k].__s = sv; cards[k].style.setProperty("--s", sv); }
    }
    if (line && lr && lr.height) {
      var p = Math.min(1, Math.max(0, (vh * 0.6 - lr.top) / lr.height)).toFixed(3);
      if (line.__p !== p) { line.__p = p; line.style.setProperty("--p", p); }
      for (var m = 0; m < steps.length; m++) {
        var lit = stepTops[m] < vh * 0.6;
        if (steps[m].__lit !== lit) { steps[m].__lit = lit; steps[m].classList.toggle("is-lit", lit); }
      }
    }
  }

  /* ---------- Before / After: Before · Compare · After switch ---------- */
  function initBaSwitch() {
    var wrap = document.querySelector("[data-ba-switch]");
    var slider = document.querySelector(".x-ba [data-before-after]");
    if (!wrap || !slider) return;
    var range = slider.querySelector(".before-after-range");
    var opts = Array.prototype.slice.call(wrap.querySelectorAll("[data-ba-set]"));
    var animTimer = 0;

    function mark(v) {
      var target = v >= 95 ? "100" : v <= 5 ? "0" : "50";
      opts.forEach(function (o) {
        var on = o.getAttribute("data-ba-set") === target;
        o.classList.toggle("is-on", on);
        o.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }

    opts.forEach(function (o) {
      o.addEventListener("click", function () {
        var v = Number(o.getAttribute("data-ba-set"));
        try { range.dispatchEvent(new Event("pointerdown")); } catch (e) {}
        if (!reduce) {
          slider.classList.add("is-animating");
          clearTimeout(animTimer);
          animTimer = setTimeout(function () { slider.classList.remove("is-animating"); }, 850);
          timers.push(animTimer);
        }
        range.value = String(v);
        slider.style.setProperty("--reveal", v + "%");
        mark(v);
      });
    });
    range.addEventListener("pointerdown", function () { slider.classList.remove("is-animating"); });
    range.addEventListener("input", function () {
      slider.classList.remove("is-animating");
      mark(Number(range.value));
    });
    mark(Number(range.value));
  }

  /* ---------- Why: 2×2 pillar cards + indicators ---------- */
  function initWhyCards() {
    var wrap = document.querySelector("[data-wcards]");
    if (!wrap) return;
    var cards = Array.prototype.slice.call(wrap.querySelectorAll("[data-wcard]"));
    var dotsWrap = document.querySelector("[data-wdots]");
    var dots = dotsWrap ? Array.prototype.slice.call(dotsWrap.querySelectorAll("[data-wdot]")) : [];
    var desktop = window.matchMedia("(min-width: 901px)");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var idx = 0, timer = 0, touched = false;

    function show(i) {
      idx = (i + cards.length) % cards.length;
      cards.forEach(function (c, j) {
        var on = j === idx;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-expanded", on ? "true" : "false");
      });
      dots.forEach(function (d, j) { d.classList.toggle("is-active", j === idx); });
    }
    function stop() { if (timer) { clearInterval(timer); timer = 0; } }
    function start() {
      if (timer || reduce || touched || !desktop.matches) return;
      timer = setInterval(function () { show(idx + 1); }, 5200);
    }

    cards.forEach(function (c, i) {
      c.addEventListener("mouseenter", function () { touched = true; stop(); if (desktop.matches) show(i); });
      c.addEventListener("focus", function () { touched = true; stop(); if (desktop.matches) show(i); });
      c.addEventListener("click", function () { touched = true; stop(); show(i); });
      c.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); touched = true; stop(); show(i); }
      });
    });
    dots.forEach(function (d, i) {
      d.addEventListener("click", function () { touched = true; stop(); show(i); });
    });

    show(0);
    start();
  }

  /* ---------- Reviews carousel ---------- */
  function initReviews() {
    var root = document.querySelector("[data-reviews]");
    if (!root) return;
    var slides = root.querySelectorAll("[data-slide]");
    var dots = root.querySelectorAll("[data-dot]");
    var DUR = 7000;
    var idx = 0, timer = 0, paused = false;
    root.style.setProperty("--x-dur", DUR / 1000 + "s");
    function show(i) {
      idx = (i + slides.length) % slides.length;
      slides.forEach(function (s, j) {
        s.classList.toggle("is-active", j === idx);
        if (j === idx) s.removeAttribute("aria-hidden"); else s.setAttribute("aria-hidden", "true");
      });
      dots.forEach(function (d, j) {
        d.classList.remove("is-active");
        d.classList.toggle("is-done", j < idx);
        if (d.tagName === "BUTTON") d.setAttribute("aria-pressed", j === idx ? "true" : "false");
      });
      var dot = dots[idx];
      if (dot) { void dot.offsetWidth; dot.classList.add("is-active"); }
      schedule();
    }
    function schedule() {
      clearTimeout(timer);
      if (reduce || paused) return;
      timer = setTimeout(function () { show(idx + 1); }, DUR);
      timers.push(timer);
    }
    var prev = root.querySelector("[data-prev]");
    var next = root.querySelector("[data-next]");
    if (prev) prev.addEventListener("click", function () { show(idx - 1); });
    if (next) next.addEventListener("click", function () { show(idx + 1); });
    dots.forEach(function (d, j) {
      d.addEventListener("click", function () { show(j); });
    });
    root.addEventListener("mouseenter", function () { paused = true; root.classList.add("is-paused"); clearTimeout(timer); });
    root.addEventListener("mouseleave", function () { paused = false; root.classList.remove("is-paused"); show(idx); });
    var sx = null;
    root.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    root.addEventListener("touchend", function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      sx = null;
      if (Math.abs(dx) < 40) return;
      var forward = dx < 0;
      if (document.documentElement.dir === "rtl") forward = !forward;
      show(idx + (forward ? 1 : -1));
    }, { passive: true });
    show(0);
  }

  /* ---------- Live clinic clock (Muscat time, Sat–Thu 9:00–21:00) ---------- */
  function initClock() {
    var root = document.querySelector("[data-clock]");
    if (!root) return;
    var timeEl = root.querySelector("[data-clock-time]");
    var openEl = root.querySelector("[data-open]");
    var closedEl = root.querySelector("[data-closed]");
    var rows = document.querySelectorAll(".x-hours [data-days]");
    var fmt, parts;
    try {
      fmt = new Intl.DateTimeFormat(lang === "ar" ? "ar-OM-u-nu-latn" : "en-US", { timeZone: "Asia/Muscat", hour: "numeric", minute: "2-digit" });
      parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Muscat", weekday: "short", hour: "numeric", hourCycle: "h23" });
    } catch (e) { return; }
    var DAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    function tick() {
      var now = new Date();
      var p = {};
      parts.formatToParts(now).forEach(function (x) { p[x.type] = x.value; });
      var day = DAYS[p.weekday];
      var hour = parseInt(p.hour, 10) % 24;
      var open = day !== 5 && hour >= 9 && hour < 21;
      if (timeEl) timeEl.textContent = fmt.format(now);
      if (openEl) openEl.hidden = !open;
      if (closedEl) closedEl.hidden = open;
      root.classList.toggle("is-closed", !open);
      rows.forEach(function (r) {
        var list = (r.getAttribute("data-days") || "").split(",").map(Number);
        r.classList.toggle("is-today", list.indexOf(day) !== -1);
      });
    }
    tick();
    timers.push(setInterval(tick, 15000));
  }

  /* ---------- Hero: portrait and badges drift with the pointer ---------- */
  function initHeroParallax() {
    var vis = document.querySelector("[data-hero-visual]");
    var hero = document.querySelector(".x-hero");
    if (!vis || !hero || reduce || !window.matchMedia("(hover: hover)").matches) return;
    var img = vis.querySelector(".x-hero__doctor");
    var floats = vis.querySelectorAll(".x-float");
    function move(x, y) {
      if (img) { img.style.setProperty("--hx", (x * 16).toFixed(1) + "px"); img.style.setProperty("--hy", (y * 8).toFixed(1) + "px"); }
      floats.forEach(function (f, i) {
        var k = (i + 1) * 10;
        f.style.setProperty("--fx", (-x * k).toFixed(1) + "px");
        f.style.setProperty("--fy", (-y * k * 0.6).toFixed(1) + "px");
      });
    }
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      move((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5);
    });
    hero.addEventListener("pointerleave", function () { move(0, 0); });
  }

  /* ---------- About: portrait tilts gently toward the pointer ---------- */
  function initTilt() {
    var box = document.querySelector("[data-tilt]");
    if (!box || reduce || !window.matchMedia("(hover: hover)").matches) return;
    box.addEventListener("pointermove", function (e) {
      var r = box.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      box.style.setProperty("--ry", (x * 10).toFixed(2) + "deg");
      box.style.setProperty("--rx", (-y * 8).toFixed(2) + "deg");
    });
    box.addEventListener("pointerleave", function () {
      box.style.setProperty("--ry", "0deg");
      box.style.setProperty("--rx", "0deg");
    });
  }


  /* ---------- Motion: staggered scroll entrances for every section after the hero ---------- */
  function initMotion() {
    var groups = [
      ".x-why__checks > li", ".x-train__facts > .x-train__fact",
      ".x-creds > .x-cred", ".x-miles > .x-mile", ".x-rev__people > .x-rev__person",
      ".x-hours > .x-hcard", ".x-ab__services > *"
    ];
    var items = [];
    groups.forEach(function (sel) {
      var n = 0;
      document.querySelectorAll(sel).forEach(function (el) {
        if (el.hasAttribute("data-reveal") || el.classList.contains("x-anim")) return;
        el.classList.add("x-anim");
        el.style.setProperty("--md", (Math.min(n, 7) * 0.09).toFixed(2) + "s");
        n++; items.push(el);
      });
    });
    var secs = Array.prototype.slice.call(document.querySelectorAll(".x-home .x-sec, .x-home .x-cta"));
    secs.forEach(function (s) { s.classList.add("x-msec"); });

    var ba = document.querySelector(".x-ba [data-before-after]");
    var baRange = ba && ba.querySelector(".before-after-range");
    var swept = false, touched = false;
    if (baRange) {
      ["pointerdown", "keydown", "touchstart"].forEach(function (ev) {
        baRange.addEventListener(ev, function () { touched = true; }, { passive: true });
      });
    }
    function sweep() {
      if (swept || touched || reduce || !baRange) return;
      swept = true;
      var keys = [[0, 50], [900, 18], [2000, 82], [2900, 50]];
      var t0 = 0;
      function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
      function frame(now) {
        if (touched) return;
        if (!t0) t0 = now;
        var t = now - t0, v = 50;
        for (var i = 1; i < keys.length; i++) {
          if (t <= keys[i][0]) {
            var a = keys[i - 1], b = keys[i];
            v = a[1] + (b[1] - a[1]) * ease((t - a[0]) / (b[0] - a[0]));
            break;
          }
        }
        baRange.value = String(v);
        ba.style.setProperty("--reveal", v + "%");
        if (t < keys[keys.length - 1][0]) raf = requestAnimationFrame(frame);
      }
      timers.push(setTimeout(function () { raf = requestAnimationFrame(frame); }, 700));
    }

    if (!("IntersectionObserver" in window) || reduce) {
      items.concat(secs).forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        if (ba && en.target.contains(ba)) sweep();
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
    items.concat(secs).forEach(function (el) { io.observe(el); });
    if (ba) io.observe(ba.parentElement);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

/* Homepage stays on its own: links to other site pages do nothing here.
   Same-page links (#…, language switch on the homepage), phone, WhatsApp,
   email and other external links keep working. */
(function () {
  "use strict";
  function isHome(path) { return /^\/(index\.html)?$/.test(path); }
  window.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest("a[href]");
    if (!link) return;
    var raw = link.getAttribute("href") || "";
    if (!raw || raw[0] === "#" || /^(?:mailto:|tel:)/i.test(raw)) return;
    var url;
    try { url = new URL(raw, window.location.href); } catch (e) { return; }
    if (url.origin !== window.location.origin) return;
    if (isHome(url.pathname)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
})();
