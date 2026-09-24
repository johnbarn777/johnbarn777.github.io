/**
 * Easter eggs, loaded on first use.
 *
 * Spider-Man mode: Shift five times (or /spidey). A splash spins a web and draws the
 * emblem, then the site turns red and blue until you do it again. Lasts the session.
 *
 * Kratos: type "boy" (or /kratos). Embers, a rune ring, and one line of advice.
 */

import '../styles/eggs.css';

const root = document.documentElement;
const SVG = 'http://www.w3.org/2000/svg';
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, html = '') {
  const e = document.createElement(tag);
  e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

/* ==========================================================================
   Shared bits
   ========================================================================== */

let toastEl: HTMLElement | null = null;
let toastTimer = 0;

function toast(text: string) {
  if (!toastEl) {
    toastEl = el('div', 'egg-toast');
    toastEl.setAttribute('role', 'status');
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = text;
  toastEl.classList.add('is-on');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl?.classList.remove('is-on'), 3600);
}

type Pt = [number, number];

/**
 * A spider web as SVG path data: straight spokes from a centre, and rings that sag
 * a little toward the centre between spokes, the way real silk does.
 */
function web(cx: number, cy: number, radius: number, from: number, to: number, spokes: number, rings: number) {
  const full = Math.abs(to - from) >= Math.PI * 2 - 0.01;
  const n = full ? spokes : spokes - 1;
  const angles = Array.from({ length: spokes }, (_, i) => from + ((to - from) * i) / n);
  const at = (a: number, r: number): Pt => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  const f = (p: Pt) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;

  const spokePaths = angles.map((a) => `M${f([cx, cy])}L${f(at(a, radius))}`);
  const ringPaths: string[] = [];
  for (let k = 1; k <= rings; k++) {
    const r = (radius * k) / (rings + 0.6);
    let d = '';
    const count = full ? spokes : spokes - 1;
    for (let i = 0; i < count; i++) {
      const a1 = angles[i];
      const a2 = angles[(i + 1) % spokes];
      const p1 = at(a1, r);
      const p2 = at(a2, r);
      const mid = at((a1 + (full && i === spokes - 1 ? a2 + Math.PI * 2 : a2)) / 2, r * 0.86);
      d += `${i === 0 ? `M${f(p1)}` : ''}Q${f(mid)} ${f(p2)}`;
    }
    ringPaths.push(d);
  }
  return { spokes: spokePaths, rings: ringPaths };
}

function svgEl(tag: string, attrs: Record<string, string | number>) {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

/** Our own spider emblem: long upper legs, a dagger body. Not a trademark, just a spider. */
const SPIDER = `
  <g class="spx-legs" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path pathLength="1" d="M46 36 L30 24 L27 4"/>
    <path pathLength="1" d="M45 42 L22 36 L10 16"/>
    <path pathLength="1" d="M45 52 L22 60 L9 82"/>
    <path pathLength="1" d="M46 60 L31 80 L27 112"/>
    <path pathLength="1" d="M54 36 L70 24 L73 4"/>
    <path pathLength="1" d="M55 42 L78 36 L90 16"/>
    <path pathLength="1" d="M55 52 L78 60 L91 82"/>
    <path pathLength="1" d="M54 60 L69 80 L73 112"/>
  </g>
  <g class="spx-body">
    <ellipse pathLength="1" cx="50" cy="25" rx="6.5" ry="7.5"/>
    <path pathLength="1" d="M50 35 C59 37 61 50 57 61 L50 96 L43 61 C39 50 41 37 50 35 Z"/>
  </g>`;

/* ==========================================================================
   Spider-Man mode
   ========================================================================== */

let splashing = false;
let decor: HTMLElement | null = null;

export function toggleSpidey(on = !root.hasAttribute('data-spidey')) {
  if (splashing) return;
  if (reduce()) {
    applySpidey(on);
    return;
  }
  splashing = true;
  const overlay = on ? splashOn() : splashOff();
  document.body.appendChild(overlay);
  window.setTimeout(() => applySpidey(on), on ? 1350 : 380);
  window.setTimeout(
    () => {
      overlay.remove();
      splashing = false;
    },
    on ? 2500 : 900,
  );
}

function applySpidey(on: boolean) {
  root.toggleAttribute('data-spidey', on);
  try {
    if (on) sessionStorage.setItem('spidey', '1');
    else sessionStorage.removeItem('spidey');
  } catch {
    /* storage can be unavailable; the mode still applies to this page */
  }
  // The background shader re-reads its colours on this event.
  document.dispatchEvent(new CustomEvent('themechange'));
  if (on) mountSpidey();
  else unmountSpidey();
  toast(on ? 'Spider-Man mode. Shift five times (or /spidey) to swing back.' : 'Back to normal. Your friendly neighbourhood portfolio.');
}

function splashOn() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const overlay = el('div', 'spx');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.appendChild(el('div', 'spx-dots'));

  const svg = svgEl('svg', { class: 'spx-web', viewBox: `0 0 ${w} ${h}` });
  const { spokes, rings } = web(w / 2, h / 2, Math.hypot(w, h) / 2 + 20, 0, Math.PI * 2, 14, 7);
  spokes.forEach((d, i) => {
    const p = svgEl('path', { d, pathLength: 1, class: 'spx-spoke' });
    p.style.animationDelay = `${60 + i * 22}ms`;
    svg.appendChild(p);
  });
  rings.forEach((d, i) => {
    const p = svgEl('path', { d, pathLength: 1, class: 'spx-ring' });
    p.style.animationDelay = `${380 + i * 70}ms`;
    svg.appendChild(p);
  });
  overlay.appendChild(svg);

  overlay.appendChild(el('div', 'spx-emblem', `<svg viewBox="0 0 100 116">${SPIDER}</svg>`));
  overlay.appendChild(el('div', 'spx-thwip', 'THWIP!'));
  return overlay;
}

function splashOff() {
  const overlay = el('div', 'spx spx-off');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.appendChild(el('div', 'spx-dots'));
  return overlay;
}

export function mountSpidey() {
  if (decor) return;
  decor = el('div', 'spx-decor');
  decor.setAttribute('aria-hidden', 'true');

  // Corner webs, drawn once at a fixed size.
  for (const corner of ['tr', 'bl'] as const) {
    const s = 260;
    const svg = svgEl('svg', { class: `spx-corner spx-corner-${corner}`, viewBox: `0 0 ${s} ${s}` });
    const [cx, cy, a0] = corner === 'tr' ? [s, 0, Math.PI / 2] : [0, s, -Math.PI / 2];
    const { spokes, rings } = web(cx, cy, s * 0.98, a0, a0 + Math.PI / 2, 6, 5);
    [...spokes, ...rings].forEach((d) => svg.appendChild(svgEl('path', { d })));
    decor.appendChild(svg);
  }

  // A small spider on a thread, hanging from the top.
  const hang = el('div', 'spx-hang', `<i class="spx-thread"></i><svg viewBox="0 0 100 116">${SPIDER}</svg>`);
  decor.appendChild(hang);

  document.body.appendChild(decor);
  document.addEventListener('click', shootWeb);
}

function unmountSpidey() {
  decor?.remove();
  decor = null;
  document.removeEventListener('click', shootWeb);
}

/** Clicks on empty space shoot a web from the nearest bottom corner. */
function shootWeb(e: MouseEvent) {
  if (reduce() || e.button !== 0) return;
  const t = e.target as HTMLElement;
  if (t.closest('a, button, input, textarea, select, label, summary, dialog, [role="button"], [tabindex]:not([tabindex="-1"])')) return;
  if (window.getSelection()?.toString()) return;

  const w = window.innerWidth;
  const h = window.innerHeight;
  const { clientX: x, clientY: y } = e;
  const sx = x < w / 2 ? -10 : w + 10;
  const sy = h + 10;

  const svg = svgEl('svg', { class: 'spx-shot', viewBox: `0 0 ${w} ${h}`, 'aria-hidden': 'true' });
  svg.appendChild(svgEl('path', { d: `M${sx} ${sy}Q${(sx + x) / 2} ${(sy + y) / 2 + 40} ${x} ${y}`, pathLength: 1, class: 'spx-line' }));
  const splat = svgEl('g', { class: 'spx-splat' });
  const { spokes, rings } = web(x, y, 26, 0, Math.PI * 2, 8, 2);
  [...spokes, ...rings].forEach((d) => splat.appendChild(svgEl('path', { d })));
  svg.appendChild(splat);
  document.body.appendChild(svg);
  window.setTimeout(() => svg.remove(), 1500);
}

/* ==========================================================================
   Kratos
   ========================================================================== */

const QUOTE = 'We win because we are determined. Disciplined. Not because we feel ourselves superior.';

let kratosOpen = false;

export function playKratos() {
  if (kratosOpen) return;
  kratosOpen = true;
  const still = reduce();
  const previous = document.activeElement as HTMLElement | null;

  const overlay = el('div', `gow${still ? ' is-still' : ''}`);
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'A quote from Kratos, God of War');
  overlay.tabIndex = -1;

  const canvas = document.createElement('canvas');
  canvas.className = 'gow-embers';
  canvas.setAttribute('aria-hidden', 'true');

  const words = QUOTE.split(' ')
    .map((w, i) => {
      const em = /^(determined|disciplined)/i.test(w) ? ' gow-em' : '';
      return `<span class="gow-w${em}" style="--i:${i}">${w}</span>`;
    })
    .join(' ');
  const count = QUOTE.split(' ').length;

  overlay.innerHTML = `
    <div class="gow-flash" aria-hidden="true"></div>
    <div class="gow-stage" style="--n:${count}">
      <svg class="gow-sigil" viewBox="0 0 200 200" aria-hidden="true">
        <circle class="gow-ring" cx="100" cy="100" r="92" pathLength="1"/>
        <circle class="gow-runes" cx="100" cy="100" r="82"/>
        <circle class="gow-ring gow-ring-inner" cx="100" cy="100" r="72" pathLength="1"/>
        <path class="gow-omega" pathLength="1" d="M52 150 L84 150 L84 136 C58 126 46 104 52 80 C58 54 78 40 100 40 C122 40 142 54 148 80 C154 104 142 126 116 136 L116 150 L148 150"/>
      </svg>
      <figure class="gow-quote">
        <blockquote><p>${words}</p></blockquote>
        <figcaption>Kratos</figcaption>
      </figure>
      <p class="gow-hint">Press any key or tap to return</p>
    </div>`;
  overlay.prepend(canvas);
  document.body.appendChild(overlay);
  document.body.classList.add('gow-lock');
  overlay.focus({ preventScroll: true });

  const sigil = overlay.querySelector('.gow-sigil')!;
  const stopEmbers = still ? () => {} : embers(canvas, () => {
    const r = sigil.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  });
  const openedAt = performance.now();

  const close = () => {
    if (performance.now() - openedAt < 900) return;
    document.removeEventListener('keydown', onKey, true);
    overlay.removeEventListener('click', close);
    overlay.classList.add('is-leaving');
    window.setTimeout(
      () => {
        stopEmbers();
        overlay.remove();
        document.body.classList.remove('gow-lock');
        kratosOpen = false;
        previous?.focus?.({ preventScroll: true });
      },
      still ? 0 : 600,
    );
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Shift' || e.key === 'Tab') {
      if (e.key === 'Tab') e.preventDefault();
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    close();
  };
  document.addEventListener('keydown', onKey, true);
  overlay.addEventListener('click', close);
}

