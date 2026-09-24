/**
 * A small terminal, loaded only when someone asks for it. It borrows the shape of
 * Claude Code: slash commands with a live menu, a spinner while it "thinks", and
 * ⏺ / ⎿ for replies and tool output. There is no model behind it, only a script.
 */

type Line = string | { html: string };
type Result = Line[] | void | Promise<Line[] | void>;

interface Command {
  help: string;
  usage?: string;
  hidden?: boolean;
  aliases?: string[];
  run: (args: string[]) => Result;
}

const EMAIL = 'yohannvinod@gmail.com';
const REPO = 'https://github.com/johnbarn777/johnbarn777.github.io';

const sections = ['work', 'how', 'experience', 'projects', 'websites', 'about', 'contact'];

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms: number) => new Promise((r) => window.setTimeout(r, reduceMotion() ? Math.min(ms, 150) : ms));
const openedAt = performance.now();

/** Assistant reply: a ⏺ on the first line, the rest indented under it. */
const say = (...lines: Line[]): Line[] =>
  lines.map((l, i) => {
    const pad = i === 0 ? '<span class="t-dot">⏺</span> ' : '  ';
    return { html: pad + (typeof l === 'string' ? esc(l) : l.html) };
  });

/** Tool call: ⏺ Name(arg), then output under ⎿. */
const tool = (name: string, arg: string, lines: Line[]): Line[] => [
  { html: `<span class="t-dot t-dot-tool">⏺</span> <b>${esc(name)}</b>(${esc(arg)})` },
  ...lines.map((l, i) => ({
    html: (i === 0 ? '  <span class="t-dim">⎿</span>  ' : '     ') + (typeof l === 'string' ? esc(l) : l.html),
  })),
];

const eggs = () => import('./eggs');

