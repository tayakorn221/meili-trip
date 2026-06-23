# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Thai-language, editorial/magazine-style travel itinerary for **เมยหลี่เสวี่ยซาน (Meili Snow Mountain / 梅里雪山 / Kawagebo)**, Yunnan, China — a 7-day family trip plan (15–21 Nov 2026). It is a **static site with no build step and no framework**: the whole site is a single self-contained `index.html` with inline `<style>` and inline `<script>`. The only third-party library is **Leaflet** (loaded from CDN) for the interactive route map, which degrades gracefully to an inline SVG when it can't load.

## Running & deploying

- **Run locally:** open `index.html` directly in a browser (double-click). No server, install, or build is needed.
- **Preview with a server (optional):** `python -m http.server 8765` from the repo root, then open `http://localhost:8765/` — needed only if you want `localStorage`/clipboard to behave exactly as on the live HTTPS site.
- **Offline PDF:** the browser Print dialog auto-expands all accordions (`beforeprint` hook + `@media print`), so "Save as PDF" yields a complete offline field guide.
- **Deploy:** GitHub Pages serves `index.html` from the repo root at https://tayakorn221.github.io/meili-trip/. Edits to that file = edits to the published site. GitHub Pages requires the entry file to be named `index.html`.
- There is no test, lint, or CI tooling in the repo.

## Files

- `index.html` — the entire site and the GitHub Pages entry point. Content is organized into **three nav groups**, sections in linear order: **วางแผน** (`overview` + inline SVG route map, `getting-there`, `visa`, `money`, `connectivity`, `packing`) · **ระหว่างทาง** (`itinerary`, `transport`, `accommodation`, `food`, `attractions`, `altitude`) · **อ้างอิงด่วน** (`emergency`, `phrases`, `weather`, `cost`, `warnings`). Estimate/volatile items use the ⚠️ badge styled by `--verify-bg` / `--verify-ink`.
- `docs/content-plan.md` — **content source-of-truth.** All copy is researched + reviewed here first (verified links + ⚠️ + check-date + source), then converted into `index.html`. Same 3-group structure.
- `og-image.png` — 1200×630 social-share image referenced by the Open Graph / Twitter meta tags in the `index.html` head.

(`.claude/` is git-ignored local tooling — e.g. a `launch.json` static-server config for previewing — and is never part of the deployed site.)

> History (git log context): this detailed page used to live in `meili-trip.html` alongside a shorter `index.html`. The detailed version is now the single published `index.html`; the old short page and the `meili-trip.html` filename are gone.

## Architecture

The site is one self-contained file. The design system lives in an inline `<style>` (a token `:root` block plus nav/hero/section CSS) and all behavior lives in a single inline `<script>` at the end of `<body>`. External assets are all from CDNs: Google Fonts, a few remote images (hero/photo bands), and **Leaflet (CSS+JS) + OpenStreetMap tiles** for the interactive route map. Everything else is inline.

### Design system (CSS custom properties in `:root`)

- **Palette:** `--paper`/`--paper-2` (warm off-white backgrounds), `--ink`/`--ink-2` (near-black text), `--clay` (terracotta accent, used for kickers/numerals/active states), `--gold`. `--verify-bg`/`--verify-ink` style the ⚠️ price-estimate badges.
- **Three font roles:** `--serif` = Noto Serif Thai (Thai headings/body emphasis), `--fig` = Fraunces (Latin figures, big numerals, kickers), `--sans` = IBM Plex Sans Thai (body text). Each has a `Leelawadee UI` / system fallback so Thai still renders if Google Fonts fails to load.
- `--nav-h` (60px) is the sticky-nav height; `section[id]`/`header[id]` use it as `scroll-margin-top` so anchored scrolling clears the nav.
- All newer components (grouped nav dropdowns, SOS panel, `<details>` accordions, tap-to-copy phrasebook rows, packing checklist, comparison/weather tables, dark group dividers, and the overview **route map** ①→④) reuse these same tokens — no new colors or fonts.
- **Route map (overview):** a **Leaflet + OpenStreetMap interactive map on screen** (4 numbered clay `circleMarker`s + dashed route polyline, fit to bounds) with a **hand-drawn inline SVG schematic as the print/offline fallback**. The script adds `.routemap.maplive` only after Leaflet initializes — which CSS uses to show `#map` and hide the SVG; `@media print` reverses it (SVG prints, map hidden). If Leaflet/tiles fail to load, the SVG simply stays. Per-stop "open real map" links go to Amap.

### Navigation & interaction (the end-of-body IIFE script)

1. **Grouped nav:** three `.navgroup` dropdowns (`.ng-btn` + `.dropdown`). Desktop: hover opens (CSS) and click toggles `.open` (JS); mobile (`max-width:980px`): `.burger` opens the whole list, `.ng-btn` becomes a non-interactive group heading and dropdowns flatten inline.
2. **Scroll-spy:** an `IntersectionObserver` (`rootMargin: -45% 0px -45% 0px`) watches every `section[id]` / `header[id]`, toggles `.active` on the `.dropdown a` whose `href` is `#<that-id>`, and marks that link's parent group `.ng-btn.active`.
3. **SOS panel:** the fixed `.sos-fab` opens `#sosPanel` (a `role="dialog"` slide-in + backdrop) — moves focus to the close button, restores focus to the fab on close, Esc closes. Uses an `offsetWidth` reflow (NOT `requestAnimationFrame`) to trigger the open transition so it still works in a backgrounded tab.
4. **Tap-to-copy phrases:** delegated click on `.cp[data-copy]` → `navigator.clipboard` + toast (graceful fallback when clipboard is unavailable, e.g. `file://`).
5. **Packing checklist:** `.chk input[id]` states persist in `localStorage` (`meili-<id>`); `#chkReset` clears them.
6. **Print:** a `beforeprint` handler force-opens every `<details>` (`afterprint` restores) so `@media print` exports the full page to PDF for offline use.

**Couplings to keep in sync:** (a) each `.dropdown a href="#x"` must match a `<section id="x">` — adding/renaming a section means updating both; (b) accordions + the itinerary use native `<details>` (consistent + print-friendly); (c) `prefers-reduced-motion` zeroes transitions and interactive elements share one `:focus-visible` outline.

## Content & meta conventions

- All user-facing content is in **Thai**. The page is travel-planning data (day-by-day itinerary, lodging cards, food, a per-person cost table, logistics).
- Prices are dual-currency: CNY (หยวน) with THB (บาท) at **~1 CNY ≈ 5 THB**.
- Items marked **⚠️** are estimates to re-verify before travel (styled with the `--verify-*` badge tokens).
- The `<head>` carries Open Graph + Twitter Card meta for link previews (LINE / Facebook / Twitter). If you change the title, hero, or `og-image.png`, keep `og:url` pointed at the live root URL and the `og:image` dimensions (1200×630) in sync.
