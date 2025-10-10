# Coding Prowess: Data, Collectors, and UI

This guide documents the data contracts, nightly collection workflow, UI integration, theming, and accessibility for the Coding Prowess panel. It follows the tone and structure used in docs/CONTENT_AUTHORING.md.

## Data contracts (data/*.json)

- data/profile.json
  - github.username: default GitHub handle
  - leetcode.username: default LeetCode handle
- data/github.json
  - user: GitHub handle used to collect the payload
  - generatedAt: ISO timestamp
  - totals: { commits, prs, issues, stars }
  - streak: { current, longest }
  - dominantLanguage: { name, percent }
  - topRepo: { name, url, stars, description, recentMonthCommits }
  - repos[]: { name, url, stars, forks, language, recentCommits[], languages{...} }
    - recentCommits arrays hold the latest N weekly totals (default 12 weeks; configurable via GH_RECENT_WEEKS)
  - monthlyCommits[]: { month: YYYY-MM, count }
  - languages[]: { name, percent }
- data/leetcode.json
  - user: LeetCode handle used to collect the payload
  - generatedAt: ISO timestamp
  - totals: { solved, easy, medium, hard }
  - streakDays: number of consecutive active days
  - weekly[]: per-week totals used for the heatmap
  - recent[]: latest submissions with { id, title, difficulty, language, status, url }
  - difficulty[]: { name, count }

Placeholder semantics: all numeric fields may be 0; arrays may be empty. Components render user-friendly empty states.

## Collector entry point (scripts/collect-prowess.mjs)

- Command: `npm run prowess:collect`
- Sources usernames from env (GH_USERNAME, LC_USERNAME) or data/profile.json.
- Optional tunables:
  - `GH_RECENT_WEEKS` (default 12) controls the length of weekly commit buckets per repo.
- Top-repo ranking uses commits authored by the configured user since the start of the current calendar month (GitHub REST commits API) with a fallback to last-52-week totals.
- Validates outputs with Ajv against schemas in scripts/schemas/.
- Writes data/github.json and data/leetcode.json. If usernames are missing, the script exits with a descriptive error.

## GitHub Actions workflow

- .github/workflows/collect-prowess.yml runs on schedule and manual dispatch.
- Installs dependencies, runs the collector, and commits only when diffs exist.
- Set `GH_USERNAME` and/or `LC_USERNAME` repository secrets, or provide data/profile.json in the repo.

## UI integration

- The panel lives at src/components/prowess/ and is mounted in src/pages/index.astro below Projects under the anchor `#prowess`.
- Tabs (Highlights, Repos, LeetCode, Mastery) use the site’s filter-toolbar styles for consistent 40×40 hit targets and keyboard handling.
- Reduced motion: there are no forced animations; any future animations must be guarded by `prefers-reduced-motion` and fall back to instant state changes.

## Theming and SVGs

- SVGs avoid heavy filters and take colour from CSS variables (e.g., `currentColor`, `var(--brand-3)`) to match the site’s dark/light palette.

## Empty states & resilience

- Each tab tolerates missing/invalid JSON and displays guidance instead of throwing.
- Missing GitHub data does not block LeetCode, and vice versa.

## Mastery calculation

- Derived directly from data/skills.json.
- Score formula (bounded to 0–100): primary weight × years factor × level weight.
  - primary weight: 1 (primary) or 0.7 (non-primary)
  - years factor: min(1, years / 5)
  - level weight: 0.6 (beginner), 0.8 (intermediate), 1.0 (advanced)
- Top skills are displayed as labelled horizontal bars with aria-label summaries.

## Playwright coverage

- e2e/prowess.spec.ts exercises:
  - Rendering and keyboard navigation of tabs
  - Accessible labels on sparkline SVGs
  - Empty-state resilience
- Run tests locally/CI with: `npm run test -- --reporter=list`.

## Privacy notes

- Do not publish private repositories or confidential LeetCode submission details. The collector is intentionally conservative and can be extended locally to fetch more detail as needed.
