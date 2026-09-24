/**
 * Topographic background.
 *
 * A fragment shader draws contour lines of a slowly evolving noise field. Scrolling
 * moves you across the terrain and through time; the pointer raises a small hill
 * that the lines bend around. One draw call, no geometry beyond a full-screen
 * triangle, and rendering idles down when nothing is moving.
 */

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;

uniform vec2 uRes;
uniform float uDpr;
uniform float uScroll;
uniform float uTime;
uniform vec2 uPointer;
uniform float uPointerAmt;
uniform vec3 uInk;
uniform vec3 uAccent;
uniform float uInkAlpha;
uniform float uAccentAlpha;
uniform float uGlowAlpha;
uniform float uIntensity;
uniform float uReading;

out vec4 outColor;

// 3D simplex noise. Ashima Arts / Stefan Gustavson, MIT License.
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

void main() {
  vec2 size = uRes / uDpr;
  vec2 css = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;

  // Terrain coordinates: the field drifts up as you scroll, slower than the page.
  float unit = 1.0 / 560.0;
  vec2 p = css * unit;
  p.y += uScroll * unit * 0.32;
  float z = uScroll * 0.00032 + uTime * 0.012;

  float h = snoise(vec3(p, z)) * 0.64
          + snoise(vec3(p * 2.1 + 17.3, z * 1.35 + 4.0)) * 0.22;

  // Pointer hill.
  vec2 d = (css - uPointer) / 190.0;
  h += uPointerAmt * 0.42 * exp(-dot(d, d));

  float levels = 8.5;
  float v = h * levels;
  float fw = max(fwidth(v), 1e-4);
  float dist = abs(fract(v - 0.5) - 0.5) / fw;
  float idx = floor(v + 0.5);
  bool major = mod(idx, 4.0) < 0.5;
  float halfW = (major ? 0.7 : 0.42) * uDpr;
  float line = 1.0 - smoothstep(halfW - 0.5, halfW + 0.5, dist);

  // A soft light that travels across the terrain as you scroll.
  vec2 focus = vec2(
    size.x * (0.70 - 0.26 * sin(uScroll * 0.00062 + 0.4)),
    size.y * (0.34 + 0.16 * sin(uScroll * 0.00093 + 1.3))
  );
  float radius = max(size.x, size.y) * 0.48;
  vec2 fd = (css - focus) / radius;
  float glow = exp(-dot(fd, fd) * 1.6);
  float hill = uPointerAmt * exp(-dot(d, d) * 0.6);
  float warm = clamp(glow + hill * 0.8, 0.0, 1.0);

  vec3 col = mix(uInk, uAccent, warm);
  float a = mix(uInkAlpha, uAccentAlpha, warm) * (major ? 1.7 : 1.0) * line;
  a *= uIntensity;

  // Once you are reading, keep the text column calm and let the edges carry the terrain.
  float column = smoothstep(260.0, 640.0, abs(css.x - size.x * 0.5));
  a *= mix(1.0, mix(0.4, 1.0, column), uReading);

  // Faint wash of light under the glow.
  float wash = uGlowAlpha * glow;
  vec3 outRgb = col * a + uAccent * wash * (1.0 - a);
  float outA = a + wash * (1.0 - a);
  outColor = vec4(outRgb, outA);
}`;

type Rgb = [number, number, number];

function readVars(): { ink: Rgb; accent: Rgb; inkA: number; accentA: number; glowA: number } {
  const cs = getComputedStyle(document.documentElement);
  const rgb = (name: string): Rgb => {
    const parts = cs.getPropertyValue(name).trim().split(/[\s,]+/).map(Number);
    return [(parts[0] || 0) / 255, (parts[1] || 0) / 255, (parts[2] || 0) / 255];
  };
  const num = (name: string, fallback: number) => {
    const v = parseFloat(cs.getPropertyValue(name));
    return Number.isFinite(v) ? v : fallback;
  };
  return {
    ink: rgb('--gl-ink'),
    accent: rgb('--gl-accent'),
    inkA: num('--gl-ink-alpha', 0.08),
    accentA: num('--gl-accent-alpha', 0.4),
    glowA: num('--gl-glow-alpha', 0.05),
  };
}

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export function initBackground(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    powerPreference: 'low-power',
  });
  if (!gl) {
    canvas.remove();
    return;
  }

  // Software rasterisers (no GPU: some VMs, blocklisted drivers, headless audits) would
  // spend the main thread drawing every frame. The page looks fine without the terrain.
  const debug = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : '';
  if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer)) {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    canvas.remove();
    return;
  }

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  const prog = gl.createProgram();
  if (!vs || !fs || !prog) {
    canvas.remove();
    return;
  }
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    canvas.remove();
    return;
  }
  gl.useProgram(prog);

  // One oversized triangle covers the viewport.
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = (name: string) => gl.getUniformLocation(prog, name);
  const U = {
    res: u('uRes'),
    dpr: u('uDpr'),
    scroll: u('uScroll'),
    time: u('uTime'),
    pointer: u('uPointer'),
    pointerAmt: u('uPointerAmt'),
    ink: u('uInk'),
    accent: u('uAccent'),
    inkA: u('uInkAlpha'),
    accentA: u('uAccentAlpha'),
    glowA: u('uGlowAlpha'),
    intensity: u('uIntensity'),
    reading: u('uReading'),
  };

  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let still = motionQuery.matches;

  const applyColors = () => {
    const c = readVars();
    gl.uniform3fv(U.ink, c.ink);
    gl.uniform3fv(U.accent, c.accent);
    gl.uniform1f(U.inkA, c.inkA);
    gl.uniform1f(U.accentA, c.accentA);
    gl.uniform1f(U.glowA, c.glowA);
  };

  let dpr = 1;
  // Lowered by the frame-time guard below if the device can't keep up.
  let quality = 1;
  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, w < 760 ? 1.75 : 2) * quality;
    const W = Math.max(1, Math.round(w * dpr));
    const H = Math.max(1, Math.round(h * dpr));
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }
    gl.viewport(0, 0, W, H);
    gl.uniform2f(U.res, W, H);
    gl.uniform1f(U.dpr, dpr);
  };

  // Eased state.
  let scrollTarget = window.scrollY;
  let scroll = scrollTarget;
  const pointerTarget = { x: -9999, y: -9999, amt: 0 };
  const pointer = { x: -9999, y: -9999, amt: 0 };
  let time = 0;
  let last = performance.now();
  let lastIdleDraw = 0;
  let raf = 0;
  let running = false;

  const draw = () => {
    const vh = window.innerHeight || 800;
    // Strongest over the hero, calmer once you are reading.
    const past = Math.min(1, Math.max(0, scroll / (vh * 0.9)));
    const intensity = 1 - 0.2 * past;
    gl.uniform1f(U.scroll, scroll);
    gl.uniform1f(U.time, time);
    gl.uniform2f(U.pointer, pointer.x, pointer.y);
    gl.uniform1f(U.pointerAmt, pointer.amt);
    gl.uniform1f(U.intensity, intensity);
    gl.uniform1f(U.reading, past);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  // Frame-time guard: if frames stay slow, draw fewer pixels; if that still isn't
  // enough, settle on a still frame instead of making the page feel heavy.
  let slowFrames = 0;
  let sampled = 0;
  const guard = (ms: number) => {
    sampled += 1;
    if (ms > 45) slowFrames += 1;
    if (sampled < 60) return;
    const slow = slowFrames / sampled > 0.6;
    sampled = slowFrames = 0;
    if (!slow) return;
    if (quality > 0.5) {
      quality *= 0.7;
      resize();
    } else {
      still = true;
      stop();
      draw();
    }
  };

  const frame = (now: number) => {
    raf = 0;
    guard(now - last);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const k = (rate: number) => 1 - Math.pow(1 - rate, dt * 60);

    const ds = scrollTarget - scroll;
    scroll += ds * k(0.085);
    pointer.x += (pointerTarget.x - pointer.x) * k(0.12);
    pointer.y += (pointerTarget.y - pointer.y) * k(0.12);
    pointer.amt += (pointerTarget.amt - pointer.amt) * k(0.06);
    time += dt;

    const busy =
      Math.abs(ds) > 0.25 ||
      Math.abs(pointerTarget.x - pointer.x) > 0.5 ||
      Math.abs(pointerTarget.y - pointer.y) > 0.5 ||
      Math.abs(pointerTarget.amt - pointer.amt) > 0.004;

    // Idle drift only needs ~24fps; motion gets every frame.
    if (busy || now - lastIdleDraw > 42) {
      draw();
      lastIdleDraw = now;
    }
    if (running) raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (still || running || document.hidden) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const stop = () => {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  const drawStill = () => {
    scroll = scrollTarget = 0;
    pointer.amt = 0;
    draw();
  };

  resize();
  applyColors();
  if (still) drawStill();
  else {
    draw();
    start();
  }
  requestAnimationFrame(() => canvas.classList.add('is-ready'));

  window.addEventListener(
    'scroll',
    () => {
      scrollTarget = window.scrollY;
    },
    { passive: true },
  );

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      pointerTarget.x = e.clientX;
      pointerTarget.y = e.clientY;
      pointerTarget.amt = 1;
      if (pointer.amt < 0.01) {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
      }
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => {
    pointerTarget.amt = 0;
  });

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resize();
      draw();
    }, 120);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  document.addEventListener('themechange', () => {
    applyColors();
    draw();
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    applyColors();
    draw();
  });

  motionQuery.addEventListener('change', () => {
    still = motionQuery.matches;
    if (still) {
      stop();
      drawStill();
    } else start();
  });

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    stop();
    canvas.classList.remove('is-ready');
  });
}
