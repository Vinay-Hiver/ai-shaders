import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { gemSmokeFragmentShader, getShaderColorFromString, GemSmokeShapes, ShaderFitOptions } from '@paper-design/shaders'

/**
 * GlassFireLab — Layer 2 (paper GemSmoke fire) is rendered to a texture and fed as
 * input to Layer 1 (our own curved iOS-glass shader), which refracts it live.
 * Both layers have full controls. Mounted at ?lab=glassfire.
 */

// paper's vertex shader (for the GemSmoke pass)
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

// our curved iOS-glass shader (ported to GLSL3), samples the fire texture u_tex
const GLASS_VERT = `#version 300 es
layout(location = 0) in vec4 a_position; out vec2 vUv;
void main(){ vUv=a_position.xy*0.5+0.5; gl_Position=a_position; }`
const GLASS_FRAG = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 fragColor;
uniform vec2 uResolution, uCenter; uniform float uAngle, uBandWidth, uBandCount;
uniform float uBezel, uThickness, uIOR, uBlur, uSpecular, uTint, uCurveAmp, uCurveFreq, uOrganic;
uniform sampler2D u_tex;
float surfaceHeight(float t){ float s=1.0-t; return pow(1.0 - s*s*s*s, 0.25); }
float hash1(float n){ return fract(sin(n)*43758.5453123); }
float vnoise1(float x){ float i=floor(x); float f=fract(x); f=f*f*(3.0-2.0*f); return mix(hash1(i),hash1(i+1.0),f); }
float fbm1(float x){ float v=0.0,a=0.5; for(int i=0;i<4;i++){ v+=a*vnoise1(x); x*=2.0; a*=0.5; } return v; }
float seamShift(float qy){ float k=uCurveFreq*6.2831853/uResolution.y; float s=sin(qy*k); float n=fbm1(qy*k)*2.0-1.0; return uCurveAmp*mix(s,n,uOrganic); }
vec3 sampleBg(vec2 s){ return texture(u_tex, vec2(s.x, 1.0-s.y)).rgb; }
vec3 sampleBgBlurred(vec2 uv,float radius){
  if(radius<0.5) return sampleBg(uv);
  vec3 sum=vec3(0.0); vec2 px=1.0/uResolution; vec2 o[16];
  o[0]=vec2(-0.94,-0.40);o[1]=vec2(0.95,-0.77);o[2]=vec2(-0.09,-0.93);o[3]=vec2(0.34,0.29);
  o[4]=vec2(-0.92,-0.46);o[5]=vec2(-0.82,0.49);o[6]=vec2(-0.38,-0.56);o[7]=vec2(-0.13,0.85);
  o[8]=vec2(0.90,0.41);o[9]=vec2(0.18,-0.30);o[10]=vec2(-0.01,-0.16);o[11]=vec2(0.60,0.71);
  o[12]=vec2(0.50,-0.47);o[13]=vec2(0.81,0.05);o[14]=vec2(-0.32,-0.04);o[15]=vec2(-0.61,0.07);
  for(int i=0;i<16;i++) sum+=sampleBg(uv+o[i]*radius*px);
  return sum/16.0;
}
void main(){
  vec2 screenPx=vec2(vUv.x,1.0-vUv.y)*uResolution;
  vec2 screenUV=screenPx/uResolution;
  vec3 bg0=sampleBg(screenUV);
  float ca=cos(uAngle),sa=sin(uAngle);
  vec2 c=screenPx-uCenter;
  float qx=c.x*ca+c.y*sa; float qy=-c.x*sa+c.y*ca;
  float shift=seamShift(qy); float dshift=seamShift(qy+1.0)-shift;
  float qxw=qx-shift; float total=uBandWidth*uBandCount; float local=qxw+total*0.5;
  if(local<0.0||local>total){ fragColor=vec4(bg0,1.0); return; }
  float within=fract(local/uBandWidth)*uBandWidth;
  float distFromEdge=min(within,uBandWidth-within);
  float bezel=min(uBezel,uBandWidth*0.5-1.0);
  float t=clamp(distFromEdge/bezel,0.0,1.0);
  float h=surfaceHeight(t); float dt=0.001; float dh=(surfaceHeight(min(t+dt,1.0))-h)/dt;
  float slope=atan(dh*(uThickness/bezel)); float sinR=clamp(sin(slope)/uIOR,-1.0,1.0);
  float displacement=h*uThickness*(tan(slope)-tan(asin(sinR)));
  float dir=(within<uBandWidth*0.5)?-1.0:1.0;
  vec2 nBand=normalize(vec2(1.0,-dshift))*dir;
  vec2 gradScreen=vec2(nBand.x*ca-nBand.y*sa,nBand.x*sa+nBand.y*ca);
  vec2 offset=-gradScreen*displacement/uResolution;
  vec3 color=sampleBgBlurred(screenUV+offset,uBlur);
  vec2 lightDir=normalize(vec2(0.5,-0.7));
  float rimDot=abs(dot(gradScreen,lightDir));
  float rimFalloff=1.0-smoothstep(0.0,bezel*0.5,distFromEdge);
  color+=vec3(pow(rimDot*rimFalloff,1.5)*uSpecular);
  float innerRim=smoothstep(0.0,2.0,distFromEdge)*(1.0-smoothstep(2.0,5.0,distFromEdge));
  color+=vec3(innerRim*0.15*uSpecular);
  color=mix(color,vec3(1.0),uTint);
  float alpha=smoothstep(0.0,1.5,distFromEdge);
  fragColor=vec4(mix(bg0,color,alpha),1.0);
}`

type Fire = { colors: string[]; colorBack: string; outerDistortion: number; outerGlow: number; angle: number; speed: number; scale: number }
type Glass = { angle: number; bands: number; curveAmp: number; curveFreq: number; organic: number; bezel: number; thickness: number; ior: number; blur: number; specular: number; tint: number }
const FIRE0: Fire = { colors:['#fe5b16','#f7ff61','#ffffff'], colorBack:'#000000', outerDistortion:0.8, outerGlow:1, angle:0, speed:1, scale:1.6 }
const GLASS0: Glass = { angle:45, bands:3, curveAmp:50, curveFreq:1, organic:0.6, bezel:70, thickness:60, ior:1.5, blur:2, specular:0.6, tint:0.06 }

function compile(gl: WebGL2RenderingContext, ty: number, src: string) { const s=gl.createShader(ty)!; gl.shaderSource(s,src); gl.compileShader(s); if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)||'compile'); return s }
function program(gl: WebGL2RenderingContext, v: string, f: string) { const p=gl.createProgram()!; gl.attachShader(p,compile(gl,gl.VERTEX_SHADER,v)); gl.attachShader(p,compile(gl,gl.FRAGMENT_SHADER,f)); gl.bindAttribLocation(p,0,'a_position'); gl.linkProgram(p); if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)||'link'); return p }

const row: CSSProperties = { display:'flex', alignItems:'center', gap:10, marginBottom:9 }
const lab: CSSProperties = { fontSize:13, color:'#334155', fontWeight:500, minWidth:92 }
const val: CSSProperties = { fontSize:12, color:'#64758b', width:38, textAlign:'right', fontVariantNumeric:'tabular-nums' }
const st: CSSProperties = { fontSize:11, fontWeight:700, letterSpacing:.5, color:'#0f172a', margin:'16px 0 10px' }

function Slider(p: { label: string; v: number; min: number; max: number; step: number; on: (n: number) => void; d?: number }) {
  return (
    <div style={row}><span style={lab}>{p.label}</span>
      <input type="range" min={p.min} max={p.max} step={p.step} value={p.v} onChange={e => p.on(parseFloat(e.target.value))} style={{ flex:1 }} />
      <span style={val}>{p.v.toFixed(p.d ?? 2)}</span></div>
  )
}

export default function GlassFireLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [fire, setFire] = useState<Fire>(FIRE0)
  const [glass, setGlass] = useState<Glass>(GLASS0)
  const fireRef = useRef(fire); fireRef.current = fire
  const glassRef = useRef(glass); glassRef.current = glass

  useEffect(() => {
    const canvas = ref.current!
    const glCtx = canvas.getContext('webgl2', { antialias: true })
    if (!glCtx) { console.error('no webgl2'); return }
    const gl: WebGL2RenderingContext = glCtx
    let raf = 0, gemProg: WebGLProgram, glassProg: WebGLProgram
    try { gemProg = program(gl, PAPER_VERT, gemSmokeFragmentShader); glassProg = program(gl, GLASS_VERT, GLASS_FRAG) }
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
    const dummy = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, dummy); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,255]))

    function resize() {
      canvas.width = Math.round(canvas.clientWidth*ratio); canvas.height = Math.round(canvas.clientHeight*ratio)
      gl.bindTexture(gl.TEXTURE_2D, fireTex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    }
    window.addEventListener('resize', resize); resize()

    const start = performance.now()
    function frame() {
      raf = requestAnimationFrame(frame)
      const t = (performance.now()-start)/1000
      const F = fireRef.current, G = glassRef.current
      const W = canvas.width, H = canvas.height

      // PASS 1 — GemSmoke fire -> fireTex (shape none, size 1, scale>=1.6, inner tied to outer => uniform full-screen)
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fireTex, 0)
      gl.viewport(0,0,W,H); gl.useProgram(gemProg)
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, dummy); gl.uniform1i(U(gemProg,'u_image'),0); gl.uniform1i(U(gemProg,'u_isImage'),0)
      const flat = F.colors.flatMap(col); gl.uniform4fv(U(gemProg,'u_colors[0]'), new Float32Array(flat)); gl.uniform1f(U(gemProg,'u_colorsCount'), F.colors.length)
      const cb = col(F.colorBack); gl.uniform4f(U(gemProg,'u_colorBack'), cb[0],cb[1],cb[2],cb[3]); gl.uniform4f(U(gemProg,'u_colorInner'), 0,0,0,0)
      gl.uniform1f(U(gemProg,'u_innerDistortion'), F.outerDistortion); gl.uniform1f(U(gemProg,'u_outerDistortion'), F.outerDistortion)
      gl.uniform1f(U(gemProg,'u_outerGlow'), F.outerGlow); gl.uniform1f(U(gemProg,'u_innerGlow'), F.outerGlow)
      gl.uniform1f(U(gemProg,'u_offset'), 0); gl.uniform1f(U(gemProg,'u_angle'), F.angle); gl.uniform1f(U(gemProg,'u_size'), 1)
      gl.uniform1f(U(gemProg,'u_shape'), GemSmokeShapes.none); gl.uniform1f(U(gemProg,'u_time'), t*F.speed)
      gl.uniform1f(U(gemProg,'u_fit'), ShaderFitOptions.cover); gl.uniform1f(U(gemProg,'u_scale'), Math.max(F.scale,1.6))
      gl.uniform1f(U(gemProg,'u_rotation'),0); gl.uniform1f(U(gemProg,'u_offsetX'),0); gl.uniform1f(U(gemProg,'u_offsetY'),0)
      gl.uniform1f(U(gemProg,'u_originX'),0.5); gl.uniform1f(U(gemProg,'u_originY'),0.5); gl.uniform1f(U(gemProg,'u_worldWidth'),0); gl.uniform1f(U(gemProg,'u_worldHeight'),0)
      gl.uniform1f(U(gemProg,'u_pixelRatio'),ratio); gl.uniform1f(U(gemProg,'u_imageAspectRatio'), W/H); gl.uniform2f(U(gemProg,'u_resolution'), W, H)
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4)

      // PASS 2 — our curved glass, refracts fireTex -> screen
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0,0,W,H); gl.useProgram(glassProg)
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fireTex); gl.uniform1i(U(glassProg,'u_tex'),0)
      const a = G.angle*Math.PI/180
      const span = Math.abs(W*Math.cos(a)) + Math.abs(H*Math.sin(a))
      gl.uniform2f(U(glassProg,'uResolution'), W, H); gl.uniform2f(U(glassProg,'uCenter'), W/2, H/2)
      gl.uniform1f(U(glassProg,'uAngle'), a); gl.uniform1f(U(glassProg,'uBandCount'), G.bands); gl.uniform1f(U(glassProg,'uBandWidth'), span/G.bands)
      gl.uniform1f(U(glassProg,'uBezel'), G.bezel*ratio); gl.uniform1f(U(glassProg,'uThickness'), G.thickness*ratio)
      gl.uniform1f(U(glassProg,'uIOR'), G.ior); gl.uniform1f(U(glassProg,'uBlur'), G.blur); gl.uniform1f(U(glassProg,'uSpecular'), G.specular); gl.uniform1f(U(glassProg,'uTint'), G.tint)
      gl.uniform1f(U(glassProg,'uCurveAmp'), G.curveAmp*ratio); gl.uniform1f(U(glassProg,'uCurveFreq'), G.curveFreq); gl.uniform1f(U(glassProg,'uOrganic'), G.organic)
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4)
    }
    frame()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  const setF = <K extends keyof Fire>(k: K, v: Fire[K]) => setFire(s => ({ ...s, [k]: v }))
  const setG = <K extends keyof Glass>(k: K, v: Glass[K]) => setGlass(s => ({ ...s, [k]: v }))

  return (
    <div style={{ display:'flex', height:'100vh', background:'#111', fontFamily:"'Hanken Grotesk',sans-serif" }}>
      <div style={{ flex:1, minWidth:0 }}><canvas ref={ref} style={{ width:'100%', height:'100%', display:'block' }} /></div>
      <div style={{ width:320, background:'#fff', padding:20, overflowY:'auto', boxShadow:'-2px 0 8px rgba(0,0,0,.1)' }}>
        <div style={st}>LAYER 1 · CURVED GLASS (refracts fire)</div>
        <Slider label="angle°" v={glass.angle} min={-180} max={180} step={1} d={0} on={v => setG('angle', v)} />
        <Slider label="bands" v={glass.bands} min={1} max={8} step={1} d={0} on={v => setG('bands', v)} />
        <Slider label="curve amount" v={glass.curveAmp} min={0} max={220} step={1} d={0} on={v => setG('curveAmp', v)} />
        <Slider label="curve waves" v={glass.curveFreq} min={0} max={4} step={0.05} on={v => setG('curveFreq', v)} />
        <Slider label="organic" v={glass.organic} min={0} max={1} step={0.01} on={v => setG('organic', v)} />
        <Slider label="bezel" v={glass.bezel} min={4} max={200} step={1} d={0} on={v => setG('bezel', v)} />
        <Slider label="thickness" v={glass.thickness} min={4} max={200} step={1} d={0} on={v => setG('thickness', v)} />
        <Slider label="IOR" v={glass.ior} min={1} max={3} step={0.01} on={v => setG('ior', v)} />
        <Slider label="blur" v={glass.blur} min={0} max={6} step={0.1} on={v => setG('blur', v)} />
        <Slider label="specular" v={glass.specular} min={0} max={1.5} step={0.01} on={v => setG('specular', v)} />
        <Slider label="tint" v={glass.tint} min={0} max={0.4} step={0.01} on={v => setG('tint', v)} />

        <div style={st}>LAYER 2 · FIRE (paper GemSmoke)</div>
        <div style={row}>
          <span style={lab}>colors</span>
          {fire.colors.map((c, i) => (
            <input key={i} type="color" value={c} onChange={e => setFire(s => { const cc = [...s.colors]; cc[i] = e.target.value; return { ...s, colors: cc } })}
              style={{ width:30, height:26, border:'1px solid #e2e8f0', borderRadius:5, padding:0 }} />
          ))}
          <input type="color" value={fire.colorBack} onChange={e => setF('colorBack', e.target.value)} title="colorBack"
            style={{ width:30, height:26, border:'1px solid #e2e8f0', borderRadius:5, padding:0 }} />
        </div>
        <Slider label="outerDistortion" v={fire.outerDistortion} min={0} max={1} step={0.01} on={v => setF('outerDistortion', v)} />
        <Slider label="outerGlow" v={fire.outerGlow} min={0} max={1} step={0.01} on={v => setF('outerGlow', v)} />
        <Slider label="angle°" v={fire.angle} min={0} max={360} step={1} d={0} on={v => setF('angle', v)} />
        <Slider label="speed" v={fire.speed} min={0} max={3} step={0.01} on={v => setF('speed', v)} />
        <Slider label="scale" v={fire.scale} min={1.6} max={4} step={0.01} on={v => setF('scale', v)} />

        <button onClick={() => console.log('GLASS+FIRE', JSON.stringify({ glass, fire }, null, 2))}
          style={{ width:'100%', padding:10, marginTop:14, background:'#f1f5f9', color:'#334155', border:0, borderRadius:6, fontWeight:500, cursor:'pointer' }}>Log values</button>
      </div>
    </div>
  )
}
