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

# Certifications Marquee Authoring Guide

The certifications banner is now a continuously scrolling marquee that highlights credential badges, issuers, and quick “Verify credential” links. There are no filters or detail panes—every card is a direct link to the source of truth.

## Data contract (`data/certs.json`)

- `featuredIds[]`
  - Array of certification `id` values to highlight elsewhere on the site.
  - Every ID listed **must** exist in `items[]`.
- `items[]`
  - `id`: stable slug (lowercase, kebab-case). Used in tests and for cross-linking.
  - `title`: credential name rendered inside the marquee card.
  - `issuer`: organization responsible for the certification (shown above the title).
  - `issued`: optional YYYY-MM string for record keeping. Not displayed in the marquee but useful for future timelines.
  - `verifyUrl`: absolute URL opened in a new tab when the card is activated.
  - `image`: badge icon (PNG/SVG) displayed at 64×64 px within the card.
  - `palette` *(optional)*: `{ bg, fg, glow }` overrides for the card gradient and foreground colour.
  - `category`, `credId`, `largeImage`, and `skills` remain supported in the data for compatibility with other surfaces, but they are not surfaced in the marquee.

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
      "image": "/assets/img/certs/gcp-pca-badge.png",
      "palette": { "bg": "#0B2545", "fg": "#E6F1FF", "glow": "#4EA1FF" }
    }
  ]
}
```

## Image authoring

- Badge art lives in `public/assets/img/certs/`.
- Export badges at 64×64 px (or larger with generous transparent padding) as lightweight PNGs or SVGs.
- Keep file sizes modest (<50 KB when possible) to preserve smooth marquee motion.
- Large hero images are no longer required for this banner, but you may continue to track them in the dataset for reuse elsewhere.

## Palette and fallback rules

- When `palette` is omitted, cards inherit the site’s default midnight gradient with white typography.
- `bg` sets the gradient base, `fg` sets text colour, and `glow` influences subtle drop shadows.
- Maintain accessible contrast (WCAG AA) for both text and decorative cues.

## Visual & UX contract

- The marquee auto-scrolls left-to-right continuously; hovering or focusing any card pauses the animation.
- Reduced-motion users receive a static row of cards with no automatic scrolling.
- Cards are direct links (`target="_blank"` + `rel="noopener noreferrer"`) and include issuer, title, and a “Verify credential” affordance.
- Duplicate card instances are rendered for seamless looping but are hidden from assistive technologies and removed from the tab order.
- Hit targets remain ≥40×40 px with clear focus outlines supplied by the shared card component.

## Manual acceptance checklist

- Visiting `/#certifications` reveals the marquee immediately below the skills banner.
- Cards display badge, issuer, title, and “Verify credential →” copy.
- Links open in a new tab and route to the correct `verifyUrl`.
- Hovering or focusing a card pauses the marquee; it resumes when focus/hover leaves (unless the user prefers reduced motion).
- With `prefers-reduced-motion: reduce`, the row is static and fully accessible via keyboard.