const commands: Record<string, Command> = {
  help: {
    help: 'show this list',
    run: () => [
      { html: '<b>Commands</b>' },
      ...Object.entries(commands)
        .filter(([, c]) => !c.hidden)
        .map(([name, c]) => ({
          html: `  <span class="t-cmd">/${esc(name)}</span>${' '.repeat(Math.max(1, 13 - name.length))}<span class="t-dim">${esc(c.help)}</span>`,
        })),
      '',
      { html: '<span class="t-dim">Type / for the menu. Tab completes, ↑ ↓ walk history, ? for shortcuts.</span>' },
      { html: '<span class="t-dim">There are a few secrets in here. /eggs if you give up.</span>' },
    ],
  },
  whoami: {
    help: 'who is this guy',
    run: () =>
      say(
        { html: '<b>Yohann Pittappillil</b>' },
        'AI Solutions Specialist at Mark Anthony Group, Vancouver, BC.',
        'Builds enterprise AI that earns its place in production.',
      ),
  },
  ls: {
    help: 'list sections of this site',
    run: () => tool('Bash', 'ls ~/portfolio', [sections.map((s) => `${s}/`).join('  ') + '  tutoring/']),
  },
  cd: {
    help: 'jump to a section',
    usage: '<section>',
    aliases: ['goto'],
    run: (args) => {
      const target = (args[0] ?? '').replace(/\/$/, '').replace(/^~?\/?/, '');
      if (!target || target === '~') return say('Usage: /cd <section>. Try /ls.');
      if (target === 'tutoring') {
        close();
        window.location.href = '/tutoring';
        return;
      }
      if (target === 'home' || target === '..') {
        close();
        window.location.href = '/';
        return;
      }
      if (!sections.includes(target)) return say(`cd: no such section: ${target}`);
      close();
      const el = document.getElementById(target);
      if (el) el.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth' });
      else window.location.href = `/#${target}`;
    },
  },
  principles: {
    help: 'how I work, in four lines',
    run: () =>
      say(
        '1. Simplest thing that works.',
        '2. Prove it before you pick it.',
        '3. Respect the budget.',
        '4. Leave the team able to run it.',
      ),
  },
  eval: {
    help: 'rerun the benchmark that settled the architecture',
    run: async () => {
      await think(1400, 'Evaluating');
      return [
        ...tool('Bash', 'run-eval --suite list-every-x --designs agent,search', [
          'scoring: did the answer include everything it should have?',
          '',
          'agent    ████████████████████  all of them',
          'search   ████░░░░░░░░░░░░░░░░  about a fifth',
        ]),
        '',
        ...say({ html: '<span class="t-good">Verdict: ship the agent.</span>' }),
      ];
    },
  },
  contact: {
    help: 'how to reach me',
    run: () =>
      say(
        { html: `email     <a href="mailto:${EMAIL}">${EMAIL}</a>` },
        { html: 'linkedin  <a href="https://linkedin.com/in/yohannp">linkedin.com/in/yohannp</a>' },
        { html: 'github    <a href="https://github.com/johnbarn777">github.com/johnbarn777</a>' },
      ),
  },
  hire: {
    help: 'the fast path',
    aliases: ['sudo'],
    run: async (args) => {
      const joined = args.join(' ').toLowerCase();
      if (joined.startsWith('rm')) return say('Permission denied. Also, rude.');
      await think(900, 'Escalating');
      window.setTimeout(() => {
        window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent("Let's work together")}`;
      }, 1100);
      return tool('Bash', 'sudo hire yohann', [
        '[sudo] password for recruiter: ********',
        { html: '<span class="t-good">Access granted.</span> Opening a new email…' },
      ]);
    },
  },
  theme: {
    help: 'light, dark, spidey, or sparta',
    usage: 'light | dark | spidey | sparta',
    run: (args) => {
      const t = args[0];
      if (t === 'spidey' || t === 'spider-man' || t === 'spiderman') return commands.spidey.run([]);
      if (t === 'sparta' || t === 'kratos') return commands.sparta.run([]);
      if (t !== 'light' && t !== 'dark') return say('Usage: /theme light | dark | spidey | sparta');
      document.dispatchEvent(new CustomEvent('settheme', { detail: t }));
      return say(`Theme set to ${t}.`);
    },
  },
  status: {
    help: 'what this session is running on',
    run: () => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const kb = performance
        .getEntriesByType('resource')
        .concat(nav ? [nav] : [])
        .reduce((sum, e) => sum + ((e as PerformanceResourceTiming).transferSize || 0), 0);
      const theme = document.documentElement.dataset.theme ?? 'system';
      return [
        { html: '<b>Status</b>' },
        `  model         yohann-1 (the only one)`,
        `  location      Vancouver, BC`,
        `  theme         ${theme}${document.documentElement.hasAttribute('data-spidey') ? ' + spidey' : ''}${document.documentElement.hasAttribute('data-sparta') ? ' + ghost of sparta' : ''}`,
        `  trackers      0`,
        `  transferred   ${kb ? `${Math.max(1, Math.round(kb / 1024))} KB` : 'from cache'}`,
        `  uptime        ${Math.round((performance.now() - openedAt) / 1000)}s`,
      ];
    },
  },
  doctor: {
    help: 'check this page is healthy',
    run: async () => {
      await think(1100, 'Diagnosing');
      const gl = !!document.querySelector('#bg-canvas.is-ready');
      const check = (ok: boolean, label: string, note = '') =>
        ({ html: `${ok ? '<span class="t-good">✓</span>' : '<span class="t-warn">!</span>'} ${esc(label)}${note ? ` <span class="t-dim">${esc(note)}</span>` : ''}` }) as Line;
      return tool('Doctor', 'portfolio', [
        check(document.fonts?.check?.('16px Inter') ?? true, 'Fonts loaded'),
        check(gl, 'WebGL background', gl ? '' : '(off, still frame, or reduced motion)'),
        check(true, 'Reduced motion respected', reduceMotion() ? '(on)' : '(off)'),
        check(true, 'Trackers', '(none, on purpose)'),
        check(navigator.onLine, 'Network'),
      ]);
    },
  },
  cost: {
    help: 'what this session cost you',
    run: () => {
      const s = Math.round((performance.now() - openedAt) / 1000);
      return [
        `Total cost:            $0.00`,
        `Total duration (wall): ${Math.floor(s / 60)}m ${s % 60}s`,
        `Tokens:                0 in, 0 out (it's a static site)`,
        { html: '<span class="t-dim">Hiring him costs more. Worth it. /hire</span>' },
      ];
    },
  },
  model: {
    help: 'switch models',
    run: () =>
      say(
        'Available models:',
        { html: '  <span class="t-good">●</span> yohann-1   <span class="t-dim">(default, only option, not rate limited)</span>' },
      ),
  },
  init: {
    help: 'write a YOHANN.md for this repo',
    run: async () => {
      await think(1300, 'Reading codebase');
      return [
        ...tool('Write', 'YOHANN.md', [
          '# YOHANN.md',
          '- Build the simplest thing that works, then measure it.',
          '- Evals before opinions.',
          '- Ship with docs the team can run without him.',
          '- Coffee is a dependency. Do not remove.',
        ]),
        '',
        ...say('Created YOHANN.md. (In memory only. This site is static.)'),
      ];
    },
  },
  compact: {
    help: 'summarize and clear the history',
    run: async () => {
      const n = history.length;
      const fav = mostUsed();
      await think(900, 'Compacting');
      out.innerHTML = '';
      return say(
        { html: '<span class="t-dim">Conversation compacted.</span>' },
        `Summary: ${n} command${n === 1 ? '' : 's'} run${fav ? `, mostly ${fav}` : ''}. Still no model in here.`,
      );
    },
  },
  bug: {
    help: 'report a bug on this site',
    run: () =>
      say({ html: `Found one? Open an issue: <a href="${REPO}/issues/new">github.com/johnbarn777/…/issues</a>` }),
  },
  spidey: {
    help: 'toggle Spider-Man mode',
    aliases: ['spiderman', 'spider-man', 'thwip'],
    hidden: true,
    run: async () => {
      close();
      (await eggs()).toggleSpidey();
    },
  },
  kratos: {
    help: 'BOY.',
    aliases: ['boy', 'gow', 'godofwar'],
    hidden: true,
    run: async () => {
      close();
      (await eggs()).playKratos();
    },
  },
  sparta: {
    help: 'toggle Ghost of Sparta mode',
    aliases: ['ghost', 'ghostofsparta'],
    hidden: true,
    run: async () => {
      close();
      (await eggs()).toggleSparta();
    },
  },
  eggs: {
    help: 'hints for the secrets',
    hidden: true,
    run: () =>
      say(
        'Things to try:',
        '  • press Shift five times, fast',
        '  • type "boy" anywhere on the page, then close the quote',
        '  • in either mode, click empty space',
        '  • /spidey and /sparta, if you want the shortcut',
        '  • /coffee, /vim, /sudo rm -rf /',
      ),
  },
  coffee: {
    help: 'brew',
    hidden: true,
    run: async () => {
      await think(1200, 'Brewing');
      return say('HTTP 418: I’m a teapot. Chai it is.');
    },
  },
  vim: { help: '', hidden: true, run: () => say('You are now stuck in vim. Kidding. Press Esc to leave.') },
  rm: { help: '', hidden: true, run: () => say('rm: this site is static. There is nothing to delete.') },
  clear: { help: 'clear the screen', run: () => void (out.innerHTML = '') },
  exit: { help: 'close the terminal', run: () => void close() },
};

/** Alias → canonical name. */
const lookup = new Map<string, string>();
for (const [name, c] of Object.entries(commands)) {
  lookup.set(name, name);
  c.aliases?.forEach((a) => lookup.set(a, name));
}

/** Plain-text prompts get a scripted reply. No model, only pattern matching. */
const replies: [RegExp, () => Result][] = [
  [/\b(hire|hiring|job|role|recruit\w*|resume|cv)\b/i, () => say('Short version: he is open to a conversation.', 'Run /hire to start one, or /contact for the details.')],
  [/\b(spider|spidey|peter|parker|miles|web|thwip)\b/i, () => say('With great power comes great responsibility.', 'Try pressing Shift five times, fast.')],
  [/\b(kratos|boy|atreus|god of war|leviathan|sparta\w*)\b/i, () => say('BOY. Type it on the page, or try /sparta.')],
  [/\b(claude|gpt|llm|model|ai|are you real)\b/i, () => say('No model behind this one. It is a few hundred lines of TypeScript and some regexes.', 'Honestly a decent eval baseline.')],
  [/\b(who|about|yohann)\b/i, () => commands.whoami.run([])],
  [/\b(joke|funny)\b/i, () => say('There are two hard problems in AI: evals, naming things, and off-by-one errors.')],
  [/\b(42|meaning of life)\b/i, () => say('42. Verified against the eval set.')],
  [/^(hi|hello|hey|yo|sup|hiya)\b/i, () => say('Hey! I only know a few things. /help lists them.')],
  [/\b(thanks|thank you|ty)\b/i, () => say('Anytime.')],
];

let dialog: HTMLDialogElement;
let out: HTMLElement;
let input: HTMLInputElement;
let menu: HTMLElement;
let hint: HTMLElement;
const history: string[] = [];
let hIndex = 0;
let booted = false;
let busy = false;
let menuItems: string[] = [];
let menuIndex = 0;

function print(lines: Line[], cls = '') {
  for (const line of lines) {
    const div = document.createElement('div');
    div.className = `t-line ${cls}`.trim();
    if (typeof line === 'string') div.textContent = line || ' ';
    else div.innerHTML = line.html;
    out.appendChild(div);
  }
  out.scrollTop = out.scrollHeight;
}

const glyphs = ['·', '✢', '✳', '✶', '✻', '✽', '✻', '✶', '✳', '✢'];
const verbs = ['Pondering', 'Noodling', 'Percolating', 'Ruminating', 'Clauding', 'Mulling', 'Simmering'];

/** The spinner line, shown while a reply is "thinking". */
async function think(ms: number, verb = verbs[Math.floor(Math.random() * verbs.length)]) {
  const div = document.createElement('div');
  div.className = 't-line t-spin';
  div.setAttribute('aria-hidden', 'true');
  out.appendChild(div);
  out.scrollTop = out.scrollHeight;
  let i = 0;
  const started = performance.now();
  const tick = () => {
    const s = Math.floor((performance.now() - started) / 1000);
    div.innerHTML = `<span class="t-glyph">${glyphs[i++ % glyphs.length]}</span> ${verb}… <span class="t-dim">(${s}s · esc to close)</span>`;
  };
  tick();
  const id = reduceMotion() ? 0 : window.setInterval(tick, 110);
  await wait(ms);
  window.clearInterval(id);
  div.remove();
}

function mostUsed() {
  const counts = new Map<string, number>();
  for (const h of history) {
    const name = h.replace(/^\//, '').split(/\s+/)[0];
    if (name !== 'compact') counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  let best = '';
  let max = 0;
  counts.forEach((n, k) => {
    if (n > max) [best, max] = [k, n];
  });
  return best ? `/${best}` : '';
}

async function run(raw: string) {
  const cmd = raw.trim();
  hideMenu();
  print([{ html: `<span class="t-prompt">&gt;</span> ${esc(cmd)}` }], 't-echo');
  if (!cmd) return;
  history.push(cmd);
  hIndex = history.length;

  busy = true;
  input.setAttribute('aria-busy', 'true');
  try {
    const res = await dispatch(cmd);
    if (res) print(res);
  } finally {
    busy = false;
    input.removeAttribute('aria-busy');
    if (dialog.open) input.focus();
  }
}

async function dispatch(cmd: string): Promise<Line[] | void> {
  if (cmd === '?') return shortcuts();

  // `!ls` runs "bash mode", like Claude Code. Same commands, shell flavoured.
  const bang = cmd.startsWith('!');
  const slash = cmd.startsWith('/');
  const body = bang || slash ? cmd.slice(1) : cmd;
  const [first, ...args] = body.split(/\s+/);
  const name = lookup.get(first.toLowerCase());

  if (name) return commands[name].run(args);
  if (slash) return say(`Unknown command: /${first}. Try /help.`);
  if (bang) return tool('Bash', body, [`${first}: command not found`]);

  const hit = replies.find(([re]) => re.test(cmd));
  await think(700 + Math.random() * 700);
  if (hit) return hit[1]();
  return say("I'm a scripted terminal, not a model, so that one's beyond me.", 'Try /help for what I can do.');
}

function shortcuts(): Line[] {
  return [
    { html: '<b>Shortcuts</b>' },
    '  /            command menu',
    '  !            bash mode (!ls, !whoami)',
    '  tab          complete',
    '  ↑ ↓          history, or move in the menu',
    '  esc          close',
    '  `            open this from anywhere',
  ];
}

/* ---------- Slash menu ---------- */

function matches(prefix: string) {
  const p = prefix.toLowerCase();
  return Object.keys(commands).filter((n) => !commands[n].hidden && n.startsWith(p));
}

function updateMenu() {
  const v = input.value;
  const m = /^\/(\S*)$/.exec(v);
  if (!m) return hideMenu();
  const items = matches(m[1]);
  if (!items.length) return hideMenu();
  if (items.join() !== menuItems.join()) menuIndex = 0;
  menuItems = items;
  menu.innerHTML = items
    .map(
      (n, i) =>
        `<li role="option" id="t-opt-${n}" data-cmd="${n}" aria-selected="${i === menuIndex}"><span class="t-cmd">/${n}${
          commands[n].usage ? ` <span class="t-dim">${esc(commands[n].usage!)}</span>` : ''
        }</span><span class="t-dim">${esc(commands[n].help)}</span></li>`,
    )
    .join('');
  menu.hidden = false;
  hint.hidden = true;
  input.setAttribute('aria-expanded', 'true');
  input.setAttribute('aria-activedescendant', `t-opt-${items[menuIndex]}`);
  menu.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
}

function hideMenu() {
  if (!menu) return;
  menu.hidden = true;
  hint.hidden = false;
  menuItems = [];
  input.setAttribute('aria-expanded', 'false');
  input.removeAttribute('aria-activedescendant');
}

const menuOpen = () => menu && !menu.hidden && menuItems.length > 0;

function pick(i = menuIndex) {
  const name = menuItems[i];
  if (!name) return;
  input.value = `/${name}${commands[name].usage ? ' ' : ''}`;
  hideMenu();
  return name;
}

function complete() {
  if (menuOpen()) return void pick();
  const parts = input.value.split(/\s+/);
  const cmd = parts[0].replace(/^[/!]/, '');
  if (parts.length === 1) {
    const hits = matches(cmd);
    if (hits.length === 1) input.value = `/${hits[0]} `;
    else if (hits.length > 1) print([hits.map((h) => `/${h}`).join('  ')]);
  } else if (lookup.get(cmd) === 'cd') {
    const hits = [...sections, 'tutoring'].filter((s) => s.startsWith(parts[1] ?? ''));
    if (hits.length === 1) input.value = `${parts[0]} ${hits[0]}`;
  }
}

function close() {
  hideMenu();
  if (dialog?.open) dialog.close();
}

function boot() {
  dialog = document.getElementById('terminal') as HTMLDialogElement;
  out = dialog.querySelector('[data-term-out]')!;
  input = dialog.querySelector('[data-term-input]')!;
  menu = dialog.querySelector('[data-term-menu]')!;
  hint = dialog.querySelector('[data-term-hint]')!;
  const form = dialog.querySelector('form')!;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (busy) return;
    // Enter on a partial command runs the highlighted menu item.
    if (menuOpen() && !lookup.has(input.value.slice(1).toLowerCase())) {
      const name = pick();
      if (name && commands[name].usage) return;
    }
    const v = input.value;
    input.value = '';
    run(v);
  });
  input.addEventListener('input', updateMenu);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      complete();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const d = e.key === 'ArrowUp' ? -1 : 1;
      if (menuOpen()) {
        menuIndex = (menuIndex + d + menuItems.length) % menuItems.length;
        updateMenu();
        return;
      }
      hIndex = Math.max(0, Math.min(history.length, hIndex + d));
      input.value = history[hIndex] ?? '';
    }
  });
  // Esc closes the menu first, then the terminal.
  dialog.addEventListener('cancel', (e) => {
    if (menuOpen()) {
      e.preventDefault();
      hideMenu();
    }
  });
  menu.addEventListener('mousedown', (e) => e.preventDefault());
  menu.addEventListener('click', (e) => {
    const li = (e.target as HTMLElement).closest<HTMLElement>('[data-cmd]');
    if (!li) return;
    const name = li.dataset.cmd!;
    if (commands[name].usage) {
      input.value = `/${name} `;
      hideMenu();
      input.focus();
    } else {
      input.value = '';
      run(`/${name}`);
    }
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
    else if (!(e.target as HTMLElement).closest('a, button, li')) input.focus();
  });
  dialog.querySelector('[data-term-close]')?.addEventListener('click', close);

  print([
    {
      html: `<div class="t-welcome"><div><span class="t-star">✻</span> Welcome to <b>Yohann Code</b>!</div><div class="t-dim">/help for help, /status for your current setup</div><div class="t-dim">cwd: ~/portfolio</div></div>`,
    },
    '',
    { html: '<span class="t-dim">Tips for getting started:</span>' },
    { html: '<span class="t-dim">1. Type <span class="t-cmd">/</span> to see what this thing does</span>' },
    { html: '<span class="t-dim">2. Or just ask something. No promises, there is no model in here.</span>' },
    '',
  ]);
  booted = true;
}

export function openTerminal() {
  if (!booted) boot();
  if (!dialog.open) dialog.showModal();
  input.focus();
}
