# [mnumanmercan.github.io](https://mnumanmercan.github.io/)

Personal portfolio of M. Numan Mercan. It's a static site built with semantic HTML, modern CSS and vanilla JavaScript. There is no framework, no build step and no runtime dependencies.

## Run locally

```sh
python3 -m http.server 5500   # or VS Code Live Server
```

Open it over `http://`, not `file://`, because browsers block the SVG icon sprite (`<use href="…sprite.svg#id">`) on `file://` URLs.

## Structure

```
index.html
css/
  base.css          tokens (both themes), reset, typography, layout, reveal animation
  components.css    header, buttons, cards + spotlight, chips, tooltips, tabs, ⌘K palette, toast, footer
  sections.css      hero, about, experience, projects (+ diagrams), skills, education, contact
js/
  main.js           theme, scroll effects, reveal, counters, typed role, tabs, filters, ⌘K palette
assets/
  icons/sprite.svg  UI icons (<symbol> sprite)
  icons/tech/       technology logos
  img/              photo, favicon, project media
```

## Editing content

- **Add a project:** copy a `.p-card` inside `#archive` in `index.html` and set `data-cats` (`ai app mobile research game academic`). The filter counts and the hero's "Projects built" counter update automatically.
- **Add a featured project:** copy one of the `.feature` articles. The visual goes in `.feature-visual`.
- **Icons:** use `<svg class="i" aria-hidden="true"><use href="assets/icons/sprite.svg#github" /></svg>`. The available ids are the `<symbol id="…">` entries in `assets/icons/sprite.svg`.
- **Colours:** every colour is a token at the top of `css/base.css`, with separate dark and light blocks.

## Details

- Dark and light themes default to the OS setting and remember the visitor's choice. The theme is applied before first paint, so there's no flash, and switching uses a circular View Transition.
- A command palette opens with <kbd>⌘K</kbd>, <kbd>Ctrl K</kbd> or <kbd>/</kbd>.
- Other motion: scroll-reveal, scroll progress bar, experience timeline that fills as you scroll, animated counters, pointer spotlight on cards.
- Respects `prefers-reduced-motion`. Without JavaScript all content is still visible.
- The three node colours in the graph diagram (query, paper, author) are colourblind-safe in both themes. The `--viz-*` tokens were validated for that.

## Credits

- UI icons: [Font Awesome Free](https://fontawesome.com) 6.7.2 (CC BY 4.0). LeetCode glyph: [Simple Icons](https://simpleicons.org) (CC0).
- Technology logos: [Devicon](https://devicon.dev) 2.17.0 (MIT).
- Fonts: [Geist & Geist Mono](https://vercel.com/font) via Google Fonts.
