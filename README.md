# PillarCap — Bento landing page

A single-page bento-style landing page for a fictional investing firm, built around a looping pixel-dissolve video of a temple.

- **`index.html`** — the finished design: light/dark themes, Motion (Framer Motion's vanilla JS API) load-in animations, and canvas pixel/ASCII art in place of stock images.
- **`wireframe.html`** — greyscale wireframe of the same layout with numbered annotations.

## Run locally

```bash
npm install   # installs `motion` and copies it to js/motion.js
npm start     # serves the site at http://localhost:5173
```

## Structure

| Path | What |
|---|---|
| `videos/hero.mp4` | Hero video (9:16, autoplay / muted / loop) |
| `images/hero.webp` | Hero still — video poster and gallery thumbnail |
| `js/motion.js` | Motion library bundle (copied from `node_modules` on install) |
| `js/pixel-art.js` | Pixel / ASCII canvas animations (`data-art="columns|ticker|globe|mosaic"`) |

Colours are CSS tokens at the top of `index.html` (`:root` for light, `:root[data-theme="dark"]` for dark).

> Figures on the page ($500, 8.4%, 48k, 98%) are placeholders.
