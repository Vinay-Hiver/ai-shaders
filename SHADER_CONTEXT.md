# Hiver Onboarding — Shader Background Context

## Project
Vite + React 18 + TypeScript. Dev server: `npm run dev` → `localhost:5173`.

## Goal
Animated shader background for the **right panel** of the Hiver onboarding screen (`src/components/OnboardingScreen.tsx`). No video. Two final options selectable via a **1/2 switcher** (bottom-left, fixed).

---

## Stack / Key Deps
- `@paper-design/shaders` + `@paper-design/shaders-react` v0.0.80 (Apache-2.0)
- Custom WebGL2 (GLSL ES 3.00) pipeline — paper components can't be chained; raw shader strings can
- Paper exports used: `gemSmokeFragmentShader`, `meshGradientFragmentShader`, `getShaderColorFromString`, `GemSmokeShapes`, `ShaderFitOptions`

---

## Architecture

### Routing (`src/main.tsx`)
```
?lab=waves  → WavesLab    (final option 1)
?lab=mesh   → MeshLab     (final option 2)
(no param)  → OnboardingScreen  ← production view
```

### OnboardingScreen (`src/components/OnboardingScreen.tsx`)
- Left: form panel (logo, progress, URL input, CTA)
- Right: `shader-placeholder` div renders **both** `<WavesLab embed active={opt===1} />` and `<MeshLab embed active={opt===2} />` simultaneously (both mounted, opacity toggle — preserves state on switch)
- Fixed bottom-left: **1/2 switcher** buttons
- Fixed top-right: **Controls / Hide controls** toggle (only active shader shows it)

---

## Option 1 — WavesLab (`src/components/WavesLab.tsx`)
**Pipeline:** paper `GemSmoke` (fire) → RGBA16F render-target texture → hand-rolled fluted-glass GLSL → screen

### Glass shader (G_FRAG) features
- Rotated coord space (`uAngle`)
- **Continuous Directional Motion Loop**: 4 selectable directions (Top Left `tl`, Top Right `tr`, Bottom Left `bl`, Bottom Right `br`, plus Static `none`) with `moveSpeed` slider
- Wavy flutes: `sin + value-noise fbm` along flute length (`uWaviness`, `uWaveFreq`)
- Per-flute cylindrical lens refraction (`uStrength`)
- N=13 multi-tap stretch/smear along flute axis (`uStretch`, `uBlur`)
- Chromatic dispersion — RGB channel offset (`uDisp`)
- Frost/grain jitter (`uGrain`) applied to tap base UV
- Bevel ridge shading — content-independent, makes panes visible on flat color (`uBevel`)
- Prismatic diffraction — rainbow fringe at groove edges (`uDiffraction`)
- Groove shadow (`uGroove`), flute highlight (`uHighlight`)
- Scale + X/Y position (`uScale`, `uOffsetX`, `uOffsetY`)
- Float RT (`RGBA16F/HALF_FLOAT` via `EXT_color_buffer_float`) — eliminates banding

### Waves Background config & 4-Color Percentage System
Custom 4-color fluid waves pipeline (renamed from Fire) mapped to percentage visibility and temporal modulation:
- `15% - `: Crest / highlight layer (`u_colors[0]`, default: `#fdb021`)
- `20% - `: Upper-mid wave (`u_colors[1]`, default: `#fff`)
- `30% - `: Lower-mid tone (`u_colors[2]`, default: `#ffffff`)
- `35% - `: Base ambient coverage (`u_colors[3]`, default: `#0051ff`)
- **Individual Color Opacity**: Each color slot has its own dedicated `opacity` slider (0.0–1.0) and editable text input. Lowering a color's opacity cleanly blends it out and reveals underlying layers without popping or seams. When all opacities are set to zero, the canvas renders pure white.
- **Time-Gated Dominance (Option C)**: In addition to spatial density partitioning, the animation cycle is partitioned into 4 contiguous time windows (15%, 20%, 30%, 35%). The 35% color commands 35% of the total animation duration as the primary blooming color, with smooth bell-curve transitions between windows.
- **Randomness / Turbulence Control**: `randomness` slider (`u_randomness`, 0–2) injects organic FBM coordinate turbulence and chaotic fluid eddies.
- **Distortion Control**: `distortion` slider (`u_outerDistortion`, 0–2) scales fluid swirl dynamics.

