/**
 * A small terminal, loaded only when someone asks for it.
 */

type Line = string | { html: string };

const EMAIL = 'yohannvinod@gmail.com';

const sections = ['work', 'how', 'experience', 'projects', 'websites', 'about', 'contact'];

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const commands: Record<string, { help: string; run: (args: string[]) => Line[] | void }> = {
  help: {
    help: 'list commands',
    run: () => [
      'Available commands:',
      ...Object.entries(commands)
        .filter(([name]) => !hidden.has(name))
        .map(([name, c]) => `  ${name.padEnd(12)}${c.help}`),
      '',
      'Tip: Tab completes, ↑ and ↓ walk your history.',
    ],
  },
  whoami: {
    help: 'who is this guy',
    run: () => [
      'Yohann Pittappillil',
      'AI Solutions Specialist at Mark Anthony Group, Vancouver, BC.',
      'Builds enterprise AI that earns its place in production.',
    ],
  },
  ls: {
    help: 'list sections of this site',
    run: () => [sections.map((s) => `${s}/`).join('  ') + '  tutoring/'],
  },
  cd: {
    help: 'jump to a section, e.g. cd work',
    run: (args) => {
      const target = (args[0] ?? '').replace(/\/$/, '').replace(/^~?\/?/, '');
      if (!target || target === '~') return ['Usage: cd <section>. Try ls.'];
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
      if (!sections.includes(target)) return [`cd: no such section: ${target}`];
      close();
      const el = document.getElementById(target);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else window.location.href = `/#${target}`;
    },
  },
  principles: {
    help: 'how I work, in four lines',
    run: () => [
      '1. Simplest thing that works.',
      '2. Prove it before you pick it.',
      '3. Respect the budget.',
      '4. Leave the team able to run it.',
    ],
  },
  eval: {
    help: 'rerun the benchmark that settled the architecture',
    run: () => [
      '$ run-eval --suite list-every-x --designs agent,search',
      'scoring: did the answer include everything it should have?',
      '',
      'agent    ████████████████████  all of them',
      'search   ████░░░░░░░░░░░░░░░░  about a fifth',
      '',
      { html: '<span class="t-good">verdict: ship the agent.</span>' },
    ],
  },
  contact: {
    help: 'how to reach me',
    run: () => [
      { html: `email     <a href="mailto:${EMAIL}">${EMAIL}</a>` },
      { html: 'linkedin  <a href="https://linkedin.com/in/yohannp">linkedin.com/in/yohannp</a>' },
      { html: 'github    <a href="https://github.com/johnbarn777">github.com/johnbarn777</a>' },
    ],
  },
  theme: {
    help: 'theme light | dark',
    run: (args) => {
      const t = args[0];
      if (t !== 'light' && t !== 'dark') return ['Usage: theme light | theme dark'];
      document.dispatchEvent(new CustomEvent('settheme', { detail: t }));
      return [`Theme set to ${t}.`];
    },
  },
  sudo: {
    help: 'try: sudo hire yohann',
    run: (args) => {
      const joined = args.join(' ').toLowerCase();
      if (/^hire( yohann)?$/.test(joined)) {
        window.setTimeout(() => {
          window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent("Let's work together")}`;
        }, 1100);
        return ['[sudo] password for recruiter: ********', 'Access granted. Opening a new email…'];
      }
      if (joined.startsWith('rm')) return ['Permission denied. Also, rude.'];
      return ['sudo: that one needs a meeting first.'];
    },
  },
  clear: { help: 'clear the screen', run: () => void (out.innerHTML = '') },
  exit: { help: 'close the terminal', run: () => void close() },
};

const hidden = new Set(['rm', 'vim', 'exit']);
commands.rm = { help: '', run: () => ['rm: this site is static. There is nothing to delete.'] };
commands.vim = { help: '', run: () => ['You are now stuck in vim. Kidding. Press Esc to leave.'] };

let dialog: HTMLDialogElement;
let out: HTMLElement;
let input: HTMLInputElement;
const history: string[] = [];
let hIndex = 0;
let booted = false;

function print(lines: Line[], cls = '') {
  for (const line of lines) {
    const div = document.createElement('div');
    div.className = `t-line ${cls}`.trim();
    if (typeof line === 'string') div.textContent = line || ' ';
    else div.innerHTML = line.html;
    out.appendChild(div);
  }
  out.scrollTop = out.scrollHeight;
}

function run(raw: string) {
  const cmd = raw.trim();
  print([{ html: `<span class="t-prompt">~ $</span> ${esc(cmd)}` }], 't-echo');
  if (!cmd) return;
  history.push(cmd);
  hIndex = history.length;
  const [name, ...args] = cmd.split(/\s+/);
  const c = commands[name.toLowerCase()];
  if (!c) {
    print([`command not found: ${name}. Try help.`]);
    return;
  }
  const res = c.run(args);
  if (res) print(res);
}

function complete() {
  const v = input.value;
  const parts = v.split(/\s+/);
  if (parts.length === 1) {
    const hits = Object.keys(commands).filter((c) => !hidden.has(c) && c.startsWith(parts[0]));
    if (hits.length === 1) input.value = `${hits[0]} `;
    else if (hits.length > 1) print([hits.join('  ')]);
  } else if (parts[0] === 'cd') {
    const hits = [...sections, 'tutoring'].filter((s) => s.startsWith(parts[1] ?? ''));
    if (hits.length === 1) input.value = `cd ${hits[0]}`;
  }
}

function close() {
  if (dialog?.open) dialog.close();
}

function boot() {
  dialog = document.getElementById('terminal') as HTMLDialogElement;
  out = dialog.querySelector('[data-term-out]')!;
  input = dialog.querySelector('[data-term-input]')!;
  const form = dialog.querySelector('form')!;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = input.value;
    input.value = '';
    run(v);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      complete();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      hIndex = Math.max(0, hIndex - 1);
      input.value = history[hIndex] ?? '';
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      hIndex = Math.min(history.length, hIndex + 1);
      input.value = history[hIndex] ?? '';
    }
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
    else if (!(e.target as HTMLElement).closest('a, button')) input.focus();
  });
  dialog.querySelector('[data-term-close]')?.addEventListener('click', close);

  print([
    'yohann-os 1.0 (static, zero trackers)',
    'Type help to see what this thing does.',
    '',
  ]);
  booted = true;
}

export function openTerminal() {
  if (!booted) boot();
  if (!dialog.open) dialog.showModal();
  input.focus();
}
