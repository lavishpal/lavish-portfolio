# Design System — Lavish Pal Portfolio

Rebuild of the existing hand-written portfolio (lavish-portfolio-rho.vercel.app) on the managed stack.
**The existing visual identity is preserved 1:1.** The only additions are a deep-space galaxy backdrop,
a blog, and an admin dashboard — all drawn in the same editorial-technical language.

Positioning: "an engineer's portfolio floating in deep space." Serious open-source/platform engineer
first, atmosphere second. Never gaming, never space-themed landing page.

## Typography (unchanged from the original site)

- Body / prose: `Source Serif 4`, Georgia, serif — 17px, line-height 1.65, justified paragraphs
- Headings / eyebrows: `Space Grotesk`, sans-serif — h1 42px/1.08 @600, section titles 20px @600
- Mono (metadata, tags, nav, dates, code): `JetBrains Mono` — 11–13px, letter-spacing 0.03–0.04em
- Measure: single column, `--max: 660px` (blog article: 720px), 24px gutters, 96px top padding

## Color tokens (identical variables to the original, `data-theme` on `<html>`)

Light:
`--bg #F5F6F8` · `--surface #FFFFFF` · `--ink #14181F` · `--muted #5B6472` · `--faint #8A93A1`
`--line #DEE2E7` · `--accent #2F6F5E` (+ soft `#E4EFEC`) · `--amber #B5741F` · `--blue #3F57B0`

Dark:
`--bg #101315` · `--surface #181C1F` · `--ink #ECEEF0` · `--muted #A9B1BB` · `--faint #6E7680`
`--line #292E33` · `--accent #55B296` · `--amber #DDA35C` · `--blue #8092DE`

Accent = green (merged/primary), amber = in-progress, blue = ongoing. Accents mark state, never decorate.

## Galaxy backdrop

- Single fixed `<canvas>` behind everything, `pointer-events: none`, z-index 0; content sits on z-index 1+
- Layers: nebula/Milky Way band (pre-rendered to an offscreen canvas once), 3 star layers
  (far/mid/near) with different sizes, brightness, drift speed and parallax factors, plus a handful of
  bright stars with a soft glow and slow twinkle
- Palette: deep black base with indigo `#0b1026`, violet `#1a1030`, faint cyan-white stars — photographic,
  not colorful. No planets, moons, astronauts, illustrations.
- Motion: very slow drift (sub-pixel per frame), gentle twinkle, mouse parallax (lerped, max ~14px),
  scroll parallax (layer-dependent). Everything eases; nothing pulses.
- Dark theme: full strength on `#05060a` base. Light theme: same field at ~10% opacity over `--bg`,
  so it reads as faint paper texture rather than night sky.
- Performance: DPR-capped rendering (max 2), star count scaled by viewport area
  (~1400 desktop → ~450 mobile), single rAF loop, offscreen nebula re-rendered only on resize,
  loop paused when the tab is hidden. `prefers-reduced-motion` → one static frame, no rAF.
- Readability: `--veil` radial/linear dark gradient layer above the canvas; text containers get a
  subtle backdrop wash (`--surface` at 55–75% + blur) only where the starfield is dense.

## Layout patterns

- Sticky top nav, right-aligned mono links + theme toggle, hairline bottom border appears on scroll
- Sections: uppercase mono eyebrow with a hairline rule filling the remaining width, 72px rhythm
- Work/project items: hairline top border, title + right-aligned date, org line, em-dash bullet list,
  mono tag row separated by middots
- Blog card: cover image (16:9, subtle border), title (Space Grotesk 19/500), serif excerpt, mono meta
  row (date · reading time), bordered mono tags, "Read article →" link
- Article page: 720px measure, sticky TOC on ≥1280px (inline collapsible below), code blocks in
  `--surface` with a hairline border and a mono language label, prev/next pair at the foot
- Admin: same tokens, two-pane editor (markdown left, live preview right), collapses to tabs on mobile

## Motion

Page load: staggered fade-up reveals (0.05s steps, 12px translate) — same as the original `.reveal`.
Hovers: 0.15s color/border transitions only. Everything above is disabled under
`prefers-reduced-motion`.
