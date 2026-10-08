# VĀRA Studio — 30-second promo

A 30-second, 1920 × 1080, 30 fps motion graphics promo for the VĀRA Studio website, with an original soundtrack. It is built in [Remotion](https://www.remotion.dev) (React video) and uses the website's own photographs, typefaces and denim artwork.

## Render

```bash
npm install
npm run soundtrack   # re-synthesizes public/audio/soundtrack.wav (Python 3 with NumPy and SciPy)
npm run render       # writes out/vara-studio-promo.mp4
```

This repository holds the code only, so `public/` is not committed. Before rendering, copy the website's photos into `public/img/` and its fonts into `public/fonts/`. Then add a `public/noise.png` grain texture and run `npm run soundtrack` to create the audio.

`npm run studio` opens Remotion Studio to scrub the timeline. On Windows, keep the project outside the Claude app's AppData folder. Path virtualization there stops npm from running esbuild.

## How it is synced

The soundtrack is synthesized from scratch in `scripts/make_soundtrack.py`; there are no samples or licensed music. It runs at 128.6 BPM, so one beat is exactly 14 frames at 30 fps. `src/lib/timing.ts` shares that grid with the visuals, so every slam, cut, shake and flash lands on a drum hit.

| Frames | Bars | Scene | Sound |
| --- | --- | --- | --- |
| 0–112 | 1–2 | The website loader: a slit opens with the looks flickering inside, V Ā R A slam in on the beat, the camera dives in | Pad swell, counter ticks, four glitch hits, riser |
| 112–224 | 3–4 | First drop: DRESSED / FOR / *now.*, then the eight looks strobe on 8ths | Impact and crash, kick and clap groove, a camera shutter on every cut |
| 224–336 | 5–6 | The hero ribbon in 3D; the cursor drags it, lands on Indigo and clicks it open | Arpeggio, drag whoosh, UI click, zoom whoosh |
| 336–448 | 7–8 | The denim edit: "Some fits just hit." on the snare, then a *No notes.* stamp; the denim drape rises | Snare hits, stamp impact, riser, big whoosh |
| 448–560 | 9–10 | Second drop: AFTER *hours.*; the frayed hem lifts and confetti erupts | Impact, crash, confetti pops, reese bass, hook |
| 560–672 | 11–12 | *Find your colour.* Cards deal out, the cursor hovers each and its colour floods the screen | Eight rising pops, eight hover clicks |
| 672–784 | 13–14 | Be the MAIN *character.* Tape marquees and stickers slapping on | Hook, sticker slaps |
| 784–840 | 15 | Build: NEW DROPS EVERY FRIDAY over accelerating duotone cuts, then a beat of black | Accelerating snare roll, riser, silence |
| 840–900 | 16 | End card: denim with the waistband, VĀRA wordmark, the cursor clicks SHOP THE DROP | Final impact and F minor 9 chord ringing out |

Mastered to about −13 LUFS with −0.9 dB peak, suited to social platforms.

## Files

- `src/Promo.tsx` — the composition: scenes, drape transition, overlays and audio.
- `src/scenes/` — `Opening` (loader, first drop), `Ribbon`, `Edits` (denim edit, drape wipe, after hours), `Finale` (colour menu, main character, build, end card).
- `src/lib/fx.tsx` — camera shake, flashes, grain, the website-style HUD, the cursor, confetti and marquee tape.
- `src/lib/Drape.tsx` and `src/lib/denim-art.js` — the website's denim drape, made deterministic for video.
- `public/` — the website photos and fonts, `noise.png` grain, and the synthesized soundtrack.

Photography is from Unsplash (see the website's `ASSET_PROVENANCE.md`); the fonts are the website's Latin Modern and Nimbus Sans files.
