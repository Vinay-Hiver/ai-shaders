import { useState } from 'react'
import { LensDistortion } from '@paper-design/shaders-react'

/**
 * Glass Lab — tune paper's LensDistortion refracting our blue wave image.
 * Mounted at ?lab=glass (see main.tsx). This is the "iOS Liquid Glass" path:
 * a sheet of glass that refracts + disperses the content behind it.
 */

const IMAGE = '/img/wave-pattern.png'

type Ctl = { key: string; min: number; max: number; step: number; def: number }
const CONTROLS: Ctl[] = [
  { key: 'scale',        min: 0.3, max: 2,   step: 0.01, def: 1.35 },
  { key: 'lensBulge',    min: -1,  max: 1,   step: 0.01, def: 0.15 },
  { key: 'lensCircle',   min: 0,   max: 1,   step: 0.01, def: 0.0 },
  { key: 'spread',       min: 0,   max: 1,   step: 0.01, def: 0.4 },
  { key: 'perspective',  min: 0,   max: 1,   step: 0.01, def: 0.05 },
  { key: 'dispersion',   min: 0,   max: 0.3, step: 0.005, def: 0.04 },
  { key: 'dispersionColor', min: 0, max: 1,  step: 0.01, def: 0.5 },
  { key: 'focusCenter',  min: 0,   max: 1,   step: 0.01, def: 0.5 },
  { key: 'focusEdges',   min: 0,   max: 1,   step: 0.01, def: 0.5 },
  { key: 'swirl',        min: 0,   max: 1,   step: 0.01, def: 0 },
]

export default function GlassLab() {
  const [p, setP] = useState<Record<string, number>>(
    Object.fromEntries(CONTROLS.map((c) => [c.key, c.def])),
  )
  const set = (k: string, v: number) => setP((s) => ({ ...s, [k]: v }))

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0b0b0f' }}>
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        <LensDistortion image={IMAGE} {...p} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>
      <div style={{ width: 300, background: '#fff', padding: 20, overflowY: 'auto', font: "13px 'Hanken Grotesk', sans-serif" }}>
        <h1 style={{ font: "600 20px 'Hanken Grotesk'", color: '#0f172a', margin: '0 0 4px' }}>LensDistortion</h1>
        <p style={{ color: '#64758b', margin: '0 0 18px', lineHeight: 1.5 }}>
          Refractive glass over the wave. Tune, then hit “Log values”.
        </p>
        {CONTROLS.map((c) => (
          <div key={c.key} style={{ marginBottom: 14 }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', color: '#334155', fontWeight: 500, marginBottom: 6 }}>
              <span>{c.key}</span>
              <span style={{ color: '#64758b', fontVariantNumeric: 'tabular-nums' }}>{p[c.key].toFixed(3)}</span>
            </label>
            <input
              type="range" min={c.min} max={c.max} step={c.step} value={p[c.key]}
              onChange={(e) => set(c.key, parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        ))}
        <button
          onClick={() => console.log('LENS PARAMS', JSON.stringify(p, null, 2))}
          style={{ width: '100%', padding: 10, marginTop: 8, background: '#0f172a', color: '#fff', border: 0, borderRadius: 6, fontWeight: 500, cursor: 'pointer' }}
        >Log values to console</button>
      </div>
    </div>
  )
}
