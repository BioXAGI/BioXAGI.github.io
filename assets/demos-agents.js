/* Agentic AI demos — simulated agent traces, no network calls. */

(function (K) {
  "use strict";
  var h = K.h, s = K.s, C = K.C;

  function log() { return h("ul", { class: "dk-log" }); }

  function say(list, cls, html) {
    var li = h("li", { class: cls || "", html: html });
    list.appendChild(li);
    list.scrollTop = list.scrollHeight;
    return li;
  }

  /* ============================================================
     BioAgent — the deep-agent loop, including the critic catching
     a real statistics mistake and forcing a revision.
     ============================================================ */

  window.DEMOS["BioAgent"] = function (root) {
    var TODOS = ["Profile the dataset", "QC and filtering", "Differential expression",
                 "Statistical review", "Write report"];

    var SCRIPT = [
      { c: "run",  t: "<b>profile</b> counts.h5ad — 12,438 genes × 3,204 cells, 4 conditions", todo: [0, "active"] },
      { c: "ok",   t: "<b>write_todos</b> — 5 items planned <i>(plan is revisable)</i>", todo: [0, "done", 1, "active"] },
      { c: "run",  t: "<b>write_file</b> scripts/qc.py <i>(68 lines)</i>" },
      { c: "ok",   t: "<b>execute</b> qc.py → 2,871 cells retained, 333 dropped", todo: [1, "done", 2, "active"] },
      { c: "run",  t: "<b>write_file</b> scripts/de.py <i>(94 lines)</i>" },
      { c: "ok",   t: "<b>execute</b> de.py → 412 genes at p &lt; 0.05" },
      { c: "run",  t: "<b>task(critic)</b> — subagent reviewing statistics <i>(clean context)</i>", todo: [3, "active"] },
      { c: "warn", t: "<b>critic</b>: 412 hits from 12,438 tests with no multiple-testing correction", todo: [2, "redo"] },
      { c: "run",  t: "<b>edit_file</b> de.py — add Benjamini–Hochberg FDR" },
      { c: "ok",   t: "<b>execute</b> de.py → <b>63 genes</b> at FDR &lt; 0.05", todo: [2, "done", 3, "done", 4, "active"] },
      { c: "ok",   t: "<b>write_file</b> report.md — 63 DE genes, 4 enriched pathways", todo: [4, "done"] }
    ];

    var state = TODOS.map(function () { return "pending"; });
    var idx = 0;

    var todoList = h("ol", { class: "dk-todo" });
    var todoNodes = TODOS.map(function (t) {
      var li = h("li", { text: t });
      todoList.appendChild(li);
      return li;
    });

    var out = K.readout([
      { id: "step", label: "Step" },
      { id: "files", label: "Files on disk" },
      { id: "hits", label: "DE genes" },
      { id: "crit", label: "Critic" }
    ]);

    var lg = log();

    function paint() {
      todoNodes.forEach(function (n, i) { n.className = state[i]; });
      out.set("step", idx + "/" + SCRIPT.length);
      out.set("files", String(Math.min(idx, 4)));
      out.set("hits", idx >= 10 ? "63" : idx >= 6 ? "412" : "—", idx >= 10 ? "good" : idx >= 6 ? "bad" : "");
      out.set("crit", idx >= 8 ? (idx >= 10 ? "passed" : "flagged") : "—",
                       idx >= 10 ? "good" : idx >= 8 ? "warn" : "");
    }

    function step() {
      if (idx >= SCRIPT.length) return false;
      var e = SCRIPT[idx++];
      say(lg, e.c, e.t);
      if (e.todo) for (var i = 0; i < e.todo.length; i += 2) state[e.todo[i]] = e.todo[i + 1];
      paint();
      return idx < SCRIPT.length;
    }

    function reset() {
      idx = 0;
      state = TODOS.map(function () { return "pending"; });
      K.clear(lg);
      paint();
    }

    var bar = K.transport({ step: step, reset: reset, interval: 1.0 });
    root.appendChild(bar);
    root.appendChild(h("div", { class: "dk-split" }, [
      h("div", null, [h("div", { class: "dk-cap", text: "PLAN" }), todoList]),
      h("div", null, [h("div", { class: "dk-cap", text: "TRACE" }), lg])
    ]));
    root.appendChild(out);
    root.appendChild(K.note(
      "The critic runs as a separate subagent with its own context, so it reviews the " +
      "numbers without having talked itself into them. 412 → 63 is the whole point."));

    reset();
    return function () { bar.stop(); };
  };

  /* ============================================================
     co-scientist — four workflows, one runner
     ============================================================ */

  window.DEMOS["co-scientist"] = function (root) {
    var FLOWS = {
      biomni:  { label: "Biomni", stages: ["parse question", "select tools", "query UniProt / GEO", "run analysis", "summarise"] },
      geo:     { label: "GEO / SRA", stages: ["resolve accession", "download matrix", "pyDESeq2", "pathway enrichment", "report"] },
      st:      { label: "ST Agent", stages: ["load Visium", "map cell types", "spatial neighborhoods", "cell–cell interaction", "plots"] },
      atria:   { label: "CellAtria", stages: ["GEO retrieval", "QC", "integrate (Harmony)", "annotate", "marker report"] }
    };
    var order = ["biomni", "geo", "st", "atria"];
    var cur = "biomni", prog = 0, stop = null;

    var svg = K.stage({ viewBox: "0 0 340 104" });
    var boxes = [], labels = [], fills = [];
    for (var i = 0; i < 5; i++) {
      var y = 16 + i * 17;
      svg.appendChild(s("rect", { x: 8, y: y, width: 236, height: 13, rx: 2, fill: C.paper, stroke: C.rule, "stroke-width": 0.8 }));
      var f = s("rect", { x: 8, y: y, width: 0, height: 13, rx: 2, fill: C.wash });
      svg.appendChild(f);
      fills.push(f);
      var t = s("text", { x: 14, y: y + 9, class: "lab", text: "" });
      labels.push(t);
      svg.appendChild(t);
      var dot = s("circle", { cx: 254, cy: y + 6.5, r: 3.2, fill: C.rule });
      boxes.push(dot);
      svg.appendChild(dot);
      if (i < 4) svg.appendChild(s("line", { x1: 254, y1: y + 10, x2: 254, y2: y + 14, stroke: C.rule, "stroke-width": 1 }));
    }
    var title = s("text", { x: 8, y: 10, class: "lab-hd", text: "" });
    svg.appendChild(title);
    var status = s("text", { x: 266, y: 60, class: "lab-sm", text: "" });
    svg.appendChild(status);

    var out = K.readout([
      { id: "flow", label: "Workflow" },
      { id: "stage", label: "Stage" },
      { id: "iface", label: "Interfaces" },
      { id: "r", label: "R required" }
    ]);

    function paint() {
      var f = FLOWS[cur];
      title.textContent = f.label.toUpperCase() + " PIPELINE";
      f.stages.forEach(function (name, i) {
        labels[i].textContent = name;
        var local = K.clamp(prog - i, 0, 1);
        fills[i].setAttribute("width", 236 * K.ease(local));
        boxes[i].setAttribute("fill", local >= 1 ? C.good : local > 0 ? C.navy : C.rule);
        labels[i].setAttribute("fill", local > 0 ? C.ink : C.faint);
      });
      var done = Math.floor(K.clamp(prog, 0, 5));
      status.textContent = done >= 5 ? "complete" : "running";
      out.set("flow", f.label);
      out.set("stage", Math.min(done + (prog >= 5 ? 0 : 1), 5) + "/5");
      out.set("iface", "CLI · Jupyter · GUI");
      out.set("r", "no", "good");
    }

    function run() {
      if (stop) stop();
      prog = 0;
      stop = K.tick(function (dt) {
        prog += dt * 1.5;
        if (prog >= 5.6) { prog = 5; paint(); stop(); stop = null; return; }
        paint();
      });
    }

    var seg = K.segmented(order.map(function (id) { return { id: id, label: FLOWS[id].label }; }),
      "biomni", function (id) { cur = id; run(); });

    root.appendChild(K.toolbar([seg, h("button", { type: "button", text: "Re-run", onclick: run })]));
    root.appendChild(svg);
    root.appendChild(out);
    root.appendChild(K.note(
      "One runner, four specialised workflows, three front-ends — and no R dependency, " +
      "which is what makes it installable on a laptop."));

    paint();
    run();
    return function () { if (stop) stop(); };
  };

  /* ============================================================
     Bio-llm-agent-evals — GeneTuring, with and without live tools
     ============================================================ */

  window.DEMOS["Bio-llm-agent-evals"] = function (root) {
    var Q = [
      { q: "Gene at chr17:43,044,295-43,170,245?", a: "BRCA1", tool: "esearch", needs: true },
      { q: "Official symbol for alias 'p53'?", a: "TP53", needs: false },
      { q: "NM_000546 → gene symbol?", a: "TP53", tool: "esummary", needs: true },
      { q: "How many exons does CFTR have?", a: "27", tool: "efetch", needs: true },
      { q: "Which chromosome carries HBB?", a: "11", needs: false },
      { q: "RefSeq transcript for human IL2RA?", a: "NM_000417", tool: "esearch", needs: true },
      { q: "SMN1 or SMN2 in spinal muscular atrophy?", a: "SMN1", needs: false },
      { q: "Gene tagged by SNP rs334?", a: "HBB", tool: "esummary", needs: true }
    ];

    var withTools = true, i = 0, right = 0;
    var lg = log();

    var out = K.readout([
      { id: "acc", label: "Accuracy" },
      { id: "n", label: "Answered" },
      { id: "calls", label: "Tool calls" },
      { id: "mode", label: "Mode" }
    ]);

    var BAR_W = 300;
    var svg = K.stage({ viewBox: "0 0 340 46" });
    svg.appendChild(s("text", { x: 8, y: 12, class: "lab-hd", text: "RUNNING ACCURACY" }));
    svg.appendChild(s("rect", { x: 20, y: 20, width: BAR_W, height: 10, rx: 2, fill: C.rule }));
    var accFill = s("rect", { x: 20, y: 20, width: 0, height: 10, rx: 2, fill: C.navy });
    svg.appendChild(accFill);
    var accLab = s("text", { x: 20, y: 41, class: "lab-sm", text: "" });
    svg.appendChild(accLab);
    [0.25, 0.5, 0.75].forEach(function (f) {
      svg.appendChild(s("line", { x1: 20 + BAR_W * f, y1: 20, x2: 20 + BAR_W * f, y2: 30, stroke: "#fff", "stroke-width": 0.8 }));
    });

    function paint() {
      var acc = i ? right / i : 0;
      accFill.setAttribute("width", BAR_W * acc);
      accFill.setAttribute("fill", acc >= 0.7 ? C.good : acc >= 0.45 ? C.navy : C.bad);
      accLab.textContent = i ? right + " / " + i + " correct" : "no questions answered yet";
      out.set("acc", i ? K.pct(acc) : "—", acc >= 0.7 ? "good" : i ? "bad" : "");
      out.set("n", i + "/" + Q.length);
      out.set("calls", String(withTools ? Q.slice(0, i).filter(function (q) { return q.tool; }).length : 0));
      out.set("mode", withTools ? "+ E-utilities" : "model only");
    }

    function step() {
      if (i >= Q.length) return false;
      var q = Q[i++];
      say(lg, "", "<i>Q" + i + "</i> " + q.q);
      if (withTools && q.tool) {
        say(lg, "run", "<b>" + q.tool + "</b> → eutils.ncbi.nlm.nih.gov");
      }
      // Without tools the model guesses on anything needing a live lookup.
      var correct = withTools ? true : !q.needs;
      if (correct) { right++; say(lg, "ok", "<b>" + q.a + "</b> — match"); }
      else { say(lg, "bad", "hallucinated identifier — no match (expected <b>" + q.a + "</b>)"); }
      paint();
      return i < Q.length;
    }

    function reset() { i = 0; right = 0; K.clear(lg); paint(); }

    var seg = K.segmented([
      { id: "tools", label: "+ NCBI E-utilities" },
      { id: "bare", label: "Model only" }
    ], "tools", function (id) { withTools = id === "tools"; reset(); });

    var bar = K.transport({ step: step, reset: reset, interval: 0.85 });

    root.appendChild(K.toolbar([seg]));
    root.appendChild(bar);
    root.appendChild(svg);
    root.appendChild(h("div", { class: "dk-cap", text: "EVAL TRACE" }));
    root.appendChild(lg);
    root.appendChild(out);
    root.appendChild(K.note(
      "The gap between the two modes is the eval's whole reason to exist: it measures " +
      "whether the agent actually calls the tool, not whether the model memorised the answer."));

    reset();
    return function () { bar.stop(); };
  };

  /* ============================================================
     Agent-connector — sequential vs pooled parallel execution
     ============================================================ */

  window.DEMOS["Agent-connector"] = function (root) {
    var AGENTS = [
      { n: "protein-expression", ms: 2400 },
      { n: "differential-expression", ms: 3100 },
      { n: "target-characterization", ms: 1800 },
      { n: "scRNA-seq", ms: 4200 },
      { n: "literature-sweep", ms: 2600 },
      { n: "pathway-enrichment", ms: 1500 }
    ];
    var mode = "parallel", pool = 3, t = 0, stop = null;

    /* Schedule: sequential is one lane; parallel greedily fills `pool` lanes. */
    function schedule() {
      if (mode === "sequential") {
        var at = 0;
        return AGENTS.map(function (a, i) {
          var e = { start: at, end: at + a.ms, lane: 0, name: a.n };
          at += a.ms;
          return e;
        });
      }
      var lanes = new Array(pool).fill(0);
      return AGENTS.map(function (a) {
        var l = lanes.indexOf(Math.min.apply(null, lanes));
        var e = { start: lanes[l], end: lanes[l] + a.ms, lane: l, name: a.n };
        lanes[l] += a.ms;
        return e;
      });
    }

    var plan = schedule();
    var total = function () { return Math.max.apply(null, plan.map(function (e) { return e.end; })); };

    var X0 = 116, W = 214;
    var svg = K.stage({ viewBox: "0 0 340 116" });
    svg.appendChild(s("text", { x: 8, y: 12, class: "lab-hd", text: "EXECUTION TIMELINE" }));
    var rowsG = s("g", {});
    svg.appendChild(rowsG);
    var playhead = s("line", { y1: 16, y2: 100, stroke: C.bad, "stroke-width": 0.9 });
    svg.appendChild(playhead);
    var axis = s("text", { x: X0, y: 112, class: "lab-sm", text: "" });
    svg.appendChild(axis);

    var out = K.readout([
      { id: "mode", label: "Mode" },
      { id: "wall", label: "Wall clock" },
      { id: "cpu", label: "Agent time" },
      { id: "save", label: "Speed-up" }
    ]);

    function build() {
      K.clear(rowsG);
      var T = total();
      plan.forEach(function (e, i) {
        var y = 18 + i * 14;
        rowsG.appendChild(s("text", { x: 112, y: y + 8, class: "lab-sm", "text-anchor": "end", text: e.name }));
        rowsG.appendChild(s("rect", { x: X0, y: y, width: W, height: 10, rx: 1, fill: C.alt, stroke: C.rule, "stroke-width": 0.5 }));
        var bar = s("rect", {
          x: X0 + (e.start / T) * W, y: y, width: 0, height: 10, rx: 1,
          fill: C.series[e.lane % C.series.length], opacity: 0.9
        });
        bar.dataset.i = i;
        rowsG.appendChild(bar);
        e.node = bar;
      });
      axis.textContent = "0 s" + " ".repeat(0) + "  →  " + (T / 1000).toFixed(1) + " s";
    }

    function paint() {
      var T = total();
      plan.forEach(function (e) {
        var done = K.clamp((t - e.start) / (e.end - e.start), 0, 1);
        e.node.setAttribute("width", (e.end - e.start) / T * W * done);
      });
      playhead.setAttribute("x1", X0 + K.clamp(t / T, 0, 1) * W);
      playhead.setAttribute("x2", X0 + K.clamp(t / T, 0, 1) * W);

      var seqTotal = AGENTS.reduce(function (a, b) { return a + b.ms; }, 0);
      out.set("mode", mode === "parallel" ? "pool of " + pool : "sequential");
      out.set("wall", (T / 1000).toFixed(1) + " s", mode === "parallel" ? "good" : "warn");
      out.set("cpu", (seqTotal / 1000).toFixed(1) + " s");
      out.set("save", (seqTotal / T).toFixed(2) + "×", seqTotal / T > 1.5 ? "good" : "");
    }

    function run() {
      if (stop) stop();
      plan = schedule();
      build();
      t = 0;
      stop = K.tick(function (dt) {
        t += dt * 4200;
        if (t >= total() * 1.08) { t = total(); paint(); stop(); stop = null; return; }
        paint();
      });
    }

    var seg = K.segmented([
      { id: "parallel", label: "Parallel pool" },
      { id: "sequential", label: "Sequential chain" }
    ], "parallel", function (id) { mode = id; run(); });

    var sl = K.slider({ label: "pool size", min: 1, max: 6, step: 1, value: 3 },
      function (v) { pool = v; if (mode === "parallel") run(); });

    root.appendChild(K.toolbar([seg, sl]));
    root.appendChild(svg);
    root.appendChild(out);
    root.appendChild(K.note(
      "Per-call timing is recorded for every agent, which is what makes the pool worth " +
      "tuning — the wall clock is set by the slowest lane, not the total work."));

    run();
    return function () { if (stop) stop(); };
  };

  /* ============================================================
     biomni-launcher-ui — semantic search over past runs
     ============================================================ */

  window.DEMOS["biomni-launcher-ui"] = function (root) {
    var MEM = [
      { t: "KRAS G12C target characterization, NSCLC cohort", k: "kras g12c target characterization lung nsclc oncogene mutation inhibitor" },
      { t: "scRNA-seq QC on GSE150290 gastric series", k: "scrna single cell qc gastric geo gse150290 filtering doublets" },
      { t: "TGF-β signature vs atezolizumab response", k: "tgfb signature immunotherapy atezolizumab response bladder imvigor checkpoint" },
      { t: "CD8 exhaustion programs across 6 tumor types", k: "cd8 exhaustion tcell programs tumor pan-cancer nmf state" },
      { t: "Protein expression sweep — CLDN18.2 normals", k: "protein expression cldn18 normal tissue safety gastric antigen" },
      { t: "Pathway enrichment after SOS1+MEK inhibition", k: "pathway enrichment sos1 mek inhibition kras pancreatic pdac" },
      { t: "Literature sweep: bispecific antibody safety", k: "literature bispecific antibody safety toxicity cytokine review" },
      { t: "Harmony integration of 11 CRC datasets", k: "harmony integration batch correction colorectal crc atlas merge" }
    ];

    var input = h("input", {
      type: "search", class: "dk-input", placeholder: "search past runs…", value: "kras lung target"
    });
    var results = h("ol", { class: "dk-rank" });
    var out = K.readout([
      { id: "n", label: "Runs indexed" },
      { id: "hits", label: "Above cut" },
      { id: "top", label: "Top cosine" },
      { id: "mode", label: "Scope" }
    ]);

    var CUT = 0.18;

    /* Toy cosine over token sets — enough to show ranked recall behaviour. */
    function score(query, keys) {
      var q = query.toLowerCase().split(/[^a-z0-9.]+/).filter(Boolean);
      if (!q.length) return 0;
      var kk = keys.split(" ");
      var hit = 0;
      q.forEach(function (tok) {
        for (var i = 0; i < kk.length; i++) {
          if (kk[i] === tok) { hit += 1; return; }
          if (kk[i].indexOf(tok) === 0 && tok.length >= 3) { hit += 0.65; return; }
        }
      });
      return K.clamp(hit / Math.sqrt(q.length * 3.2), 0, 1);
    }

    function paint() {
      var q = input.value;
      var ranked = MEM.map(function (m) { return { t: m.t, sc: score(q, m.k) }; })
                      .sort(function (a, b) { return b.sc - a.sc; });
      K.clear(results);
      var above = 0;
      ranked.forEach(function (r) {
        if (r.sc >= CUT) above++;
        var bar = h("i", { style: "width:" + (r.sc * 100).toFixed(1) + "%" });
        results.appendChild(h("li", { class: r.sc >= CUT ? "" : "dim" }, [
          h("span", { class: "dk-rank-t", text: r.t }),
          h("span", { class: "dk-rank-b" }, [bar]),
          h("span", { class: "dk-rank-n", text: r.sc.toFixed(2) })
        ]));
      });
      out.set("n", String(MEM.length));
      out.set("hits", String(above), above ? "good" : "warn");
      out.set("top", ranked[0].sc.toFixed(2), ranked[0].sc >= 0.4 ? "good" : "warn");
      out.set("mode", "project");
    }

    input.addEventListener("input", paint);

    root.appendChild(K.toolbar([input]));
    root.appendChild(h("div", { class: "dk-cap", text: "RANKED RECALL" }));
    root.appendChild(results);
    root.appendChild(out);
    root.appendChild(K.note(
      "Type to re-rank. Project-scoped memory means a new run starts from what the last " +
      "one already established, instead of from an empty context."));

    paint();
  };

  /* ============================================================
     Discovery-Stack — compose the layers, see what you can build
     ============================================================ */

  window.DEMOS["Discovery-Stack"] = function (root) {
    var LAYERS = [
      { id: "io", label: "Data I/O", deps: [] },
      { id: "index", label: "Vector index", deps: ["io"] },
      { id: "tools", label: "Tool registry", deps: ["io"] },
      { id: "mem", label: "Run memory", deps: ["index"] },
      { id: "orch", label: "Orchestrator", deps: ["tools"] },
      { id: "eval", label: "Eval harness", deps: ["orch"] }
    ];
    var CAPS = [
      { label: "Grounded literature QA", needs: ["io", "index"] },
      { label: "Tool-calling agent", needs: ["io", "tools", "orch"] },
      { label: "Multi-run memory", needs: ["io", "index", "mem"] },
      { label: "Benchmarked agent", needs: ["io", "tools", "orch", "eval"] },
      { label: "Full discovery loop", needs: ["io", "index", "tools", "mem", "orch", "eval"] }
    ];

    var on = { io: true, index: true, tools: true, orch: true, mem: false, eval: false };

    var svg = K.stage({ viewBox: "0 0 340 122" });
    var boxes = {}, warns = {};
    LAYERS.forEach(function (l, i) {
      var y = 16 + i * 17;
      var g = s("g", {});
      var rect = s("rect", { x: 8, y: y, width: 132, height: 13, rx: 2, fill: C.rule, stroke: "none", style: "cursor:pointer" });
      var txt = s("text", { x: 14, y: y + 9, class: "lab", text: l.label, style: "cursor:pointer;pointer-events:none" });
      var wrn = s("text", { x: 146, y: y + 9, class: "lab-sm", fill: C.bad, text: "" });
      rect.addEventListener("click", function () { on[l.id] = !on[l.id]; paint(); });
      g.appendChild(rect); g.appendChild(txt); g.appendChild(wrn);
      svg.appendChild(g);
      boxes[l.id] = { rect: rect, txt: txt };
      warns[l.id] = wrn;
    });
    svg.appendChild(s("text", { x: 8, y: 10, class: "lab-hd", text: "LAYERS — click to toggle" }));

    svg.appendChild(s("text", { x: 200, y: 10, class: "lab-hd", text: "CAPABILITIES" }));
    var capDots = [], capTxt = [];
    CAPS.forEach(function (c, i) {
      var y = 16 + i * 17;
      var d = s("circle", { cx: 205, cy: y + 6.5, r: 3.4, fill: C.rule });
      var t = s("text", { x: 213, y: y + 9, class: "lab", text: c.label });
      capDots.push(d); capTxt.push(t);
      svg.appendChild(d); svg.appendChild(t);
    });

    var out = K.readout([
      { id: "act", label: "Layers active" },
      { id: "cap", label: "Capabilities" },
      { id: "brk", label: "Unmet deps" }
    ]);

    function paint() {
      var broken = 0;
      LAYERS.forEach(function (l) {
        var missing = l.deps.filter(function (d) { return !on[d]; });
        var bad = on[l.id] && missing.length > 0;
        if (bad) broken++;
        boxes[l.id].rect.setAttribute("fill", !on[l.id] ? C.rule : bad ? "#f3dede" : C.wash);
        boxes[l.id].rect.setAttribute("stroke", bad ? C.bad : on[l.id] ? C.navy : "none");
        boxes[l.id].rect.setAttribute("stroke-width", bad || on[l.id] ? 0.9 : 0);
        boxes[l.id].txt.setAttribute("fill", on[l.id] ? C.ink : C.faint);
        warns[l.id].textContent = bad ? "needs " + missing.join(", ") : "";
      });

      var nCap = 0;
      CAPS.forEach(function (c, i) {
        var ok = c.needs.every(function (n) {
          var layer = LAYERS.filter(function (l) { return l.id === n; })[0];
          return on[n] && layer.deps.every(function (d) { return on[d]; });
        });
        if (ok) nCap++;
        capDots[i].setAttribute("fill", ok ? C.good : C.rule);
        capTxt[i].setAttribute("fill", ok ? C.ink : C.faint);
      });

      out.set("act", Object.keys(on).filter(function (k) { return on[k]; }).length + "/6");
      out.set("cap", nCap + "/" + CAPS.length, nCap === CAPS.length ? "good" : "");
      out.set("brk", String(broken), broken ? "bad" : "good");
    }

    root.appendChild(svg);
    root.appendChild(out);
    root.appendChild(K.note(
      "Layers are independently installable but not independent — turning off the vector " +
      "index takes run memory with it. Toggle a layer to see what stops being buildable."));

    paint();
  };

  /* ============================================================
     LangGraph-cookbook — the graph topology behind each recipe
     ============================================================ */

  window.DEMOS["LangGraph-cookbook"] = function (root) {
    var RECIPES = {
      chat: {
        label: "Web-search chatbot",
        nodes: [{ id: "in", x: 34, y: 58, t: "input" }, { id: "route", x: 106, y: 58, t: "route" },
                { id: "search", x: 182, y: 30, t: "web_search" }, { id: "answer", x: 182, y: 86, t: "answer" },
                { id: "out", x: 272, y: 58, t: "reply" }],
        edges: [["in", "route"], ["route", "search"], ["route", "answer"], ["search", "answer"], ["answer", "out"]],
        path: ["in", "route", "search", "answer", "out"]
      },
      stock: {
        label: "Stock screener",
        nodes: [{ id: "in", x: 34, y: 58, t: "universe" }, { id: "fetch", x: 104, y: 58, t: "fetch OHLC" },
                { id: "ind", x: 178, y: 30, t: "indicators" }, { id: "filt", x: 178, y: 86, t: "screen" },
                { id: "out", x: 272, y: 58, t: "shortlist" }],
        edges: [["in", "fetch"], ["fetch", "ind"], ["ind", "filt"], ["fetch", "filt"], ["filt", "out"]],
        path: ["in", "fetch", "ind", "filt", "out"]
      },
      gene: {
        label: "Gene enrichment",
        nodes: [{ id: "in", x: 34, y: 58, t: "gene list" }, { id: "map", x: 104, y: 58, t: "id map" },
                { id: "over", x: 178, y: 30, t: "ORA" }, { id: "gsea", x: 178, y: 86, t: "GSEA" },
                { id: "out", x: 272, y: 58, t: "report" }],
        edges: [["in", "map"], ["map", "over"], ["map", "gsea"], ["over", "out"], ["gsea", "out"]],
        path: ["in", "map", "over", "gsea", "out"]
      }
    };

    var cur = "chat", t = 0, stop = null;
    var svg = K.stage({ viewBox: "0 0 340 116" });
    var edgeG = s("g", {}), nodeG = s("g", {}), tokenG = s("g", {});
    svg.appendChild(edgeG); svg.appendChild(nodeG); svg.appendChild(tokenG);
    var title = s("text", { x: 8, y: 12, class: "lab-hd", text: "" });
    svg.appendChild(title);

    var token = s("circle", { r: 3.6, fill: C.bad, opacity: 0 });
    tokenG.appendChild(token);

    var nodeMap = {}, nodeEls = {};

    var out = K.readout([
      { id: "rec", label: "Recipe" },
      { id: "n", label: "Nodes" },
      { id: "e", label: "Edges" },
      { id: "at", label: "Executing" }
    ]);

    function build() {
      var R = RECIPES[cur];
      K.clear(edgeG); K.clear(nodeG);
      nodeMap = {}; nodeEls = {};
      R.nodes.forEach(function (n) { nodeMap[n.id] = n; });

      R.edges.forEach(function (e) {
        var a = nodeMap[e[0]], b = nodeMap[e[1]];
        edgeG.appendChild(s("line", {
          x1: a.x + 26, y1: a.y + 7, x2: b.x - 2, y2: b.y + 7,
          stroke: C.rule, "stroke-width": 1
        }));
      });

      R.nodes.forEach(function (n) {
        var rect = s("rect", { x: n.x - 2, y: n.y, width: 56, height: 14, rx: 7, fill: C.paper, stroke: C.rule, "stroke-width": 0.9 });
        var txt = s("text", { x: n.x + 26, y: n.y + 9.5, class: "lab-sm", "text-anchor": "middle", text: n.t });
        nodeG.appendChild(rect); nodeG.appendChild(txt);
        nodeEls[n.id] = { rect: rect, txt: txt };
      });

      title.textContent = R.label.toUpperCase();
      out.set("rec", R.label);
      out.set("n", String(R.nodes.length));
      out.set("e", String(R.edges.length));
    }

    function paint() {
      var R = RECIPES[cur];
      var pos = K.clamp(t, 0, R.path.length - 1);
      var i = Math.floor(pos), frac = pos - i;
      var a = nodeMap[R.path[i]], b = nodeMap[R.path[Math.min(i + 1, R.path.length - 1)]];
      token.setAttribute("cx", K.lerp(a.x + 26, b.x + 26, K.ease(frac)));
      token.setAttribute("cy", K.lerp(a.y + 7, b.y + 7, K.ease(frac)));
      token.setAttribute("opacity", 1);

      R.nodes.forEach(function (n) {
        var reached = R.path.indexOf(n.id) >= 0 && R.path.indexOf(n.id) <= pos + 0.001;
        var active = R.path[i] === n.id;
        nodeEls[n.id].rect.setAttribute("fill", active ? C.navy : reached ? C.wash : C.paper);
        nodeEls[n.id].rect.setAttribute("stroke", reached ? C.navy : C.rule);
        nodeEls[n.id].txt.setAttribute("fill", active ? "#fff" : reached ? C.navy : C.faint);
      });
      out.set("at", nodeMap[R.path[i]].t);
    }

    function run() {
      if (stop) stop();
      build();
      t = 0;
      stop = K.tick(function (dt) {
        t += dt * 1.1;
        if (t >= RECIPES[cur].path.length - 1 + 0.6) { t = 0; }
        paint();
      });
    }

    var seg = K.segmented(Object.keys(RECIPES).map(function (id) {
      return { id: id, label: RECIPES[id].label };
    }), "chat", function (id) { cur = id; run(); });

    root.appendChild(K.toolbar([seg]));
    root.appendChild(svg);
    root.appendChild(out);
    root.appendChild(K.note(
      "Same runtime, three topologies. The branch after routing is where LangGraph earns " +
      "its keep over a linear chain."));

    run();
    return function () { if (stop) stop(); };
  };

})(DemoKit);
