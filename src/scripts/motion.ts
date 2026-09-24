/**
 * Scroll-linked motion. Everything here is progressive enhancement: without
 * JavaScript, or with reduced motion, the page renders in its final state.
 */

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** Fade-and-rise elements as they enter the viewport. */
function initReveal() {
  const els = document.querySelectorAll<HTMLElement>('[data-reveal], [data-play]');
  if (!('IntersectionObserver' in window) || reduceMotion()) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.15 },
  );
  els.forEach((el) => io.observe(el));
}

/**
 * Elements with [data-progress] get a --p custom property from 0 to 1.
 *  - "hero":    0 at the top of the page, 1 once the element has scrolled away.
 *  - otherwise: 0 when the element's top reaches data-start (fraction of the
 *               viewport, default 0.85), 1 when its bottom reaches data-end
 *               (default 0.5).
 */
function initProgress() {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-progress]'));
  if (!els.length) return;
  if (reduceMotion()) {
    els.forEach((el) => el.style.setProperty('--p', el.dataset.progress === 'hero' ? '0' : '1'));
    return;
  }

  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;
      let p: number;
      if (el.dataset.progress === 'hero') {
        p = clamp(-r.top / Math.max(1, r.height));
      } else {
        const start = parseFloat(el.dataset.start ?? '0.85') * vh;
        const end = parseFloat(el.dataset.end ?? '0.5') * vh;
        p = clamp((start - r.top) / Math.max(1, r.height + start - end));
      }
      el.style.setProperty('--p', p.toFixed(4));
    }
  };
  const request = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };
  update();
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
}

/** Sticky "selected work" story: one visual stage, three steps of text. */
function initStory() {
  const story = document.querySelector<HTMLElement>('[data-story]');
  if (!story) return;
  const steps = Array.from(story.querySelectorAll<HTMLElement>('[data-step]'));
  const panels = Array.from(story.querySelectorAll<HTMLElement>('[data-panel]'));
  const dots = Array.from(story.querySelectorAll<HTMLElement>('[data-dot]'));
  const counter = story.querySelector<HTMLElement>('[data-counter]');

  const stage = story.querySelector<HTMLElement>('.stage-frame');
  let active = 0;
  let stageVisible = false;
  const play = () => {
    if (stageVisible) panels[active]?.querySelector('[data-visual]')?.classList.add('is-playing');
  };

  const activate = (i: number) => {
    if (i < 0) return;
    active = i;
    steps.forEach((s, j) => s.classList.toggle('is-active', i === j));
    panels.forEach((p, j) => {
      const on = i === j;
      p.classList.toggle('is-active', on);
      p.setAttribute('aria-hidden', String(!on));
    });
    dots.forEach((d, j) => d.classList.toggle('is-active', i === j));
    if (counter) counter.textContent = String(i + 1).padStart(2, '0');
    play();
  };
  activate(0);

  if (stage) {
    new IntersectionObserver(
      (entries) => {
        stageVisible = entries.some((e) => e.isIntersecting);
        play();
      },
      { threshold: 0.3 },
    ).observe(stage);
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) activate(steps.indexOf(entry.target as HTMLElement));
      }
    },
    { rootMargin: '-48% 0px -48% 0px' },
  );
  steps.forEach((s) => io.observe(s));

  // Inline visuals (small screens) play when they enter the viewport.
  const inline = story.querySelectorAll<HTMLElement>('[data-inline-visual] [data-visual]');
  const io2 = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-playing');
        io2.unobserve(entry.target);
      }
    },
    { threshold: 0.35 },
  );
  inline.forEach((v) => io2.observe(v));
}

/** Visuals outside the story (case study, etc.) play on entry. */
function initStandaloneVisuals() {
  const els = document.querySelectorAll<HTMLElement>('[data-visual][data-autoplay]');
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-playing');
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.35 },
  );
  els.forEach((el) => io.observe(el));
}

/** Header background on scroll, plus scrollspy for in-page nav links. */
function initNav() {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const links = new Map<string, HTMLAnchorElement[]>();
  document.querySelectorAll<HTMLAnchorElement>('[data-spy]').forEach((a) => {
    const id = a.dataset.spy!;
    links.set(id, [...(links.get(id) ?? []), a]);
  });
  const sections = [...links.keys()]
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => !!el);
  if (!sections.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const id = entry.target.id;
        links.forEach((as, key) =>
          as.forEach((a) => {
            if (key === id) a.setAttribute('aria-current', 'true');
            else a.removeAttribute('aria-current');
          }),
        );
      }
    },
    { rootMargin: '-40% 0px -55% 0px' },
  );
  sections.forEach((s) => io.observe(s));
}

