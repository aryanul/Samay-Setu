/* Samay Setu — shared marketing-site behavior */
(function () {
  "use strict";

  /* Nav: shadow on scroll + mobile toggle */
  var navWrap = document.querySelector(".nav-wrap");
  var toggle = document.querySelector(".nav-toggle");
  function onScroll() {
    if (navWrap) navWrap.classList.toggle("scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toggle) {
    toggle.addEventListener("click", function () {
      document.body.classList.toggle("nav-open");
    });
    document.querySelectorAll(".nav-links a").forEach(function (a) {
      a.addEventListener("click", function () {
        document.body.classList.remove("nav-open");
      });
    });
    // Tap the scrim / outside the drawer to close
    document.addEventListener("click", function (e) {
      if (!document.body.classList.contains("nav-open")) return;
      if (e.target.closest(".nav-links") || e.target.closest(".nav-toggle")) return;
      document.body.classList.remove("nav-open");
    });
    // Escape closes
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") document.body.classList.remove("nav-open");
    });
  }

  /* Scroll reveal */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* FAQ accordion */
  document.querySelectorAll(".faq-q").forEach(function (q) {
    q.addEventListener("click", function () {
      var item = q.closest(".faq-item");
      var open = item.classList.contains("open");
      // single-open behaviour within a group
      var group = q.closest(".faq-list");
      if (group) group.querySelectorAll(".faq-item.open").forEach(function (i) { if (i !== item) i.classList.remove("open"); });
      item.classList.toggle("open", !open);
      q.setAttribute("aria-expanded", String(!open));
    });
  });

  /* Count-up for figures with data-count */
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && counters.length) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var target = parseFloat(el.getAttribute("data-count"));
        var pad = el.getAttribute("data-pad") === "1";
        var dur = 1100, start = null;
        function step(ts) {
          if (start === null) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          var val = Math.round(target * eased);
          el.textContent = pad && val < 10 ? "0" + val : String(val);
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        co.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { co.observe(el); });
  }
})();
