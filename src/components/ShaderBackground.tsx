import { useEffect, useState } from 'react'
import { Warp } from '@paper-design/shaders-react'

/**
 * Gentle animated "silk wave" background for the onboarding visual panel.
 *
 * Uses paper's <Warp> shader — a base "stripes" pattern warped by noise + swirl,
 * which produces the directional silk-fold look of the Hiver reference
 * (src/img/wave-pattern.png). MeshGradient can't do the folds; it only makes
 * soft radial blobs.
 *
 * Palette extracted from the reference via scripts/extract-palette.mjs
 * (`npm run extract:palette`). Weighted toward white (the reference is ~65%
 * light) by leading with white stops, so blue reads as thin folds, not a blob.
 *
 * Tweak the CONSTANTS below to change the look.
 */

// Order matters: Warp blends these across the stripe, so the light stops up
// front keep most of the panel white and push blue into narrow bands.
const WAVE_COLORS = [
  '#ffffff', // white field
  '#ffffff', // white field (weighted)
  '#e8f1fb', // pale edge
  '#5b9bd8', // sky blue fold
  '#15589a', // deep azure core
  '#183f5f', // navy shadow
]

const SPEED = 0.3 // gentle
const SHAPE = 'stripes' as const // base pattern that warps into folds
const SHAPE_SCALE = 0.2 // low = fewer, bigger folds (like the reference)
const SOFTNESS = 0.9 // smooth, soft transitions
const PROPORTION = 0.5 // blend midpoint between colors
const DISTORTION = 0.5 // noise waviness of the folds
const SWIRL = 0.65 // the S-curve twist
const SWIRL_ITERATIONS = 4 // layered swirl passes
const ROTATION = 40 // diagonal folds, top-left -> bottom-right
const SCALE = 1

/** Freeze the animation when the OS asks for reduced motion. */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return reduced
}

export default function ShaderBackground() {
  const reducedMotion = usePrefersReducedMotion()

  return (
    <Warp
      colors={WAVE_COLORS}
      speed={reducedMotion ? 0 : SPEED}
      shape={SHAPE}
      shapeScale={SHAPE_SCALE}
      softness={SOFTNESS}
      proportion={PROPORTION}
      distortion={DISTORTION}
      swirl={SWIRL}
      swirlIterations={SWIRL_ITERATIONS}
      rotation={ROTATION}
      scale={SCALE}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}
