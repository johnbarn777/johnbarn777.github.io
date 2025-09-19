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
