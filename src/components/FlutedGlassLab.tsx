import { useState, type CSSProperties, type ReactNode } from 'react'
import { FlutedGlass, Water, GemSmoke } from '@paper-design/shaders-react'

/**
 * Stack lab — 3 composited layers: GLASS (paper FlutedGlass) over WATER (paper Water)
 * over BACKGROUND. Each layer has opacity + blend so you can composite them.
 * Mounted at ?lab=fluted (see main.tsx).
 *
 * Note: paper's shaders each take a STATIC image and render independently, so the
 * layers are COMPOSITED (CSS stacking + blend), not chained (one can't refract the
 * other's live output via paper's public API). BACKGROUND is a placeholder for the
 * real background shader we'll build next.
 */

type Shape = 'lines' | 'linesIrregular' | 'wave' | 'zigzag' | 'pattern'
type Dist = 'prism' | 'lens' | 'contour' | 'cascade' | 'flat'
type Fit = 'none' | 'contain' | 'cover'
type Blend = 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light' | 'difference' | 'lighten' | 'darken'

const BLENDS: Blend[] = ['normal', 'multiply', 'screen', 'overlay', 'soft-light', 'hard-light', 'difference', 'lighten', 'darken']

// ---------------- GLASS (FlutedGlass) ----------------
type GParams = {
  colorBack: string; colorShadow: string; colorHighlight: string
  shadows: number; highlights: number; size: number; shape: Shape; angle: number
  distortionShape: Dist; distortion: number; shift: number; stretch: number
  blur: number; edges: number; margin: number; grainMixer: number; grainOverlay: number; scale: number; fit: Fit
}
const GC = { colorBack: '#00000000', colorShadow: '#000000', colorHighlight: '#ffffff' }
const G_PRESETS: Record<string, GParams> = {
  Default:  { ...GC, shadows:0.25, highlights:0.1, size:0.5, shape:'lines',          angle:0,  distortionShape:'prism',   distortion:0.5,  shift:0, stretch:0, blur:0,    edges:0.25, margin:0, grainMixer:0,   grainOverlay:0,    scale:1,   fit:'cover' },
  Abstract: { ...GC, shadows:0,    highlights:0,   size:0.7, shape:'linesIrregular', angle:30, distortionShape:'flat',    distortion:1,    shift:0, stretch:1, blur:1,    edges:0.5,  margin:0, grainMixer:0.1, grainOverlay:0.1,  scale:4,   fit:'cover' },
  Waves:    { ...GC, shadows:0,    highlights:0,   size:0.9, shape:'wave',           angle:0,  distortionShape:'contour', distortion:0.5,  shift:0, stretch:1, blur:0.1,  edges:0.5,  margin:0, grainMixer:0,   grainOverlay:0.05, scale:1.2, fit:'cover' },
  Folds:    { ...GC, shadows:0.4,  highlights:0,   size:0.4, shape:'lines',          angle:0,  distortionShape:'cascade', distortion:0.75, shift:0, stretch:0, blur:0.25, edges:0.5,  margin:0, grainMixer:0,   grainOverlay:0,    scale:1,   fit:'cover' },
}
const G_SLIDERS: { k: keyof GParams; min: number; max: number; step: number }[] = [
  { k:'shadows',min:0,max:1,step:0.01 },{ k:'highlights',min:0,max:1,step:0.01 },{ k:'size',min:0,max:1,step:0.01 },
  { k:'angle',min:0,max:180,step:1 },{ k:'distortion',min:0,max:1,step:0.01 },{ k:'shift',min:-1,max:1,step:0.01 },
  { k:'stretch',min:0,max:1,step:0.01 },{ k:'blur',min:0,max:1,step:0.01 },{ k:'edges',min:0,max:1,step:0.01 },
  { k:'margin',min:0,max:1,step:0.01 },{ k:'grainMixer',min:0,max:1,step:0.01 },{ k:'grainOverlay',min:0,max:1,step:0.01 },
  { k:'scale',min:0.1,max:4,step:0.01 },
]
const SHAPES: Shape[] = ['lines', 'linesIrregular', 'wave', 'zigzag', 'pattern']
const DISTS: Dist[] = ['prism', 'lens', 'contour', 'cascade', 'flat']
const FITS: Fit[] = ['none', 'contain', 'cover']

