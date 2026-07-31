/* LinkPeople - interaction layer (vanilla, no dependencies) */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Sticky header background on scroll ---------- */
  var header = document.getElementById("siteHeader");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Mobile navigation (accessible) ---------- */
  var toggle = document.getElementById("navToggle");
  var panel = document.getElementById("mobileNav");
  if (toggle && panel) {
    var lastFocus = null;
    var focusable = function () {
      return Array.prototype.slice.call(panel.querySelectorAll('a[href], button:not([disabled])'));
    };
    var openNav = function () {
      lastFocus = document.activeElement;
      document.body.classList.add("nav-open");
      document.body.style.overflow = "hidden";
      toggle.setAttribute("aria-expanded", "true");
      var f = focusable(); if (f.length) f[0].focus();
    };
    var closeNav = function () {
      document.body.classList.remove("nav-open");
      document.body.style.overflow = "";
      toggle.setAttribute("aria-expanded", "false");
      if (lastFocus) lastFocus.focus();
    };
    toggle.addEventListener("click", function () {
      document.body.classList.contains("nav-open") ? closeNav() : openNav();
    });
    panel.addEventListener("click", function (e) { if (e.target.closest("a")) closeNav(); });
    document.addEventListener("keydown", function (e) {
      if (!document.body.classList.contains("nav-open")) return;
      if (e.key === "Escape") { closeNav(); }
      if (e.key === "Tab") {
        var f = focusable(); if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) { el.classList.add("in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
      }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
      revealEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- Role selector tabs (accessible) ---------- */
  function buildRoleSelector() {
    var mount = document.getElementById("roleSelector");
    if (!mount || !window.LP || !window.LP.roleGroups) return;
    var groups = window.LP.roleGroups;
    var tabsWrap = document.createElement("div");
    tabsWrap.className = "role-tabs"; tabsWrap.setAttribute("role", "tablist");
    tabsWrap.setAttribute("aria-label", "Role categories");
    var panelsWrap = document.createElement("div");

    groups.forEach(function (g, i) {
      var tab = document.createElement("button");
      tab.className = "role-tab"; tab.type = "button"; tab.id = "tab-" + g.id;
      tab.setAttribute("role", "tab"); tab.setAttribute("aria-controls", "panel-" + g.id);
      tab.setAttribute("aria-selected", i === 0 ? "true" : "false");
      tab.tabIndex = i === 0 ? 0 : -1; tab.textContent = g.label;
      tabsWrap.appendChild(tab);

      var p = document.createElement("div");
      p.className = "role-panel"; p.id = "panel-" + g.id;
      p.setAttribute("role", "tabpanel"); p.setAttribute("aria-labelledby", "tab-" + g.id);
      if (i !== 0) p.hidden = true;
      var ul = document.createElement("ul"); ul.className = "role-list";
      g.roles.forEach(function (r) { var li = document.createElement("li"); li.textContent = r; ul.appendChild(li); });
      p.appendChild(ul);
      panelsWrap.appendChild(p);
    });
    mount.appendChild(tabsWrap); mount.appendChild(panelsWrap);

    var tabs = Array.prototype.slice.call(tabsWrap.querySelectorAll('[role="tab"]'));
    function select(idx) {
      tabs.forEach(function (t, i) {
        var on = i === idx;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
    }
    tabsWrap.addEventListener("click", function (e) {
      var t = e.target.closest('[role="tab"]'); if (!t) return;
      select(tabs.indexOf(t)); t.focus();
    });
    tabsWrap.addEventListener("keydown", function (e) {
      var i = tabs.indexOf(document.activeElement); if (i < 0) return;
      var n = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (i + 1) % tabs.length;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") n = 0; else if (e.key === "End") n = tabs.length - 1;
      if (n !== null) { e.preventDefault(); tabs[n].focus(); select(n); }
    });
  }
  buildRoleSelector();

  /* ---------- Insights cards (data-driven) ---------- */
  (function () {
    var mount = document.getElementById("insightsGrid");
    if (!mount || !window.LP || !window.LP.insights) return;
    window.LP.insights.forEach(function (a) {
      var art = document.createElement("article");
      art.className = "card article-card reveal";
      art.innerHTML =
        '<span class="a-cat">' + a.category + '</span>' +
        '<h3 class="a-title">' + a.title + '</h3>' +
        '<p class="muted">' + a.summary + '</p>' +
        '<div class="a-foot"><span class="link-arrow">Article coming soon <span class="arrow" aria-hidden="true">\u2192</span></span></div>';
      mount.appendChild(art);
    });
  })();

  /* ---------- Abstract "connections" visual (lightweight canvas) ---------- */
  (function () {
    var canvas = document.getElementById("connections");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, nodes = [], raf = null, mouse = { x: -9999, y: -9999, on: false };
    var fine = window.matchMedia("(pointer: fine)").matches;

    function size() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function build() {
      var count = W < 560 ? 8 : 12;
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.14, vy: (Math.random() - 0.5) * 0.14,
          r: Math.random() * 1.6 + 1.4,
          accent: i === 2 || i === Math.floor(count / 2) + 1, // one or two accent nodes
        });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      // links
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var a = nodes[i], b = nodes[j];
          var dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
          var max = W < 560 ? 150 : 200;
          if (d < max) {
            var alpha = (1 - d / max) * 0.16;
            ctx.strokeStyle = "rgba(255,255,255," + alpha.toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      // nodes
      nodes.forEach(function (n) {
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.accent ? "rgba(184,255,74,0.9)" : "rgba(214,222,230,0.55)";
        ctx.fill();
        if (n.accent) { ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 4, 0, Math.PI * 2); ctx.strokeStyle = "rgba(184,255,74,0.22)"; ctx.lineWidth = 1; ctx.stroke(); }
      });
    }
    function step() {
      nodes.forEach(function (n) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        if (mouse.on && fine) {
          var dx = n.x - mouse.x, dy = n.y - mouse.y, d = Math.hypot(dx, dy);
          if (d < 90 && d > 0.01) { n.x += (dx / d) * (1 - d / 90) * 0.6; n.y += (dy / d) * (1 - d / 90) * 0.6; }
        }
      });
      draw();
      raf = requestAnimationFrame(step);
    }
    function start() { if (!raf) step(); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    size(); build(); draw();
    if (!reduceMotion) {
      start();
      if (fine) {
        canvas.addEventListener("pointermove", function (e) { var r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true; });
        canvas.addEventListener("pointerleave", function () { mouse.on = false; });
      }
      // pause when off-screen
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (en) { en[0].isIntersecting ? start() : stop(); }, { threshold: 0.01 }).observe(canvas);
      }
    }
    var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { size(); build(); if (reduceMotion) draw(); }, 200); });
  })();

  /* ---------- Forms: validation + honest submission adapter ---------- */
  /* TODO: connect a backend (Formspree / Resend / your API) by setting FORM_ENDPOINT.
     While empty, forms validate fully and fall back to a prefilled mailto - they never
     show a fake "sent" state. File uploads require a real backend (see note below). */
  var FORM_ENDPOINT = ""; // e.g. "https://formspree.io/f/xxxxxxx"
  var CONTACT_EMAIL = "hello@linkpeople.agency";

  function setError(field, msg) {
    var input = field.querySelector("input, select, textarea");
    var err = field.querySelector(".err");
    if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
    if (err) err.textContent = msg || "";
  }
  function validateField(field) {
    var input = field.querySelector("input, select, textarea");
    if (!input) return true;
    var val = (input.value || "").trim();
    if (input.hasAttribute("required")) {
      if (input.type === "checkbox" && !input.checked) { setError(field, "Please confirm to continue."); return false; }
      if (input.type !== "checkbox" && !val) { setError(field, "This field is required."); return false; }
    }
    if (input.type === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { setError(field, "Enter a valid email address."); return false; }
    if (input.type === "url" && val && !/^https?:\/\/.+\..+/.test(val)) { setError(field, "Enter a valid URL (including https://)."); return false; }
    setError(field, ""); return true;
  }

  document.querySelectorAll("form[data-lp-form]").forEach(function (form) {
    var fields = Array.prototype.slice.call(form.querySelectorAll(".field, .consent"));
    var status = form.querySelector(".form-status");

    fields.forEach(function (field) {
      var input = field.querySelector("input, select, textarea");
      if (!input) return;
      input.addEventListener("blur", function () { validateField(field); });
      input.addEventListener("input", function () { if (input.getAttribute("aria-invalid") === "true") validateField(field); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true, firstBad = null;
      fields.forEach(function (field) { if (!validateField(field) && ok) { ok = false; firstBad = field; } else if (!validateField(field)) { ok = false; } });
      if (!ok) {
        if (status) { status.className = "form-status show error"; status.textContent = "Please correct the highlighted fields."; }
        if (firstBad) { var fi = firstBad.querySelector("input, select, textarea"); if (fi) fi.focus(); }
        return;
      }

      if (FORM_ENDPOINT) {
        // Real submission path (enabled once FORM_ENDPOINT is set).
        var fd = new FormData(form);
        fetch(FORM_ENDPOINT, { method: "POST", body: fd, headers: { Accept: "application/json" } })
          .then(function (r) {
            if (r.ok) { form.reset(); status.className = "form-status show info"; status.textContent = "Thank you - your message has been sent. We'll be in touch shortly."; }
            else throw new Error("bad status");
          })
          .catch(function () { status.className = "form-status show error"; status.textContent = "Something went wrong sending the form. Please email " + CONTACT_EMAIL + "."; });
        return;
      }

      // No backend configured yet - do NOT fake success. Offer a working mailto fallback.
      var subject = encodeURIComponent(form.getAttribute("data-subject") || "Enquiry via linkpeople.agency");
      var lines = [];
      fields.forEach(function (field) {
        var input = field.querySelector("input, select, textarea");
        if (!input || input.type === "checkbox" || input.type === "file") return;
        var label = field.querySelector("label");
        var name = label ? label.textContent.replace("*", "").trim() : input.name;
        if ((input.value || "").trim()) lines.push(name + ": " + input.value.trim());
      });
      var hasFile = form.querySelector('input[type="file"]');
      if (hasFile && hasFile.files && hasFile.files.length) {
        lines.push("(CV attached in form - please attach the file manually to this email.)");
      }
      var body = encodeURIComponent(lines.join("\n"));
      if (status) {
        status.className = "form-status show info";
        var mailtoHref = "mailto:" + CONTACT_EMAIL + "?subject=" + subject + "&body=" + body;
        var link = document.createElement("a");
        link.className = "link-underline";
        link.style.color = "var(--accent)";
        link.href = mailtoHref;
        link.textContent = "Send this enquiry by email instead \u2192";
        status.textContent = "This site isn't connected to a form service yet, so nothing was submitted automatically. ";
        status.appendChild(link);
      }
    });
  });
})();
