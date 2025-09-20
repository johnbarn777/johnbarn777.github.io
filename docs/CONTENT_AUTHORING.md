# Skills Carousel Authoring Guide

This document captures how to work with the skills carousel content, configuration knobs, and accessibility guarantees.

## Data contract (`data/skills.json`)

- `categories[]`
  - `id`: stable machine identifier. Used as slide anchors (`#skills-cat-<id>`).
  - `label`: human-readable name rendered as the slide heading.
  - `order`: numeric sort key (lower numbers display first). Categories with equal `order` fall back to alphabetical label sorting.
  - `visible`: when `false`, the category and all of its skills are hidden from the carousel (items remain in the seed for future use).
- `items[]`
  - `category` **must** reference a visible category `id`.
  - `primary`: `true` items appear first inside a slide and are counted in the banner tally.

### Recommended content limits

- Aim for 12–16 skills per category to keep the first fold dense without overflow.
- Leave empty categories in place if needed—the carousel will render a “No skills yet” placeholder so paging indices stay stable.

## Carousel behaviour knobs (`src/config/ui.ts`)

```ts
export const ui = {
  skillsCarousel: {
    autoplayMs: 5000,      // interval between automatic advances (set to 0 to disable)
    resumeDelayMs: 2000,   // delay after hover/focus/visibility pause before restarting autoplay
    loop: true,            // when true, paddles wrap from last → first slide (never disabled)
  },
};
```

Changes are picked up at build time. Reduced-motion users always receive a non-animated experience regardless of these values.

## Accessibility & interaction notes

- The carousel exposes `role="region"`/`aria-roledescription="carousel"` and announces slide changes via a polite live region (`Now viewing …`).
- Slides upgrade hash navigation (`#skills-cat-<id>`), and the active category is synced to the URL and to `localStorage` (`skills:lastCategory`) so refreshes restore the last viewed slide.
- Autoplay pauses when:
  - the user hovers the carousel,
  - the carousel or any pill receives focus,
  - the page/tab is hidden, or
  - the carousel is <60% visible.
  Autoplay resumes ~2s after the interaction ends. Setting `prefers-reduced-motion` disables autoplay entirely.
- Keyboard support highlights:
  - `Tab` moves through paddles, dots, then each pill (40×40 targets, visible focus rings).
  - When focus is on the viewport: `PageUp/PageDown` (or `Ctrl` + arrow keys) moves slides; `Home/End` jump to first/last.
  - Dots use `role="tab"` with roving tab index; arrow keys cycle, `Enter/Space` activates the selected category.

## Styling reserved area

Each category slide uses a fixed min-height so icons load without layout shift, and paddles/dots reserve space to keep CLS ≤0.02. Icons for the first two slides are preloaded; additional icons remain lazily loaded via `<img loading="lazy">`.

## Contributing tips

- Add new icons to `public/assets/icons/skills/` (24×24 viewBox, visually centered). The first two categories' icons are preloaded automatically.
- When reordering categories, update each `order` value and keep them unique per desired slot.
- When hiding categories temporarily, set `visible: false` so URL history and tests stay stable.

# Certifications Coverflow Authoring Guide

The certifications module mirrors the carousel-first ethos of the site: it preloads the hero assets you need, keeps state in sync across cards, detail, dots, and filters, and avoids hover-reliant interactions.

## Data contract (`data/certs.json`)

- `featuredIds[]`
  - Array of certification `id` values to highlight in hero rows or additional callouts.
  - Every ID listed **must** exist in `items[]`.
