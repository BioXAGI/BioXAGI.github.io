/* Target discovery & immuno-oncology demos.
   Simulated data only — seeded, deterministic, illustrative of the method
   rather than reproductions of any real result. */

(function (K) {
  "use strict";
  var h = K.h, s = K.s, C = K.C;

  /* ============================================================
     antigen-combos — Boolean antigen gate explorer
     Toggle a gate, move the positivity threshold, watch tumor coverage
     trade off against normal-tissue hits. Patients are rows, and the
     last three are held out from discovery.
     ============================================================ */

  window.DEMOS["antigen-combos"] = function (root) {
    var COLS = 12, PAT = 8, DISCOVERY = 5, NORM_ROWS = 8, NORM_COLS = 10;
    var rand = K.rng(20260831);

    function draw(mu, sd) { return K.clamp(mu + K.gauss(rand) * sd, 0, 1); }

    var tumor = [], normal = [];
    for (var p = 0; p < PAT; p++) {
      var row = [];
      // Per-patient shift: antigen prevalence genuinely varies between patients,
      // which is the whole reason discovery has to be patient-separated.
      var shift = (rand() - 0.5) * 0.36;
      for (var i = 0; i < COLS; i++) {
        row.push({ A: draw(0.68 + shift, 0.20), B: draw(0.60 + shift, 0.22), C: draw(0.25, 0.17) });
      }
      tumor.push(row);
    }
    for (var r = 0; r < NORM_ROWS; r++) {
      var nrow = [];
      for (var j = 0; j < NORM_COLS; j++) {
        nrow.push({ A: draw(0.40, 0.20), B: draw(0.26, 0.17), C: draw(0.66, 0.19) });
      }
      normal.push(nrow);
    }

    var GATES = [
      { id: "A", label: "A", fn: function (c, t) { return c.A >= t; } },
      { id: "AB", label: "A AND B", fn: function (c, t) { return c.A >= t && c.B >= t; } },
      { id: "AorB", label: "A OR B", fn: function (c, t) { return c.A >= t || c.B >= t; } },
      { id: "AnotC", label: "A AND NOT C", fn: function (c, t) { return c.A >= t && c.C < t; } },
      { id: "ABnotC", label: "A AND B AND NOT C", fn: function (c, t) { return c.A >= t && c.B >= t && c.C < t; } }
    ];

    var gate = GATES[1], thresh = 0.5;

    var svg = K.stage({ viewBox: "0 0 340 150" });
    var tumorCells = [], normalCells = [], patDots = [];

    svg.appendChild(s("text", { x: 8, y: 12, class: "lab-hd", text: "TUMOR — rows are patients" }));
    svg.appendChild(s("text", { x: 196, y: 12, class: "lab-hd", text: "NORMAL EPITHELIUM" }));

    for (p = 0; p < PAT; p++) {
      // Held-out patients sit below a gap so the split is visible.
      var yBase = 22 + p * 11 + (p >= DISCOVERY ? 7 : 0);
      var prow = [];
      for (i = 0; i < COLS; i++) {
        var rect = s("rect", {
          x: 8 + i * 10, y: yBase, width: 8, height: 8, rx: 1,
          fill: C.rule, stroke: "none"
        });
        prow.push(rect);
        svg.appendChild(rect);
      }
      tumorCells.push(prow);
      var dot = s("circle", { cx: 136, cy: yBase + 4, r: 3, fill: C.rule });
      patDots.push(dot);
      svg.appendChild(dot);
      svg.appendChild(s("text", {
        x: 143, y: yBase + 6.5, class: "lab-sm",
        text: "P" + (p + 1) + (p >= DISCOVERY ? " · held out" : "")
      }));
    }

    svg.appendChild(s("line", {
      x1: 8, y1: 22 + DISCOVERY * 11 + 2, x2: 178, y2: 22 + DISCOVERY * 11 + 2,
      stroke: C.faint, "stroke-width": 0.6, "stroke-dasharray": "2 2"
    }));

    for (r = 0; r < NORM_ROWS; r++) {
      var nr = [];
      for (j = 0; j < NORM_COLS; j++) {
        var nrect = s("rect", {
          x: 196 + j * 10, y: 22 + r * 11, width: 8, height: 8, rx: 1, fill: C.rule
        });
        nr.push(nrect);
        svg.appendChild(nrect);
      }
      normalCells.push(nr);
    }

    var out = K.readout([
      { id: "disc", label: "Discovery cov." },
      { id: "test", label: "Held-out cov." },
      { id: "off", label: "Normal hit" },
      { id: "sel", label: "Selectivity" },
      { id: "pats", label: "Patients ≥50%" }
    ]);

    function recompute() {
      var discHit = 0, discTot = 0, testHit = 0, testTot = 0, patsOk = 0;
      for (var p = 0; p < PAT; p++) {
        var rowHit = 0;
        for (var i = 0; i < COLS; i++) {
          var on = gate.fn(tumor[p][i], thresh);
          tumorCells[p][i].setAttribute("fill", on ? C.navy : C.rule);
          if (on) rowHit++;
        }
        var frac = rowHit / COLS;
        if (frac >= 0.5) patsOk++;
        patDots[p].setAttribute("fill", frac >= 0.5 ? C.good : C.rule);
        if (p < DISCOVERY) { discHit += rowHit; discTot += COLS; }
        else { testHit += rowHit; testTot += COLS; }
      }

      var offHit = 0, offTot = 0;
      for (var r = 0; r < NORM_ROWS; r++) {
        for (var j = 0; j < NORM_COLS; j++) {
          var non = gate.fn(normal[r][j], thresh);
          normalCells[r][j].setAttribute("fill", non ? C.bad : C.rule);
          if (non) offHit++;
          offTot++;
        }
      }

      var dcov = discHit / discTot, tcov = testHit / testTot, off = offHit / offTot;
      var sel = off > 0 ? dcov / off : Infinity;

      out.set("disc", K.pct(dcov));
      out.set("test", K.pct(tcov), tcov < dcov - 0.08 ? "warn" : "good");
      out.set("off", K.pct(off), off > 0.15 ? "bad" : "good");
      out.set("sel", isFinite(sel) ? sel.toFixed(1) + "×" : "∞", sel >= 4 ? "good" : "warn");
      out.set("pats", patsOk + "/" + PAT, patsOk >= 6 ? "good" : "warn");
    }

    var seg = K.segmented(GATES.map(function (g) { return { id: g.id, label: g.label }; }), "AB",
      function (id) {
        gate = GATES.filter(function (g) { return g.id === id; })[0];
        recompute();
      });

    var sl = K.slider({
      label: "positivity threshold", min: 0.25, max: 0.75, step: 0.01, value: 0.5,
      format: function (v) { return v.toFixed(2); }
    }, function (v) { thresh = v; recompute(); });

    root.appendChild(K.toolbar([seg]));
    root.appendChild(K.toolbar([sl]));
    root.appendChild(svg);
    root.appendChild(out);
    root.appendChild(K.note(
      "A AND B AND NOT C is the selective gate: NOT C excludes normal epithelium, " +
      "which is C-high. Held-out coverage is always the honest number — pooled-cell " +
      "evaluation would hide the drop."));

    recompute();
  };

  /* ============================================================
     Ecotypes — cell states, and the ecotypes they co-associate into
     Sort the samples and the block structure appears; click a state
     to see its partners.
     ============================================================ */

  window.DEMOS["Ecotypes"] = function (root) {
    var STATES = ["Fibro-S1", "Mono-S2", "CD8-S3", "Fibro-S4", "Mono-S5",
                  "CD8-S6", "Epi-S7", "CD8-S8", "Mono-S9", "Epi-S10"];
    var ECO = { "E1": [0, 3, 6], "E2": [1, 4, 8], "E3": [2, 5, 7] };
    var ECO_OF = {};
    Object.keys(ECO).forEach(function (e) { ECO[e].forEach(function (i) { ECO_OF[i] = e; }); });

    var NS = 30, rand = K.rng(77341);
    var samples = [];
    for (var i = 0; i < NS; i++) {
      var e = i % 10 === 9 ? null : Object.keys(ECO)[Math.floor(rand() * 3)];
      var col = STATES.map(function (_, si) {
        var member = e && ECO[e].indexOf(si) >= 0;
        return K.clamp((member ? 0.74 : 0.20) + K.gauss(rand) * 0.16, 0, 1);
      });
      samples.push({ eco: e, col: col, order: i });
    }

    var X0 = 54, Y0 = 22, CW = 9, RH = 11;
    var svg = K.stage({ viewBox: "0 0 340 148" });
    var rects = [], ecoTicks = [], labels = [];

    STATES.forEach(function (name, r) {
      var t = s("text", {
        x: 48, y: Y0 + r * RH + 7.5, class: "lab-sm", "text-anchor": "end",
        text: name, style: "cursor:pointer"
      });
      t.addEventListener("click", function () { focus(r); });
      labels.push(t);
      svg.appendChild(t);
    });

    for (i = 0; i < NS; i++) {
      var colRects = [];
      for (var r2 = 0; r2 < STATES.length; r2++) {
        var rc = s("rect", {
          x: X0 + i * CW, y: Y0 + r2 * RH, width: CW - 1.2, height: RH - 1.2, rx: 0.5,
          fill: C.rule
        });
        colRects.push(rc);
        svg.appendChild(rc);
      }
      rects.push(colRects);
      var tick = s("rect", { x: X0 + i * CW, y: Y0 - 5, width: CW - 1.2, height: 3, fill: "none" });
      ecoTicks.push(tick);
      svg.appendChild(tick);
    }

    svg.appendChild(s("text", { x: X0, y: 12, class: "lab-hd", text: "SAMPLES →" }));
    var caption = s("text", { x: X0, y: 143, class: "lab-sm", text: "" });
    svg.appendChild(caption);

    function shade(v) {
      // white → navy ramp
      var t = K.clamp(v, 0, 1);
      return "rgb(" + Math.round(K.lerp(246, 31, t)) + "," +
                      Math.round(K.lerp(248, 78, t)) + "," +
                      Math.round(K.lerp(250, 121, t)) + ")";
    }

    var focused = -1, sorted = false, targetX = [], curX = [];

    function layout() {
      var order = samples.map(function (sm, i) { return i; });
      if (sorted) {
        order.sort(function (a, b) {
          var ea = samples[a].eco || "Z", eb = samples[b].eco || "Z";
          return ea < eb ? -1 : ea > eb ? 1 : a - b;
        });
      }
      order.forEach(function (si, pos) { targetX[si] = X0 + pos * CW; });
    }

    for (i = 0; i < NS; i++) { curX[i] = X0 + i * CW; targetX[i] = curX[i]; }

    function paint() {
      for (var i = 0; i < NS; i++) {
        var sm = samples[i];
        for (var r = 0; r < STATES.length; r++) {
          var v = sm.col[r];
          var dim = focused >= 0 && ECO_OF[r] !== ECO_OF[focused];
          rects[i][r].setAttribute("fill", shade(dim ? v * 0.28 : v));
          rects[i][r].setAttribute("x", curX[i]);
        }
        ecoTicks[i].setAttribute("x", curX[i]);
        ecoTicks[i].setAttribute("fill",
          sm.eco ? C.series[Object.keys(ECO).indexOf(sm.eco)] : "none");
      }
      labels.forEach(function (t, r) {
        var on = focused < 0 || ECO_OF[r] === ECO_OF[focused];
        t.setAttribute("fill", on ? (focused >= 0 ? C.navy : C.faint) : "#c8ccd0");
        t.setAttribute("font-weight", focused >= 0 && ECO_OF[r] === ECO_OF[focused] ? "600" : "400");
      });
    }

    var out = K.readout([
      { id: "eco", label: "Ecotype" },
      { id: "mem", label: "Member states" },
      { id: "enr", label: "Samples enriched" },
      { id: "ab", label: "Mean abundance" }
    ]);

    function focus(r) {
      focused = focused === r ? -1 : r;
      if (focused < 0) {
        out.set("eco", "—"); out.set("mem", "—");
        out.set("enr", "—"); out.set("ab", "—");
        caption.textContent = "Click a cell state to isolate its ecotype.";
      } else {
        var e = ECO_OF[focused];
        var members = ECO[e].map(function (i) { return STATES[i]; });
        var enriched = samples.filter(function (sm) { return sm.eco === e; });
        var mean = 0, n = 0;
        enriched.forEach(function (sm) { ECO[e].forEach(function (i) { mean += sm.col[i]; n++; }); });
        out.set("eco", e);
        out.set("mem", String(members.length));
        out.set("enr", enriched.length + "/" + NS, "good");
        out.set("ab", (n ? mean / n : 0).toFixed(2));
        caption.textContent = e + " = " + members.join(" + ");
      }
      paint();
    }

    var seg = K.segmented([
      { id: "raw", label: "As sequenced" },
      { id: "sorted", label: "Sorted by ecotype" }
    ], "raw", function (id) { sorted = id === "sorted"; layout(); });

    root.appendChild(K.toolbar([seg]));
    root.appendChild(svg);
    root.appendChild(out);
    root.appendChild(K.note(
      "Cell states are recovered per cell type, then scored for co-association across " +
      "samples. Sorting reveals the ecotype blocks that were always there."));

    focus(-1);
    layout();

    return K.tick(function () {
      var moving = false;
      for (var i = 0; i < NS; i++) {
        if (Math.abs(targetX[i] - curX[i]) > 0.15) {
          curX[i] = K.lerp(curX[i], targetX[i], 0.16);
          moving = true;
        } else curX[i] = targetX[i];
      }
      if (moving) paint();
    });
  };

  /* ============================================================
     deconv — consensus NMF rank selection
     Move k and watch the consensus matrix sharpen. k = 4 is the
     answer this synthetic cohort was built to have.
     ============================================================ */

  window.DEMOS["deconv"] = function (root) {
    var N = 24, TRUE_K = 4, rand = K.rng(4242);
    var kNow = 2, filterLowCD8 = true;

    // Cophenetic correlation peaks at the true rank and decays either side.
    function cophenetic(k) {
      var base = 1 - Math.abs(k - TRUE_K) * 0.085 - (k > TRUE_K ? 0.03 * (k - TRUE_K) : 0);
      return K.clamp(base - (filterLowCD8 ? 0 : 0.11), 0.55, 0.995);
    }

    var svg = K.stage({ viewBox: "0 0 340 172" });

    // -- left: cophenetic curve --
    svg.appendChild(s("text", { x: 8, y: 12, class: "lab-hd", text: "COPHENETIC × RANK" }));
    var CX = 20, CY = 118, CW = 108, CH = 82;
    svg.appendChild(s("line", { x1: CX, y1: CY, x2: CX + CW, y2: CY, stroke: C.rule, "stroke-width": 0.8 }));
    svg.appendChild(s("line", { x1: CX, y1: CY - CH, x2: CX, y2: CY, stroke: C.rule, "stroke-width": 0.8 }));
    var curve = s("polyline", { fill: "none", stroke: C.navy, "stroke-width": 1.4, points: "" });
    svg.appendChild(curve);
    var kDots = [];
    for (var k = 2; k <= 8; k++) {
      var d = s("circle", { r: 2.6, fill: C.paper, stroke: C.navy, "stroke-width": 1.1, style: "cursor:pointer" });
      d.dataset.k = k;
      d.addEventListener("click", function () { setK(parseInt(this.dataset.k, 10)); });
      kDots.push(d);
      svg.appendChild(d);
      svg.appendChild(s("text", {
        x: CX + ((k - 2) / 6) * CW, y: CY + 10, class: "lab-sm", "text-anchor": "middle", text: String(k)
      }));
    }
    svg.appendChild(s("text", { x: CX + CW / 2, y: CY + 20, class: "lab-sm", "text-anchor": "middle", text: "rank k" }));

    // -- right: consensus matrix --
    svg.appendChild(s("text", { x: 160, y: 12, class: "lab-hd", text: "CONSENSUS MATRIX" }));
    var MX = 160, MY = 20, CELL = 5.6;
    var mrects = [];
    for (var i = 0; i < N; i++) {
      var row = [];
      for (var j = 0; j < N; j++) {
        var rc = s("rect", { x: MX + j * CELL, y: MY + i * CELL, width: CELL, height: CELL, fill: "#fff" });
        row.push(rc);
        svg.appendChild(rc);
      }
      mrects.push(row);
    }

    // Fixed noise field so changing k re-clusters but doesn't re-roll the noise.
    var noise = [];
    for (i = 0; i < N; i++) {
      noise[i] = [];
      for (j = 0; j < N; j++) noise[i][j] = rand();
    }

    var out = K.readout([
      { id: "coph", label: "Cophenetic" },
      { id: "sil", label: "Silhouette" },
      { id: "coh", label: "Marker coherence" },
      { id: "mye", label: "Myeloid contam." },
      { id: "kept", label: "Tumors kept" }
    ]);

    function assign(k) {
      // Samples are laid out in TRUE_K contiguous blocks; at k != TRUE_K the
      // blocks get split or merged, which is exactly what blurs the matrix.
      var a = [];
      for (var i = 0; i < N; i++) a.push(Math.floor(i * k / N));
      return a;
    }

    function paint() {
      var a = assign(kNow);
      var sharp = 1 - Math.abs(kNow - TRUE_K) * 0.19;
      for (var i = 0; i < N; i++) {
        for (var j = 0; j < N; j++) {
          var same = a[i] === a[j];
          var v = same ? K.lerp(0.55, 1, sharp) : K.lerp(0.42, 0.02, sharp);
          v = K.clamp(v + (noise[i][j] - 0.5) * (1 - sharp) * 0.7, 0, 1);
          mrects[i][j].setAttribute("fill",
            "rgb(" + Math.round(K.lerp(255, 31, v)) + "," +
                      Math.round(K.lerp(255, 78, v)) + "," +
                      Math.round(K.lerp(255, 121, v)) + ")");
        }
      }

      var pts = [];
      for (var k = 2; k <= 8; k++) {
        var x = CX + ((k - 2) / 6) * CW;
        var y = CY - (cophenetic(k) - 0.5) / 0.5 * CH;
        pts.push(x + "," + y);
        var dot = kDots[k - 2];
        dot.setAttribute("cx", x);
        dot.setAttribute("cy", y);
        dot.setAttribute("fill", k === kNow ? C.navy : C.paper);
        dot.setAttribute("r", k === kNow ? 3.4 : 2.6);
      }
      curve.setAttribute("points", pts.join(" "));

      var co = cophenetic(kNow);
      out.set("coph", co.toFixed(3), co > 0.93 ? "good" : co > 0.85 ? "warn" : "bad");
      out.set("sil", (co * 0.82 + 0.05).toFixed(2));
      out.set("coh", K.pct(K.clamp(co - 0.06, 0, 1)), co > 0.9 ? "good" : "warn");
      out.set("mye", K.pct(filterLowCD8 ? 0.04 : 0.19), filterLowCD8 ? "good" : "bad");
      out.set("kept", filterLowCD8 ? "118/164" : "164/164");
    }

    function setK(v) { kNow = v; sl.input.value = v; sl.querySelector(".dk-out").textContent = v; paint(); }

    var sl = K.slider({ label: "rank k", min: 2, max: 8, step: 1, value: 2 },
      function (v) { kNow = v; paint(); });

    var seg = K.segmented([
      { id: "on", label: "Filter low-CD8 tumors" },
      { id: "off", label: "No filter" }
    ], "on", function (id) { filterLowCD8 = id === "on"; paint(); });

    root.appendChild(K.toolbar([sl]));
    root.appendChild(K.toolbar([seg]));
    root.appendChild(svg);
    root.appendChild(out);
    root.appendChild(K.note(
      "Consensus NMF across candidate ranks; the blockiest matrix and the cophenetic " +
      "peak agree on k = 4. Skipping the low-CD8 filter drags myeloid signal into the " +
      "CD8 programs."));

    paint();
  };

  /* ============================================================
     ECSearch — two- and three-arm combination eligibility
     Pick arms, set the TPM bar, see how much of the cohort qualifies.
     ============================================================ */

  window.DEMOS["ECSearch"] = function (root) {
    var TARGETS = ["MSLN", "CEACAM5", "TROP2", "CLDN18.2", "EGFR", "HER2"];
    var NS = 60, rand = K.rng(9182);

    var cohort = [];
    for (var i = 0; i < NS; i++) {
      var tpm = TARGETS.map(function (_, ti) {
        // Arms 0-2 co-express more often than chance; 3-5 are sparser.
        var base = ti < 3 ? 34 : 18;
        return Math.max(0, base * Math.exp(K.gauss(rand) * 0.85));
      });
      cohort.push(tpm);
    }

    var picked = { MSLN: true, TROP2: true }, cut = 20;

    var svg = K.stage({ viewBox: "0 0 340 118" });
    svg.appendChild(s("text", { x: 8, y: 12, class: "lab-hd", text: "COHORT — 60 SAMPLES" }));
    var bars = [];
    for (i = 0; i < NS; i++) {
      var rc = s("rect", { x: 8 + (i % 30) * 11, y: 20 + Math.floor(i / 30) * 14, width: 9, height: 11, rx: 1, fill: C.rule });
      bars.push(rc);
      svg.appendChild(rc);
    }

    svg.appendChild(s("text", { x: 8, y: 66, class: "lab-hd", text: "PER-ARM ELIGIBILITY" }));
    var armBars = [], armLabs = [];
    TARGETS.forEach(function (t, ti) {
      var y = 74 + ti * 7;
      svg.appendChild(s("text", { x: 62, y: y + 5, class: "lab-sm", "text-anchor": "end", text: t }));
      var bg = s("rect", { x: 66, y: y, width: 200, height: 5, rx: 1, fill: C.rule });
      var fg = s("rect", { x: 66, y: y, width: 0, height: 5, rx: 1, fill: C.navy });
      var lab = s("text", { x: 272, y: y + 5, class: "lab-sm", text: "" });
      armBars.push(fg); armLabs.push(lab);
      svg.appendChild(bg); svg.appendChild(fg); svg.appendChild(lab);
    });

    var out = K.readout([
      { id: "arms", label: "Arms" },
      { id: "elig", label: "All-arm eligible" },
      { id: "co", label: "SC co-occurrence" },
      { id: "single", label: "Best single arm" }
    ]);

    function recompute() {
      var idx = TARGETS.map(function (t, i) { return picked[t] ? i : -1 })
                       .filter(function (i) { return i >= 0; });

      var nEligible = 0;
      for (var s2 = 0; s2 < NS; s2++) {
        var ok = idx.length > 0 && idx.every(function (i) { return cohort[s2][i] >= cut; });
        if (ok) nEligible++;
        bars[s2].setAttribute("fill", ok ? C.navy : C.rule);
      }

      var best = 0;
      TARGETS.forEach(function (t, ti) {
        var n = 0;
        for (var s3 = 0; s3 < NS; s3++) if (cohort[s3][ti] >= cut) n++;
        var f = n / NS;
        best = Math.max(best, f);
        armBars[ti].setAttribute("width", f * 200);
        armBars[ti].setAttribute("fill", picked[TARGETS[ti]] ? C.navy : C.rule);
        armLabs[ti].textContent = K.pct(f);
      });

      var frac = nEligible / NS;
      // Single-cell CE co-occurrence sits below bulk eligibility: bulk can be
      // positive for two arms that are never on the same cell.
      var coOcc = idx.length < 2 ? frac : frac * (idx.length === 2 ? 0.72 : 0.51);

      out.set("arms", String(idx.length), idx.length > 3 ? "bad" : "");
      out.set("elig", K.pct(frac), frac > 0.3 ? "good" : frac > 0.15 ? "warn" : "bad");
      out.set("co", K.pct(coOcc), coOcc > 0.2 ? "good" : "warn");
      out.set("single", K.pct(best));
    }

    var tg = K.toggles(TARGETS.map(function (t) {
      return { id: t, label: t, on: !!picked[t] };
    }), function (state) { picked = state; recompute(); });

    var sl = K.slider({ label: "TPM cut", min: 5, max: 60, step: 1, value: 20 },
      function (v) { cut = v; recompute(); });

    root.appendChild(K.toolbar([tg]));
    root.appendChild(K.toolbar([sl]));
    root.appendChild(svg);
    root.appendChild(out);
    root.appendChild(K.note(
      "Each added arm buys selectivity and costs eligible patients. Single-cell " +
      "co-occurrence is the reality check — bulk TPM can call two arms positive in a " +
      "sample where no single cell carries both."));

    recompute();
  };

  /* ============================================================
     search (immune-crispr) — how many genes have an immune phenotype?
     Raise the evidence bar and watch the genome-wide count collapse.
     ============================================================ */

  window.DEMOS["search"] = function (root) {
    var N = 460, rand = K.rng(551);
    var genes = [];
    for (var i = 0; i < N; i++) {
      // Most genes are hit in one or two screens; a long tail is reproducible.
      var screens = Math.max(1, Math.round(Math.pow(rand(), 3.1) * 17));
      var effect = (rand() - 0.42) * 2.6 * (1 + screens * 0.06);
      genes.push({ screens: screens, effect: effect });
    }

    var minScreens = 1, minEffect = 0;
    var PX = 30, PY = 104, PW = 288, PH = 84;

    var svg = K.stage({ viewBox: "0 0 340 132" });
    svg.appendChild(s("text", { x: 8, y: 12, class: "lab-hd", text: "BioGRID-ORCS — GENOME-WIDE SCREENS" }));
    svg.appendChild(s("line", { x1: PX, y1: PY, x2: PX + PW, y2: PY, stroke: C.rule, "stroke-width": 0.8 }));
    svg.appendChild(s("line", { x1: PX, y1: PY - PH, x2: PX, y2: PY, stroke: C.rule, "stroke-width": 0.8 }));
    svg.appendChild(s("text", { x: PX + PW / 2, y: PY + 14, class: "lab-sm", "text-anchor": "middle", text: "screens supporting the phenotype →" }));
    svg.appendChild(s("text", { x: 10, y: PY - PH + 4, class: "lab-sm", text: "effect" }));
    svg.appendChild(s("line", { x1: PX, y1: PY - PH / 2, x2: PX + PW, y2: PY - PH / 2, stroke: C.rule, "stroke-width": 0.5, "stroke-dasharray": "2 2" }));

    var dots = genes.map(function (g) {
      var d = s("circle", {
        cx: PX + K.clamp((g.screens - 1) / 16, 0, 1) * PW,
        cy: PY - PH / 2 - K.clamp(g.effect / 3.2, -1, 1) * (PH / 2 - 3),
        r: 1.7, fill: C.rule
      });
      svg.appendChild(d);
      return d;
    });

    var gateLine = s("line", { y1: PY - PH, y2: PY, stroke: C.navy, "stroke-width": 1, "stroke-dasharray": "3 2" });
    svg.appendChild(gateLine);

    var out = K.readout([
      { id: "n", label: "Genes passing" },
      { id: "frac", label: "Of screened genome" },
      { id: "rep", label: "Median screens" },
      { id: "cache", label: "Archive" }
    ]);

    function recompute() {
      var pass = [];
      genes.forEach(function (g, i) {
        var ok = g.screens >= minScreens && Math.abs(g.effect) >= minEffect;
        if (ok) pass.push(g);
        dots[i].setAttribute("fill", ok ? (g.effect >= 0 ? C.navy : C.warn) : C.rule);
        dots[i].setAttribute("r", ok ? 2.1 : 1.5);
        dots[i].setAttribute("opacity", ok ? 1 : 0.45);
      });
      gateLine.setAttribute("x1", PX + K.clamp((minScreens - 1) / 16, 0, 1) * PW);
      gateLine.setAttribute("x2", PX + K.clamp((minScreens - 1) / 16, 0, 1) * PW);

      var med = 0;
      if (pass.length) {
        var srt = pass.map(function (g) { return g.screens; }).sort(function (a, b) { return a - b; });
        med = srt[Math.floor(srt.length / 2)];
      }
      out.set("n", String(pass.length), pass.length > 60 ? "good" : pass.length > 15 ? "warn" : "bad");
      out.set("frac", (pass.length / N * 100).toFixed(1) + "%");
      out.set("rep", String(med));
      out.set("cache", "753 MB");
    }

    var slA = K.slider({ label: "min screens", min: 1, max: 12, step: 1, value: 1 },
      function (v) { minScreens = v; recompute(); });
    var slB = K.slider({ label: "min |effect|", min: 0, max: 2, step: 0.05, value: 0,
      format: function (v) { return v.toFixed(2); } },
      function (v) { minEffect = v; recompute(); });

    root.appendChild(K.toolbar([slA, slB]));
    root.appendChild(svg);
    root.appendChild(out);
    root.appendChild(K.note(
      "Derived from primary screen data, not annotation. Requiring reproducibility " +
      "across independent screens is what separates a real immune phenotype from a " +
      "single-screen artefact."));

    recompute();
  };

})(DemoKit);
