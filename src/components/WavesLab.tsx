import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { getShaderColorFromString, ShaderFitOptions } from '@paper-design/shaders'

/**
 * WavesLab — a HAND-ROLLED mimic of paper's fluted-glass "Waves" preset, applied
 * to a custom 4-color weighted fluid waves background. Wavy flutes + per-flute lens refraction +
 * directional stretch/smear (the streaky look) + continuous looping directional motion. Mounted at ?lab=waves.
 */

const PAPER_VERT = `#version 300 es
precision mediump float;
layout(location = 0) in vec4 a_position;
uniform vec2 u_resolution; uniform float u_pixelRatio; uniform float u_imageAspectRatio;
uniform float u_originX; uniform float u_originY; uniform float u_worldWidth; uniform float u_worldHeight;
uniform float u_fit; uniform float u_scale; uniform float u_rotation; uniform float u_offsetX; uniform float u_offsetY;
out vec2 v_objectUV; out vec2 v_objectBoxSize; out vec2 v_responsiveUV; out vec2 v_responsiveBoxGivenSize;
out vec2 v_patternUV; out vec2 v_patternBoxSize; out vec2 v_imageUV;
vec3 getBoxSize(float boxRatio, vec2 g){ vec2 box=vec2(0.); box.x=boxRatio*min(g.x/boxRatio,g.y); float nf=box.x;
  if(u_fit==1.){box.x=boxRatio*min(u_resolution.x/boxRatio,u_resolution.y);} else if(u_fit==2.){box.x=boxRatio*max(u_resolution.x/boxRatio,u_resolution.y);}
  box.y=box.x/boxRatio; return vec3(box,nf); }
void main(){
  gl_Position=a_position; vec2 uv=gl_Position.xy*.5;
  vec2 boxOrigin=vec2(.5-u_originX,u_originY-.5);
  vec2 g=vec2(u_worldWidth,u_worldHeight); g=max(g,vec2(1.))*u_pixelRatio;
  float r=u_rotation*3.14159265/180.; mat2 rot=mat2(cos(r),sin(r),-sin(r),cos(r)); vec2 go=vec2(-u_offsetX,u_offsetY);
  vec2 fr=vec2((u_worldWidth==0.)?u_resolution.x:g.x,(u_worldHeight==0.)?u_resolution.y:g.y);
  v_objectBoxSize=getBoxSize(1.,fr).xy; vec2 ows=u_resolution.xy/v_objectBoxSize;
  v_objectUV=uv; v_objectUV*=ows; v_objectUV+=boxOrigin*(ows-1.); v_objectUV+=go; v_objectUV/=u_scale; v_objectUV=rot*v_objectUV;
  v_responsiveBoxGivenSize=fr; float rr=fr.x/fr.y; vec2 rbs=getBoxSize(rr,fr).xy; vec2 rbsc=u_resolution.xy/rbs;
  v_responsiveUV=uv; v_responsiveUV*=rbsc; v_responsiveUV+=boxOrigin*(rbsc-1.); v_responsiveUV+=go; v_responsiveUV/=u_scale; v_responsiveUV.x*=rr; v_responsiveUV=rot*v_responsiveUV; v_responsiveUV.x/=rr;
  float pr=g.x/g.y; vec2 pg=fr; pr=pg.x/pg.y; vec3 bd=getBoxSize(pr,pg); v_patternBoxSize=bd.xy; float pnf=bd.z; vec2 psc=u_resolution.xy/v_patternBoxSize;
  v_patternUV=uv; v_patternUV+=go/psc; v_patternUV+=boxOrigin; v_patternUV-=boxOrigin/psc; v_patternUV*=u_resolution.xy; v_patternUV/=u_pixelRatio; if(u_fit>0.){v_patternUV*=(pnf/v_patternBoxSize.x);} v_patternUV/=u_scale; v_patternUV=rot*v_patternUV; v_patternUV+=boxOrigin/psc; v_patternUV-=boxOrigin; v_patternUV*=.01;
  vec2 ibs; if(u_fit==1.){ibs.x=min(u_resolution.x/u_imageAspectRatio,u_resolution.y)*u_imageAspectRatio;} else if(u_fit==2.){ibs.x=max(u_resolution.x/u_imageAspectRatio,u_resolution.y)*u_imageAspectRatio;} else {ibs.x=min(10.0,10.0/u_imageAspectRatio*u_imageAspectRatio);}
  ibs.y=ibs.x/u_imageAspectRatio; vec2 isc=u_resolution.xy/ibs;
  v_imageUV=uv; v_imageUV*=isc; v_imageUV+=boxOrigin*(isc-1.); v_imageUV+=go; v_imageUV/=u_scale; v_imageUV.x*=u_imageAspectRatio; v_imageUV=rot*v_imageUV; v_imageUV.x/=u_imageAspectRatio; v_imageUV+=.5; v_imageUV.y=1.-v_imageUV.y;
}`

