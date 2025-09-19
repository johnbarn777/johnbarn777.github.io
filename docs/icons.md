# Icon pipeline & usage

This project keeps skill icons in sync with Iconify so we can reference a single source of truth and keep everything legal.

- Run `npm run icons:fetch` whenever you add or change icons. The script will:
  - look up every `/data/skills.json` entry,
  - download the matching Iconify glyph,
  - normalise it to a `0 0 24 24` viewBox,
  - strip inline colours and dimensions, so the SVG obeys `currentColor`,
  - optimise it with SVGO, then write to `public/assets/icons/skills/<slug>.svg`.
- Icon sets in use:
  - [Devicon](https://github.com/devicons/devicon) – MIT licence.
  - [Simple Icons](https://github.com/simple-icons/simple-icons) – CC0 1.0.
  - [Material Symbols](https://fonts.google.com/icons) – Apache-2.0 licence.
- Brand usage tips:
  - Let CSS provide colour (`color`, `--tw-text-*`, etc.). Do not hardcode fills in the SVG.
  - Follow each brand’s usage guide (no skewing, stretching, or unapproved recolours).
  - If a neutral or placeholder graphic is required, the script maps missing icons to Material Symbols via the `fallbackIcon` constant.

If you introduce a new skill, add a mapping in `scripts/fetch-skill-icons.mjs` (or let the fallback handle it temporarily) and rerun the fetch script before committing.
