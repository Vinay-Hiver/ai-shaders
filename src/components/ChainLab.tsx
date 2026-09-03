import { useEffect, useRef } from 'react'
import {
  gemSmokeFragmentShader, waterFragmentShader, flutedGlassFragmentShader,
  getShaderColorFromString, GlassGridShapes, GlassDistortionShapes, GemSmokeShapes, ShaderFitOptions,
} from '@paper-design/shaders'

/**
 * ChainLab — full chained pipeline with PAPER'S REAL shaders:
 *   GemSmoke (fire) -> texture -> Water refracts it -> texture -> FlutedGlass refracts that -> screen
 * Per-layer opacity is honored via mix passes. Mounted at ?lab=chain.
 */

// paper's vertex shader (from @paper-design/shaders/dist/vertex-shader.js)
const VERT = `#version 300 es
precision mediump float;
layout(location = 0) in vec4 a_position;
uniform vec2 u_resolution; uniform float u_pixelRatio; uniform float u_imageAspectRatio;
uniform float u_originX; uniform float u_originY; uniform float u_worldWidth; uniform float u_worldHeight;
uniform float u_fit; uniform float u_scale; uniform float u_rotation; uniform float u_offsetX; uniform float u_offsetY;
out vec2 v_objectUV; out vec2 v_objectBoxSize; out vec2 v_responsiveUV; out vec2 v_responsiveBoxGivenSize;
out vec2 v_patternUV; out vec2 v_patternBoxSize; out vec2 v_imageUV;
vec3 getBoxSize(float boxRatio, vec2 givenBoxSize){
  vec2 box=vec2(0.);
  box.x=boxRatio*min(givenBoxSize.x/boxRatio,givenBoxSize.y);
  float noFitBoxWidth=box.x;
  if(u_fit==1.){ box.x=boxRatio*min(u_resolution.x/boxRatio,u_resolution.y); }
  else if(u_fit==2.){ box.x=boxRatio*max(u_resolution.x/boxRatio,u_resolution.y); }
  box.y=box.x/boxRatio;
  return vec3(box,noFitBoxWidth);
}
void main(){
  gl_Position=a_position;
  vec2 uv=gl_Position.xy*.5;
  vec2 boxOrigin=vec2(.5-u_originX,u_originY-.5);
  vec2 givenBoxSize=vec2(u_worldWidth,u_worldHeight);
  givenBoxSize=max(givenBoxSize,vec2(1.))*u_pixelRatio;
  float r=u_rotation*3.14159265358979323846/180.;
  mat2 graphicRotation=mat2(cos(r),sin(r),-sin(r),cos(r));
  vec2 graphicOffset=vec2(-u_offsetX,u_offsetY);
  float fixedRatio=1.;
  vec2 fixedRatioBoxGivenSize=vec2((u_worldWidth==0.)?u_resolution.x:givenBoxSize.x,(u_worldHeight==0.)?u_resolution.y:givenBoxSize.y);
  v_objectBoxSize=getBoxSize(fixedRatio,fixedRatioBoxGivenSize).xy;
  vec2 objectWorldScale=u_resolution.xy/v_objectBoxSize;
  v_objectUV=uv; v_objectUV*=objectWorldScale; v_objectUV+=boxOrigin*(objectWorldScale-1.); v_objectUV+=graphicOffset; v_objectUV/=u_scale; v_objectUV=graphicRotation*v_objectUV;
  v_responsiveBoxGivenSize=vec2((u_worldWidth==0.)?u_resolution.x:givenBoxSize.x,(u_worldHeight==0.)?u_resolution.y:givenBoxSize.y);
  float responsiveRatio=v_responsiveBoxGivenSize.x/v_responsiveBoxGivenSize.y;
  vec2 responsiveBoxSize=getBoxSize(responsiveRatio,v_responsiveBoxGivenSize).xy;
  vec2 responsiveBoxScale=u_resolution.xy/responsiveBoxSize;
  v_responsiveUV=uv; v_responsiveUV*=responsiveBoxScale; v_responsiveUV+=boxOrigin*(responsiveBoxScale-1.); v_responsiveUV+=graphicOffset; v_responsiveUV/=u_scale; v_responsiveUV.x*=responsiveRatio; v_responsiveUV=graphicRotation*v_responsiveUV; v_responsiveUV.x/=responsiveRatio;
  float patternBoxRatio=givenBoxSize.x/givenBoxSize.y;
  vec2 patternBoxGivenSize=vec2((u_worldWidth==0.)?u_resolution.x:givenBoxSize.x,(u_worldHeight==0.)?u_resolution.y:givenBoxSize.y);
  patternBoxRatio=patternBoxGivenSize.x/patternBoxGivenSize.y;
  vec3 boxSizeData=getBoxSize(patternBoxRatio,patternBoxGivenSize);
  v_patternBoxSize=boxSizeData.xy; float patternBoxNoFitBoxWidth=boxSizeData.z;
  vec2 patternBoxScale=u_resolution.xy/v_patternBoxSize;
  v_patternUV=uv; v_patternUV+=graphicOffset/patternBoxScale; v_patternUV+=boxOrigin; v_patternUV-=boxOrigin/patternBoxScale; v_patternUV*=u_resolution.xy; v_patternUV/=u_pixelRatio;
  if(u_fit>0.){ v_patternUV*=(patternBoxNoFitBoxWidth/v_patternBoxSize.x); }
  v_patternUV/=u_scale; v_patternUV=graphicRotation*v_patternUV; v_patternUV+=boxOrigin/patternBoxScale; v_patternUV-=boxOrigin; v_patternUV*=.01;
  vec2 imageBoxSize;
  if(u_fit==1.){ imageBoxSize.x=min(u_resolution.x/u_imageAspectRatio,u_resolution.y)*u_imageAspectRatio; }
  else if(u_fit==2.){ imageBoxSize.x=max(u_resolution.x/u_imageAspectRatio,u_resolution.y)*u_imageAspectRatio; }
  else { imageBoxSize.x=min(10.0,10.0/u_imageAspectRatio*u_imageAspectRatio); }
  imageBoxSize.y=imageBoxSize.x/u_imageAspectRatio;
  vec2 imageBoxScale=u_resolution.xy/imageBoxSize;
  v_imageUV=uv; v_imageUV*=imageBoxScale; v_imageUV+=boxOrigin*(imageBoxScale-1.); v_imageUV+=graphicOffset; v_imageUV/=u_scale; v_imageUV.x*=u_imageAspectRatio; v_imageUV=graphicRotation*v_imageUV; v_imageUV.x/=u_imageAspectRatio;
  v_imageUV+=.5; v_imageUV.y=1.-v_imageUV.y;
}`