// 4-color fluid waves background with percentage-based visibility, turbulence randomness, and temporal modulation
const FIRE_FRAG = `#version 300 es
precision mediump float;

in mediump vec2 v_objectUV;
out vec4 fragColor;

uniform float u_time;
uniform vec4 u_colors[4];
uniform vec4 u_weights; // (0.15, 0.20, 0.30, 0.35)

uniform float u_randomness;
uniform float u_innerDistortion;
uniform float u_outerDistortion;
uniform float u_outerGlow;
uniform float u_innerGlow;
uniform float u_angle;
uniform float u_size;

#define PI 3.14159265358979323846

vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}

float sst(float a, float b, float x) {
  return smoothstep(a, b, x);
}

float hash2(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise2D(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash2(i);
  float b = hash2(i + vec2(1.0, 0.0));
  float c = hash2(i + vec2(0.0, 1.0));
  float d = hash2(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm2D(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 3; i++) {
    v += a * noise2D(p);
    p = rot * p * 2.0 + vec2(10.0);
    a *= 0.5;
  }
  return v;
}

// Option C: Time-gated dominance function
// Divides cycle into 4 contiguous time windows: 15%, 20%, 30%, 35%
vec4 getTimeWeights(float tau) {
  const float s = 0.04;
  // Window 0: [0.00, 0.15] (15% duration for Color 0)
  float w0 = smoothstep(0.0 - s, 0.0 + s, tau) * (1.0 - smoothstep(0.15 - s, 0.15 + s, tau));
  w0 += smoothstep(1.0 - s, 1.0, tau);

  // Window 1: [0.15, 0.35] (20% duration for Color 1)
  float w1 = smoothstep(0.15 - s, 0.15 + s, tau) * (1.0 - smoothstep(0.35 - s, 0.35 + s, tau));

  // Window 2: [0.35, 0.65] (30% duration for Color 2)
  float w2 = smoothstep(0.35 - s, 0.35 + s, tau) * (1.0 - smoothstep(0.65 - s, 0.65 + s, tau));

  // Window 3: [0.65, 1.00] (35% duration for Color 3)
  float w3 = smoothstep(0.65 - s, 0.65 + s, tau) * (1.0 - smoothstep(1.0 - s, 1.0 + s, tau));
  w3 += (1.0 - smoothstep(0.0, s, tau));

  vec4 tw = vec4(w0, w1, w2, w3);
  // Baseline ensures smooth harmonious presence while the active window commands the stage
  tw = 0.22 + 0.78 * tw;
  return tw / (tw.x + tw.y + tw.z + tw.w);
}

void main() {
  float time = u_time;
  // Normalized animation cycle phase (approx 16s cycle at speed=1)
  float tau = fract(time * 0.065);
  vec4 tw = getTimeWeights(tau);

  vec2 smokeUV = v_objectUV;
  smokeUV = rotate(smokeUV, u_angle * PI / 180.);
  smokeUV *= mix(4., 1., u_size);

  // Randomness turbulence applied to coordinates
  vec2 turb = (vec2(
    fbm2D(smokeUV * 2.2 + vec2(time * 0.12, -time * 0.08)),
    fbm2D(smokeUV * 2.2 + vec2(-time * 0.09, time * 0.11) + vec2(5.2))
  ) - 0.5) * u_randomness * 0.75;

  vec2 innerUV = smokeUV + turb * 0.7;
  vec2 outerUV = smokeUV + turb;

  innerUV.y += u_innerDistortion * (1. - sst(0., 1., length(.4 * innerUV)));
  innerUV.y -= .4 * u_innerDistortion;
  outerUV.y += u_outerDistortion * (1. - sst(0., 1., length(.4 * outerUV)));
  outerUV.y -= .4 * u_outerDistortion;

  float innerSwirl = u_innerDistortion * (1.0 + u_randomness * 0.6);
  float outerSwirl = u_outerDistortion * (1.0 + u_randomness * 0.6);

  for (int i = 1; i < 5; i++) {
    float fi = float(i);
    float stretchIn = max(length(dFdx(innerUV)), length(dFdy(innerUV)));
    float dampenIn = 1. / (1. + stretchIn * 8.);
    float sIn = innerSwirl * dampenIn;
    innerUV.x += sIn / fi * cos(time + fi * 2.9 * innerUV.y);
    innerUV.y += sIn / fi * cos(time + fi * 1.5 * innerUV.x);

    float stretchOut = max(length(dFdx(outerUV)), length(dFdy(outerUV)));
    float dampenOut = 1. / (1. + stretchOut * 8.);
    float sOut = outerSwirl * dampenOut;
    outerUV.x += sOut / fi * cos(time + fi * 2.9 * outerUV.y);
    outerUV.y += sOut / fi * cos(time + fi * 1.5 * outerUV.x);
  }

  float innerShape = exp(-1.5 * dot(innerUV, innerUV));
  float outerShape = exp(-1.5 * dot(outerUV, outerUV));

  float outerMask = pow(u_outerGlow, 2.);
  float innerMask = .01 + .99 * u_innerGlow;

  innerShape *= innerMask;
  outerShape *= outerMask;

  // Broad continuous density field spanning the whole canvas
  float rawDensity = (innerShape * 0.75 + outerShape * 0.85);
  // Wave & organic noise modulation controlled by randomness
  float wave = 0.12 * sin(time * 0.65 + outerUV.y * 2.2 + outerUV.x * 1.5);
  float noiseMod = (noise2D(outerUV * 3.5 + time * 0.25) - 0.5) * u_randomness * 0.35;
  float d = clamp(rawDensity + wave + noiseMod + 0.16, 0.0, 1.0);

  // 4 Colors with individual opacities in alpha channel (c.a)
  vec4 c0 = u_colors[0]; // 15%
  vec4 c1 = u_colors[1]; // 20%
  vec4 c2 = u_colors[2]; // 30%
  vec4 c3 = u_colors[3]; // 35%

  // Option C: Threshold cutoffs dynamically expand during each color's time window
  float cut1 = 0.35 + (tw.w - 0.25) * 0.25; // Color 3 (35%) expands when tw.w is high
  float cut2 = 0.65 + (tw.z - 0.25) * 0.20; // Color 2 (30%)
  float cut3 = 0.85 - (tw.x - 0.25) * 0.20; // Color 0 (15%) expands when tw.x is high

  // Pure white base canvas when opacities are 0
  vec3 baseCanvas = vec3(1.0);

  // Base background layer: blends between white canvas and c3 based on c3.a
  vec3 bgCol = mix(baseCanvas, c3.rgb, c3.a);

  float m1 = smoothstep(cut1 - 0.12, cut1 + 0.12, d);
  vec3 spatialCol = mix(bgCol, c2.rgb, m1 * c2.a);

  float m2 = smoothstep(cut2 - 0.12, cut2 + 0.12, d);
  spatialCol = mix(spatialCol, c1.rgb, m2 * c1.a);

  float m3 = smoothstep(cut3 - 0.10, cut3 + 0.10, d);
  spatialCol = mix(spatialCol, c0.rgb, m3 * c0.a);

  // Time-gated dominance surge scaled by individual color opacities
  vec4 tw_a = vec4(tw.x * c0.a, tw.y * c1.a, tw.z * c2.a, tw.w * c3.a);
  float sum_tw = tw_a.x + tw_a.y + tw_a.z + tw_a.w;
  vec3 timeDom = sum_tw > 0.001 ? (c0.rgb * tw_a.x + c1.rgb * tw_a.y + c2.rgb * tw_a.z + c3.rgb * tw_a.w) / sum_tw : baseCanvas;

  float timeBlend = 0.45 * min(1.0, (c0.a + c1.a + c2.a + c3.a) * 0.35);
  vec3 finalCol = mix(spatialCol, timeDom, timeBlend);

  fragColor = vec4(clamp(finalCol, 0.0, 1.0), 1.0);
}`

