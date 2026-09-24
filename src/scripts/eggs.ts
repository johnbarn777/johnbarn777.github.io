/**
 * Easter eggs, loaded on first use.
 *
 * Spider-Man mode: Shift five times (or /spidey). A splash spins a web and draws the
 * emblem, then the site turns red and blue until you do it again. Lasts the session.
 *
 * Kratos: type "boy" (or /kratos). Embers, a rune ring, and one line of advice. Closing
 * it leaves the site in Ghost of Sparta mode: ash and blood, the Blades of Chaos, and a
 * Leviathan Axe you can throw. Type "boy" again to rest. Only one mode at a time.
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

/**
 * The Spider-Verse emblem, redrawn as vectors: a sprayed ring, a bat-eared spider and
 * long legs that break out of the circle, with paint drips. Drawn in a 2000 x 1125 space
 * (the reference image) and cropped by the viewBox. Legs are tapered polygons so each one
 * can grow out of the body on its own.
 */
type Leg = [Pt, Pt, Pt]; // body joint, knee, tip (right side; the left side mirrors it)
const LEGS: Leg[] = [
  [[1040, 505], [1180, 455], [1062, 82]],
  [[1075, 535], [1262, 462], [1150, 142]],
  [[1080, 590], [1282, 590], [1165, 985]],
  [[1045, 615], [1192, 688], [1075, 1045]],
];

function taper(a: Pt, b: Pt, wa: number, wb: number) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) / 2;
  const ny = (dx / len) / 2;
  const p = (q: Pt, w: number, side: number) => `${(q[0] + nx * w * side).toFixed(0)},${(q[1] + ny * w * side).toFixed(0)}`;
  return `${p(a, wa, 1)} ${p(b, wb, 1)} ${p(b, wb, -1)} ${p(a, wa, -1)}`;
}

function legShape([body, knee, tip]: Leg) {
  return `<polygon points="${taper(body, knee, 30, 40)}"/><circle cx="${knee[0]}" cy="${knee[1]}" r="20"/><polygon points="${taper(knee, tip, 40, 3)}"/>`;
}

const mirror = (leg: Leg): Leg => leg.map(([x, y]) => [2000 - x, y]) as Leg;

function spiderMark(withRing: boolean, id: string) {
  const legs = LEGS.flatMap((leg, i) => [
    `<g class="spx-leg" style="--i:${i};transform-origin:${leg[0][0]}px ${leg[0][1]}px">${legShape(leg)}</g>`,
    `<g class="spx-leg" style="--i:${i};transform-origin:${2000 - leg[0][0]}px ${leg[0][1]}px">${legShape(mirror(leg))}</g>`,
  ]).join('');
  const ring = withRing
    ? `<ellipse class="spx-ring-mark" cx="1005" cy="555" rx="372" ry="368" pathLength="1"/>`
    : '';
  const viewBox = withRing ? '560 60 880 1010' : '700 60 600 1000';
  return `<svg viewBox="${viewBox}" aria-hidden="true">
    <defs><filter id="${id}" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="7"/>
      <feDisplacementMap in="SourceGraphic" scale="9"/>
    </filter></defs>
    <g class="spx-mark" filter="url(#${id})">
      ${ring}
      ${legs}
      <g class="spx-core">
        <path d="M958 472 C952 432 962 404 974 384 L990 424 L1010 424 L1026 384 C1038 404 1048 432 1042 472 Z"/>
        <path d="M1000 468 C1070 470 1105 520 1100 570 C1096 615 1062 650 1030 655 L1020 690 L1010 668 L1004 700 L992 668 L975 745 L968 660 C935 650 902 615 900 570 C896 520 930 470 1000 468 Z"/>
        <path class="spx-drip" d="M766 470 h10 l-2 50 q-3 6 -6 0 Z"/>
        <path class="spx-drip" d="M960 650 h10 l-1 90 q-4 7 -8 0 Z"/>
      </g>
    </g>
  </svg>`;
}

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

function remember(key: string, on: boolean) {
  try {
    if (on) sessionStorage.setItem(key, '1');
    else sessionStorage.removeItem(key);
  } catch {
    /* storage can be unavailable; the mode still applies to this page */
  }
}