/** Rising embers, with a burst when the sigil lands. Returns a stop function. */
function embers(canvas: HTMLCanvasElement, origin: () => Pt) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;
  const size = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size();
  window.addEventListener('resize', size);

  type P = { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number; hue: number };
  const ps: P[] = [];
  const spawn = (x: number, y: number, speed: number): P => ({
    x,
    y,
    vx: (Math.random() - 0.5) * speed * 0.8,
    vy: -(0.4 + Math.random()) * speed,
    life: 0,
    max: 120 + Math.random() * 160,
    r: 0.6 + Math.random() * 2.2,
    hue: 8 + Math.random() * 30,
  });

  let burst = false;
  const burstAt = performance.now() + 1700;
  let last = performance.now();
  let raf = 0;

  const frame = (now: number) => {
    const dt = Math.min(3, (now - last) / 16.7);
    last = now;
    if (!burst && now >= burstAt) {
      burst = true;
      const [ox, oy] = origin();
      for (let i = 0; i < 140; i++) ps.push(spawn(ox + (Math.random() - 0.5) * 120, oy + (Math.random() - 0.5) * 60, 4));
    }
    if (ps.length < 110) ps.push(spawn(Math.random() * w, h + 10, 1.4));

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.life += dt;
      p.x += (p.vx + Math.sin((p.life + i) * 0.05) * 0.3) * dt;
      p.y += p.vy * dt;
      p.vy *= 0.995;
      const k = 1 - p.life / p.max;
      if (k <= 0 || p.y < -20) {
        ps.splice(i, 1);
        continue;
      }
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      g.addColorStop(0, `hsla(${p.hue}, 100%, 65%, ${0.9 * k})`);
      g.addColorStop(1, `hsla(${p.hue}, 100%, 50%, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', size);
  };
}
