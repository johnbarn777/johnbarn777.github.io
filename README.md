# Astro Starter Kit: Basics

## Mobile layout & testing

- Global CSS clips horizontal overflow and exposes a `.full-bleed` helper; keep new edge-to-edge sections inside this utility instead of custom negative margins.
- Navigation collapses into a stacked layout below 420px and the hero avatar scales down for 320px devices—verify with DevTools device mode (`npm run dev`) at 320, 360, and 375 widths.
- Skills carousel trims viewport padding below 360px; ensure slides remain scrollable without introducing page-level scroll.
- Cert marquee relies on `full-bleed` plus `overscroll-behavior-x: contain`; no additional negative margins are required.
- Run responsive regressions with `npx playwright test e2e/responsive.spec.ts --reporter=list` and, for full coverage, `npx playwright test --project="Mobile Safari" --project="Mobile Chrome" --reporter=list`.
- `npm run build:css` regenerates `assets/css/main.css` after editing Tailwind sources; commit the generated file once linting/tests pass.

```sh
npm create astro@latest -- --template basics
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/basics)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/basics)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/basics/devcontainer.json)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

![just-the-basics](https://github.com/withastro/astro/assets/2244813/a0a5533c-a856-4198-8470-2d67b1d7c554)

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── assets
│   │   └── astro.svg
│   ├── components
│   │   └── Welcome.astro
│   ├── layouts
│   │   └── Layout.astro
│   └── pages
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## Icons & licensing

- `npm run icons:fetch` downloads the current icon set from Iconify, normalises everything to a 24×24 viewBox, and runs SVGO.
- Icon sources: Devicon (MIT), Simple Icons (CC0 1.0), Material Symbols (Apache-2.0).
- Keep icons driven by `currentColor`; if a brand requires a specific colour, set it via CSS variables rather than editing the SVG.
- Follow each brand’s usage guide (no stretching, skewing, or unapproved recolours) when you place icons in UI.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Icons & licensing

- `npm run icons:fetch` downloads the current icon set from Iconify, normalises everything to a 24×24 viewBox, and runs SVGO.
- Icon sources: Devicon (MIT), Simple Icons (CC0 1.0), Material Symbols (Apache-2.0).
- Keep icons driven by `currentColor`; if a brand requires a specific colour, set it via CSS variables rather than editing the SVG.
- Follow each brand’s usage guide (no stretching, skewing, or unapproved recolours) when you place icons in UI.

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
