# Arnab // Mission Control

An explorable, gamified portfolio: an interactive **physics lab** on the landing page, a real
CLI terminal that drives the whole site, three color modes, and a hands-on **sandbox on every
project page** — a small, honest in-browser simulation of the real system, next to the
why/what/stack/numbers/when of the production version. Projects are never shown proactively:
the archive is opened by the visitor (button or `ls`).

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static output in dist/
npm run preview    # serve the production build locally
node scripts/smoke.mjs   # headless smoke test + screenshots (needs `npm run preview` on :4321)
```

## The physics lab (`src/three/`)

- **Double pendulum** — Lagrangian equations of motion integrated with RK4 at a fixed 240 Hz
  sub-step (Euler visibly pumps energy into this system). Drag either bob to set initial
  conditions; up to 8 "ghost" pendulums start 0.001 rad apart and diverge. Ring-buffer trails,
  gravity / damping / time-scale sliders, randomize, pause.
- **Young's double slit** — a ripple tank in a vertex shader (plane wave → two cylindrical
  waves from the slits, finite-difference normals for shading) with a detection screen whose
  fragment shader draws the analytic time-averaged fringes `2A²(1+cos kΔr)` × the single-slit
  sinc² envelope. Sliders for slit gap and wavelength; close a slit and the fringes vanish.
- Controls live in a slim icon **rail** docked to the right edge of the hero (experiment
  switch, pause, reset, randomize, tune); the sliders and live readouts sit in a **drawer**
  that slides out beside it on demand and closes with Esc — the scene and the hero copy stay
  unobstructed. On narrow screens the rail becomes a horizontal pill under the header and the
  drawer a bottom sheet.
- Shared state lives in `src/store/labStore.ts`, so the rail, the drawer, the 3D scene and the
  terminal (`lab pendulum`, `lab slits`, `lab reset`, `lab random`) all drive the same lab.
- On wide screens the scene is drawn through an asymmetric frustum (`camera.setViewOffset`)
  so the experiment sits to the right of the hero copy while staying orbit-centred.

## Themes

Three modes × five accents, all as CSS design tokens in `src/styles/global.css`:

- `data-mode`: **dark** (default) · **dim** (softer, GitHub dark_dimmed-style) · **light**
- `data-accent`: cyan · green · amber · violet · pink

Every component, sandbox, the terminal and the 3D scene read only these tokens
(`src/three/usePalette.ts` re-reads them for three.js), so a switch re-paints everything.
The header button cycles modes; the terminal accepts `theme dark|dim|light` and
`theme <accent>`. Choice is persisted and applied by an inline `<head>` script before first
paint (no flash). Accent hues are darkened per mode so text stays legible on light.

## Progressive reveal

The homepage shows the lab, a metrics strip and a **locked archive**. Projects appear only
when asked: the "declassify" button (3 at a time, or "reveal all") or the terminal (`ls`
reveals 6, `ls --all` / `reveal all` everything). The reveal count is session-only — every
visit starts locked. The full paginated index is one click away at `/projects`.

## Architecture & performance

- **Static-first.** All project data is baked in (`src/data/projects.ts`). No runtime APIs,
  no backend — instantly loadable from any static host/CDN.
- **Code-splitting.** Core shell ≈80 KB gzipped. three.js (~230 KB gz) lives only in the
  lazy `PhysicsLab` chunk. Each of the 16 sandboxes is its own ~2 KB lazy chunk.
- **Clean URLs** via `BrowserRouter` (`/projects`, not `/#/projects`). The host must serve
  `index.html` for unknown paths — `public/_redirects` does that on Cloudflare Pages / Netlify,
  and Vite dev + preview do it natively. (A host without rewrite support, e.g. plain GitHub
  Pages, would need `HashRouter` instead.)
- **`public/_headers`** fingerprints assets as immutable for a year and keeps `index.html`
  revalidating, so returning visitors re-download nothing but still get new deploys.
- **Graceful WebGL fallback**: `src/lib/webgl.ts` probes for a context; if none is available
  (locked-down machines, disabled acceleration) or `prefers-reduced-motion` is set, the hero
  renders `LabFallback` — the same RK4 double pendulum integrated in JS and drawn as an SVG
  trace, no GPU required.
- Self-hosted fonts (JetBrains Mono + Space Grotesk); `prefers-reduced-motion` disables the
  WebGL scene and animations; pagination + filters + search on `/projects`.

## Gamification

XP, levels, ranks (persisted), 12 achievements with toasts — earned by revealing systems,
visiting projects, running commands, tinkering with the lab and playing with sandboxes.
Terminal: `` ` `` toggles. `help`, `ls`, `open <slug>`, `cat <codename>`, `neofetch`,
`theme`, `lab`, `matrix`, `sudo hire-me`; Tab completes, ↑ recalls.

## Deploy

Cloudflare Pages (recommended — free, unlimited bandwidth, global CDN):

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Env var | `NODE_VERSION` = `22` |

Connect the GitHub repo once and every `git push` to `main` triggers a rebuild and deploy
(~2 min). Pull requests get their own preview URL automatically. `_headers` and `_redirects`
are picked up from the build output — no dashboard configuration needed.

Netlify works identically with the same two files. A host without SPA rewrite support would
need `HashRouter` back in `src/main.tsx`.

## Career timeline

`src/data/profile.ts` holds identity (role, company, previous role, education, links) and an
`experience` array (work / education / award / project entries with dates, summary, bullets,
tags). `src/components/Timeline.tsx` renders it two ways: the full vertical chronology on
`/about` (newest first, pulsing "NOW" node, expandable highlights) and the compact
`Trajectory` strip on the home page. Update the array — no component changes needed.

## Content

Project facts are distilled from the real repos' READMEs at github.com/TerrorBlade2002 and
the resume (metrics like AUC-PR, latency percentiles, user counts). Edit
`src/data/projects.ts` and `src/data/profile.ts` — no code changes needed.