const PASS_VERT = `#version 300 es
layout(location = 0) in vec4 a_position;
void main(){ gl_Position = a_position; }`
const MIX_FRAG = `#version 300 es
precision mediump float;
uniform sampler2D u_a; uniform sampler2D u_b; uniform float u_op; uniform vec2 u_res;
out vec4 fragColor;
void main(){ vec2 uv=gl_FragCoord.xy/u_res; fragColor=mix(texture(u_a,uv), texture(u_b,uv), u_op); }`

// ---- user's exact values ----
const BG = { colors:['#00608C','#00608C','#ffffff'], colorBack:'#ffffff', colorInner:'#000000',
  innerDistortion:0.6, outerDistortion:1, outerGlow:0.85, innerGlow:0.65, offset:0, angle:53, size:1, speed:0.18, scale:1.6, shape:'none' as const }
const WATER = { colorBack:'#909090', colorHighlight:'#ffffff', highlights:0.43, layering:0.63, edges:0, waves:0.14, caustic:0.2,
  size:1, speed:0.1, scale:1.02, fit:'cover' as const, opacity:0.64 }
const GLASS = { colorBack:'#00000000', colorShadow:'#000000', colorHighlight:'#ffffff', shadows:0, highlights:0, size:0.9,
  shape:'wave' as const, angle:98, distortionShape:'contour' as const, distortion:0.5, shift:0, stretch:1, blur:0.1, edges:0.5,
  margin:0, grainMixer:0, grainOverlay:0.05, scale:2.49, fit:'cover' as const, opacity:0.5 }

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error((gl.getShaderInfoLog(s) || '') + '\n' + src.slice(0, 80))
  return s
}
function program(gl: WebGL2RenderingContext, vert: string, frag: string) {
  const p = gl.createProgram()!
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vert))
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, frag))
  gl.bindAttribLocation(p, 0, 'a_position'); gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link error')
  return p
}

