/**
 * Live page stats for the "websites" section, read from the browser's own
 * Performance API. Nothing is sent anywhere.
 */

function measure() {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const res = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const bytes = (e: PerformanceResourceTiming) => e.encodedBodySize || e.transferSize || 0;

  let weight = nav ? bytes(nav) : 0;
  let js = 0;
  let thirdParty = 0;
  for (const r of res) {
    weight += bytes(r);
    if (r.initiatorType === 'script' || /\.m?js(\?|$)/.test(r.name)) js += bytes(r);
    try {
      if (new URL(r.name).origin !== location.origin) thirdParty += 1;
    } catch {
      /* ignore unparsable entries */
    }
  }
  const load = nav ? Math.round((nav.loadEventEnd || nav.domContentLoadedEventEnd) - nav.startTime) : NaN;
  return { load, weight: weight / 1024, js: js / 1024, thirdParty };
}

function countUp(el: HTMLElement, to: number, decimals = 0) {
  if (!Number.isFinite(to)) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
  if (reduce) {
    el.textContent = fmt(to);
    return;
  }
  const t0 = performance.now();
  const dur = 1100;
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - t, 4);
    el.textContent = fmt(to * e);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function initPerf() {
  const panel = document.querySelector<HTMLElement>('[data-perf-panel]');
  if (!panel || !('performance' in window)) return;

  const fill = () => {
    const m = measure();
    const set = (key: string, v: number, d = 0) => {
      const el = panel.querySelector<HTMLElement>(`[data-perf="${key}"]`);
      if (el) countUp(el, v, d);
    };
    set('load', m.load);
    set('weight', m.weight);
    set('js', m.js, 1);
    set('third', m.thirdParty);
    panel.classList.add('is-measured');
  };

  const whenLoaded = () => (document.readyState === 'complete' ? Promise.resolve() : new Promise<void>((r) => addEventListener('load', () => r(), { once: true })));

  const io = new IntersectionObserver(
    async (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      await whenLoaded();
      // Let loadEventEnd settle.
      setTimeout(fill, 0);
    },
    { threshold: 0.4 },
  );
  io.observe(panel);
}
