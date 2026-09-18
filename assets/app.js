/* Renders the portfolio from the data in projects.js. No dependencies, no build step. */

(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function link(href, text, cls) {
    var a = el("a", cls, text);
    a.href = href;
    if (/^https?:/.test(href)) { a.rel = "noopener"; a.target = "_blank"; }
    return a;
  }

  function repoUrl(p) {
    return "https://github.com/" + p.account + "/" + p.name;
  }

  /* ---------- masthead ---------- */

  function renderProfile() {
    document.title = PROFILE.name + ", " + PROFILE.credentials.replace(/,\s*/g, " ") +
                     " — Computational Biology & AI";
    $("p-name").firstChild.nodeValue = PROFILE.name;
    $("p-creds").textContent = PROFILE.credentials;
    $("p-role").textContent = PROFILE.title;
    $("p-affil").textContent = PROFILE.affiliation;
    $("p-summary").textContent = PROFILE.summary;

    var contact = $("p-contact");
    [
      link("mailto:" + PROFILE.email, PROFILE.email),
      link(PROFILE.linkedin, "linkedin.com/in/di-feng"),
      link(PROFILE.github, "github.com/d-feng"),
      link(PROFILE.githubAlt, "github.com/fengdi2015"),
      el("span", null, PROFILE.location)
    ].forEach(function (node) {
      var li = el("li");
      li.appendChild(node);
      contact.appendChild(li);
    });

    var stats = $("p-stats");
    PROFILE.stats.forEach(function (s) {
      var d = el("div", "stat");
      d.appendChild(el("b", null, s.value));
      d.appendChild(el("span", null, s.label));
      stats.appendChild(d);
    });
  }

  /* ---------- projects ---------- */

  function card(p) {
    var art = el("article", "card" + (p.featured ? " is-featured" : ""));
    art.dataset.category = p.category;

    var meta = el("div", "meta");
    meta.appendChild(el("span", "lang", p.lang || ""));
    meta.appendChild(el("span", "badge", p.featured ? "Highlighted" : p.account));
    art.appendChild(meta);

    var h3 = el("h3");
    h3.appendChild(link(repoUrl(p), p.name));
    art.appendChild(h3);

    art.appendChild(el("p", "tagline", p.tagline));
    art.appendChild(el("p", "body", p.body));

    if (p.tags && p.tags.length) {
      var ul = el("ul", "tags");
      p.tags.forEach(function (t) { ul.appendChild(el("li", null, t)); });
      art.appendChild(ul);
    }

    var links = el("div", "links");
    links.appendChild(link(repoUrl(p), "Source"));
    if (p.doi) links.appendChild(link(p.doi, "Paper"));

    art.appendChild(links);

    var factory = window.DEMOS && window.DEMOS[p.name];
    if (factory) {
      art.className += " has-demo";
      var panel = el("div", "demo-panel");
      panel.appendChild(el("div", "demo-head", "Live demo — interactive, simulated data"));
      var host = el("div", "demo-host");
      panel.appendChild(host);
      art.appendChild(panel);
      mountDemo(host, factory, p.name);
    }

    return art;
  }

  /* Demos are on by default and built up front. All eighteen together cost
     ~30ms, so deferring them behind an observer would only add a way for a
     panel to end up visibly empty. A demo that throws is contained to its
     own card. */
  function mountDemo(host, factory, name) {
    try {
      factory(host);
    } catch (err) {
      host.appendChild(el("p", "dk-note", "This demo failed to start: " + err.message));
      if (window.console) console.error("demo:" + name, err);
    }
  }

  function renderProjects() {
    var grid = $("p-grid");
    // Highlighted entries lead, then the rest in declaration order.
    PROJECTS.slice()
      .sort(function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); })
      .forEach(function (p) { grid.appendChild(card(p)); });
  }

  function renderFilters() {
    var bar = $("p-filters");
    var all = [{ id: "all", label: "All work" }].concat(CATEGORIES);

    all.forEach(function (c) {
      var b = el("button", null, c.label);
      b.type = "button";
      b.setAttribute("aria-pressed", c.id === "all" ? "true" : "false");
      b.addEventListener("click", function () {
        Array.prototype.forEach.call(bar.children, function (other) {
          other.setAttribute("aria-pressed", other === b ? "true" : "false");
        });
        Array.prototype.forEach.call($("p-grid").children, function (art) {
          art.hidden = !(c.id === "all" || art.dataset.category === c.id);
        });
      });
      bar.appendChild(b);
    });
  }

  /* ---------- skills & publications ---------- */

  function renderSkills() {
    var host = $("p-skills");
    SKILLS.forEach(function (g) {
      var d = el("div");
      d.appendChild(el("h3", null, g.heading));
      var ul = el("ul");
      g.items.forEach(function (i) { ul.appendChild(el("li", null, i)); });
      d.appendChild(ul);
      host.appendChild(d);
    });
  }

  function renderPublications() {
    var ol = $("p-pubs");
    PUBLICATIONS.forEach(function (p) {
      var li = el("li");
      li.appendChild(el("span", "authors", p.authors + " "));
      li.appendChild(p.doi ? link(p.doi, p.text, "title") : el("span", "title", p.text));
      li.appendChild(el("span", "venue", " " + p.venue));
      li.appendChild(el("span", "year", " (" + p.year + ")"));
      ol.appendChild(li);
    });
    $("p-pubnote").textContent =
      "40 peer-reviewed publications and one US patent spanning immunology, oncology, " +
      "computational biology, and AI (2003–2025).";
  }

  function renderFooter() {
    $("f-name").textContent = PROFILE.name + " · " + PROFILE.location;
    var links = $("f-links");
    links.appendChild(link("mailto:" + PROFILE.email, "Email"));
    links.appendChild(document.createTextNode("  ·  "));
    links.appendChild(link(PROFILE.linkedin, "LinkedIn"));
    links.appendChild(document.createTextNode("  ·  "));
    links.appendChild(link(PROFILE.github, "GitHub"));
  }

  renderProfile();
  renderProjects();
  renderFilters();
  renderSkills();
  renderPublications();
  renderFooter();
})();
