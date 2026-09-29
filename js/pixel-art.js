/*
 * Pixel / ASCII micro-animations that echo the hero video's dissolving,
 * pixel-particle look. Usage: <div data-art="columns|ticker|globe|mosaic"></div>
 * Colours come from the page's CSS tokens, so they follow light/dark mode.
 */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FPS = 24;
  const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

  // ---------- palette ----------
  const hex = (v) => {
    let h = v.trim().replace("#", "");
    if (h.length === 3) h = [...h].map((c) => c + c).join("");
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  let pal;
  const readPalette = () => {
    const cs = getComputedStyle(root);
    const get = (k) => hex(cs.getPropertyValue(k));
    pal = { indigo: get("--indigo"), mauve: get("--mauve"), orange: get("--orange"), bg: get("--art-bg"), dark: root.dataset.theme === "dark" };
  };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  // 0 → indigo, .5 → mauve, 1 → orange  (the building: blue top, orange base)
  const grad = (t) => {
    t = Math.min(1, Math.max(0, t));
    return t < 0.5 ? mix(pal.indigo, pal.mauve, t * 2) : mix(pal.mauve, pal.orange, (t - 0.5) * 2);
  };
  const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

  // cheap deterministic hash → [0,1)
  const hash = (x, y) => {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };

  // ---------- renderers ----------
  const renderers = {
    // Pixel pillars rising & falling like a market, dissolving into particles at the top
    columns(ctx, w, h, t) {
      const s = 3, cols = Math.ceil(w / s), rows = Math.ceil(h / s);
      ctx.fillStyle = rgba(pal.bg); ctx.fillRect(0, 0, w, h);
      const tick = Math.floor(t * 10);
      for (let c = 0; c < cols; c++) {
        if (c % 4 === 3) continue;                       // gaps between pillars
        const g = Math.floor(c / 4);
        let hf = 0.42 + 0.22 * Math.sin(t * 1.1 + g * 0.7) + 0.14 * Math.sin(t * 0.6 + g * 1.9);
        hf = Math.min(0.92, Math.max(0.14, hf));
        const top = rows * (1 - hf);
        for (let r = 0; r < rows; r++) {
          if (r >= top) {
            // solid pillar — slight flicker so it feels "digital"
            // each pillar: indigo cap → orange base, like the temple in the video
            const a = 0.85 + 0.15 * hash(c, r + tick);
            ctx.fillStyle = rgba(grad((r - top) / (rows - top + 0.001)), a);
            ctx.fillRect(c * s, r * s, s - 0.6, s - 0.6);
          } else {
            // dissolving particles above the pillar
            const dist = top - r;
            const p = Math.exp(-dist / 3.2) * 0.9;
            if (hash(c * 7, r + tick) < p) {
              ctx.fillStyle = rgba(grad(0), 0.2 + 0.6 * p);
              ctx.fillRect(c * s, r * s, s - 0.6, s - 0.6);
            }
          }
        }
      }
    },

    // Scrolling ASCII area chart — a live market ticker
    ticker(ctx, w, h, t) {
      ctx.fillStyle = rgba(pal.bg); ctx.fillRect(0, 0, w, h);
      const fs = 7;
      ctx.font = `600 ${fs}px ${MONO}`;
      ctx.textBaseline = "top";
      const cw = ctx.measureText("M").width + 0.4;
      const cols = Math.ceil(w / cw) + 1, rows = Math.floor(h / fs);
      const speed = 5, pos = t * speed, off = Math.floor(pos), frac = pos - off;
      const val = (i) => 0.5 + 0.22 * Math.sin(i * 0.33) + 0.12 * Math.sin(i * 0.87 + 1.3) + (hash(i, 3) - 0.5) * 0.16;
      const ramp = "@#*+=-:. ";
      for (let c = 0; c < cols; c++) {
        const v = val(c + off) * (1 - frac) + val(c + off + 1) * frac;
        const line = Math.round((1 - v) * (rows - 1));
        const x = (c - frac) * cw;
        for (let r = 0; r < rows; r++) {
          const y = r * fs + (h - rows * fs) / 2;
          if (r < line) {
            if (r % 2 === 0 && (c + off) % 3 === 0) { ctx.fillStyle = rgba(grad(0), 0.18); ctx.fillText(".", x, y); }
            continue;
          }
          const depth = r - line;
          const ch = depth === 0 ? "@" : ramp[Math.min(ramp.length - 1, depth)];
          ctx.fillStyle = rgba(grad(r / rows), depth === 0 ? 1 : Math.max(0.25, 0.9 - depth * 0.12));
          ctx.fillText(ch, x, y);
        }
      }
    },

    // Rotating ASCII globe with lat/long grid and orbiting dust
    globe(ctx, w, h, t) {
      ctx.fillStyle = rgba(pal.bg); ctx.fillRect(0, 0, w, h);
      const fs = 6.5;
      ctx.font = `600 ${fs}px ${MONO}`;
      ctx.textBaseline = "top";
      const cw = ctx.measureText("M").width + 0.3;
      const cols = Math.floor(w / cw), rows = Math.floor(h / fs);
      const ox = (w - cols * cw) / 2, oy = (h - rows * fs) / 2;
      const ramp = " .:-=+*#%@";
      const a = t * 0.55, ca = Math.cos(a), sa = Math.sin(a);
      const b = 0.38, cb = Math.cos(b), sb = Math.sin(b);
      const R = 0.8, tick = Math.floor(t * 6);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const nx = (((c + 0.5) / cols) * 2 - 1) / R;
          const ny = (((r + 0.5) / rows) * 2 - 1) / R;
          const d = nx * nx + ny * ny;
          const x = ox + c * cw, y = oy + r * fs;
          if (d > 1) {
            // sparse drifting dust outside the sphere
            if (hash(c + tick, r * 3) > 0.965) { ctx.fillStyle = rgba(grad(r / rows), 0.45); ctx.fillText(".", x, y); }
            continue;
          }
          const nz = Math.sqrt(1 - d);
          const x1 = nx * ca + nz * sa, z1 = -nx * sa + nz * ca;          // spin (y axis)
          const y2 = ny * cb - z1 * sb, z2 = ny * sb + z1 * cb;           // tilt (x axis)
          const lon = Math.atan2(x1, z2), lat = Math.asin(Math.max(-1, Math.min(1, y2)));
          const fl = (v) => v - Math.floor(v);
          const grid = Math.abs(fl(lon / (Math.PI / 6)) - 0.5) > 0.4 || Math.abs(fl(lat / (Math.PI / 7)) - 0.5) > 0.38;
          const light = Math.max(0, -0.45 * nx - 0.4 * ny + 0.8 * nz);
          let v = 0.1 + 0.4 * light + (grid ? 0.5 : 0);
          v = Math.min(0.999, v);
          const ch = ramp[Math.floor(v * ramp.length)];
          if (ch === " ") continue;
          ctx.fillStyle = rgba(grad((ny * R + 1) / 2), grid ? 0.95 : 0.3 + 0.5 * light);
          ctx.fillText(ch, x, y);
        }
      }
    },

    // Shimmering pixel mosaic (for tiny slots)
    mosaic(ctx, w, h, t) {
      ctx.fillStyle = rgba(pal.bg); ctx.fillRect(0, 0, w, h);
      const s = 3, cols = Math.ceil(w / s), rows = Math.ceil(h / s);
      const tick = Math.floor(t * 8);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let n = 0.5 + 0.35 * Math.sin(c * 0.55 + t * 1.6) * Math.cos(r * 0.7 - t * 1.1) + (hash(c, r + tick) - 0.5) * 0.35;
          n = Math.round(Math.min(1, Math.max(0, n)) * 4) / 4;          // quantise → pixel steps
          if (n <= 0.25 && hash(c * 5, r + tick) > 0.4) continue;
          ctx.fillStyle = rgba(grad(0.15 + (r / rows) * 0.85), 0.35 + n * 0.65);
          ctx.fillRect(c * s, r * s, s - 0.5, s - 0.5);
        }
      }
    },
  };

  // ---------- mounting ----------
  readPalette();
  const arts = [];
  const dpr = Math.min(2, window.devicePixelRatio || 1);

  document.querySelectorAll("[data-art]").forEach((el) => {
    const render = renderers[el.dataset.art];
    if (!render) return;
    const cv = document.createElement("canvas");
    cv.className = "art";
    cv.setAttribute("aria-hidden", "true");
    el.prepend(cv);
    const art = { el, cv, ctx: cv.getContext("2d"), render, w: 0, h: 0, visible: true, t: 0 };
    art.draw = () => { if (art.w && art.h) render(art.ctx, art.w, art.h, art.t); };
    const fit = () => {
      art.w = el.clientWidth; art.h = el.clientHeight;
      cv.width = Math.round(art.w * dpr); cv.height = Math.round(art.h * dpr);
      art.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      art.draw();
    };
    new ResizeObserver(fit).observe(el);
    new IntersectionObserver(([e]) => (art.visible = e.isIntersecting)).observe(el);
    fit();
    arts.push(art);
  });

  // Re-colour instantly when the theme changes
  new MutationObserver(() => { readPalette(); arts.forEach((a) => a.draw()); })
    .observe(root, { attributes: true, attributeFilter: ["data-theme"] });

  if (reduce) { arts.forEach((a) => { a.t = 2; a.draw(); }); return; }

  let last = 0;
  const start = performance.now();
  const loop = (now) => {
    requestAnimationFrame(loop);
    if (now - last < 1000 / FPS) return;
    last = now;
    const t = (now - start) / 1000;
    for (const a of arts) if (a.visible) { a.t = t; a.draw(); }
  };
  requestAnimationFrame(loop);
})();