export default function ChainLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current!
    const glCtx = canvas.getContext('webgl2', { antialias: true, premultipliedAlpha: false })
    if (!glCtx) { console.error('no webgl2'); return }
    const gl: WebGL2RenderingContext = glCtx
    let raf = 0
    let gemProg: WebGLProgram, waterProg: WebGLProgram, glassProg: WebGLProgram, mixProg: WebGLProgram
    try {
      gemProg = program(gl, VERT, gemSmokeFragmentShader)
      waterProg = program(gl, VERT, waterFragmentShader)
      glassProg = program(gl, VERT, flutedGlassFragmentShader)
      mixProg = program(gl, PASS_VERT, MIX_FRAG)
    } catch (e) { console.error('SHADER BUILD FAILED:', e); return }

    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    const ratio = Math.min(window.devicePixelRatio, 2)
    const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n)
    const col = (v: string) => getShaderColorFromString(v) as number[]

    const mkTex = () => { const t = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, t)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); return t }
    const tFire = mkTex(), tWater = mkTex(), tGlassIn = mkTex(), tGlass = mkTex()
    const fbo = gl.createFramebuffer()
    // 1x1 dummy for GemSmoke's (unused) image sampler
    const dummy = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, dummy)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,255]))

    function sizing(p: WebGLProgram, fit: string, scale: number) {
      gl.uniform1f(U(p,'u_fit'), ShaderFitOptions[fit as keyof typeof ShaderFitOptions])
      gl.uniform1f(U(p,'u_scale'), scale); gl.uniform1f(U(p,'u_rotation'), 0)
      gl.uniform1f(U(p,'u_offsetX'), 0); gl.uniform1f(U(p,'u_offsetY'), 0)
      gl.uniform1f(U(p,'u_originX'), 0.5); gl.uniform1f(U(p,'u_originY'), 0.5)
      gl.uniform1f(U(p,'u_worldWidth'), 0); gl.uniform1f(U(p,'u_worldHeight'), 0)
      gl.uniform1f(U(p,'u_pixelRatio'), ratio)
      gl.uniform1f(U(p,'u_imageAspectRatio'), canvas.width / canvas.height)
      gl.uniform2f(U(p,'u_resolution'), canvas.width, canvas.height)
    }
    const c4 = (p: WebGLProgram, n: string, v: string) => { const c = col(v); gl.uniform4f(U(p,n), c[0], c[1], c[2], c[3]) }

    function drawTo(tex: WebGLTexture | null) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      if (tex) gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
    function drawScreen() { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0,0,canvas.width,canvas.height); gl.drawArrays(gl.TRIANGLE_STRIP,0,4) }

    function resize() {
      canvas.width = Math.round(canvas.clientWidth * ratio); canvas.height = Math.round(canvas.clientHeight * ratio)
      for (const t of [tFire, tWater, tGlassIn, tGlass]) { gl.bindTexture(gl.TEXTURE_2D, t)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null) }
    }
    window.addEventListener('resize', resize); resize()

    const start = performance.now()
    function frame() {
      raf = requestAnimationFrame(frame)
      const t = (performance.now() - start) / 1000

      // PASS 1 — GemSmoke fire -> tFire
      gl.useProgram(gemProg)
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, dummy); gl.uniform1i(U(gemProg,'u_image'), 0)
      gl.uniform1i(U(gemProg,'u_isImage'), 0)
      const flat = BG.colors.flatMap(col); gl.uniform4fv(U(gemProg,'u_colors[0]'), new Float32Array(flat)); gl.uniform1f(U(gemProg,'u_colorsCount'), BG.colors.length)
      c4(gemProg,'u_colorBack', BG.colorBack); c4(gemProg,'u_colorInner', BG.colorInner)
      gl.uniform1f(U(gemProg,'u_innerDistortion'), BG.innerDistortion); gl.uniform1f(U(gemProg,'u_outerDistortion'), BG.outerDistortion)
      gl.uniform1f(U(gemProg,'u_outerGlow'), BG.outerGlow); gl.uniform1f(U(gemProg,'u_innerGlow'), BG.innerGlow)
      gl.uniform1f(U(gemProg,'u_offset'), BG.offset); gl.uniform1f(U(gemProg,'u_angle'), BG.angle); gl.uniform1f(U(gemProg,'u_size'), BG.size)
      gl.uniform1f(U(gemProg,'u_shape'), GemSmokeShapes[BG.shape])
      gl.uniform1f(U(gemProg,'u_time'), t * BG.speed)
      sizing(gemProg, 'cover', BG.scale)
      drawTo(tFire)

      // PASS 2 — Water(tFire) -> tWater
      gl.useProgram(waterProg)
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tFire); gl.uniform1i(U(waterProg,'u_image'), 0)
      c4(waterProg,'u_colorBack', WATER.colorBack); c4(waterProg,'u_colorHighlight', WATER.colorHighlight)
      gl.uniform1f(U(waterProg,'u_highlights'), WATER.highlights); gl.uniform1f(U(waterProg,'u_layering'), WATER.layering)
      gl.uniform1f(U(waterProg,'u_edges'), WATER.edges); gl.uniform1f(U(waterProg,'u_waves'), WATER.waves); gl.uniform1f(U(waterProg,'u_caustic'), WATER.caustic)
      gl.uniform1f(U(waterProg,'u_size'), WATER.size); gl.uniform1f(U(waterProg,'u_time'), t * WATER.speed)
      sizing(waterProg, WATER.fit, WATER.scale)
      drawTo(tWater)

      // MIX — tGlassIn = mix(tFire, tWater, waterOpacity)
      gl.useProgram(mixProg)
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tFire); gl.uniform1i(U(mixProg,'u_a'), 0)
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tWater); gl.uniform1i(U(mixProg,'u_b'), 1)
      gl.uniform1f(U(mixProg,'u_op'), WATER.opacity); gl.uniform2f(U(mixProg,'u_res'), canvas.width, canvas.height)
      drawTo(tGlassIn)

      // PASS 3 — FlutedGlass(tGlassIn) -> tGlass
      gl.useProgram(glassProg)
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tGlassIn); gl.uniform1i(U(glassProg,'u_image'), 0)
      c4(glassProg,'u_colorBack', GLASS.colorBack); c4(glassProg,'u_colorShadow', GLASS.colorShadow); c4(glassProg,'u_colorHighlight', GLASS.colorHighlight)
      gl.uniform1f(U(glassProg,'u_shadows'), GLASS.shadows); gl.uniform1f(U(glassProg,'u_size'), GLASS.size); gl.uniform1f(U(glassProg,'u_angle'), GLASS.angle)
      gl.uniform1f(U(glassProg,'u_distortion'), GLASS.distortion); gl.uniform1f(U(glassProg,'u_shift'), GLASS.shift); gl.uniform1f(U(glassProg,'u_blur'), GLASS.blur)
      gl.uniform1f(U(glassProg,'u_edges'), GLASS.edges); gl.uniform1f(U(glassProg,'u_stretch'), GLASS.stretch); gl.uniform1f(U(glassProg,'u_highlights'), GLASS.highlights)
      gl.uniform1f(U(glassProg,'u_distortionShape'), GlassDistortionShapes[GLASS.distortionShape])
      gl.uniform1f(U(glassProg,'u_shape'), GlassGridShapes[GLASS.shape])
      gl.uniform1f(U(glassProg,'u_marginLeft'), GLASS.margin); gl.uniform1f(U(glassProg,'u_marginRight'), GLASS.margin)
      gl.uniform1f(U(glassProg,'u_marginTop'), GLASS.margin); gl.uniform1f(U(glassProg,'u_marginBottom'), GLASS.margin)
      gl.uniform1f(U(glassProg,'u_grainMixer'), GLASS.grainMixer); gl.uniform1f(U(glassProg,'u_grainOverlay'), GLASS.grainOverlay)
      sizing(glassProg, GLASS.fit, GLASS.scale)
      drawTo(tGlass)

      // MIX to screen — mix(tGlassIn, tGlass, glassOpacity)
      gl.useProgram(mixProg)
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tGlassIn); gl.uniform1i(U(mixProg,'u_a'), 0)
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tGlass); gl.uniform1i(U(mixProg,'u_b'), 1)
      gl.uniform1f(U(mixProg,'u_op'), GLASS.opacity); gl.uniform2f(U(mixProg,'u_res'), canvas.width, canvas.height)
      drawScreen()
    }
    frame()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <div style={{ height: '100vh', background: '#1c1c1e' }}>
      <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  )
}
