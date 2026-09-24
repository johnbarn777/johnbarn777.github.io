# Content authoring

All copy lives in three typed files. Components only lay it out.

| File | Holds |
| --- | --- |
| `src/data/site.ts` | Name, email, links, current role, nav, open decisions |
| `src/data/content.ts` | Home page: selected work, benchmark labels, principles, experience, projects, skills, credentials |
| `src/data/tutoring.ts` | Tutoring page: summary, stats, subjects, methods, roles, test scores |

## Source of truth

The resume store in `career-assistance/content/*.yaml` is the source of truth. This site holds a hand-ported copy, so it can drift. When a role, date, or bullet changes there, update the matching entry here in the same week.

## Rules the tests enforce

- **No em dashes.** Use a colon, semicolon, comma, or parentheses. En dashes in date ranges are fine.
- **No hype words**: game-changer, revolutionize, unlock, leverage, robust, seamless, cutting-edge, synergy, passionate, innovator, ninja, rockstar, world-class, 10x.
- **Tutoring stays off the home page**, apart from the one line in About.

## Rules the tests can't enforce

- **Every claim traces to the resume store.** No invented metrics, titles, or dates.
- **Employer work stays public-safe.** No names of colleagues, customers, vendors, or internal systems, and no pricing. Exact employer metrics (recall percentages, business-unit counts, hours saved) stay off the site unless Yohann approves publishing them (decision D3 in `src/data/site.ts`).
- **The internship title is "Junior Software Developer."**
- **Show, don't tell.** No "passionate", "expert", or self-grading. Let the work and the visuals carry it.

## Common changes

- **New role**: add it to the top of `experience` in `src/data/content.ts`. Set `open: true` on the newest role and remove it from the previous one.
- **New project**: add it to `projects` in `src/data/content.ts`. Each project card has a small illustrative motif in `src/components/home/Projects.astro`; add one keyed by the project `id`.
- **Publish the resume PDF (D3)**: copy the PDF built by `career-assistance/build.sh` into `public/` and set `decisions.resumeUrl` in `src/data/site.ts`. The Experience and Contact sections switch from "on request" to a download link.
- **Launch /writing (D8)**: add posts, set `decisions.showWriting`, add a nav entry, and remove `noindex` from `src/pages/writing.astro` and the sitemap filter in `astro.config.mjs`.
- **Add a photo (D10)**: put a real photo in `src/assets/` and render it in `src/components/home/About.astro` with Astro's `<Picture>` and meaningful `alt` text.
- **Change the headline or palette**: run `npm run og` afterwards to regenerate the share images and icons.
