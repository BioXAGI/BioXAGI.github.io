# Portfolio site — Di Feng

Static portfolio site. No build step, no dependencies: plain HTML, one CSS file, two
JS files. Works when served from any directory.

```
index.html            markup shell (empty containers, filled by app.js)
assets/style.css      clean academic light theme
assets/projects.js    ALL CONTENT LIVES HERE — profile, projects, skills, publications
assets/app.js         renders the data into the shell, wires the demo toggles
assets/demo.css       styling for the interactive demo panels
assets/demo-kit.js    shared demo toolkit — seeded RNG, rAF ticker, UI atoms
assets/demos-*.js     the 18 interactive demos, grouped by category
.nojekyll             tells GitHub Pages not to run Jekyll
```

## Interactive demos

Every project card carries a working mini-app illustrating what that repo does —
a Boolean antigen-gate explorer for `antigen-combos`, a consensus-NMF rank sweep for
`deconv`, an agent trace where the critic subagent catches a missing FDR correction
for `BioAgent`, and so on. They are **visible by default**: nothing to click to
reveal, every demo is live as soon as the page loads.

Rules these follow:

- **All data is simulated and seeded.** `DemoKit.rng()` is a mulberry32 PRNG — no
  `Math.random` anywhere — so a demo renders identically on every load and in
  screenshots. Nothing is a reproduction of a real published result.
- **Metrics are computed, not asserted.** Where a demo makes a claim, it calculates
  it live: `BioNetwork` runs a real segment-intersection test on whatever node
  positions are on screen (8 crossings anchored vs 72–120 force-directed).
- **Nothing is fetched.** No network calls, no API keys, no rate limits, works offline.
- **Built up front.** All eighteen mount during render for about 30 ms total, so
  they are not deferred behind an observer — that would only add a way for a panel
  to end up visibly empty. A demo that throws is contained to its own card.
- **One shared clock.** Animation runs off a single `requestAnimationFrame` ticker
  in `demo-kit.js`. Most demos settle and go idle after their opening transition;
  only the LangGraph graph traversal loops continuously.

To add or change one, edit the matching `assets/demos-*.js`; the key in
`window.DEMOS` must equal the project's `name` in `projects.js`. A project with no
matching key simply renders without a demo button.

## Editing content

Everything you'd want to change is in `assets/projects.js`:

- `PROFILE` — name, title, contact links, summary, the four stat tiles
- `CATEGORIES` — the filter buttons above the project grid
- `PROJECTS` — one object per repo. `account` decides the GitHub URL, so repos under
  both `d-feng` and `fengdi2015` coexist in one grid. Set `featured: true` to tint the
  card and float it to the top. Optional `doi` adds a second "Paper" link.
- `SKILLS`, `PUBLICATIONS` — the lower two sections

Nothing is fetched from the GitHub API at runtime, so the page never breaks on rate
limits and works offline.

## Preview locally

```bash
python -m http.server 8020 --directory C:/CV_machine/portfolio
```

Then open <http://localhost:8020>.

## Deploying

The site is currently **local only — nothing has been pushed.**

### Option A — refresh the existing site at `d-feng.github.io`

This is the URL the CV points at. The repo already holds a Vite/TypeScript SPA that
publishes from `master` branch, `/docs` folder. To replace it with this site, copy
these files into `docs/` and push:

```bash
gh auth switch --user d-feng
git clone https://github.com/d-feng/d-feng.github.io.git
```

Then copy `index.html`, `assets/`, and `.nojekyll` into the clone's `docs/` directory,
commit, and push. Pages settings need no change — the source is already `master:/docs`.

Note: the current `gh` login (`fengdi2015`) has read-only access to that repo, so the
auth switch is required.

### Option B — new site at `fengdi2015.github.io`

Publishes at <https://fengdi2015.github.io> from the repo root:

```bash
gh repo create fengdi2015.github.io --public --source=. --push
```

Run that from this directory after `git init && git add -A && git commit`. Then enable
Pages on `main` / root in the repo settings.

### Option C — project page under any repo

Copy into a `docs/` folder of an existing repo and set Pages source to `main:/docs`.
All asset paths are relative, so it works under a subpath like
`https://<user>.github.io/<repo>/`.
