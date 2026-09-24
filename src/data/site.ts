/**
 * Site-wide facts and open decisions.
 *
 * Content here is hand-ported from the career-assistance resume store
 * (content/*.yaml). Only verified [V] facts and the public-safe wording from the
 * website brief are used. If the resume store changes, update this file too.
 */

export const site = {
  name: 'Yohann Pittappillil',
  firstName: 'Yohann',
  monogram: 'YP',
  url: 'https://johnbarn777.github.io',
  title: 'Yohann Pittappillil · AI Engineer',
  /** Resume headline, used for meta and Open Graph tags. */
  headline: 'AI Engineer / Data Scientist',
  oneLiner: 'Enterprise AI that earns its place in production.',
  description:
    'Yohann Pittappillil builds enterprise AI that earns its place in production. AI Solutions Specialist at Mark Anthony Group in Vancouver, BC.',
  email: 'yohannvinod@gmail.com',
  linkedin: 'https://linkedin.com/in/yohannp',
  github: 'https://github.com/johnbarn777',
  repo: 'https://github.com/johnbarn777/johnbarn777.github.io',
  location: 'Burnaby, BC',
  city: 'Vancouver',
  role: {
    title: 'AI Solutions Specialist',
    org: 'Mark Anthony Group',
    since: 'Feb 2026',
  },
  languages: ['English', 'French', 'Hindi', 'Malayalam'],
} as const;

/**
 * Open decisions (see the brief, section 21). Each default is built and easy to flip.
 */
export const decisions = {
  /**
   * D3: publish employer metrics and the resume PDF?
   * Default: no. Public-safe wording everywhere and the resume is "on request".
   * To flip: set a URL here (e.g. '/Yohann_Pittappillil_AI_Engineer.pdf' after
   * copying the PDF into public/) and swap the benchmark labels in content.ts.
   */
  resumeUrl: null as string | null,
  /** D8: show the /writing route in navigation once at least one post exists. */
  showWriting: false,
} as const;

export const mailto = (subject?: string) =>
  `mailto:${site.email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;

export const nav = [
  { href: '/#work', id: 'work', label: 'Work' },
  { href: '/#experience', id: 'experience', label: 'Experience' },
  { href: '/#projects', id: 'projects', label: 'Projects' },
  { href: '/#websites', id: 'websites', label: 'Websites' },
  { href: '/#about', id: 'about', label: 'About' },
] as const;