### Default values (tuned)
```js
waves: { count:16, waviness:2, waveFreq:1.3, strength:2.1, stretch:1, disp:0.5, blur:1,
         angle:-28, scale:5, offsetX:0, offsetY:0, highlight:0, groove:0,
         grain:0.15, bevel:0, diffraction:0.02, moveDir:'tr', moveSpeed:0.12 }
wavesBg: { colors:['#fdb021','#fff','#ffffff','#0051ff'], opacities:[1,1,1,1],
           randomness:0.05, outerDistortion:0.71, outerGlow:1, angle:104, speed:0.1, scale:1.6 }
```

---

## Option 2 — MeshLab (`src/components/MeshLab.tsx`)
**Pipeline:** Custom 4-color weighted `MeshGradient` → RGBA16F render-target texture → same fluted-glass GLSL → screen

Identical glass shader and controls to WavesLab. Background uses 4 color nodes with percentage-based spatial influence scaling (`u_weights` = [0.15, 0.20, 0.30, 0.35]) and temporal phase modulation.

### MeshGradient controls & percentages
- `15% - `: First node (default: `#fcffd1`)
- `20% - `: Second node (default: `#c2d5ff`)
- `30% - `: Third node (default: `#c2ceff`)
- `35% - `: Fourth node (default: `#f9df39`)

### Default values (tuned)
```js
waves: { count:13, waviness:0.95, waveFreq:2.4, strength:1, stretch:1, disp:0.5, blur:1,
         angle:-25, scale:4.58, offsetX:0, offsetY:0, highlight:0, groove:0,
         grain:0.62, bevel:0, diffraction:0.05 }
mesh:  { colors:['#fcffd1','#c2d5ff','#c2ceff','#f9df39'],
         distortion:0.8, swirl:0.1, grainMixer:0, grainOverlay:0,
         speed:1, scale:1, rotation:0, offsetX:0, offsetY:0 }
```

---

## Glass Controls (both options)
| Control | Uniform | Range | Notes |
|---|---|---|---|
| flutes | `uCount` | 2–40 | number of flutes |
| waviness | `uWaviness` | 0–2 | amplitude of flute wobble |
| wave freq | `uWaveFreq` | 0.1–4 | frequency of wobble |
| strength | `uStrength` | 0–3 | refraction magnitude |
| stretch | `uStretch` | 0–3 | along-flute smear |
| dispersion | `uDisp` | 0–3 | chromatic aberration |
| flute highlight | `uHighlight` | 0–0.5 | bright crest line |
| groove shadow | `uGroove` | 0–0.5 | dark groove line |
| bevel (ridge) | `uBevel` | 0–1 | content-independent ridge shading |
| diffraction | `uDiffraction` | 0–1 | prismatic rainbow fringe |
| grain (frost) | `uGrain` | 0–1 | frosted glass texture |
| blur | `uBlur` | 0–4 | tap spread (bokeh) |
| angle° | `uAngle` | -90–90 | flute rotation |
| scale | `uScale` | 0.2–5 | zoom flute pattern |
| X/Y position | `uOffsetX/Y` | -1–1 | pan flute pattern |

---

## Embed Mode
Both components accept `embed` and `active` props:
- `embed=true` → canvas-only (no lab layout), floats a **Controls** toggle button (top-right, fixed) that shows/hides the full slider panel as a fixed right overlay
- `active=false` → suppresses the Controls button (used when the component is mounted but hidden behind the other option)

---

## Key Gotchas / Lessons Learned
1. **`u_colorsCount` is `uniform1f`** — passing as int makes colors black
2. **Slider components must be at module scope** — defining inside component causes remount on every state change, breaking drag
3. **Float render target** — `EXT_color_buffer_float` + `RGBA16F/HALF_FLOAT` needed to eliminate banding on smooth gradients
4. **GemSmoke box** — `shape:'none'`, `size:1`, `scale≥1.6` required to hide the smoke shape and fill canvas
5. **Refraction invisible on flat color** — solved with `uBevel` (content-independent ridge shading)
6. **Both shaders always mounted** — opacity/pointerEvents toggle (not conditional render) preserves control state between switches

---

## Files
```
src/
  main.tsx                    ← router by ?lab= param
  components/
    OnboardingScreen.tsx/.css ← production page, renders both shaders
    WavesLab.tsx              ← option 1: fire bg + fluted glass
    MeshLab.tsx               ← option 2: mesh gradient bg + fluted glass
    GlassFireLab.tsx          ← older prototype (?lab=glassfire)
    FlutedGlassLab.tsx        ← older prototype (?lab=fluted)
    ChainLab.tsx              ← older prototype (?lab=chain)
  img/
    wave-pattern.png          ← reference image (700×900, blue waves)
scripts/
  top4.mjs                    ← k-means color extractor (pngjs)
```
