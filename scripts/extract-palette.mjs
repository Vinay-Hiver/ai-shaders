// Extract a palette from a PNG using pure-JS pngjs.
// Reports: (1) dominant colors by coverage, (2) an ordered white->dark ramp.
import fs from 'node:fs'
import { PNG } from 'pngjs'

const file = process.argv[2] || 'src/img/wave-pattern.png'
const png = PNG.sync.read(fs.readFileSync(file))
const { width, height, data } = png
const total = width * height

const toHex = (r, g, b) =>
  '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b
const sat = (r, g, b) => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
  return mx === 0 ? 0 : (mx - mn) / mx
}

// ---- 1. Dominant colors: quantize to 5-bit/channel buckets, count coverage ----
const buckets = new Map()
for (let i = 0; i < data.length; i += 4) {
  const a = data[i + 3]
  if (a < 8) continue // skip transparent
  const r = data[i], g = data[i + 1], b = data[i + 2]
  const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)
  let e = buckets.get(key)
  if (!e) buckets.set(key, (e = { r: 0, g: 0, b: 0, n: 0 }))
  e.r += r; e.g += g; e.b += b; e.n++
}
const dominant = [...buckets.values()]
  .sort((a, b) => b.n - a.n)
  .slice(0, 10)
  .map((e) => ({
    hex: toHex(e.r / e.n, e.g / e.n, e.b / e.n),
    pct: ((e.n / total) * 100).toFixed(1),
  }))

// ---- 2. Ordered ramp: bin by luminance, average color + coverage per bin ----
const BINS = 8
const bins = Array.from({ length: BINS }, () => ({ r: 0, g: 0, b: 0, n: 0 }))
for (let i = 0; i < data.length; i += 4) {
  if (data[i + 3] < 8) continue
  const r = data[i], g = data[i + 1], b = data[i + 2]
  const bi = Math.min(BINS - 1, Math.floor((lum(r, g, b) / 256) * BINS))
  const e = bins[bi]
  e.r += r; e.g += g; e.b += b; e.n++
}
const ramp = bins
  .filter((e) => e.n > 0)
  .map((e) => ({
    hex: toHex(e.r / e.n, e.g / e.n, e.b / e.n),
    pct: ((e.n / total) * 100).toFixed(1),
  }))
  .reverse() // dark -> light; reverse to light -> dark

// ---- 3. Signature colors: purest blue + darkest navy ----
let bluest = null, darkest = null
for (const e of buckets.values()) {
  const r = e.r / e.n, g = e.g / e.n, b = e.b / e.n
  const s = sat(r, g, b), l = lum(r, g, b)
  if (b > r && b > g && (!bluest || s > bluest.s)) bluest = { hex: toHex(r, g, b), s, l }
  if (b > r && l < 120 && (!darkest || l < darkest.l)) darkest = { hex: toHex(r, g, b), l }
}

console.log(`\nImage: ${file}  (${width}x${height}, ${total.toLocaleString()} px)\n`)
console.log('DOMINANT COLORS (by coverage):')
dominant.forEach((d) => console.log(`  ${d.hex}  ${d.pct.padStart(5)}%`))
console.log('\nORDERED RAMP (light -> dark, luminance bins):')
ramp.forEach((d) => console.log(`  ${d.hex}  ${d.pct.padStart(5)}%`))
console.log('\nSIGNATURE:')
console.log(`  purest blue : ${bluest?.hex}`)
console.log(`  darkest navy: ${darkest?.hex}`)
console.log('')