const G_VERT = `#version 300 es
layout(location = 0) in vec4 a_position; out vec2 vUv;
void main(){ vUv=a_position.xy*0.5+0.5; gl_Position=a_position; }`

// Waves-mimic fluted glass with continuous directional movement loop
const G_FRAG = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 fragColor;
uniform vec2 uRes; uniform sampler2D u_tex;
uniform float uCount, uWaviness, uWaveFreq, uStrength, uStretch, uDisp, uBlur, uAngle, uScale, uOffsetX, uOffsetY, uHighlight, uGroove, uGrain, uBevel, uDiffraction;
uniform float u_time, uMoveSpeed;
uniform vec2 uMoveDir;

float hash(float n){ return fract(sin(n)*43758.5453); }
float h2(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
float vn(float x){ float i=floor(x),f=fract(x); f=f*f*(3.0-2.0*f); return mix(hash(i),hash(i+1.0),f); }
vec3 samp(vec2 uv){ return texture(u_tex, vec2(uv.x, 1.0-uv.y)).rgb; }
void main(){
  float asp = uRes.x/uRes.y;
  vec2 uv = vUv;
  float a = uAngle*3.14159265/180.;
  float ca=cos(a), sa=sin(a);
  vec2 c = uv-0.5; c.x*=asp;
  vec2 r = vec2(c.x*ca - c.y*sa, c.x*sa + c.y*ca);   // rotated

  // Continuous looping movement along uMoveDir
  vec2 motion = -uMoveDir * (u_time * uMoveSpeed * 0.15);
  r = r / uScale + vec2(uOffsetX, uOffsetY) + motion;          // scale + X/Y position + continuous loop motion

  // wavy flutes: flute coordinate waves along the flute length + organic noise
  float wob = uWaviness * (0.6*sin(r.y*uWaveFreq*6.2831) + 0.4*(vn(r.y*uWaveFreq*2.0)*2.0-1.0));
  float fx = r.x * uCount + wob;
  float rib = fract(fx);
  float lens = rib - 0.5;                              // -0.5..0.5 within flute
  float off = lens * uStrength * 0.06;                 // refraction across flute
  vec2 ndir = vec2(ca, sa) / vec2(asp,1.0);           // flute-normal in uv space
  vec2 tdir = vec2(-sa, ca) / vec2(asp,1.0);          // along-flute (stretch dir)
  vec2 seed = vUv * uRes;
  vec2 jit = (vec2(h2(seed), h2(seed + 19.7)) - 0.5) * uGrain * 0.03;
  vec3 col = vec3(0.0);
  const int N = 13;
  for(int i=0;i<N;i++){
    float f = float(i)/float(N-1) - 0.5;               // -0.5..0.5
    vec2 base = uv + jit + ndir*(off + f*uBlur*0.01) + tdir*(f*uStretch*0.14);
    float d = uDisp*0.012*lens;
    col.r += samp(base + ndir*d).r;
    col.g += samp(base).g;
    col.b += samp(base - ndir*d).b;
  }
  col /= float(N);
  col *= 1.0 + uBevel * clamp(lens * 2.0, -1.0, 1.0);
  col *= 1.0 - uGroove*smoothstep(0.28,0.5,abs(lens));  // groove shadow between flutes
  col += uHighlight*smoothstep(0.05,0.0,abs(lens));    // flute highlight (thin bright line per flute)
  vec3 spec = 0.5 + 0.5*cos(6.28318*(lens*2.2 + vec3(0.0,0.33,0.67)));
  col += uDiffraction * (spec - 0.5) * smoothstep(0.12,0.5,abs(lens));
  col += (h2(seed + 3.3) - 0.5) * uGrain * 0.10;
  fragColor = vec4(clamp(col,0.0,1.0), 1.0);
}`

type Direction = 'tl' | 'tr' | 'bl' | 'br' | 'none'

const DIR_VECTORS: Record<Direction, [number, number]> = {
  tl: [-0.707106, 0.707106],
  tr: [0.707106, 0.707106],
  bl: [-0.707106, -0.707106],
  br: [0.707106, -0.707106],
  none: [0, 0]
}

type Fire = {
  colors: string[]; // [15%, 20%, 30%, 35%]
  opacities: number[]; // [15%, 20%, 30%, 35%]
  randomness: number;
  outerDistortion: number;
  outerGlow: number;
  angle: number;
  speed: number;
  scale: number;
}
type W = {
  count: number;
  waviness: number;
  waveFreq: number;
  strength: number;
  stretch: number;
  disp: number;
  blur: number;
  angle: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  highlight: number;
  groove: number;
  grain: number;
  bevel: number;
  diffraction: number;
  moveDir: Direction;
  moveSpeed: number;
}

// Default 4-color palette mapped to 15%, 20%, 30%, 35% visibility
const FIRE0: Fire = {
  colors: ['#fdb021', '#fff', '#ffffff', '#0051ff'],
  opacities: [1, 1, 1, 1],
  randomness: 0.05,
  outerDistortion: 0.71,
  outerGlow: 1,
  angle: 104,
  speed: 0.1,
  scale: 1.6
}
const W0: W = {
  count: 16,
  waviness: 2,
  waveFreq: 1.3,
  strength: 2.1,
  stretch: 1,
  disp: 0.5,
  blur: 1,
  angle: -28,
  scale: 5,
  offsetX: 0,
  offsetY: 0,
  highlight: 0,
  groove: 0,
  grain: 0.15,
  bevel: 0,
  diffraction: 0.02,
  moveDir: 'tr',
  moveSpeed: 0.12
}

const PERCENT_LABELS = ['15%', '20%', '30%', '35%'] as const

function compile(gl: WebGL2RenderingContext, ty: number, src: string){ const s=gl.createShader(ty)!; gl.shaderSource(s,src); gl.compileShader(s); if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)||'c'); return s }
function program(gl: WebGL2RenderingContext, v: string, f: string){ const p=gl.createProgram()!; gl.attachShader(p,compile(gl,gl.VERTEX_SHADER,v)); gl.attachShader(p,compile(gl,gl.FRAGMENT_SHADER,f)); gl.bindAttribLocation(p,0,'a_position'); gl.linkProgram(p); if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)||'l'); return p }

const row: CSSProperties = { display:'flex', alignItems:'center', gap:8, marginBottom:8, width:'100%', boxSizing:'border-box' }
const lab: CSSProperties = { fontSize:12, color:'#334155', fontWeight:500, width:84, flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }
const st: CSSProperties = { fontSize:11, fontWeight:700, letterSpacing:.5, color:'#0f172a', margin:'16px 0 10px' }

function S(p: { label: string; v: number; min: number; max: number; step: number; on: (n: number) => void; d?: number }) {
  const [text, setText] = useState<string>(p.v.toFixed(p.d ?? 2))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) {
      setText(p.v.toFixed(p.d ?? 2))
    }
  }, [p.v, p.d, focused])

  const onTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setText(val)
    const num = parseFloat(val)
    if (!isNaN(num)) {
      p.on(num)
    }
  }

  const onBlur = () => {
    setFocused(false)
    const num = parseFloat(text)
    if (isNaN(num)) {
      setText(p.v.toFixed(p.d ?? 2))
    } else {
      const clamped = Math.max(p.min, Math.min(p.max, num))
      p.on(clamped)
      setText(clamped.toFixed(p.d ?? 2))
    }
  }

  return (
    <div style={row}>
      <span style={lab} title={p.label}>{p.label}</span>
      <input
        type="range"
        min={p.min}
        max={p.max}
        step={p.step}
        value={p.v}
        onChange={e => {
          const val = parseFloat(e.target.value)
          p.on(val)
          setText(val.toFixed(p.d ?? 2))
        }}
        style={{ flex: 1, minWidth: 0, accentColor: '#2563eb', cursor: 'pointer' }}
      />
      <input
        type="text"
        inputMode="decimal"
        value={focused ? text : p.v.toFixed(p.d ?? 2)}
        onFocus={() => setFocused(true)}
        onChange={onTextChange}
        onBlur={onBlur}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur()
          }
        }}
        style={{
          width: 48,
          flexShrink: 0,
          fontSize: 12,
          padding: '2px 4px',
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
          fontFamily: 'monospace',
          border: focused ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
          borderRadius: 4,
          background: focused ? '#ffffff' : '#f8fafc',
          color: '#0f172a',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color .15s, background .15s'
        }}
      />
    </div>
  )
}

export default function WavesLab({ embed = false, active = true }: { embed?: boolean; active?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [fire, setFire] = useState<Fire>(FIRE0)
  const [w, setW] = useState<W>(W0)
  const [showControls, setShowControls] = useState(false)
  const fireRef = useRef(fire); fireRef.current = fire
  const wRef = useRef(w); wRef.current = w

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const glCtx = canvas.getContext('webgl2', { antialias: true })
    if (!glCtx) { console.error('no webgl2'); return }
    const gl: WebGL2RenderingContext = glCtx

    const floatRT = !!gl.getExtension('EXT_color_buffer_float'); gl.getExtension('OES_texture_float_linear')
    let raf = 0, gemProg: WebGLProgram, gProg: WebGLProgram
    try { gemProg = program(gl, PAPER_VERT, FIRE_FRAG); gProg = program(gl, G_VERT, G_FRAG) }
    catch (e) { console.error('SHADER BUILD FAILED', e); return }
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    const ratio = Math.min(window.devicePixelRatio, 2)
    const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n)
    const col = (v: string) => getShaderColorFromString(v) as number[]
    const fireTex = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, fireTex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    const fbo = gl.createFramebuffer()
    const dummy = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, dummy); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,255]))
    function resize(){
      if (!canvas) return
      canvas.width=Math.round(canvas.clientWidth*ratio); canvas.height=Math.round(canvas.clientHeight*ratio)
      gl.bindTexture(gl.TEXTURE_2D, fireTex)
      if (floatRT) gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA16F,canvas.width,canvas.height,0,gl.RGBA,gl.HALF_FLOAT,null)
      else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,canvas.width,canvas.height,0,gl.RGBA,gl.UNSIGNED_BYTE,null)
    }
    window.addEventListener('resize', resize); resize()
    const start = performance.now() - 17 * 1000
    function frame(){
      raf = requestAnimationFrame(frame)
      if (!canvas) return
      const t=(performance.now()-start)/1000, F=fireRef.current, G=wRef.current, Wd=canvas.width, Hd=canvas.height
      // waves background -> fireTex
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fireTex, 0)
      gl.viewport(0,0,Wd,Hd); gl.useProgram(gemProg)
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, dummy)
      
      const flat = F.colors.slice(0, 4).flatMap((c, idx) => {
        const rgba = [...col(c)]
        rgba[3] = F.opacities?.[idx] ?? 1
        return rgba
      })
      gl.uniform4fv(U(gemProg,'u_colors[0]'), new Float32Array(flat))
      gl.uniform4f(U(gemProg,'u_weights'), 0.15, 0.20, 0.30, 0.35)

      gl.uniform1f(U(gemProg,'u_randomness'), F.randomness)
      gl.uniform1f(U(gemProg,'u_innerDistortion'), F.outerDistortion)
      gl.uniform1f(U(gemProg,'u_outerDistortion'), F.outerDistortion)
      gl.uniform1f(U(gemProg,'u_outerGlow'), F.outerGlow)
      gl.uniform1f(U(gemProg,'u_innerGlow'), F.outerGlow)
      gl.uniform1f(U(gemProg,'u_offset'), 0)
      gl.uniform1f(U(gemProg,'u_angle'), F.angle)
      gl.uniform1f(U(gemProg,'u_size'), 1)
      gl.uniform1f(U(gemProg,'u_time'), t * F.speed)
      gl.uniform1f(U(gemProg,'u_fit'), ShaderFitOptions.cover)
      gl.uniform1f(U(gemProg,'u_scale'), Math.max(F.scale, 1.6))
      gl.uniform1f(U(gemProg,'u_rotation'), 0)
      gl.uniform1f(U(gemProg,'u_offsetX'), 0)
      gl.uniform1f(U(gemProg,'u_offsetY'), 0)
      gl.uniform1f(U(gemProg,'u_originX'), 0.5)
      gl.uniform1f(U(gemProg,'u_originY'), 0.5)
      gl.uniform1f(U(gemProg,'u_worldWidth'), 0)
      gl.uniform1f(U(gemProg,'u_worldHeight'), 0)
      gl.uniform1f(U(gemProg,'u_pixelRatio'), ratio)
      gl.uniform1f(U(gemProg,'u_imageAspectRatio'), Wd/Hd)
      gl.uniform2f(U(gemProg,'u_resolution'), Wd, Hd)
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4)

      // waves glass -> screen
      gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.viewport(0,0,Wd,Hd); gl.useProgram(gProg)
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fireTex); gl.uniform1i(U(gProg,'u_tex'),0)
      gl.uniform2f(U(gProg,'uRes'),Wd,Hd)
      gl.uniform1f(U(gProg,'uCount'),G.count); gl.uniform1f(U(gProg,'uWaviness'),G.waviness); gl.uniform1f(U(gProg,'uWaveFreq'),G.waveFreq)
      gl.uniform1f(U(gProg,'uStrength'),G.strength); gl.uniform1f(U(gProg,'uStretch'),G.stretch); gl.uniform1f(U(gProg,'uDisp'),G.disp)
      gl.uniform1f(U(gProg,'uBlur'),G.blur); gl.uniform1f(U(gProg,'uAngle'),G.angle)
      gl.uniform1f(U(gProg,'uScale'),G.scale); gl.uniform1f(U(gProg,'uOffsetX'),G.offsetX); gl.uniform1f(U(gProg,'uOffsetY'),G.offsetY)
      gl.uniform1f(U(gProg,'uHighlight'),G.highlight); gl.uniform1f(U(gProg,'uGroove'),G.groove); gl.uniform1f(U(gProg,'uGrain'),G.grain); gl.uniform1f(U(gProg,'uBevel'),G.bevel); gl.uniform1f(U(gProg,'uDiffraction'),G.diffraction)

      const dirVec = DIR_VECTORS[G.moveDir] || [0, 0]
      gl.uniform2f(U(gProg, 'uMoveDir'), dirVec[0], dirVec[1])
      gl.uniform1f(U(gProg, 'uMoveSpeed'), G.moveSpeed)
      gl.uniform1f(U(gProg, 'u_time'), t)

      gl.drawArrays(gl.TRIANGLE_STRIP,0,4)
    }
    frame()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  const setF = <K extends keyof Fire>(k: K, v: Fire[K]) => setFire(s => ({ ...s, [k]: v }))
  const setWv = <K extends keyof W>(k: K, v: W[K]) => setW(s => ({ ...s, [k]: v }))

  const handleColorChange = (index: number, val: string) => {
    setFire(s => {
      const cc = [...s.colors]
      cc[index] = val
      return { ...s, colors: cc }
    })
  }

  const handleOpacityChange = (index: number, val: number) => {
    setFire(s => {
      const op = [...(s.opacities || [1, 1, 1, 1])]
      op[index] = val
      return { ...s, opacities: op }
    })
  }

  const dirBtn = (active: boolean): CSSProperties => ({
    padding: '7px 8px',
    borderRadius: 6,
    border: active ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
    background: active ? '#2563eb' : '#f8fafc',
    color: active ? '#ffffff' : '#334155',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    transition: 'all .15s',
  })

  const controls = (
      <div style={{ width:340, boxSizing:'border-box', background:'#fff', padding:'20px 16px', overflowY:'auto', overflowX:'hidden', maxHeight:'100vh', boxShadow:'-2px 0 8px rgba(0,0,0,.1)' }}>
        <div style={st}>GLASS SHADER (fluted glass)</div>
        
        {/* Continuous looping movement controls */}
        <div style={{ marginBottom: 14, padding: '10px 8px', boxSizing: 'border-box', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
            Continuous Loop Motion
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
            <button style={dirBtn(w.moveDir === 'tl')} onClick={() => setWv('moveDir', 'tl')}>↖ Top Left</button>
            <button style={dirBtn(w.moveDir === 'tr')} onClick={() => setWv('moveDir', 'tr')}>↗ Top Right</button>
            <button style={dirBtn(w.moveDir === 'bl')} onClick={() => setWv('moveDir', 'bl')}>↙ Bottom Left</button>
            <button style={dirBtn(w.moveDir === 'br')} onClick={() => setWv('moveDir', 'br')}>↘ Bottom Right</button>
          </div>
          <button
            style={{ ...dirBtn(w.moveDir === 'none'), width: '100%', marginBottom: 10 }}
            onClick={() => setWv('moveDir', 'none')}
          >
            ⏹ Static (Pause motion)
          </button>
          <S label="move speed" v={w.moveSpeed} min={0} max={2} step={0.02} on={v => setWv('moveSpeed', v)} />
        </div>

        <S label="flutes" v={w.count} min={2} max={40} step={1} d={0} on={v=>setWv('count',v)} />
        <S label="waviness" v={w.waviness} min={0} max={2} step={0.01} on={v=>setWv('waviness',v)} />
        <S label="wave freq" v={w.waveFreq} min={0.1} max={4} step={0.05} on={v=>setWv('waveFreq',v)} />
        <S label="strength" v={w.strength} min={0} max={3} step={0.05} on={v=>setWv('strength',v)} />
        <S label="stretch" v={w.stretch} min={0} max={3} step={0.05} on={v=>setWv('stretch',v)} />
        <S label="dispersion" v={w.disp} min={0} max={3} step={0.05} on={v=>setWv('disp',v)} />
        <S label="flute highlight" v={w.highlight} min={0} max={0.5} step={0.01} on={v=>setWv('highlight',v)} />
        <S label="groove shadow" v={w.groove} min={0} max={0.5} step={0.01} on={v=>setWv('groove',v)} />
        <S label="bevel (ridge)" v={w.bevel} min={0} max={1} step={0.01} on={v=>setWv('bevel',v)} />
        <S label="diffraction" v={w.diffraction} min={0} max={1} step={0.01} on={v=>setWv('diffraction',v)} />
        <S label="grain (frost)" v={w.grain} min={0} max={1} step={0.01} on={v=>setWv('grain',v)} />
        <S label="blur" v={w.blur} min={0} max={4} step={0.05} on={v=>setWv('blur',v)} />
        <S label="angle°" v={w.angle} min={-90} max={90} step={1} d={0} on={v=>setWv('angle',v)} />
        <S label="scale" v={w.scale} min={0.2} max={5} step={0.01} on={v=>setWv('scale',v)} />
        <S label="X position" v={w.offsetX} min={-1} max={1} step={0.01} on={v=>setWv('offsetX',v)} />
        <S label="Y position" v={w.offsetY} min={-1} max={1} step={0.01} on={v=>setWv('offsetY',v)} />
        
        <div style={st}>WAVES (background layer)</div>
        <div style={{ fontSize:12, fontWeight:600, color:'#475569', marginBottom:8 }}>COLOUR CONTROL (% VISIBILITY / TIME)</div>
        {PERCENT_LABELS.map((pct, idx) => (
          <div
            key={pct}
            style={{
              marginBottom: 10,
              padding: '8px 10px',
              background: '#f8fafc',
              borderRadius: 6,
              border: '1px solid #e2e8f0',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#0f172a', fontWeight: 700 }}>{pct} - Color</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="text"
                  value={fire.colors[idx] || '#ffffff'}
                  onChange={e => handleColorChange(idx, e.target.value)}
                  style={{ width: 66, fontSize: 12, fontFamily: 'monospace', padding: '3px 6px', border: '1px solid #cbd5e1', borderRadius: 4, color: '#334155', boxSizing: 'border-box' }}
                />
                <input
                  type="color"
                  value={fire.colors[idx] || '#ffffff'}
                  onChange={e => handleColorChange(idx, e.target.value)}
                  style={{ width: 28, height: 26, border: '1px solid #cbd5e1', borderRadius: 4, padding: 0, cursor: 'pointer' }}
                />
              </div>
            </div>
            <S
              label="opacity"
              v={fire.opacities?.[idx] ?? 1}
              min={0}
              max={1}
              step={0.01}
              on={v => handleOpacityChange(idx, v)}
            />
          </div>
        ))}

        <S label="randomness" v={fire.randomness} min={0} max={2} step={0.01} on={v=>setF('randomness',v)} />
        <S label="distortion" v={fire.outerDistortion} min={0} max={2} step={0.01} on={v=>setF('outerDistortion',v)} />
        <S label="outerGlow" v={fire.outerGlow} min={0} max={1} step={0.01} on={v=>setF('outerGlow',v)} />
        <S label="angle°" v={fire.angle} min={0} max={360} step={1} d={0} on={v=>setF('angle',v)} />
        <S label="speed" v={fire.speed} min={0} max={3} step={0.01} on={v=>setF('speed',v)} />
        <S label="scale" v={fire.scale} min={1.6} max={4} step={0.01} on={v=>setF('scale',v)} />
        <button onClick={()=>console.log('WAVES', JSON.stringify({waves:w,wavesBg:fire},null,2))} style={{width:'100%',padding:10,marginTop:14,background:'#f1f5f9',color:'#334155',border:0,borderRadius:6,fontWeight:500,cursor:'pointer'}}>Log values</button>
      </div>
  )
  const toggleBtn = (
    <button onClick={()=>setShowControls(s=>!s)} style={{ position:'fixed', top:16, right:16, zIndex:9999, padding:'8px 14px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, background:'#0f172a', color:'#fff', boxShadow:'0 2px 8px rgba(15,23,42,0.25)', fontFamily:"'Hanken Grotesk',sans-serif" }}>{showControls ? 'Hide controls' : 'Controls'}</button>
  )
  if (embed) return (
    <>
      <canvas ref={ref} style={{ width:'100%', height:'100%', display:'block' }} />
      {active && toggleBtn}
      {active && showControls && <div style={{ position:'fixed', top:0, right:0, height:'100vh', zIndex:9998, fontFamily:"'Hanken Grotesk',sans-serif" }}>{controls}</div>}
    </>
  )
  return (
    <div style={{ display:'flex', height:'100vh', background:'#111', fontFamily:"'Hanken Grotesk',sans-serif" }}>
      <div style={{ flex:1, minWidth:0 }}><canvas ref={ref} style={{ width:'100%', height:'100%', display:'block' }} /></div>
      {controls}
    </div>
  )
}


