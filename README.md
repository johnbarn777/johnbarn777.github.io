# johnbarn777.github.io

Personal site for **Yohann Pittappillil**: AI engineer in Vancouver, BC.
Live at <https://johnbarn777.github.io>.

## What's here

| Route | What it is |
| --- | --- |
| `/` | AI-first home page: hero, selected work (sticky scroll story), how I work, experience, projects, websites, about, contact |
| `/work/agent-eval` | Case study of the agent vs. retrieval benchmark, with an interactive recall demo |
| `/tutoring` | Tutoring page with its own green accent, linked from the footer and one line in About |
| `/writing` | Placeholder, `noindex` and out of the sitemap until the first post exists |
| `/404` | The one page with an overt joke |

## Stack

- **Astro 5**, static output, deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.
- **Hand-written CSS** with design tokens in `src/styles/global.css`. No CSS framework.
- **Vanilla TypeScript** for motion and interaction (`src/scripts/`), about 7 KB gzipped on the home page. The terminal (press `` ` ``, Claude Code style slash commands) and the other easter eggs (`src/scripts/eggs.ts`: Shift five times for Spider-Man mode, type "boy" for Kratos) are split out and load on first use.
- **WebGL2 background** (`src/scripts/background.ts`): a fragment shader draws contour lines of a noise field. Scrolling moves across the terrain, the pointer raises a hill, and it idles down when nothing moves. Falls back to a plain background without WebGL and renders a single still frame under `prefers-reduced-motion`.
- **Self-hosted fonts**: Inter (opsz + wght) and JetBrains Mono, subset to Latin and trimmed to the weights in use (`public/fonts/`).

## Commands

| Command | Does |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run check` | Astro and TypeScript diagnostics |
| `npm test` | Build, serve, and run the Playwright suite (desktop and mobile) |
| `npm run og` | Regenerate `og.png`, `og-tutoring.png`, `favicon.png`, and `apple-touch-icon.png` |

Tests use Playwright's bundled Chromium. To use a Chromium that's already installed, set `CHROMIUM_PATH`.

## Where things live

```text
src/
  data/site.ts          name, links, nav, and the open decisions (D3, D8)
  data/content.ts       home page copy: work, principles, experience, projects, skills
  data/tutoring.ts      tutoring page copy
  components/home/      one component per home page section
  components/visuals/   architecture diagram, benchmark chart, chat mock, recall demo
  layouts/Base.astro    <head>, meta and Open Graph tags, JSON-LD, nav, footer, background
  scripts/              background shader, scroll motion, terminal, live page stats
  styles/global.css     tokens (light, dark, green accent), type scale, primitives
e2e/                    Playwright tests
scripts/make-images.mjs share images and icons, rendered with the site's own shader and fonts
```

See `docs/CONTENT_AUTHORING.md` for how to change copy safely.

## Tests

`e2e/` checks what matters before shipping: every link and CTA resolves, no horizontal scroll at 375, 768, 1024, and 1440 px, theme choice persists, reduced motion shows everything, the 404 works, the terminal runs, axe finds no WCAG 2.2 AA violations in either theme, SEO tags and JSON-LD are present, and the built HTML has no em dashes, banned hype words, or stale claims.
