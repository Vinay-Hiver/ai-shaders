// k-means (k=4) top colors from a PNG using pngjs (pure JS)
import fs from 'node:fs'
import { PNG } from 'pngjs'
const png = PNG.sync.read(fs.readFileSync(process.argv[2] || 'src/img/wave-pattern.png'))
const { width, height, data } = png
// sample pixels
const pts = []
for (let y = 0; y < height; y += 3) for (let x = 0; x < width; x += 3) {
  const i = (y * width + x) * 4
  if (data[i+3] < 8) continue
  pts.push([data[i], data[i+1], data[i+2]])
}
const K = 4
// init centroids: spread across luminance
pts.sort((a,b)=>(a[0]+a[1]+a[2])-(b[0]+b[1]+b[2]))
let cent = [0,1,2,3].map(k => pts[Math.floor((k+0.5)/K*pts.length)].slice())
const dist=(a,b)=>{const dr=a[0]-b[0],dg=a[1]-b[1],db=a[2]-b[2];return dr*dr+dg*dg+db*db}
let assign = new Array(pts.length).fill(0)
for (let it=0; it<12; it++) {
  for (let p=0;p<pts.length;p++){ let best=0,bd=Infinity; for(let k=0;k<K;k++){const d=dist(pts[p],cent[k]); if(d<bd){bd=d;best=k}} assign[p]=best }
  const sum=Array.from({length:K},()=>[0,0,0,0])
  for(let p=0;p<pts.length;p++){const k=assign[p];sum[k][0]+=pts[p][0];sum[k][1]+=pts[p][1];sum[k][2]+=pts[p][2];sum[k][3]++}
  for(let k=0;k<K;k++) if(sum[k][3]>0) cent[k]=[sum[k][0]/sum[k][3],sum[k][1]/sum[k][3],sum[k][2]/sum[k][3]]
}
const counts=Array(K).fill(0); for(const a of assign) counts[a]++
const toHex=c=>'#'+c.slice(0,3).map(v=>Math.round(v).toString(16).padStart(2,'0')).join('')
const res=cent.map((c,k)=>({hex:toHex(c),pct:(counts[k]/pts.length*100).toFixed(1)})).sort((a,b)=>b.pct-a.pct)
console.log('TOP 4 COLORS (k-means, by coverage):')
res.forEach(r=>console.log(`  ${r.hex}   ${r.pct.padStart(5)}%`))
