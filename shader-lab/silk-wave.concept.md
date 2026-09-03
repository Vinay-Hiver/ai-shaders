# Silk Wave

**Concept:** A near-white field disturbed by a few slow, sweeping folds of blue —
as if light-blue silk were draped across white paper and gently breathing. Most
of the surface stays bright; blue lives only in the creases, deepening to azure
and then to a quiet navy where the fabric folds back on itself. Nothing repeats
on a visible cycle; the folds drift and re-form forever.

**Shader expression — the field.** The image is built from *domain warping*: a
smooth value-noise `fbm` field is fed back into itself (`q = fbm(uv)`,
`w = fbm(uv + q)`) so straight coordinates bend into organic, cloth-like flow.
This warped value is added to a low-frequency directional ramp (a rotated axis),
so the folds all lean the same way — the diagonal top-left → bottom-right sweep
of the reference — instead of scattering like blobs.

**Shader expression — the folds.** Passing that combined value through a single
`sin` turns it into smooth, alternating bands: white in the troughs, blue at the
crests. Because the ramp frequency is low and the warp is strong, only a handful
of broad folds cross the panel, each one bent and tapered differently by the
noise. The result reads as *fabric*, not stripes.

**Shader expression — the color.** A four-stop ramp maps the fold value to color,
but the thresholds are deliberately lopsided: everything below ~0.45 is pure
white, so white dominates the way it does in the reference (~65% of the frame).
Only the upper range lifts into sky blue, then deep azure, then navy — via
stacked `smoothstep`s, so every edge is soft and anti-aliased. A `blueAmount`
control slides these thresholds together to make the fabric more or less blue.

**Shader expression — the motion.** Time is injected into the `fbm` lookups at a
very low rate, so the folds slowly morph and slide rather than scroll. At
`speed ≈ 0.15` it's a gentle, hypnotic drift that never distracts from the form
in front of it. Freezes cleanly to a still frame at `speed = 0` for reduced
motion.

**Craftsmanship.** Five octaves of noise, one warp feedback pass, no loops in the
color stage, all built-ins (`smoothstep`, `mix`) — cheap enough to hold 60fps on
an integrated GPU while filling a full-height panel. Every visible parameter is a
uniform, so the whole look is tunable in real time.

## Tunable parameters
- **speed** — drift rate of the folds (0 = frozen)
- **foldFrequency** — how many folds cross the panel (low = few, broad)
- **warpStrength** — how much the noise bends the folds (silkiness)
- **warpScale** — noise detail / grain of the fabric
- **rotation** — fold direction (degrees)
- **blueAmount** — white-vs-blue balance (shifts the color thresholds)
- **colors** — background, sky, deep, navy