// ---------------- WATER ----------------
type WParams = {
  colorBack: string; colorHighlight: string; highlights: number; layering: number
  edges: number; waves: number; caustic: number; size: number; speed: number; scale: number; fit: Fit
}
const W_PRESETS: Record<string, WParams> = {
  Default:   { colorBack:'#909090', colorHighlight:'#ffffff', highlights:0.07, layering:0.5, edges:0.8, waves:0.3, caustic:0.1, size:1,    speed:1,   scale:0.8, fit:'cover' },
  Abstract:  { colorBack:'#909090', colorHighlight:'#ffffff', highlights:0,    layering:0,   edges:1,   waves:1,   caustic:0.4, size:0.15, speed:1,   scale:3,   fit:'cover' },
  'Slow-mo': { colorBack:'#909090', colorHighlight:'#ffffff', highlights:0.4,  layering:0,   edges:0,   waves:0,   caustic:0.2, size:0.7,  speed:0.1, scale:1,   fit:'cover' },
  Streaming: { colorBack:'#909090', colorHighlight:'#ffffff', highlights:0,    layering:0,   edges:0,   waves:0.5, caustic:0,   size:0.5,  speed:2,   scale:0.4, fit:'contain' },
}
const W_SLIDERS: { k: keyof WParams; min: number; max: number; step: number }[] = [
  { k:'highlights',min:0,max:1,step:0.01 },{ k:'layering',min:0,max:1,step:0.01 },{ k:'edges',min:0,max:1,step:0.01 },
  { k:'waves',min:0,max:1,step:0.01 },{ k:'caustic',min:0,max:1,step:0.01 },{ k:'size',min:0,max:1,step:0.01 },
  { k:'speed',min:0,max:3,step:0.01 },{ k:'scale',min:0.1,max:4,step:0.01 },
]

// ---------------- BACKGROUND (GemSmoke, shape removed = full-screen smoke/fire) ----------------
type SParams = {
  colors: string[]; colorCount: number; colorBack: string; colorInner: string
  innerDistortion: number; outerDistortion: number; outerGlow: number; innerGlow: number
  offset: number; angle: number; size: number; speed: number; scale: number
}
const S_PRESETS: Record<string, SParams> = {
  Default:     { colors:['#333333','#e7e6df'],                               colorCount:2, colorBack:'#f0efea', colorInner:'#fafaf5',   innerDistortion:0.8, outerDistortion:0.6, outerGlow:0.55, innerGlow:1,    offset:0,   angle:0, size:1, speed:1,   scale:1.6 },
  Fluorescent: { colors:['#2fb64c','#cdff61','#ffffff'],                     colorCount:3, colorBack:'#000000', colorInner:'#000000',   innerDistortion:1,   outerDistortion:0.8, outerGlow:0,    innerGlow:1,    offset:0,   angle:0, size:1, speed:1,   scale:1.6 },
  Fire:        { colors:['#fe5b16','#f7ff61','#ffffff'],                     colorCount:3, colorBack:'#000000', colorInner:'#000000',   innerDistortion:0.6, outerDistortion:0.8, outerGlow:1,    innerGlow:0.65, offset:0,   angle:0, size:1,   speed:1,   scale:1.6 },
  Infrared:    { colors:['#ff9900','#fff67a','#dcff52','#00ffbb','#0077ff'], colorCount:5, colorBack:'#cd28dc', colorInner:'#00000000', innerDistortion:1,   outerDistortion:1,   outerGlow:1,    innerGlow:1,    offset:0.2, angle:0, size:1,   speed:0.5, scale:1.6 },
}
const S_SLIDERS: { k: keyof SParams; min: number; max: number; step: number }[] = [
  { k:'outerDistortion',min:0,max:1,step:0.01 },{ k:'outerGlow',min:0,max:1,step:0.01 },
  { k:'angle',min:0,max:360,step:1 },
  { k:'speed',min:0,max:3,step:0.01 },{ k:'scale',min:1.6,max:4,step:0.01 },
]

