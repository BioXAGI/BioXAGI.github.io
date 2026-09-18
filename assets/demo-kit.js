/* Shared toolkit for the per-project demos.
   No dependencies. Everything deterministic — seeded RNG, no Math.random —
   so a demo looks identical on every load and in screenshots. */

window.DEMOS = window.DEMOS || {};

var DemoKit = (function () {
  "use strict";

  var SVGNS = "http://www.w3.org/2000/svg";

  /* ---------- DOM ---------- */

  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    apply(n, attrs);
    append(n, kids);
    return n;
  }

  function s(tag, attrs, kids) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs || {}) {
      if (k === "text") n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    append(n, kids);
    return n;
  }

  function apply(n, attrs) {
    for (var k in attrs || {}) {
      var v = attrs[k];
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k === "html") n.innerHTML = v;
      else if (k === "style") n.setAttribute("style", v);
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), v);
      else if (k.slice(0, 5) === "data-" || k.slice(0, 5) === "aria-") n.setAttribute(k, v);
      else n[k] = v;
    }
  }

  function append(n, kids) {
    if (kids == null) return;
    (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
      if (c == null) return;
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
  }

  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); return n; }

  /* ---------- math ---------- */

  /* mulberry32 — small, fast, deterministic. Same seed, same demo, every time. */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Box–Muller on a seeded stream, for plausible-looking expression values. */
  function gauss(rand) {
    var u = 1 - rand(), v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  var clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var round = function (v, d) { var m = Math.pow(10, d || 0); return Math.round(v * m) / m; };
  var pct = function (v) { return (v * 100).toFixed(0) + "%"; };

  /* easeOutCubic — the only easing these demos need */
  function ease(t) { return 1 - Math.pow(1 - clamp(t, 0, 1), 3); }

  /* ---------- ticker ----------
     One rAF loop for the whole page. Demos register while open and
     unregister when collapsed, so hidden demos cost nothing. */

  var subs = [], raf = null, last = 0;

  function frame(now) {
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    for (var i = subs.length - 1; i >= 0; i--) {
      try { subs[i](dt, now / 1000); } catch (e) { subs.splice(i, 1); }
    }
    raf = subs.length ? requestAnimationFrame(frame) : (last = 0, null);
  }

  function tick(fn) {
    subs.push(fn);
    if (!raf) raf = requestAnimationFrame(frame);
    return function stop() {
      var i = subs.indexOf(fn);
      if (i >= 0) subs.splice(i, 1);
    };
  }

  /* ---------- UI atoms ---------- */

  function toolbar(kids) { return h("div", { class: "dk-bar" }, kids); }

  function segmented(opts, initial, onChange) {
    var wrap = h("div", { class: "dk-seg", role: "group" });
    var value = initial != null ? initial : opts[0].id;
    opts.forEach(function (o) {
      var b = h("button", {
        type: "button", text: o.label, title: o.title || "",
        "aria-pressed": String(o.id === value),
        onclick: function () {
          value = o.id;
          Array.prototype.forEach.call(wrap.children, function (c, i) {
            c.setAttribute("aria-pressed", String(opts[i].id === value));
          });
          onChange(value);
        }
      });
      wrap.appendChild(b);
    });
    wrap.setValue = function (v) {
      value = v;
      Array.prototype.forEach.call(wrap.children, function (c, i) {
        c.setAttribute("aria-pressed", String(opts[i].id === v));
      });
    };
    return wrap;
  }

  function toggles(opts, onChange) {
    var state = {};
    var wrap = h("div", { class: "dk-seg" });
    opts.forEach(function (o) {
      state[o.id] = !!o.on;
      var b = h("button", {
        type: "button", text: o.label, "aria-pressed": String(state[o.id]),
        onclick: function () {
          state[o.id] = !state[o.id];
          b.setAttribute("aria-pressed", String(state[o.id]));
          onChange(state);
        }
      });
      wrap.appendChild(b);
    });
    wrap.state = state;
    return wrap;
  }

  function slider(cfg, onInput) {
    var out = h("output", { class: "dk-out", text: cfg.format ? cfg.format(cfg.value) : cfg.value });
    var input = h("input", {
      type: "range", min: cfg.min, max: cfg.max, step: cfg.step || 1, value: cfg.value,
      oninput: function () {
        var v = parseFloat(input.value);
        out.textContent = cfg.format ? cfg.format(v) : v;
        onInput(v);
      }
    });
    var wrap = h("label", { class: "dk-slider" }, [
      h("span", { class: "dk-lab", text: cfg.label }), input, out
    ]);
    wrap.input = input;
    return wrap;
  }

  function readout(fields) {
    var wrap = h("div", { class: "dk-read" });
    var cells = {};
    fields.forEach(function (f) {
      var v = h("b", { text: "—" });
      cells[f.id] = v;
      wrap.appendChild(h("div", { class: "dk-read-cell" }, [v, h("span", { text: f.label })]));
    });
    wrap.set = function (id, value, tone) {
      var c = cells[id];
      if (!c) return;
      c.textContent = value;
      c.className = tone ? "tone-" + tone : "";
    };
    return wrap;
  }

  function note(text) { return h("p", { class: "dk-note", text: text }); }

  function stage(attrs) {
    return s("svg", Object.assign({ class: "dk-stage", xmlns: SVGNS }, attrs || {}));
  }

  /* A play/pause/step transport for the step-through demos. */
  function transport(cfg) {
    var playing = false, stop = null, acc = 0;
    var playBtn = h("button", { type: "button", class: "dk-play", text: "Play" });

    function setPlaying(v) {
      playing = v;
      playBtn.textContent = v ? "Pause" : "Play";
      if (v && !stop) {
        acc = 0;
        stop = tick(function (dt) {
          acc += dt;
          if (acc >= (cfg.interval || 1.1)) { acc = 0; if (!cfg.step()) setPlaying(false); }
        });
      } else if (!v && stop) { stop(); stop = null; }
    }

    playBtn.addEventListener("click", function () { setPlaying(!playing); });

    var bar = h("div", { class: "dk-bar" }, [
      playBtn,
      h("button", { type: "button", text: "Step", onclick: function () { setPlaying(false); cfg.step(); } }),
      h("button", { type: "button", text: "Reset", onclick: function () { setPlaying(false); cfg.reset(); } })
    ]);
    bar.stop = function () { setPlaying(false); };
    bar.autoplay = function () { setPlaying(true); };
    return bar;
  }

  /* Palette — sampled from the site's academic-light theme plus data hues. */
  var C = {
    navy: "#1f4e79", navyDark: "#16385a", wash: "#eef3f8",
    ink: "#16191d", soft: "#4a5158", faint: "#757d85",
    rule: "#e2e2dc", paper: "#ffffff", alt: "#fbfbf8",
    good: "#2e7d5b", warn: "#b06a1f", bad: "#a63d3d",
    series: ["#1f4e79", "#2e7d5b", "#b06a1f", "#7b4b8a", "#a63d3d", "#3f7f92"]
  };

  return {
    h: h, s: s, clear: clear, apply: apply,
    rng: rng, gauss: gauss, clamp: clamp, lerp: lerp, round: round, pct: pct, ease: ease,
    tick: tick,
    toolbar: toolbar, segmented: segmented, toggles: toggles, slider: slider,
    readout: readout, note: note, stage: stage, transport: transport,
    C: C
  };
})();
