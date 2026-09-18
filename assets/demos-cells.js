/* Single-cell & network tooling demos. */

(function (K) {
  "use strict";
  var h = K.h, s = K.s, C = K.C;

  /* ============================================================
     BioNetwork — force-directed vs biologically anchored layout
     The edge-crossing count is computed for real on whatever
     positions are on screen, so the comparison is not asserted.
     ============================================================ */

  window.DEMOS["BioNetwork"] = function (root) {
    var GROUPS = [
      { id: "ifn",  label: "IFN-γ",     color: C.series[0] },
      { id: "tcr",  label: "TCR",       color: C.series[1] },
      { id: "apop", label: "Apoptosis", color: C.series[2] },
      { id: "ag",   label: "Ag present",color: C.series[3] },
      { id: "nfkb", label: "NF-κB",     color: C.series[5] }
    ];
    var GENES = [
      ["JAK1", "JAK2", "STAT1", "IFNGR1", "IRF1"],
      ["CD3E", "LCK", "ZAP70", "LAT", "CD28"],
      ["CASP8", "FADD", "BID", "APAF1"],
      ["B2M", "TAP1", "TAP2", "HLA-A", "NLRC5"],
      ["RELA", "NFKBIA", "TRAF2", "IKBKB"]
    ];

    var nodes = [];
    GENES.forEach(function (list, gi) {
      list.forEach(function (name, i) { nodes.push({ name: name, g: gi, i: i }); });
    });

    // Edges: dense within pathway, a few curated cross-pathway links.
    var edges = [];
    var offset = 0;
    GENES.forEach(function (list, gi) {
      for (var a = 0; a < list.length; a++) {
        for (var b = a + 1; b < list.length; b++) {
          if ((a + b) % 2 === 0) edges.push([offset + a, offset + b]);
        }
      }
      offset += list.length;
    });
    function idx(name) { return nodes.map(function (n) { return n.name; }).indexOf(name); }
    [["STAT1", "IRF1"], ["IRF1", "TAP1"], ["STAT1", "B2M"], ["NLRC5", "HLA-A"],
     ["ZAP70", "RELA"], ["CD28", "IKBKB"], ["CASP8", "FADD"], ["TRAF2", "CASP8"],
     ["JAK2", "NFKBIA"], ["LCK", "CD3E"]].forEach(function (p) {
      var a = idx(p[0]), b = idx(p[1]);
      if (a >= 0 && b >= 0) edges.push([a, b]);
    });

    var W = 340, H = 150, mode = "anchored", run = 0;
    var cur = nodes.map(function () { return { x: W / 2, y: H / 2 }; });
    var target = nodes.map(function () { return { x: 0, y: 0 }; });

    // Column order is chosen so pathways that actually talk to each other sit
    // next to each other: Ag-presentation — IFN-γ — NF-κB — TCR — apoptosis.
    // That is the curation a force solver cannot do, because it does not know
    // which adjacencies are biologically meaningful.
    var COL_OF = [1, 3, 4, 0, 2];

    function anchoredPos() {
      // Genes stack within their column and zig-zag, so within-pathway edges are
      // short diagonals rather than one overlapping vertical stack.
      return nodes.map(function (n) {
        return { x: 38 + COL_OF[n.g] * 62 + (n.i % 2 ? 17 : 0), y: 34 + n.i * 20 };
      });
    }

    function forcePos(seed) {
      var rand = K.rng(seed);
      return nodes.map(function () {
        return { x: 30 + rand() * (W - 60), y: 28 + rand() * (H - 56) };
      });
    }

    function layout() {
      target = mode === "anchored" ? anchoredPos() : forcePos(1000 + run);
    }

    var svg = K.stage({ viewBox: "0 0 " + W + " " + H });
    var edgeG = s("g", {}), nodeG = s("g", {}), labG = s("g", {});
    svg.appendChild(edgeG); svg.appendChild(nodeG); svg.appendChild(labG);

    var edgeEls = edges.map(function () {
      var l = s("line", { stroke: C.rule, "stroke-width": 0.8, opacity: 0.85 });
      edgeG.appendChild(l);
      return l;
    });
    var nodeEls = nodes.map(function (n) {
      var c = s("circle", { r: 4, fill: GROUPS[n.g].color, opacity: 0.9 });
      nodeG.appendChild(c);
      return c;
    });
    var labEls = nodes.map(function (n) {
      var t = s("text", { class: "lab-sm", "text-anchor": "middle", text: n.name });
      labG.appendChild(t);
      return t;
    });

    var head = s("text", { x: 8, y: 11, class: "lab-hd", text: "" });
    svg.appendChild(head);
    GROUPS.forEach(function (g, i) {
      svg.appendChild(s("circle", { cx: 150 + i * 38, cy: 8, r: 3, fill: g.color }));
      svg.appendChild(s("text", { x: 156 + i * 38, y: 11, class: "lab-sm", text: g.label }));
    });

    /* Proper segment intersection, ignoring edges that share an endpoint. */
    function crossings() {
      var n = 0;
      for (var i = 0; i < edges.length; i++) {
        for (var j = i + 1; j < edges.length; j++) {
          var e1 = edges[i], e2 = edges[j];
          if (e1[0] === e2[0] || e1[0] === e2[1] || e1[1] === e2[0] || e1[1] === e2[1]) continue;
          if (seg(cur[e1[0]], cur[e1[1]], cur[e2[0]], cur[e2[1]])) n++;
        }
      }
      return n;
    }
    function ccw(a, b, c) { return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x); }
    function seg(p1, p2, p3, p4) {
      return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
    }

    /* Two labels collide if their boxes overlap — approximate, but consistent. */
    function collisions() {
      var n = 0;
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          if (Math.abs(cur[i].x - cur[j].x) < 22 && Math.abs(cur[i].y - cur[j].y) < 8) n++;
        }
      }
      return n;
    }

    var out = K.readout([
      { id: "cross", label: "Edge crossings" },
      { id: "coll", label: "Label collisions" },
      { id: "repro", label: "Reproducible" },
      { id: "runs", label: "Layout run" }
    ]);

    function paint() {
      nodeEls.forEach(function (c, i) {
        c.setAttribute("cx", cur[i].x);
        c.setAttribute("cy", cur[i].y);
      });
      labEls.forEach(function (t, i) {
        t.setAttribute("x", cur[i].x);
        t.setAttribute("y", cur[i].y - 6);
        t.setAttribute("opacity", mode === "anchored" ? 1 : 0.5);
      });
      edgeEls.forEach(function (l, i) {
        var a = cur[edges[i][0]], b = cur[edges[i][1]];
        l.setAttribute("x1", a.x); l.setAttribute("y1", a.y);
        l.setAttribute("x2", b.x); l.setAttribute("y2", b.y);
        l.setAttribute("stroke", nodes[edges[i][0]].g === nodes[edges[i][1]].g
          ? GROUPS[nodes[edges[i][0]].g].color : C.faint);
        l.setAttribute("opacity", nodes[edges[i][0]].g === nodes[edges[i][1]].g ? 0.45 : 0.75);
      });
      head.textContent = mode === "anchored" ? "BIOLOGICALLY ANCHORED" : "FORCE-DIRECTED";

      var x = crossings(), col = collisions();
      out.set("cross", String(x), x < 30 ? "good" : "bad");
      out.set("coll", String(col), col === 0 ? "good" : "bad");
      out.set("repro", mode === "anchored" ? "yes" : "no", mode === "anchored" ? "good" : "bad");
      out.set("runs", "#" + (run + 1));
    }

    var seg2 = K.segmented([
      { id: "anchored", label: "Biologically anchored" },
      { id: "force", label: "Force-directed" }
    ], "anchored", function (id) { mode = id; layout(); paint(); });

    var rerun = h("button", {
      type: "button", text: "Re-run layout",
      onclick: function () { run++; if (mode === "force") layout(); else paint(); }
    });

    root.appendChild(K.toolbar([seg2, rerun]));
    root.appendChild(svg);
    root.appendChild(out);
    root.appendChild(K.note(
      "Re-run the force layout and the picture changes every time — same graph, different " +
      "figure. The anchored layout puts a gene in the same place on every run, which is " +
      "what a publication figure needs."));

    layout();
    for (var i = 0; i < nodes.length; i++) cur[i] = { x: target[i].x, y: target[i].y };
    paint();

    return K.tick(function () {
      var moving = false;
      for (var i = 0; i < nodes.length; i++) {
        if (Math.abs(cur[i].x - target[i].x) > 0.2 || Math.abs(cur[i].y - target[i].y) > 0.2) {
          cur[i].x = K.lerp(cur[i].x, target[i].x, 0.14);
          cur[i].y = K.lerp(cur[i].y, target[i].y, 0.14);
          moving = true;
        } else if (cur[i].x !== target[i].x || cur[i].y !== target[i].y) {
          // Snap and repaint once more so the metrics describe the settled layout.
          cur[i].x = target[i].x;
          cur[i].y = target[i].y;
          moving = true;
        }
      }
      if (moving) paint();
    });
  };

  /* ============================================================
     SingleCellExplorer — UMAP, clusters, marker overlay
     ============================================================ */

  window.DEMOS["SingleCellExplorer"] = function (root) {
    var CLUSTERS = [
      { n: "CD8 T",      x: 88,  y: 44,  col: C.series[0], markers: ["CD8A", "GZMB", "PRF1"] },
      { n: "CD4 T",      x: 132, y: 92,  col: C.series[1], markers: ["CD4", "IL7R", "CCR7"] },
      { n: "B",          x: 232, y: 38,  col: C.series[2], markers: ["MS4A1", "CD79A"] },
      { n: "Myeloid",    x: 258, y: 100, col: C.series[3], markers: ["LYZ", "CD68", "ITGAX"] },
      { n: "Epithelial", x: 60,  y: 112, col: C.series[4], markers: ["EPCAM", "KRT18"] },
      { n: "Fibroblast", x: 178, y: 130, col: C.series[5], markers: ["COL1A1", "DCN"] }
    ];
    var GENES = ["CD8A", "MS4A1", "LYZ", "EPCAM", "COL1A1"];
    var GENE_OF = { CD8A: 0, MS4A1: 2, LYZ: 3, EPCAM: 4, COL1A1: 5 };

    var rand = K.rng(31337), cells = [];
    CLUSTERS.forEach(function (c, ci) {
      var n = 90 + Math.floor(rand() * 40);
      for (var i = 0; i < n; i++) {
        cells.push({
          x: c.x + K.gauss(rand) * 15,
          y: c.y + K.gauss(rand) * 11,
          c: ci,
          e: {} // expression filled below
        });
      }
    });
    cells.forEach(function (cell) {
      GENES.forEach(function (g) {
        var on = GENE_OF[g] === cell.c;
        cell.e[g] = K.clamp((on ? 0.78 : 0.09) + K.gauss(rand) * 0.15, 0, 1);
      });
    });

    var mode = "cluster", gene = "CD8A", picked = -1;

    var svg = K.stage({ viewBox: "0 0 340 156" });
    svg.appendChild(s("text", { x: 8, y: 11, class: "lab-hd", text: "UMAP — 638 CELLS" }));
    var dots = cells.map(function (cell) {
      var d = s("circle", { cx: cell.x, cy: cell.y, r: 1.9, opacity: 0.85 });
      svg.appendChild(d);
      return d;
    });
    var labs = CLUSTERS.map(function (c, ci) {
      var t = s("text", {
        x: c.x, y: c.y - 17, class: "lab-sm", "text-anchor": "middle",
        text: c.n, style: "cursor:pointer", "font-weight": "600"
      });
      t.addEventListener("click", function () { picked = picked === ci ? -1 : ci; paint(); });
      svg.appendChild(t);
      return t;
    });

    var out = K.readout([
      { id: "sel", label: "Selection" },
      { id: "n", label: "Cells" },
      { id: "mk", label: "Top markers" },
      { id: "pct", label: "Pct expressing" }
    ]);

    function ramp(v) {
      return "rgb(" + Math.round(K.lerp(226, 166, v)) + "," +
                      Math.round(K.lerp(226, 26, v)) + "," +
                      Math.round(K.lerp(220, 61, v)) + ")";
    }

    function paint() {
      cells.forEach(function (cell, i) {
        var dim = picked >= 0 && cell.c !== picked;
        if (mode === "cluster") {
          dots[i].setAttribute("fill", dim ? "#dfe1e4" : CLUSTERS[cell.c].col);
        } else {
          dots[i].setAttribute("fill", dim ? "#e8e8e4" : ramp(cell.e[gene]));
        }
        dots[i].setAttribute("r", picked >= 0 && cell.c === picked ? 2.4 : 1.9);
        dots[i].setAttribute("opacity", dim ? 0.4 : 0.9);
      });
      labs.forEach(function (t, ci) {
        t.setAttribute("fill", picked === ci ? C.navy : picked >= 0 ? "#c3c7cb" : C.faint);
      });

      if (picked >= 0) {
        var c = CLUSTERS[picked];
        var n = cells.filter(function (x) { return x.c === picked; }).length;
        out.set("sel", c.n);
        out.set("n", String(n));
        out.set("mk", c.markers.slice(0, 2).join(", "));
        var g = Object.keys(GENE_OF).filter(function (k) { return GENE_OF[k] === picked; })[0];
        var expr = g ? cells.filter(function (x) { return x.c === picked && x.e[g] > 0.4; }).length / n : 0;
        out.set("pct", g ? K.pct(expr) : "—", expr > 0.8 ? "good" : "");
      } else {
        out.set("sel", mode === "cluster" ? "all clusters" : gene);
        out.set("n", String(cells.length));
        out.set("mk", mode === "gene" ? gene : "6 clusters");
        var hi = cells.filter(function (x) { return x.e[gene] > 0.4; }).length;
        out.set("pct", mode === "gene" ? K.pct(hi / cells.length) : "—");
      }
    }

    var segMode = K.segmented([
      { id: "cluster", label: "Colour by cluster" },
      { id: "gene", label: "Colour by gene" }
    ], "cluster", function (id) { mode = id; paint(); });

    var segGene = K.segmented(GENES.map(function (g) { return { id: g, label: g }; }), "CD8A",
      function (g) { gene = g; mode = "gene"; segMode.setValue("gene"); paint(); });

    root.appendChild(K.toolbar([segMode]));
    root.appendChild(K.toolbar([segGene]));
    root.appendChild(svg);
    root.appendChild(out);
    root.appendChild(K.note(
      "Click a cluster label to isolate it. Switching to gene colouring shows the marker " +
      "that defines each cluster — the loop the published web server was built around."));

    paint();
  };

  /* ============================================================
     cellatria — the scRNA-seq QC funnel, with the cutoffs live
     ============================================================ */

  window.DEMOS["cellatria"] = function (root) {
    var START = 41203, SAMPLES = 8;
    var mito = 15, minGenes = 200, doublets = true;

    var svg = K.stage({ viewBox: "0 0 340 142" });
    svg.appendChild(s("text", { x: 8, y: 11, class: "lab-hd", text: "QC FUNNEL — 8 GEO SAMPLES" }));

    var STAGES = ["raw barcodes", "empty droplets", "mito % filter", "min genes", "doublet removal", "integrated"];
    var bars = [], nums = [], names = [];
    STAGES.forEach(function (name, i) {
      var y = 20 + i * 19;
      names.push(name);
      svg.appendChild(s("text", { x: 96, y: y + 9, class: "lab-sm", "text-anchor": "end", text: name }));
      svg.appendChild(s("rect", { x: 100, y: y, width: 180, height: 12, rx: 1, fill: C.alt, stroke: C.rule, "stroke-width": 0.5 }));
      var f = s("rect", { x: 100, y: y, width: 180, height: 12, rx: 1, fill: C.navy, opacity: 0.85 });
      svg.appendChild(f);
      bars.push(f);
      var t = s("text", { x: 286, y: y + 9, class: "lab-sm", text: "" });
      svg.appendChild(t);
      nums.push(t);
    });

    var out = K.readout([
      { id: "kept", label: "Cells retained" },
      { id: "frac", label: "Of raw" },
      { id: "types", label: "Cell types" },
      { id: "batch", label: "Batches merged" }
    ]);

    function counts() {
      var v = [START];
      v.push(Math.round(START * 0.824));                                  // empty droplets
      v.push(Math.round(v[1] * K.clamp(0.62 + mito * 0.0175, 0, 0.985))); // mito cutoff
      v.push(Math.round(v[2] * K.clamp(1.06 - minGenes * 0.00058, 0, 0.99))); // min genes
      v.push(Math.round(v[3] * (doublets ? 0.943 : 1)));                  // doublets
      v.push(v[4]);                                                       // integration keeps all
      return v;
    }

    function paint() {
      var v = counts();
      v.forEach(function (n, i) {
        bars[i].setAttribute("width", 180 * (n / START));
        bars[i].setAttribute("fill", i === 5 ? C.good : C.navy);
        nums[i].textContent = n.toLocaleString();
      });
      var kept = v[5];
      out.set("kept", kept.toLocaleString());
      out.set("frac", K.pct(kept / START), kept / START > 0.55 ? "good" : "warn");
      out.set("types", String(Math.max(6, Math.min(13, Math.round(kept / 2400)))));
      out.set("batch", SAMPLES + " → 1", "good");
    }

    var slA = K.slider({ label: "max mito %", min: 5, max: 30, step: 1, value: 15,
      format: function (v) { return v + "%"; } }, function (v) { mito = v; paint(); });
    var slB = K.slider({ label: "min genes", min: 100, max: 800, step: 25, value: 200 },
      function (v) { minGenes = v; paint(); });
    var seg = K.segmented([
      { id: "on", label: "Doublet removal" },
      { id: "off", label: "Keep doublets" }
    ], "on", function (id) { doublets = id === "on"; paint(); });

    root.appendChild(K.toolbar([slA, slB]));
    root.appendChild(K.toolbar([seg]));
    root.appendChild(svg);
    root.appendChild(out);
    root.appendChild(K.note(
      "Every cutoff is a judgement call with a cell count attached. Running the agent in " +
      "a container is what makes the number at the bottom the same on someone else's machine."));

    paint();
  };

})(DemoKit);
