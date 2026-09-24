// Renders the favicon PNG, Apple touch icon, and Open Graph cards into public/.
// Run with `npm run og` after changing the monogram, the one-liner, or the palette.
// Uses the site's own fonts and the same contour shader as the live background.

import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const pub = (p) => join(root, 'public', p);
const fontUrl = (f) => pathToFileURL(pub(`fonts/${f}`)).href;
const letters = readFileSync(join(root, 'src/assets/monogram-path.txt'), 'utf8').trim();
const bgSource = readFileSync(join(root, 'src/scripts/background.ts'), 'utf8');
const FRAG = bgSource.match(/const FRAG = `([\s\S]*?)`;/)[1];
const VERT = bgSource.match(/const VERT = `([\s\S]*?)`;/)[1];

const fonts = `
  @font-face { font-family: Inter; src: url(${fontUrl('inter-var.woff2')}) format('woff2'); font-weight: 400 700; }
  @font-face { font-family: 'JetBrains Mono'; src: url(${fontUrl('jetbrains-mono-var.woff2')}) format('woff2'); font-weight: 400 600; }
  * { margin: 0; box-sizing: border-box; }
  body { font-family: Inter, sans-serif; -webkit-font-smoothing: antialiased; }
`;

const monogram = (size, bg, fg) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="${bg}"/><path d="${letters}" fill="${fg}"/></svg>`;

// Draws the contour field once, with the glow parked where the card needs it.
const contourScript = (accent, ink) => `
  <script type="module">
    const c = document.getElementById('bg');
    const gl = c.getContext('webgl2', { premultipliedAlpha: true, preserveDrawingBuffer: true });
    const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); return x; };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, ${JSON.stringify(VERT)}));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, ${JSON.stringify(FRAG)}));
    gl.linkProgram(p); gl.useProgram(p);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
    const l = gl.getAttribLocation(p, 'aPos'); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0);
    const u = (n) => gl.getUniformLocation(p, n);
    gl.viewport(0, 0, c.width, c.height);
    gl.uniform2f(u('uRes'), c.width, c.height);
    gl.uniform1f(u('uDpr'), 1);
    gl.uniform1f(u('uScroll'), 0);
    gl.uniform1f(u('uTime'), 3.0);
    gl.uniform2f(u('uPointer'), -9999, -9999);
    gl.uniform1f(u('uPointerAmt'), 0);
    gl.uniform3fv(u('uInk'), ${JSON.stringify(ink)});
    gl.uniform3fv(u('uAccent'), ${JSON.stringify(accent)});
    gl.uniform1f(u('uInkAlpha'), 0.09);
    gl.uniform1f(u('uAccentAlpha'), 0.5);
    gl.uniform1f(u('uGlowAlpha'), 0.08);
    gl.uniform1f(u('uIntensity'), 1);
    gl.uniform1f(u('uReading'), 0);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    document.body.dataset.ready = '1';
  </script>`;

const card = ({ accent, accentRgb, grad, kicker, title, sub, foot }) => `<!doctype html><html><head><style>${fonts}
  body { width: 1200px; height: 630px; background: #0c0c0e; color: #f5f5f7; position: relative; overflow: hidden; }
  #bg { position: absolute; inset: 0; width: 1200px; height: 630px; }
  .fade { position: absolute; inset: 0; background: radial-gradient(70% 90% at 22% 60%, rgb(12 12 14 / 0.92), rgb(12 12 14 / 0.35) 60%, transparent); }
  .wrap { position: absolute; inset: 72px 80px; display: flex; flex-direction: column; }
  .id { display: flex; align-items: center; gap: 18px; font-size: 28px; font-weight: 620; letter-spacing: -0.02em; }
  .kicker { margin-top: 64px; font-family: 'JetBrains Mono'; font-size: 22px; color: ${accent}; }
  h1 { margin-top: 18px; font-size: 76px; line-height: 1.02; font-weight: 680; letter-spacing: -0.045em; max-width: 900px; }
  h1 .g { background: ${grad}; -webkit-background-clip: text; color: transparent; }
  .sub { margin-top: 22px; font-size: 26px; color: #a1a1a6; letter-spacing: -0.01em; }
  .foot { margin-top: auto; display: flex; justify-content: space-between; font-family: 'JetBrains Mono'; font-size: 20px; color: #8a8a90; }
</style></head><body>
  <canvas id="bg" width="1200" height="630"></canvas>
  <div class="fade"></div>
  <div class="wrap">
    <div class="id">${monogram(52, '#f5f5f7', '#0c0c0e')}Yohann Pittappillil</div>
    <p class="kicker">${kicker}</p>
    <h1>${title}</h1>
    ${sub ? `<p class="sub">${sub}</p>` : ''}
    <div class="foot"><span>${foot[0]}</span><span>${foot[1]}</span></div>
  </div>
  ${contourScript(accentRgb, [0.96, 0.96, 0.97])}
</body></html>`;

const icon = (size, rounded) => `<!doctype html><html><head><style>${fonts}
  html, body { width: ${size}px; height: ${size}px; background: ${rounded ? 'transparent' : '#1d1d1f'}; }
  svg { display: block; }
</style></head><body>${
  rounded
    ? monogram(size, '#1d1d1f', '#fbfbfd')
    : `<svg width="${size}" height="${size}" viewBox="0 0 32 32"><rect width="32" height="32" fill="#1d1d1f"/><g transform="translate(3.2 3.2) scale(0.8)"><path d="${letters}" fill="#fbfbfd"/></g></svg>`
}</body></html>`;

const jobs = [
  {
    out: 'og.png',
    w: 1200,
    h: 630,
    html: card({
      accent: '#8ebbe8',
      accentRgb: [142 / 255, 187 / 255, 232 / 255],
      grad: 'linear-gradient(100deg, #cfe3f7, #8ebbe8 50%, #5f9bd6)',
      kicker: 'AI Engineer / Data Scientist',
      title: 'Enterprise AI that earns its place <span class="g">in production.</span>',
      sub: '',
      foot: ['AI Solutions Specialist · Vancouver, BC', 'johnbarn777.github.io'],
    }),
  },
  {
    out: 'og-tutoring.png',
    w: 1200,
    h: 630,
    html: card({
      accent: '#8fcfb0',
      accentRgb: [143 / 255, 207 / 255, 176 / 255],
      grad: 'linear-gradient(100deg, #d3efe1, #8fcfb0 50%, #5fae8a)',
      kicker: 'Tutoring · Burnaby, BC',
      title: 'Mathematics, Physics <span class="g">&amp;</span> Computer Science Tutor',
      sub: 'Grade 2 through first-year university. Six years, four languages.',
      foot: ['BC curriculum · AP · SAT · JEE', 'johnbarn777.github.io/tutoring'],
    }),
  },
  { out: 'apple-touch-icon.png', w: 180, h: 180, html: icon(180, false) },
  { out: 'favicon.png', w: 32, h: 32, html: icon(32, true), transparent: true },
];

const dir = mkdtempSync(join(tmpdir(), 'og-'));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
for (const job of jobs) {
  const file = join(dir, job.out.replace('.png', '.html'));
  writeFileSync(file, job.html);
  const page = await browser.newPage({ viewport: { width: job.w, height: job.h }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(file).href);
  await page.evaluate(() => document.fonts.ready);
  if (job.html.includes('id="bg"')) await page.waitForSelector('body[data-ready]');
  const png = await page.screenshot({ omitBackground: !!job.transparent });
  await page.close();
  // Palette PNGs are about a fifth of the size and look identical for these flat designs.
  const out = job.w > 200 ? await sharp(png).png({ palette: true, quality: 92, effort: 10, compressionLevel: 9 }).toBuffer() : png;
  writeFileSync(pub(job.out), out);
  console.log('wrote public/' + job.out);
}
await browser.close();
