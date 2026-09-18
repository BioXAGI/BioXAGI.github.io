/* Data acquisition & pipeline demos. */

(function (K) {
  "use strict";
  var h = K.h, s = K.s, C = K.C;

  /* ============================================================
     cbioportal_run — the plotting half: oncoprint + expression
     ============================================================ */

  window.DEMOS["cbioportal_run"] = function (root) {
    var STUDIES = {
      paad: { label: "TCGA-PAAD", n: 44, rates: { KRAS: 0.91, TP53: 0.68, SMAD4: 0.31, APC: 0.05 } },
      coad: { label: "TCGA-COAD", n: 44, rates: { KRAS: 0.43, TP53: 0.59, SMAD4: 0.12, APC: 0.78 } },
      blca: { label: "TCGA-BLCA", n: 44, rates: { KRAS: 0.05, TP53: 0.49, SMAD4: 0.07, APC: 0.09 } }
    };
    var TYPES = [
      { id: "mis",  label: "missense",   col: C.series[1] },
      { id: "trunc",label: "truncating", col: C.ink },
      { id: "amp",  label: "amplified",  col: C.bad },
      { id: "del",  label: "deleted",    col: C.series[0] }
    ];
    var GENES = ["KRAS", "TP53", "SMAD4", "APC"];

    var study = "paad", gene = "KRAS";
    var rand = K.rng(8080);
    // One fixed random field; the study's rate decides how much of it is altered.
    var field = {};
    Object.keys(STUDIES).forEach(function (st) {
      field[st] = {};
      GENES.forEach(function (g) {
        field[st][g] = [];
        for (var i = 0; i < 44; i++) field[st][g].push({ u: rand(), t: rand() });
      });
    });

    var svg = K.stage({ viewBox: "0 0 340 148" });
    var head = s("text", { x: 8, y: 11, class: "lab-hd", text: "" });
    svg.appendChild(head);

    var cellW = 6.6, X0 = 62;
    var grid = {}, geneLabs = {};
    GENES.forEach(function (g, gi) {
      var y = 20 + gi * 15;
      var t = s("text", { x: 56, y: y + 9, class: "lab-sm", "text-anchor": "end", text: g, style: "cursor:pointer" });
      t.addEventListener("click", function () { gene = g; segGene.setValue(g); paint(); });
      svg.appendChild(t);
      geneLabs[g] = t;
      grid[g] = [];
      for (var i = 0; i < 44; i++) {
        var rc = s("rect", { x: X0 + i * cellW, y: y, width: cellW - 1, height: 11, rx: 0.5, fill: C.rule });
        svg.appendChild(rc);
        grid[g].push(rc);
      }
      var pctT = s("text", { x: 360, y: y + 9, class: "lab-sm", text: "" });
      svg.appendChild(pctT);
      grid[g].pct = pctT;
      pctT.setAttribute("x", X0 + 44 * cellW + 4);
    });

    // expression strip
    svg.appendChild(s("text", { x: 8, y: 96, class: "lab-hd", text: "EXPRESSION — ALTERED vs WILD-TYPE" }));
    var boxes = [];
    [0, 1].forEach(function (bi) {
      var y = 106 + bi * 18;
      svg.appendChild(s("text", { x: 56, y: y + 9, class: "lab-sm", "text-anchor": "end",
        text: bi === 0 ? "altered" : "wild-type" }));
      svg.appendChild(s("line", { x1: X0, y1: y + 5.5, x2: X0 + 240, y2: y + 5.5, stroke: C.rule, "stroke-width": 0.6 }));
      var box = s("rect", { y: y, height: 11, rx: 1, fill: bi === 0 ? C.navy : C.rule, opacity: 0.85 });
      var med = s("line", { y1: y - 1, y2: y + 12, stroke: C.ink, "stroke-width": 1 });
      svg.appendChild(box); svg.appendChild(med);
      boxes.push({ box: box, med: med });
    });

    var out = K.readout([
      { id: "study", label: "Study" },
      { id: "gene", label: "Gene" },
      { id: "alt", label: "Altered" },
      { id: "n", label: "Samples" }
    ]);

    function paint() {
      var st = STUDIES[study];
      head.textContent = st.label.toUpperCase() + " — ONCOPRINT";

      GENES.forEach(function (g) {
        var rate = st.rates[g], altered = 0;
        field[study][g].forEach(function (cell, i) {
          var on = cell.u < rate;
          if (on) altered++;
          var type = TYPES[Math.floor(cell.t * (g === "KRAS" ? 1.6 : 4)) % 4];
          grid[g][i].setAttribute("fill", on ? type.col : C.rule);
          grid[g][i].setAttribute("opacity", g === gene ? 1 : 0.32);
        });
        grid[g].pct.textContent = Math.round(altered / 44 * 100) + "%";
        grid[g].pct.setAttribute("fill", g === gene ? C.navy : C.faint);
        geneLabs[g].setAttribute("fill", g === gene ? C.navy : C.faint);
        geneLabs[g].setAttribute("font-weight", g === gene ? "600" : "400");
      });

      // Altered samples sit lower in expression for tumor suppressors, higher for KRAS.
      var up = gene === "KRAS";
      var altCenter = up ? 150 : 96, wtCenter = up ? 108 : 152;
      [[boxes[0], altCenter, 34], [boxes[1], wtCenter, 40]].forEach(function (p) {
        p[0].box.setAttribute("x", X0 + p[1] - p[2] / 2);
        p[0].box.setAttribute("width", p[2]);
        p[0].med.setAttribute("x1", X0 + p[1]);
        p[0].med.setAttribute("x2", X0 + p[1]);
      });

      var rate = st.rates[gene];
      out.set("study", st.label);
      out.set("gene", gene);
      out.set("alt", Math.round(rate * 100) + "%", rate > 0.5 ? "good" : "");
      out.set("n", String(st.n));
    }

    var segStudy = K.segmented(Object.keys(STUDIES).map(function (id) {
      return { id: id, label: STUDIES[id].label };
    }), "paad", function (id) { study = id; paint(); });

    var segGene = K.segmented(GENES.map(function (g) { return { id: g, label: g }; }), "KRAS",
      function (g) { gene = g; paint(); });

    root.appendChild(K.toolbar([segStudy]));
    root.appendChild(K.toolbar([segGene]));
    root.appendChild(svg);
    root.appendChild(out);
    root.appendChild(K.note(
      "Same query shape across studies: pull the profile, tabulate alterations, compare " +
      "expression in altered versus wild-type. KRAS in PAAD is the sanity check that the " +
      "pipeline is wired correctly."));

    paint();
  };

  /* ============================================================
     IMvigor210_TGFb — where you cut the signature changes the story
     ============================================================ */

  window.DEMOS["IMvigor210_TGFb"] = function (root) {
    var N = 198, rand = K.rng(21021);
    var pts = [];
    for (var i = 0; i < N; i++) {
      var score = K.clamp(0.5 + K.gauss(rand) * 0.19, 0, 1);
      // Response probability falls steeply as the TGF-β signature rises.
      var p = K.clamp(0.66 - score * 0.86 + K.gauss(rand) * 0.05, 0.02, 0.95);
      pts.push({ score: score, resp: rand() < p });
    }
    pts.sort(function (a, b) { return a.score - b.score; });

    var cut = 0.5;
    var X0 = 14, W = 312;

    var svg = K.stage({ viewBox: "0 0 340 146" });
    svg.appendChild(s("text", { x: 8, y: 11, class: "lab-hd", text: "PATIENTS SORTED BY TGF-β SIGNATURE →" }));
    var ticks = pts.map(function (p, i) {
      var t = s("rect", { x: X0 + i * (W / N), y: 18, width: W / N - 0.3, height: 22, fill: C.rule });
      svg.appendChild(t);
      return t;
    });
    var cutLine = s("line", { y1: 14, y2: 46, stroke: C.ink, "stroke-width": 1.2 });
    svg.appendChild(cutLine);
    var cutLab = s("text", { y: 52, class: "lab-sm", "text-anchor": "middle", text: "cut" });
    svg.appendChild(cutLab);

    svg.appendChild(s("text", { x: 8, y: 74, class: "lab-hd", text: "OBJECTIVE RESPONSE RATE" }));
    var groups = [];
    ["TGF-β low", "TGF-β high"].forEach(function (name, gi) {
      var y = 82 + gi * 22;
      svg.appendChild(s("text", { x: 66, y: y + 11, class: "lab-sm", "text-anchor": "end", text: name }));
      svg.appendChild(s("rect", { x: 70, y: y, width: 200, height: 13, rx: 1, fill: C.alt, stroke: C.rule, "stroke-width": 0.5 }));
      var f = s("rect", { x: 70, y: y, width: 0, height: 13, rx: 1, fill: gi === 0 ? C.good : C.bad });
      var t = s("text", { x: 276, y: y + 10, class: "lab-sm", text: "" });
      svg.appendChild(f); svg.appendChild(t);
      groups.push({ fill: f, lab: t });
    });
    svg.appendChild(s("text", { x: 70, y: 138, class: "lab-sm", text: "0%" }));
    svg.appendChild(s("text", { x: 250, y: 138, class: "lab-sm", text: "50%" }));

    var out = K.readout([
      { id: "nlow", label: "n low" },
      { id: "nhigh", label: "n high" },
      { id: "orrl", label: "ORR low" },
      { id: "orrh", label: "ORR high" },
      { id: "or", label: "Odds ratio" }
    ]);

    function paint() {
      var lowR = 0, lowN = 0, highR = 0, highN = 0;
      pts.forEach(function (p, i) {
        var high = p.score >= cut;
        if (high) { highN++; if (p.resp) highR++; } else { lowN++; if (p.resp) lowR++; }
        ticks[i].setAttribute("fill", p.resp ? (high ? "#c98f8f" : C.good) : (high ? "#efe2e2" : "#dfe7e2"));
        ticks[i].setAttribute("height", p.resp ? 22 : 11);
        ticks[i].setAttribute("y", p.resp ? 18 : 29);
      });

      var idx = pts.filter(function (p) { return p.score < cut; }).length;
      var x = X0 + idx * (W / N);
      cutLine.setAttribute("x1", x); cutLine.setAttribute("x2", x);
      cutLab.setAttribute("x", x);

      var orrL = lowN ? lowR / lowN : 0, orrH = highN ? highR / highN : 0;
      groups[0].fill.setAttribute("width", K.clamp(orrL / 0.5, 0, 1) * 200);
      groups[1].fill.setAttribute("width", K.clamp(orrH / 0.5, 0, 1) * 200);
      groups[0].lab.textContent = K.pct(orrL);
      groups[1].lab.textContent = K.pct(orrH);

      var or = (orrL / Math.max(1 - orrL, 1e-6)) / Math.max(orrH / Math.max(1 - orrH, 1e-6), 1e-6);
      out.set("nlow", String(lowN), lowN < 25 ? "warn" : "");
      out.set("nhigh", String(highN), highN < 25 ? "warn" : "");
      out.set("orrl", K.pct(orrL), "good");
      out.set("orrh", K.pct(orrH), "bad");
      out.set("or", isFinite(or) ? or.toFixed(1) + "×" : "—", or > 2 ? "good" : "warn");
    }

    var sl = K.slider({ label: "signature cut", min: 0.2, max: 0.8, step: 0.01, value: 0.5,
      format: function (v) { return v.toFixed(2); } }, function (v) { cut = v; paint(); });

    root.appendChild(K.toolbar([sl]));
    root.appendChild(svg);
    root.appendChild(out);
    root.appendChild(K.note(
      "Tall bars are responders. The TGF-β association is real across the range, but push " +
      "the cut to either extreme and one arm gets too small to say anything — which is why " +
      "the cutoff belongs in the methods, not the results."));

    paint();
  };

  /* ============================================================
     scData_agent — resolve a GEO accession, download, convert
     ============================================================ */

  window.DEMOS["scData_agent"] = function (root) {
    var SERIES = {
      GSE150290: { title: "Gastric cancer, 10x 3'", files: 6, mb: 1840, cells: 56440, sra: "SRP261119" },
      GSE131907: { title: "Lung adenocarcinoma atlas", files: 11, mb: 4310, cells: 208506, sra: "SRP219369" },
      GSE132465: { title: "Colorectal, SMC cohort", files: 4, mb: 1120, cells: 63689, sra: "SRP222048" }
    };
    var acc = "GSE150290", i = 0;

    var lg = h("ul", { class: "dk-log" });
    var out = K.readout([
      { id: "files", label: "Files" },
      { id: "bytes", label: "Downloaded" },
      { id: "cells", label: "Cells" },
      { id: "out", label: "Output" }
    ]);

    var BAR_W = 300;
    var svg = K.stage({ viewBox: "0 0 340 44" });
    svg.appendChild(s("text", { x: 8, y: 12, class: "lab-hd", text: "WORKFLOW PROGRESS" }));
    svg.appendChild(s("rect", { x: 20, y: 20, width: BAR_W, height: 9, rx: 2, fill: C.rule }));
    var fill = s("rect", { x: 20, y: 20, width: 0, height: 9, rx: 2, fill: C.navy });
    svg.appendChild(fill);
    var stageLab = s("text", { x: 20, y: 40, class: "lab-sm", text: "idle" });
    svg.appendChild(stageLab);

    function steps() {
      var m = SERIES[acc];
      return [
        { c: "run", t: "<b>query</b> GEO series <b>" + acc + "</b>", lab: "resolving" },
        { c: "ok",  t: m.title + " — supplementary archive found", lab: "resolved" },
        { c: "run", t: "<b>resolve</b> related SRA study " + m.sra, lab: "resolving" },
        { c: "run", t: "<b>download</b> " + acc + "_RAW.tar — " + m.mb + " MB", lab: "downloading" },
        { c: "ok",  t: "checksum verified, " + m.files + " files extracted", lab: "extracted" },
        { c: "run", t: "<b>write</b> manifest.json <i>(run metadata)</i>", lab: "manifest" },
        { c: "run", t: "<b>write</b> report.txt <i>(human-readable summary)</i>", lab: "summary" },
        { c: "run", t: "<b>geo-to-h5ad</b> — building AnnData", lab: "converting" },
        { c: "ok",  t: "<b>" + m.cells.toLocaleString() + " cells</b> → downloads/" + acc + "/matrix.h5ad", lab: "complete" }
      ];
    }

    var SEQ = steps();

    function paint() {
      var m = SERIES[acc];
      fill.setAttribute("width", BAR_W * (i / SEQ.length));
      fill.setAttribute("fill", i >= SEQ.length ? C.good : C.navy);
      stageLab.textContent = i === 0 ? "idle" : SEQ[i - 1].lab;
      out.set("files", i >= 5 ? String(m.files) : "—");
      out.set("bytes", i >= 4 ? m.mb + " MB" : "—");
      out.set("cells", i >= 9 ? m.cells.toLocaleString() : "—", i >= 9 ? "good" : "");
      out.set("out", i >= 9 ? "matrix.h5ad" : "—");
    }

    function step() {
      if (i >= SEQ.length) return false;
      var e = SEQ[i++];
      var li = h("li", { class: e.c, html: e.t });
      lg.appendChild(li);
      lg.scrollTop = lg.scrollHeight;
      paint();
      return i < SEQ.length;
    }

    function reset() { i = 0; SEQ = steps(); K.clear(lg); paint(); }

    var seg = K.segmented(Object.keys(SERIES).map(function (a) { return { id: a, label: a }; }),
      "GSE150290", function (a) { acc = a; reset(); });

    var bar = K.transport({ step: step, reset: reset, interval: 0.75 });

    root.appendChild(K.toolbar([seg]));
    root.appendChild(bar);
    root.appendChild(svg);
    root.appendChild(h("div", { class: "dk-cap", text: "RUN LOG" }));
    root.appendChild(lg);
    root.appendChild(out);
    root.appendChild(K.note(
      "The manifest and the summary are the point: a download you can audit six months " +
      "later, rather than a folder of files whose provenance you have to reconstruct."));

    reset();
    return function () { bar.stop(); };
  };

})(DemoKit);