// ---------------- styles ----------------
const row: CSSProperties = { display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, marginBottom:10 }
const lab: CSSProperties = { fontSize:13, color:'#334155', fontWeight:500, minWidth:92 }
const val: CSSProperties = { fontSize:12, color:'#64758b', fontVariantNumeric:'tabular-nums', width:38, textAlign:'right' }
const sel: CSSProperties = { flex:1, padding:'6px 8px', border:'1px solid #e2e8f0', borderRadius:6, fontSize:13, color:'#334155', background:'#fff' }
const txt: CSSProperties = { flex:1, padding:'6px 8px', border:'1px solid #e2e8f0', borderRadius:6, fontSize:12, color:'#334155', fontFamily:'monospace' }
const swatch: CSSProperties = { width:34, height:28, border:'1px solid #e2e8f0', borderRadius:6, padding:0, background:'#fff', cursor:'pointer' }
const btn: CSSProperties = { padding:'8px', background:'#f1f5f9', color:'#334155', border:0, borderRadius:6, fontSize:13, fontWeight:500, cursor:'pointer' }

function Slider({ label, value, min, max, step, onChange, deci = 2 }:
  { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; deci?: number }) {
  return (
    <div style={row}>
      <span style={lab}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} style={{ flex:1 }} />
      <span style={val}>{value.toFixed(deci)}</span>
    </div>
  )
}
function Dropdown<T extends string>({ label, value, options, onChange }:
  { label: string; value: T; options: readonly T[]; onChange: (v: T) => void }) {
  return (
    <div style={row}>
      <span style={lab}>{label}</span>
      <select style={sel} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
function ColorRow({ label, value, onChange, picker = true }:
  { label: string; value: string; onChange: (v: string) => void; picker?: boolean }) {
  return (
    <div style={row}>
      <span style={lab}>{label}</span>
      {picker && <input type="color" style={swatch} value={value.slice(0, 7)} onChange={(e) => onChange(e.target.value)} />}
      <input style={txt} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
function Section({ title, open, onToggle, enabled, onEnabled, children }:
  { title: string; open: boolean; onToggle: () => void; enabled: boolean; onEnabled: (v: boolean) => void; children: ReactNode }) {
  return (
    <div style={{ borderBottom:'1px solid #e2e8f0' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 0' }}>
        <input type="checkbox" checked={enabled} onChange={(e) => onEnabled(e.target.checked)} title="Enable / disable this layer" style={{ width:16, height:16, cursor:'pointer' }} />
        <button onClick={onToggle} style={{ flex:1, display:'flex', justifyContent:'space-between', alignItems:'center', background:'none', border:0, cursor:'pointer', padding:0 }}>
          <span style={{ fontSize:12, fontWeight:700, letterSpacing:.6, color: enabled ? '#0f172a' : '#cbd5e1' }}>{title}{enabled ? '' : ' (off)'}</span>
          <span style={{ color:'#94a3b8', fontSize:12 }}>{open ? '▲' : '▼'}</span>
        </button>
      </div>
      {open && <div style={{ paddingBottom:14 }}>{children}</div>}
    </div>
  )
}

// ---------------- lab ----------------
export default function FlutedGlassLab() {
  const [g, setG] = useState<GParams>(G_PRESETS.Waves)
  const [w, setW] = useState<WParams>(W_PRESETS['Slow-mo'])
  const [sm, setSm] = useState<SParams>(S_PRESETS.Fire)
  const [gLayer, setGLayer] = useState({ opacity: 0.5, blend: 'normal' as Blend })
  const [wLayer, setWLayer] = useState({ opacity: 0.5, blend: 'normal' as Blend })
  const [image, setImage] = useState<string>('/img/flowers.webp')
  const [open, setOpen] = useState<Record<string, boolean>>({ GLASS: false, WATER: false, BACKGROUND: true })
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ GLASS: false, WATER: false, BACKGROUND: true })
  const toggle = (k: string) => setOpen((s) => ({ ...s, [k]: !s[k] }))
  const setEn = (k: string, v: boolean) => setEnabled((s) => ({ ...s, [k]: v }))
  const setg = <K extends keyof GParams>(k: K, v: GParams[K]) => setG((s) => ({ ...s, [k]: v }))
  const setw = <K extends keyof WParams>(k: K, v: WParams[K]) => setW((s) => ({ ...s, [k]: v }))
  const setsm = <K extends keyof SParams>(k: K, v: SParams[K]) => setSm((s) => ({ ...s, [k]: v }))
  const setColor = (i: number, v: string) => setSm((s) => { const c = [...s.colors]; c[i] = v; return { ...s, colors: c } })
  const smColors = Array.from({ length: sm.colorCount }, (_, i) => sm.colors[i] || '#ffffff')
  const layerFull: CSSProperties = { position:'absolute', inset:0, width:'100%', height:'100%', display:'block' }

  return (
    <div style={{ display:'flex', height:'100vh', background:'#1c1c1e', fontFamily:"'Hanken Grotesk',sans-serif" }}>
      {/* stacked canvas */}
      <div style={{ flex:1, minWidth:0, position:'relative', background:'#000', overflow:'hidden' }}>
        {enabled.BACKGROUND && <GemSmoke shape="none" fit="cover"
          colors={smColors} colorBack={sm.colorBack} colorInner="#00000000"
          innerDistortion={sm.outerDistortion} outerDistortion={sm.outerDistortion}
          outerGlow={sm.outerGlow} innerGlow={sm.outerGlow}
          offset={sm.offset} angle={sm.angle} size={1} speed={sm.speed} scale={Math.max(sm.scale, 1.6)}
          style={{ ...layerFull, zIndex: 1 }} />}
        {enabled.WATER && <Water image={image || undefined}
          colorBack={w.colorBack} colorHighlight={w.colorHighlight} highlights={w.highlights} layering={w.layering}
          edges={w.edges} waves={w.waves} caustic={w.caustic} size={w.size} speed={w.speed} scale={w.scale} fit={w.fit}
          style={{ ...layerFull, zIndex: 2, opacity: wLayer.opacity, mixBlendMode: wLayer.blend }} />}
        {enabled.GLASS && <FlutedGlass image={image || undefined}
          colorBack={g.colorBack} colorShadow={g.colorShadow} colorHighlight={g.colorHighlight}
          shadows={g.shadows} highlights={g.highlights} size={g.size} shape={g.shape} angle={g.angle}
          distortionShape={g.distortionShape} distortion={g.distortion} shift={g.shift} stretch={g.stretch}
          blur={g.blur} edges={g.edges} margin={g.margin} grainMixer={g.grainMixer} grainOverlay={g.grainOverlay}
          scale={g.scale} fit={g.fit}
          style={{ ...layerFull, zIndex: 3, opacity: gLayer.opacity, mixBlendMode: gLayer.blend }} />}
      </div>

      {/* accordion controls */}
      <div style={{ width:330, background:'#fff', padding:'6px 20px 24px', overflowY:'auto', boxShadow:'-2px 0 8px rgba(0,0,0,.1)' }}>

        <Section title="GLASS" open={open.GLASS} onToggle={() => toggle("GLASS")} enabled={enabled.GLASS} onEnabled={(v) => setEn("GLASS", v)}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
            {Object.keys(G_PRESETS).map((n) => <button key={n} style={btn} onClick={() => setG(G_PRESETS[n])}>{n}</button>)}
          </div>
          <Slider label="opacity" value={gLayer.opacity} min={0} max={1} step={0.01} onChange={(v) => setGLayer((s) => ({ ...s, opacity: v }))} />
          <Dropdown label="blend" value={gLayer.blend} options={BLENDS} onChange={(v) => setGLayer((s) => ({ ...s, blend: v }))} />
          <ColorRow label="colorBack" value={g.colorBack} onChange={(v) => setg('colorBack', v)} picker={false} />
          <ColorRow label="colorShadow" value={g.colorShadow} onChange={(v) => setg('colorShadow', v)} />
          <ColorRow label="colorHighlight" value={g.colorHighlight} onChange={(v) => setg('colorHighlight', v)} />
          {G_SLIDERS.slice(0, 3).map((s) => <Slider key={s.k} label={s.k} value={g[s.k] as number} min={s.min} max={s.max} step={s.step} onChange={(v) => setg(s.k, v as GParams[typeof s.k])} />)}
          <Dropdown label="shape" value={g.shape} options={SHAPES} onChange={(v) => setg('shape', v)} />
          <Slider label="angle" value={g.angle} min={0} max={180} step={1} deci={0} onChange={(v) => setg('angle', v)} />
          <Dropdown label="distortionShape" value={g.distortionShape} options={DISTS} onChange={(v) => setg('distortionShape', v)} />
          {G_SLIDERS.slice(4).map((s) => <Slider key={s.k} label={s.k} value={g[s.k] as number} min={s.min} max={s.max} step={s.step} onChange={(v) => setg(s.k, v as GParams[typeof s.k])} />)}
          <Dropdown label="fit" value={g.fit} options={FITS} onChange={(v) => setg('fit', v)} />
        </Section>

        <Section title="WATER" open={open.WATER} onToggle={() => toggle("WATER")} enabled={enabled.WATER} onEnabled={(v) => setEn("WATER", v)}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
            {Object.keys(W_PRESETS).map((n) => <button key={n} style={btn} onClick={() => setW(W_PRESETS[n])}>{n}</button>)}
          </div>
          <Slider label="opacity" value={wLayer.opacity} min={0} max={1} step={0.01} onChange={(v) => setWLayer((s) => ({ ...s, opacity: v }))} />
          <Dropdown label="blend" value={wLayer.blend} options={BLENDS} onChange={(v) => setWLayer((s) => ({ ...s, blend: v }))} />
          <ColorRow label="colorBack" value={w.colorBack} onChange={(v) => setw('colorBack', v)} />
          <ColorRow label="colorHighlight" value={w.colorHighlight} onChange={(v) => setw('colorHighlight', v)} />
          {W_SLIDERS.map((s) => <Slider key={s.k} label={s.k} value={w[s.k] as number} min={s.min} max={s.max} step={s.step} onChange={(v) => setw(s.k, v as WParams[typeof s.k])} />)}
          <Dropdown label="fit" value={w.fit} options={FITS} onChange={(v) => setw('fit', v)} />
        </Section>

        <Section title="BACKGROUND" open={open.BACKGROUND} onToggle={() => toggle("BACKGROUND")} enabled={enabled.BACKGROUND} onEnabled={(v) => setEn("BACKGROUND", v)}>
          <p style={{ fontSize:12, color:'#94a3b8', margin:'0 0 12px', lineHeight:1.5 }}>Paper GemSmoke with the shape removed (<code>shape: none</code>) — just the moving smoke/fire field.</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
            {Object.keys(S_PRESETS).map((n) => <button key={n} style={btn} onClick={() => setSm(S_PRESETS[n])}>{n}</button>)}
          </div>
          <Slider label="colorCount" value={sm.colorCount} min={1} max={6} step={1} deci={0} onChange={(v) => setsm('colorCount', v)} />
          {smColors.map((c, i) => <ColorRow key={i} label={`color${i + 1}`} value={c} onChange={(v) => setColor(i, v)} />)}
          <ColorRow label="colorBack" value={sm.colorBack} onChange={(v) => setsm('colorBack', v)} />
          {S_SLIDERS.map((s) => <Slider key={s.k} label={s.k} value={sm[s.k] as number} min={s.min} max={s.max} step={s.step} deci={s.k === 'angle' ? 0 : 2} onChange={(v) => setsm(s.k, v as SParams[typeof s.k])} />)}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10 }}>
            <label style={{ ...btn, textAlign:'center' }}>Water/Glass image
              <input type="file" accept="image/*" style={{ display:'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) setImage(URL.createObjectURL(f)) }} />
            </label>
            <button style={btn} onClick={() => setImage('')}>Delete image</button>
          </div>
        </Section>

        <button onClick={() => console.log('STACK PARAMS', JSON.stringify({ glass: { ...g, layer: gLayer }, water: { ...w, layer: wLayer }, background: sm }, null, 2))}
          style={{ ...btn, width:'100%', marginTop:14 }}>Log values to console</button>
      </div>
    </div>
  )
}
