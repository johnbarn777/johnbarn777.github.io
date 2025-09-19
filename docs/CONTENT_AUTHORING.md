# Skills carousel authoring guide

The skills banner groups data from [`data/skills.json`](../data/skills.json) into horizontally paged
slides by category. This document describes how to safely update the content model and how to adjust
runtime behavior.

## Category structure

Each entry in `categories` must include:

- `id` — unique string referenced by the `items[].category` field.
- `label` — human-friendly name shown in the carousel header.
- `order` — numeric sort weight; lower numbers appear first.
- `visible` — when `false`, the category (and its skills) are ignored, but the data is preserved for
  later use.

Authoring tips:

- Ensure every item references a visible category; hidden categories are skipped entirely.
- When reordering, update the `order` values and keep them distinct to avoid ambiguous sorting.
- Leave categories in place even if they temporarily have zero primary skills. The carousel will render
  a placeholder slide so keyboard paging remains consistent.

## Skill items

Skills are rendered twice: primary skills appear first within their category, followed by any remaining
entries. Aim for **12–16 skills per category** so that the two-row grid on desktop stays within the
first viewport.

Icons must live under `public/assets/icons/skills/` and match the `icon` path defined in each item.

## Runtime configuration

The carousel exposes a small configuration object in [`src/config/ui.ts`](../src/config/ui.ts):

```ts
export const ui = {
  skillsCarousel: {
    autoplayMs: 5000,
    loop: true,
    resumeDelayMs: 2000,
  },
} as const;
```

- `autoplayMs` — interval (milliseconds) between automatic slide advances. Set to `0` to disable.
- `loop` — when `true`, navigation wraps from the last slide to the first.
- `resumeDelayMs` — delay before autoplay resumes after user interaction (hover, focus, etc.).

Updates to this config are picked up automatically on the next build.

## Accessibility and motion

The carousel announces the active category and skill count via an ARIA live region and keeps
paddles/dots keyboard accessible. Autoplay pauses when:

- The user hovers the carousel or focuses any control/pill.
- The document is hidden (e.g., switching tabs) or the carousel is less than 60% visible.
- The operating system/browser is set to “reduced motion”. In this mode, smooth scrolling and
  autoplay are disabled completely.

Remember to leave these behaviors intact when making changes so the component continues to meet
accessibility expectations.