- `items[]`
  - `id`: stable slug (lowercase, kebab-case). Used for anchors and test selectors.
  - `title`: credential name rendered on cards and in the detail pane.
  - `issuer`: organization responsible for the certification.
  - `issued`: YYYY-MM string (e.g. `2024-08`). Parsed into “Month YYYY” for announcements and detail metadata.
  - `verifyUrl`: absolute URL opened in a new tab when “Verify credential” is activated.
  - `category`: filter bucket. Allowed values: `Cloud`, `ML/AI`, `Security`, `Data`, `Aviation`.
  - `credId`: displayed credential identifier.
  - `image`: badge icon (PNG, optimized for 64×64 display) placed on cards.
  - `largeImage`: hero art showcased in the detail panel (WebP/AVIF ≤150 KB, 16:10 or similar aspect).
  - `skills[]`: 3–6 chips surfaced in the detail panel.
  - `palette` *(optional)*: `{ bg, fg, glow }` overrides for card/detail backdrop and glow accents.

```json
{
  "featuredIds": ["gcp-pca", "deeplearning-ai-nlp"],
  "items": [
    {
      "id": "gcp-pca",
      "title": "Professional Cloud Architect",
      "issuer": "Google Cloud",
      "issued": "2024-08",
      "verifyUrl": "https://…",
      "category": "Cloud",
      "credId": "ABC-123",
      "image": "/assets/img/certs/gcp-pca-badge.png",
      "largeImage": "/assets/img/certs/gcp-pca-card.webp",
      "skills": ["VPC", "IAM", "GKE", "Networking", "SRE"],
      "palette": { "bg": "#0B2545", "fg": "#E6F1FF", "glow": "#4EA1FF" }
    }
  ]
}
```

## Image authoring

- Badge art lives in `public/assets/img/certs/` alongside large hero images.
- Badges should be exported at 64×64 px (or larger with safe transparent padding) as lightweight PNGs.
- Large images **must** be WebP or AVIF and remain ≤150 KB. Use 720×450 (or 16:10 equivalent) to match the reserved layout.
- Provide matching filenames for `image`/`largeImage`; the build preloads the first two hero assets automatically.

## Palette and fallback rules

- When `palette` is omitted, cards/detail panels inherit the site’s default gradient and foreground colors.
- `bg` fills the card/detail background, `fg` sets foreground copy colour, `glow` feeds both the card halo and detail under-glow.
- Stick to accessible contrast: body text and UI chrome must meet WCAG AA in both light and dark contexts.

## Filters & categories

- Filter chips are rendered in the order: **All · Cloud · ML/AI · Security · Data · Aviation**.
- New certifications should reuse one of these categories. Introduce a new chip only when all tests/docs are updated.
- Changing filters resets the active index to the first result—ensure each subset has at least one certification to avoid empty states.

## Visual & UX contract

- No hover-only reveals. All changes occur through scroll, click/tap, or keyboard input.
- The viewport behaves as a snap carousel; one card is visually dominant at any time (scale 1.0 / high opacity).
- Detail content is pinned below the viewport and swaps instantly when the active card changes.
- Verify CTA always opens in a new tab (`target="_blank"` + `rel="noopener"`).
- Keyboard: Left/Right navigate cards; `V` focuses the Verify button for the active detail; dots expose `role="tab"` semantics.
- Live region announces active changes (`Now viewing …`). Keep copy succinct and monotonic.
- Motion respects `prefers-reduced-motion: reduce` with ≤120 ms fades and no smooth scrolling.
- Hit targets (cards, filters, dots, buttons) remain ≥40×40 px with visible focus outlines.

## Manual acceptance checklist

- Carousel snaps card-by-card; one card is clearly active (scaled/bright).
- Clicking or tapping any card centers & activates it; keyboard Left/Right and dots all stay in sync.
- Live detail shows only the active certification, including issued date, credential ID, skills, and Verify CTA.
- Verify links open in a new tab and point to the correct `verifyUrl`.
- Large images preload for the first two cards; subsequent assets lazy-load with no layout shift (CLS ≤0.02).
- Filters immediately subset the list, reset the active detail to the first match, and update dots/counts.
- AXE/Lighthouse accessibility score ≥95 with live announcements functioning.
