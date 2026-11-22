/* Home hero motion layer: letter-by-letter title, gold dust, a soft
   spotlight and depth that follow the pointer, magnetic buttons and a
   gentle scroll parallax. Only transform/opacity are touched, so it stays
   smooth. Safe to run again after js/speed.js swaps pages in place. */
(function () {
  "use strict";
  if (window.__xHeroFxCleanup) { try { window.__xHeroFxCleanup(); } catch (e) {} }
  var offs = [];
  var raf = 0;
  var scrollRaf = 0;
  function on(el, ev, fn, opt) {
    el.addEventListener(ev, fn, opt);
    offs.push(function () { el.removeEventListener(ev, fn, opt); });
  }
  window.__xHeroFxCleanup = function () {
    offs.forEach(function (f) { f(); });
    offs = [];
    if (raf) cancelAnimationFrame(raf);
    if (scrollRaf) cancelAnimationFrame(scrollRaf);
    raf = scrollRaf = 0;
  };

  var hero = document.querySelector(".page-index .x-hero");
  if (!hero) return;
  var stage = hero.querySelector(".x-stage");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var rtl = document.documentElement.getAttribute("dir") === "rtl";
  var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var phone = window.matchMedia && window.matchMedia("(max-width: 700px)").matches;
  if (reduce || !stage) return;
  hero.classList.add("fx-on");

  /* ---- Title: first line rises letter by letter (Latin scripts only) ---- */
  (function splitTitle() {
    if (rtl) return;
    var line = hero.querySelector(".x-hero__title .x-line > span:not(.x-fx-chars)");
    if (!line || line.querySelector(".x-fx-c")) return;
    var text = line.textContent || "";
    if (!text.trim()) return;
    var sr = document.createElement("span");
    sr.className = "x-fx-sr";
    sr.textContent = text;
    var box = document.createElement("span");
    box.setAttribute("aria-hidden", "true");
    var i = 0;
    text.split(/(\s+)/).forEach(function (part) {
      if (!part) return;
      if (/^\s+$/.test(part)) { box.appendChild(document.createTextNode(" ")); return; }
      var w = document.createElement("span");
      w.className = "x-fx-w";
      Array.from(part).forEach(function (ch) {
        var c = document.createElement("span");
        c.className = "x-fx-c";
        c.style.setProperty("--i", String(i++));
        c.textContent = ch;
        w.appendChild(c);
      });
      box.appendChild(w);
    });
    line.textContent = "";
    line.appendChild(sr);
    line.appendChild(box);
    line.classList.add("x-fx-chars");
  })();

  /* ---- More gold dust drifting up through the stage ---- */
  (function dust() {
    var host = hero.querySelector(".x-stage__sparks");
    if (!host || host.querySelector("[data-fx]")) return;
    var n = phone ? 6 : 18;
    for (var k = 0; k < n; k++) {
      var d = document.createElement("i");
      d.setAttribute("data-fx", "");
      d.style.setProperty("--l", (Math.random() * 100).toFixed(1) + "%");
      d.style.setProperty("--t", (Math.random() * 9).toFixed(2) + "s");
      d.style.setProperty("--s", (1 + Math.random() * 3).toFixed(1) + "px");
      d.style.setProperty("--dx", ((Math.random() - 0.5) * 80).toFixed(0) + "px");
      d.style.setProperty("--dur", (8 + Math.random() * 8).toFixed(1) + "s");
      host.appendChild(d);
    }
  })();

  /* ---- Pointer: spotlight follows, layers shift for depth ---- */
  (function pointer() {
    if (!fine) return;
    var spot = hero.querySelector(".x-fx-spot");
    var tx = 0, ty = 0, cx = 0, cy = 0, px = 0, py = 0, cpx = 0, cpy = 0;
    function loop() {
      cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
      cpx += (px - cpx) * 0.08; cpy += (py - cpy) * 0.08;
      if (spot) spot.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
      hero.style.setProperty("--px", cpx.toFixed(3));
      hero.style.setProperty("--py", cpy.toFixed(3));
      if (Math.abs(tx - cx) + Math.abs(ty - cy) + Math.abs(px - cpx) * 100 + Math.abs(py - cpy) * 100 > 0.4) {
        raf = requestAnimationFrame(loop);
      } else { raf = 0; }
    }
    function kick() { if (!raf) raf = requestAnimationFrame(loop); }
    on(hero, "pointermove", function (e) {
      var r = stage.getBoundingClientRect();
      tx = e.clientX - r.left; ty = e.clientY - r.top;
      px = tx / r.width - 0.5; py = ty / r.height - 0.5;
      if (!hero.classList.contains("is-lit")) { cx = tx; cy = ty; hero.classList.add("is-lit"); }
      kick();
    });
    on(hero, "pointerleave", function () { hero.classList.remove("is-lit"); px = py = 0; kick(); });
  })();

  /* ---- Buttons lean toward the cursor ---- */
  (function magnets() {
    if (!fine) return;
    hero.querySelectorAll(".x-hero__cta > a").forEach(function (a) {
      on(a, "pointermove", function (e) {
        var r = a.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        a.style.transform = "translate3d(" + (dx * 0.18).toFixed(1) + "px," + (dy * 0.3).toFixed(1) + "px,0)";
      });
      on(a, "pointerleave", function () { a.style.transform = ""; });
    });
  })();

  /* ---- Scroll: copy lifts away fast, portrait drifts up slower ---- */
  (function parallax() {
    var copy = hero.querySelector(".x-stage__copy");
    var photo = hero.querySelector(".x-stage__photo");
    var stats = hero.querySelector(".x-stage__stats");
    var wide = window.matchMedia("(min-width: 1100px)");
    function apply() {
      scrollRaf = 0;
      if (!wide.matches) {
        /* stacked phone/tablet layout: the stats sit low, so no fading */
        [copy, photo, stats].forEach(function (el) { if (el) { el.style.transform = ""; el.style.opacity = ""; } });
        return;
      }
      var h = hero.offsetHeight || 1;
      var y = Math.min(Math.max(window.scrollY || 0, 0), h);
      var p = y / h;
      if (copy) { copy.style.transform = y ? "translate3d(0," + (-y * 0.18).toFixed(1) + "px,0)" : ""; copy.style.opacity = y ? String(Math.max(0, 1 - p * 1.25).toFixed(3)) : ""; }
      if (photo) photo.style.transform = y ? "translate3d(0," + (-y * 0.06).toFixed(1) + "px,0)" : "";
      if (stats) { stats.style.transform = y ? "translate3d(0," + (-y * 0.08).toFixed(1) + "px,0)" : ""; stats.style.opacity = y ? String(Math.max(0, 1 - p * 1.1).toFixed(3)) : ""; }
      hero.style.setProperty("--sp", p.toFixed(3));
    }
    function req() { if (!scrollRaf) scrollRaf = requestAnimationFrame(apply); }
    on(window, "scroll", req, { passive: true });
    on(window, "resize", req, { passive: true });
    apply();
  })();
})();