/** Full-screen menu for small screens. */
function initMenu() {
  const btn = document.querySelector<HTMLButtonElement>('[data-menu-button]');
  const panel = document.querySelector<HTMLElement>('[data-menu]');
  if (!btn || !panel) return;
  const setOpen = (open: boolean) => {
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    panel.classList.toggle('is-open', open);
    panel.inert = !open;
    document.documentElement.classList.toggle('menu-open', open);
    if (open) panel.querySelector<HTMLElement>('a')?.focus({ preventScroll: true });
  };
  panel.inert = true;
  btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
  panel.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      btn.focus();
    }
  });
  matchMedia('(min-width: 900px)').addEventListener('change', (e) => {
    if (e.matches) setOpen(false);
  });
}

/** Theme toggle. Defaults to the system; an explicit choice is remembered. */
function initTheme() {
  const root = document.documentElement;
  const dark = matchMedia('(prefers-color-scheme: dark)');
  const current = () => (root.dataset.theme ?? (dark.matches ? 'dark' : 'light')) as 'light' | 'dark';
  const sync = () => {
    const t = current();
    document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((b) => {
      if (!b.textContent?.trim()) b.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      b.dataset.mode = t;
    });
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#0c0c0e' : '#fbfbfd');
  };
  const set = (t: 'light' | 'dark') => {
    root.dataset.theme = t;
    try {
      localStorage.setItem('theme-preference', t);
    } catch {
      /* storage can be unavailable; the choice still applies to this page */
    }
    sync();
    document.dispatchEvent(new CustomEvent('themechange', { detail: t }));
  };
  sync();
  dark.addEventListener('change', sync);
  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-theme-toggle]');
    if (btn) set(current() === 'dark' ? 'light' : 'dark');
  });
  document.addEventListener('settheme', (e) => set((e as CustomEvent).detail));
}

/** Copy-to-clipboard buttons. */
function initCopy() {
  document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
    const label = btn.querySelector<HTMLElement>('[data-copy-label]');
    const original = label?.textContent ?? '';
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy!);
        btn.classList.add('is-copied');
        if (label) label.textContent = 'Copied';
      } catch {
        window.location.href = `mailto:${btn.dataset.copy}`;
        return;
      }
      window.setTimeout(() => {
        btn.classList.remove('is-copied');
        if (label) label.textContent = original;
      }, 2000);
    });
  });
}

/** The terminal loads on demand: press ` anywhere, or use a [data-terminal-open] button. */
function initTerminalTrigger() {
  const open = async () => {
    const mod = await import('./terminal');
    mod.openTerminal();
  };
  document.addEventListener('keydown', (e) => {
    if (e.key !== '`' || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea, [contenteditable="true"], dialog')) return;
    e.preventDefault();
    open();
  });
  document.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-terminal-open]')) open();
  });
}

/**
 * Easter eggs. The listeners are tiny; the eggs themselves load on first use.
 * Shift five times fast toggles Spider-Man mode. Typing "boy" summons Kratos, and
 * Ghost of Sparta mode after him; typing it again ends that mode. Clicking a theme
 * button five times opens a picker with all of them.
 */
function initEggs() {
  const eggs = () => import('./eggs');
  if (document.documentElement.hasAttribute('data-spidey')) eggs().then((m) => m.mountSpidey());
  if (document.documentElement.hasAttribute('data-sparta')) eggs().then((m) => m.mountSparta());

  // Five quick clicks on a theme button open the theme picker. Five flips net out to
  // one, so flip back first and the picker opens on the theme you started with.
  let clicks = 0;
  let lastClick = 0;
  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-theme-toggle]');
    if (!btn) return;
    const now = performance.now();
    clicks = now - lastClick < 700 ? clicks + 1 : 1;
    lastClick = now;
    if (clicks < 5) return;
    clicks = 0;
    const back = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.dispatchEvent(new CustomEvent('settheme', { detail: back }));
    eggs().then((m) => m.openThemePicker(btn));
  });

  let shifts = 0;
  let lastShift = 0;
  let typed = '';
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Shift') {
      if (e.repeat) return;
      const now = performance.now();
      shifts = now - lastShift < 600 ? shifts + 1 : 1;
      lastShift = now;
      if (shifts >= 5) {
        shifts = 0;
        eggs().then((m) => m.toggleSpidey());
      }
      return;
    }
    shifts = 0;
    const t = e.target as HTMLElement;
    if (e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey) return;
    if (t.closest('input, textarea, select, [contenteditable="true"], dialog')) return;
    typed = (typed + e.key.toLowerCase()).slice(-3);
    if (typed === 'boy') {
      typed = '';
      eggs().then((m) => m.playKratos());
    }
  });
}

export function initMotion() {
  document.documentElement.classList.toggle('motion', !reduceMotion());
  initTheme();
  initReveal();
  initProgress();
  initStory();
  initStandaloneVisuals();
  initNav();
  initMenu();
  initCopy();
  initTerminalTrigger();
  initEggs();
}
