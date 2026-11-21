/* Smooth-scroll guard, shared by every public page.
   The pages run many looping decorations (glows, shimmers, marquees, rings).
   Painting them while the page scrolls is what made scrolling stutter, so:
   - while the visitor scrolls, every looping animation is paused;
   - when scrolling stops, only loops near the screen resume, the rest stay
     paused until they scroll into view.
   One-off entrance animations are never touched. Lives under /js/lib/ so
   js/speed.js keeps its listeners across in-place page swaps. */
(function () {
  "use strict";
  if (window.__PERF__) return;
  window.__PERF__ = true;
  if (!document.getAnimations) return;

  var paused = new Set();
  var scrolling = false;
  var idle = 0;
  var HOVER_PAUSE = ".h-ribbon, .h-reviews__marquee, .x-tr__marquee";
  var hoverBox = null;

  function loops() {
    return document.getAnimations().filter(function (a) {
      try {
        var t = a.effect && a.effect.getTiming();
        return !!t && t.iterations === Infinity;
      } catch (e) {
        return false;
      }
    });
  }

  function pause(a) {
    if (a.playState === "running") {
      a.pause();
      paused.add(a);
    }
  }

  function settle() {
    scrolling = false;
    var vh = window.innerHeight || 800;
    var margin = vh * 0.5;
    var list = loops();
    var live = new Set(list);
    paused.forEach(function (a) { if (!live.has(a)) paused.delete(a); });
    var rects = list.map(function (a) {
      var el = a.effect && a.effect.target;
      return el && el.isConnected ? el.getBoundingClientRect() : null;
    });
    list.forEach(function (a, i) {
      var r = rects[i];
      var near = !!r && r.bottom > -margin && r.top < vh + margin;
      var el = a.effect && a.effect.target;
      var held = hoverBox && el && hoverBox.contains(el);
      if (near && !held) {
        if (paused.has(a)) {
          paused.delete(a);
          a.play();
        }
      } else {
        pause(a);
      }
    });
  }

  var lastSweep = 0;
  function onScroll() {
    var now = Date.now();
    // Pause on the first scroll event, then re-check a few times a second
    // for loops that started mid-scroll (e.g. a card that just appeared).
    if (!scrolling || now - lastSweep > 300) {
      scrolling = true;
      lastSweep = now;
      loops().forEach(pause);
    }
    clearTimeout(idle);
    idle = setTimeout(settle, 160);
  }

  // Marquees pause while hovered (their CSS hover rule stops applying once
  // an animation has been paused/played from script, so do it here).
  function hover(event, on) {
    var t = event.target;
    var box = t && t.closest ? t.closest(HOVER_PAUSE) : null;
    if (!box) return;
    if (!on && event.relatedTarget && box.contains(event.relatedTarget)) return;
    hoverBox = on ? box : null;
    loops().forEach(function (a) {
      var el = a.effect && a.effect.target;
      if (!el || !box.contains(el)) return;
      if (on) pause(a);
      else if (paused.has(a) && !scrolling) {
        paused.delete(a);
        a.play();
      }
    });
  }

  // Card photos (data-lazy-bg) load shortly before they scroll into view.
  function showBg(el) {
    var url = el.getAttribute("data-lazy-bg");
    el.removeAttribute("data-lazy-bg");
    if (url) el.style.backgroundImage = "url('" + url + "')";
  }
  var bgObserver = null;
  function lazyBackgrounds() {
    var list = document.querySelectorAll("[data-lazy-bg]");
    if (!list.length) return;
    if (!("IntersectionObserver" in window)) { list.forEach(showBg); return; }
    if (bgObserver) bgObserver.disconnect();
    bgObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        bgObserver.unobserve(en.target);
        showBg(en.target);
      });
    }, { rootMargin: "900px 0px" });
    list.forEach(function (el) { bgObserver.observe(el); });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  document.addEventListener("pointerover", function (e) { hover(e, true); }, { passive: true });
  document.addEventListener("pointerout", function (e) { hover(e, false); }, { passive: true });
  // Initial load and every in-place page swap (speed.js re-fires it).
  document.addEventListener("DOMContentLoaded", function () { lazyBackgrounds(); setTimeout(settle, 300); });
  lazyBackgrounds();
  window.addEventListener("load", function () { setTimeout(settle, 300); });
  if (document.readyState !== "loading") setTimeout(settle, 300);
})();