function applySpidey(on: boolean, quiet = false) {
  if (on && root.hasAttribute('data-sparta')) applySparta(false, true);
  root.toggleAttribute('data-spidey', on);
  remember('spidey', on);
  // The background shader re-reads its colours on this event.
  document.dispatchEvent(new CustomEvent('themechange'));
  if (on) mountSpidey();
  else unmountSpidey();
  if (!quiet) toast(on ? 'Spider-Man mode. Shift five times (or /spidey) to swing back.' : 'Back to normal. Your friendly neighbourhood portfolio.');
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

  overlay.appendChild(el('div', 'spx-emblem', spiderMark(true, 'spx-spray')));
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
  const hang = el('div', 'spx-hang', `<i class="spx-thread"></i>${spiderMark(false, 'spx-spray-sm')}`);
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

/** The quote, then Ghost of Sparta mode. If the mode is already on, this turns it off. */
export function playKratos() {
  if (root.hasAttribute('data-sparta')) return toggleSparta(false);
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
      <p class="gow-hint">Press any key or tap to rise</p>
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
    applySparta(true);
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

/* ==========================================================================
   Ghost of Sparta mode
   ========================================================================== */

/** Leviathan Axe, head up: a bearded blade with a frost edge, a spike, a wrapped haft. */
const AXE = `
  <path class="gos-haft" d="M20 14h5v80h-5z"/>
  <path class="gos-wrap" d="M19.5 54h6M19.5 59h6M19.5 64h6M19.5 69h6M19.5 74h6M19.5 79h6"/>
  <path class="gos-pommel" d="M18 91h9l-1.5 7h-6z"/>
  <path class="gos-steel" d="M20 16 L11 18 L6 23 L11 28 L20 30 Z"/>
  <path class="gos-steel" d="M25 11 C33 9 40 5 44 0 C42 13 43 27 41 38 C40.5 45 42.5 51 45 56 C37 52 31 46 29 40 L25 38 Z"/>
  <path class="gos-edge" d="M44 0 C42 13 43 27 41 38 C40.5 45 42.5 51 45 56"/>
  <circle class="gos-rune" cx="34" cy="24" r="5"/>
  <path class="gos-rune" d="M34 19v10M29 24h10"/>
  <rect class="gos-steel" x="18" y="8" width="9" height="32" rx="2"/>`;

/** One Blade of Chaos: a hooked, serrated blade, a short grip and a ring for the chain. */
const BLADE = `
  <path class="gos-blade" d="M21 46 C19 34 20 22 26 12 C28 8 30 5 29 1 C35 8 36 18 32 26 L34 28 L30 31 L31 34 C29 38 26 42 25 46 Z"/>
  <path class="gos-glow" d="M29 1 C35 8 36 18 32 26 L34 28 L30 31 L31 34 C29 38 26 42 25 46"/>
  <path class="gos-guard" d="M14 46h18l-2 4H16z"/>
  <path class="gos-grip" d="M20 50h6v14h-6z"/>
  <circle class="gos-ring" cx="23" cy="68" r="3.5"/>`;

/** Kratos's red tattoo: down from the top, around the eye, and on down the body. */
const TATTOO = `<path d="M18 0 V70 C18 104 52 112 56 84 C59 62 34 58 32 78" /><path d="M18 70 V1000" />`;

const svgIcon = (inner: string, viewBox: string, cls: string) =>
  `<svg class="${cls}" viewBox="${viewBox}" aria-hidden="true">${inner}</svg>`;

let spartaDecor: HTMLElement | null = null;
let spartaBusy = false;
let axeFlying = false;

export function toggleSparta(on = !root.hasAttribute('data-sparta')) {
  if (on) return playKratos();
  if (spartaBusy) return;
  if (reduce()) return applySparta(false);
  spartaBusy = true;
  const ash = el('div', 'gos-ash');
  ash.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ash);
  window.setTimeout(() => applySparta(false), 420);
  window.setTimeout(() => {
    ash.remove();
    spartaBusy = false;
  }, 1000);
}

function applySparta(on: boolean, quiet = false) {
  if (on && root.hasAttribute('data-spidey')) applySpidey(false, true);
  root.toggleAttribute('data-sparta', on);
  remember('sparta', on);
  document.dispatchEvent(new CustomEvent('themechange'));
  if (on) mountSparta();
  else unmountSparta();
  if (!quiet) toast(on ? 'Ghost of Sparta. Click anywhere to throw the axe. Type "boy" to rest.' : 'The cycle ends here.');
}

export function mountSparta() {
  if (spartaDecor) return;
  spartaDecor = el('div', 'gos-decor');
  spartaDecor.setAttribute('aria-hidden', 'true');
  spartaDecor.innerHTML = `
    ${svgIcon(TATTOO, '0 0 64 1000', 'gos-tattoo')}
    <div class="gos-blades">
      ${svgIcon(BLADE, '0 0 46 74', 'gos-b gos-b-l')}
      ${svgIcon(BLADE, '0 0 46 74', 'gos-b gos-b-r')}
      <svg class="gos-chain" viewBox="0 0 120 60" aria-hidden="true"><path d="M30 44 C42 60 78 60 90 44" pathLength="1"/></svg>
    </div>
    <div class="gos-axe">${svgIcon(AXE, '0 0 46 100', 'gos-axe-svg')}</div>`;
  document.body.appendChild(spartaDecor);
  document.addEventListener('click', throwAxe);
}

function unmountSparta() {
  spartaDecor?.remove();
  spartaDecor = null;
  document.removeEventListener('click', throwAxe);
}

/** Click on empty space: the axe leaves its corner, spins in, bites, and comes back. */
function throwAxe(e: MouseEvent) {
  if (reduce() || axeFlying || e.button !== 0 || !spartaDecor) return;
  const t = e.target as HTMLElement;
  if (t.closest('a, button, input, textarea, select, label, summary, dialog, [role="button"], [tabindex]:not([tabindex="-1"])')) return;
  if (window.getSelection()?.toString()) return;
  const home = spartaDecor.querySelector<HTMLElement>('.gos-axe');
  if (!home) return;

  axeFlying = true;
  const r = home.getBoundingClientRect();
  const ox = r.left + r.width / 2;
  const oy = r.top + r.height / 2;
  const dx = e.clientX - ox;
  const dy = e.clientY - oy;
  const rest = -35;
  const spin = dx < 0 ? -1080 : 1080;

  const fly = el('div', 'gos-fly', svgIcon(AXE, '0 0 46 100', 'gos-axe-svg'));
  fly.style.left = `${r.left}px`;
  fly.style.top = `${r.top}px`;
  fly.style.width = `${r.width}px`;
  fly.style.height = `${r.height}px`;
  document.body.appendChild(fly);
  home.classList.add('is-thrown');

  const out = fly.animate(
    [{ transform: `translate(0, 0) rotate(${rest}deg)` }, { transform: `translate(${dx}px, ${dy}px) rotate(${rest + spin}deg)` }],
    { duration: 420, easing: 'cubic-bezier(0.25, 0.1, 0.5, 1)', fill: 'forwards' },
  );
  out.onfinish = () => {
    frost(e.clientX, e.clientY);
    window.setTimeout(() => {
      const back = fly.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) rotate(${rest + spin}deg)` },
          { transform: `translate(0, 0) rotate(${rest}deg)` },
        ],
        { duration: 480, easing: 'cubic-bezier(0.5, 0, 0.75, 0)', fill: 'forwards' },
      );
      back.onfinish = () => {
        fly.remove();
        home.classList.remove('is-thrown');
        home.classList.add('is-caught');
        window.setTimeout(() => home.classList.remove('is-caught'), 400);
        axeFlying = false;
      };
    }, 650);
  };
}

/** A burst of ice where the axe lands. */
function frost(x: number, y: number) {
  const svg = svgEl('svg', { class: 'gos-frost', width: 120, height: 120, viewBox: '-60 -60 120 120', 'aria-hidden': 'true' });
  (svg as SVGElement).style.left = `${x - 60}px`;
  (svg as SVGElement).style.top = `${y - 60}px`;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
    const len = 22 + Math.random() * 30;
    svg.appendChild(svgEl('path', { d: `M0 0L${(Math.cos(a) * len).toFixed(1)} ${(Math.sin(a) * len).toFixed(1)}` }));
  }
  svg.appendChild(svgEl('circle', { r: 14 }));
  document.body.appendChild(svg);
  window.setTimeout(() => svg.remove(), 900);
}

/* ==========================================================================
   Theme picker (five clicks on a theme button, or /themes)
   ========================================================================== */

let picker: HTMLElement | null = null;
let pickerCleanup = () => {};

const baseTheme = () =>
  (root.dataset.theme ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) as 'light' | 'dark';
const mode = () => (root.hasAttribute('data-spidey') ? 'spidey' : root.hasAttribute('data-sparta') ? 'sparta' : 'standard');

/** Straight into Ghost of Sparta, with a flash of embers instead of the quote. */
function enterSparta() {
  if (reduce()) return applySparta(true);
  const flash = el('div', 'gos-ash gos-ember');
  flash.setAttribute('aria-hidden', 'true');
  document.body.appendChild(flash);
  window.setTimeout(() => applySparta(true), 420);
  window.setTimeout(() => flash.remove(), 1000);
}

export function openThemePicker(anchor?: HTMLElement | null) {
  if (picker) return closePicker();
  anchor ??= document.querySelector<HTMLElement>('header [data-theme-toggle]');
  const previous = document.activeElement as HTMLElement | null;

  picker = el('div', 'egg-picker');
  picker.setAttribute('role', 'dialog');
  picker.setAttribute('aria-label', 'Themes');
  picker.innerHTML = `
    <p class="egg-picker-title">Themes unlocked</p>
    <div class="egg-picker-base" role="group" aria-label="Light or dark">
      <button type="button" data-pick="light">Light</button>
      <button type="button" data-pick="dark">Dark</button>
    </div>
    <div class="egg-picker-modes" role="group" aria-label="Theme">
      <button type="button" data-pick="standard"><i class="egg-sw egg-sw-standard"></i>Standard</button>
      <button type="button" data-pick="spidey"><i class="egg-sw egg-sw-spidey"></i>Spider-Man</button>
      <button type="button" data-pick="sparta"><i class="egg-sw egg-sw-sparta"></i>Ghost of Sparta</button>
    </div>`;
  document.body.appendChild(picker);

  const place = () => {
    if (!picker) return;
    const r = anchor?.getBoundingClientRect();
    const w = picker.offsetWidth;
    const left = r ? Math.min(window.innerWidth - w - 16, Math.max(16, r.right - w)) : window.innerWidth - w - 16;
    const top = r ? Math.min(r.bottom + 8, window.innerHeight - picker.offsetHeight - 16) : 72;
    picker.style.left = `${left}px`;
    picker.style.top = `${Math.max(16, top)}px`;
  };
  const sync = () => {
    picker?.querySelectorAll<HTMLButtonElement>('[data-pick]').forEach((b) => {
      const v = b.dataset.pick;
      b.setAttribute('aria-pressed', String(v === baseTheme() || v === mode()));
    });
  };
  place();
  sync();

  picker.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-pick]');
    if (!b) return;
    const v = b.dataset.pick!;
    if (v === 'light' || v === 'dark') {
      document.dispatchEvent(new CustomEvent('settheme', { detail: v }));
      sync();
      return;
    }
    const now = mode();
    closePicker();
    if (v === now) return;
    if (v === 'spidey') toggleSpidey(true);
    else if (v === 'sparta') enterSparta();
    else if (now === 'spidey') toggleSpidey(false);
    else toggleSparta(false);
  });

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closePicker();
    }
  };
  const onDown = (e: PointerEvent) => {
    const t = e.target as HTMLElement;
    if (!picker?.contains(t) && !t.closest('[data-theme-toggle]')) closePicker();
  };
  document.addEventListener('keydown', onKey);
  document.addEventListener('pointerdown', onDown);
  window.addEventListener('resize', place);
  window.addEventListener('scroll', place, { passive: true });
  pickerCleanup = () => {
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('pointerdown', onDown);
    window.removeEventListener('resize', place);
    window.removeEventListener('scroll', place);
    previous?.focus?.({ preventScroll: true });
  };
  picker.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus({ preventScroll: true });
}

function closePicker() {
  picker?.remove();
  picker = null;
  pickerCleanup();
  pickerCleanup = () => {};
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
