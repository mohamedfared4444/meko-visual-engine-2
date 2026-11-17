# Meko Visual Engine 2.0 — Isolated Prototype

**Branch: `visual-engine-2-prototype`** (never merged to `main`, never deployed)

An isolated proof-of-concept for a premium stylized **2.5D educational
manufacturing animation engine**, built with **Motion Canvas 3.17 + TypeScript**,
designed for the Meko video production platform.

The test scene is **"HOW CHOCOLATE IS MADE FROM SCRATCH"** — five connected
production stages (conveyor → roasting → grinding → conching → molding),
1080×1920 @ 30 fps, silent, ~60 s.

---

## Quick start

```bash
npm install          # free, open-source deps only
npm run typecheck    # strict TypeScript
npm run render       # headless render -> output/meko-visual-engine-2-preview.mp4
npm run dev          # live editor (optional; needs `npm i @motion-canvas/ui`)
```

The render driver (`scripts/render.mjs`):

1. starts the vite dev server with the Motion Canvas plugin,
2. opens `render.html` in headless Chrome,
3. Motion Canvas' public `Renderer` class renders frame-by-frame
   deterministically and a custom exporter streams each JPEG frame to the
   plugin's own `motion-canvas:export` websocket endpoint,
4. FFmpeg assembles the MP4 (`libx264`, CRF 18, `yuv420p`, faststart),
5. writes `output/render-stats.json` (frames, wall time, peak RSS).

Chrome is auto-detected from the puppeteer cache or `CHROME_PATH`
(`/usr/bin/google-chrome` on GitHub runners).

## Why a custom harness?

Motion Canvas 3.x has **no official CLI/headless renderer** — rendering is
normally triggered from the editor UI. The engine's public `Renderer` +
exporter interfaces are stable, so this prototype drives them headlessly
without patching any upstream package. That makes GitHub Actions rendering
possible while staying on vanilla upstream dependencies.

## Source map

| Path | Purpose |
| --- | --- |
| `src/project.ts` | Motion Canvas project entry (scenes, 1080×1920 @ 30fps) |
| `src/scenes/chocolate.ts` | The 60 s timeline: camera choreography, five stages |
| `src/lib/camera.ts` | Deterministic parallax camera rig (signals, no DOM) |
| `src/lib/world.ts` | World constants (floor line, machine centers, belt heights) |
| `src/lib/palette.ts` | Controlled palette (cream / cocoa / steel / stage accents) |
| `src/lib/shadows.ts` | Soft shadow + gradient factories (radial falloff) |
| `src/lib/beans.ts` | Bean / nib / dollop / chocolate-bar factories |
| `src/lib/machines/*` | Conveyor, roaster (cutaway), grinder (cutaway), conche, molder |
| `src/lib/ui.ts` | Screen-space UI: title, captions, progress dots, end card |
| `src/lib/narration.ts` | **Unused** compatibility hook for Meko word timings |
| `src/render-main.ts` | Headless harness + JPEG frame exporter |
| `scripts/render.mjs` | Node driver: vite + Chrome + FFmpeg + stats |
| `.github/workflows/render-prototype.yml` | Isolated manual render workflow |

## Determinism

- All motion derives from tweened signals; no `Math.random()`, no
  wall-clock reads, no real-time playback loop (the `Renderer` advances
  frame-by-frame).
- Fonts (Baloo 2, Nunito — SIL OFL) are bundled in `src/fonts/` and loaded
  before the first frame, so typography is identical everywhere.

## Audio & caption compatibility

The prototype renders silently. `src/lib/narration.ts` documents the
integration surface: Meko's existing Edge-TTS audio and word-timing JSON map
1:1 onto the scene's fixed 30 fps timeline (`NarrationCue`). No Meko caption
system was rebuilt and none of Meko's production code was touched.

## License notes

- Code: MIT (see `LICENSE`).
- Fonts: Baloo 2 & Nunito under the SIL Open Font License — bundled with
  redistribution permitted; see `src/fonts/OFL.txt`.
- Dependencies: all MIT/Apache-2.0 open source (see `docs/DEPENDENCIES.md`).
