/* Signature theme behaviour: header state, mobile menu, scroll reveals and
   back-to-top. Safe to run again after js/speed.js swaps pages in place. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  function init() {
    var header = document.querySelector("[data-header]");
    var burger = document.querySelector("[data-burger]");
    var topBtn = document.querySelector("[data-top]");

    if (burger && header && !burger.__lm) {
      burger.__lm = true;
      burger.addEventListener("click", function () {
        var open = header.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }
    if (topBtn && !topBtn.__lm) {
      topBtn.__lm = true;
      topBtn.addEventListener("click", function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    // Scroll work runs at most once per frame, and the page height is only
    // measured on resize/load, so scrolling never forces an extra layout.
    var maxScroll = 1;
    function measure() {
      maxScroll = (document.documentElement.scrollHeight - window.innerHeight) || 1;
    }
    var lastHeader = null, lastTop = null, lastP = "";
    function onScroll() {
      window.__lmTick = 0;
      var y = window.scrollY || 0;
      var h = document.querySelector("[data-header]");
      var t = document.querySelector("[data-top]");
      var scrolled = y > 40, visible = y > 600;
      if (h && lastHeader !== scrolled) { h.classList.toggle("is-scrolled", scrolled); lastHeader = scrolled; }
      if (t && lastTop !== visible) { t.classList.toggle("is-visible", visible); lastTop = visible; }
      var pb = document.querySelector(".lm-progress");
      if (pb) {
        var p = Math.min(1, Math.max(0, y / maxScroll)).toFixed(3);
        if (p !== lastP) { pb.style.setProperty("--p", p); lastP = p; }
      }
    }
    window.__lmOnScroll = onScroll;
    window.__lmMeasure = measure;
    // Re-registered on every run (in-place page swaps drop page listeners);
    // the previous copies are removed first so they never stack up.
    if (window.__lmScrollFn) {
      window.removeEventListener("scroll", window.__lmScrollFn);
      window.removeEventListener("resize", window.__lmResizeFn);
    }
    window.__lmScrollFn = function () {
      if (window.__lmTick) return;
      window.__lmTick = requestAnimationFrame(function () { window.__lmOnScroll(); });
    };
    window.__lmResizeFn = function () { window.__lmMeasure(); window.__lmOnScroll(); };
    window.addEventListener("scroll", window.__lmScrollFn, { passive: true });
    window.addEventListener("resize", window.__lmResizeFn, { passive: true });
    if (document.readyState !== "complete") window.addEventListener("load", window.__lmResizeFn, { once: true });
    measure();
    onScroll();

    // Scroll progress beam
    var bar = document.querySelector(".lm-progress");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "lm-progress";
      bar.setAttribute("aria-hidden", "true");
      bar.appendChild(document.createElement("span"));
      document.body.appendChild(bar);
    }

    // Pointer spotlight on glass cards
    if (!window.__lmGlow && window.matchMedia && window.matchMedia("(hover: hover)").matches) {
      window.__lmGlow = true;
      var glowSel = ".h-tile, .s-card, .a-pillar, .h-review, .p-ticket, .a-cert, .a-step, .h-why__col, .a-tcard, .h-treat__item, .c-form, .c-tip";
      document.addEventListener("pointermove", function (e) {
        var card = e.target && e.target.closest ? e.target.closest(glowSel) : null;
        if (!card) return;
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      }, { passive: true });
    }

    var items = document.querySelectorAll("[data-reveal]:not(.is-in)");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    if (window.__lmObserver) window.__lmObserver.disconnect();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    window.__lmObserver = io;
    items.forEach(function (el) { io.observe(el); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  document.addEventListener("DOMContentLoaded", init);
})();
