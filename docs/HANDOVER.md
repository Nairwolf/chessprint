# ChessPrint — Handover

## Status

MVP implemented and committed on `main`. All 9 steps from CLAUDE.md are done.
The app runs, validates FENs, previews boards in the browser, and exports a PDF via `@react-pdf/renderer`.

```
3a80ce8 docs: document single-page containment rule for PDF layout
d88e953 fix: remove blank continuation page in PDF export
a2ebf8b feat: implement PDF generation (steps 7-9)
3b0345d feat: wire App.tsx — global state, debounced validation, two-column layout
1624f28 feat: implement UI components (ExerciseForm, ExportControls, ErrorMessage, Preview)
154fd91 feat: implement ChessBoard SVG diagram component
7109206 feat: implement lib layer (parser, validator, fen, layout)
d003479 chore: scaffold Vite + React 18 + TypeScript project
```

---

## Board orientation ✅ DONE (2026-07-15)

Diagrams can now be oriented from White's side, from Black's side, or **by turn** (default —
the side to move sits at the bottom). Built in two steps:

1. Automatic by-turn orientation. `orientBoard(board, 'w' | 'b')` in `src/lib/fen.ts` flips
   the board for Black (reverses both rank and file order = 180° rotation).
2. User-selectable mode. A segmented control (**By turn · White · Black**) in
   `ExportControls.tsx` drives an `orientation` state in `App.tsx`, threaded into both the
   preview and the PDF config (`ExportConfig.orientation: OrientationMode`).

`resolveOrientation(mode, activeColor)` (in `fen.ts`) maps the mode to a concrete `'w' | 'b'`
at each render site (`Preview.tsx`, `PdfExercise.tsx`), where the exercise's `activeColor` is
known; `'auto'` returns the side to move. Both `ChessBoard.tsx` and `ChessBoardPdf.tsx` take an
explicit `orientation: 'w' | 'b'` prop for the flip. The active-color indicator circle stays
tied to the real side to move and remains at the bottom-right in every mode.

**Verified:** user confirmed preview + PDF across all three modes for White-to-play and
Black-to-play positions. `npm run typecheck` + `npm run lint` pass. Docs (SPEC §3.3/§3.5,
ARCHITECTURE §4/§6, CLAUDE.md) updated to match.

---

## Deploy to Vercel ✅ DONE (2026-07-15)

**Live at https://chessprint.nairwolf.net** (custom domain, HTTPS).

Deployed via Vercel's GitHub integration: the **Nairwolf/chessprint** repo is imported into a
Vercel project, so every push to `main` triggers an automatic production deploy. No
`vercel.json` was needed — Vercel auto-detected the **Vite** preset (build `npm run build`,
output `dist/`, install `npm install`), and the app is a pure client-side SPA with no
router, so no SPA rewrite or environment variables are required.

**Custom domain (chessprint.nairwolf.net):** added in Vercel's *Settings → Domains*, then a
single **CNAME** record at the registrar (Gandi):

```
chessprint  CNAME  300  b5197159e0b4bcc5.vercel-dns-017.com.
```

Vercel issues that unique per-domain CNAME target (not the generic `cname.vercel-dns.com`);
it resolves to Vercel's anycast IPs and Vercel auto-provisioned the Let's Encrypt cert.
Verified live: `curl -I https://chessprint.nairwolf.net` → `HTTP/2 200`, `server: Vercel`,
HSTS present. The rest of the nairwolf.net zone (root `A`, Gandi `MX`/SPF, `blog`, `webmail`,
`www`) was left untouched.

**Licensing heads-up:** ChessPrint is CC BY-NC-SA 4.0 (the caliente piece set is
NonCommercial). The public deployment is fine for personal/non-commercial use, but the site
must not be used commercially (no ads, no paid access) without replacing the piece set.

---

## PDF UI polish — diagram layout ✅ DONE (2026-07-14)

Two rounds of PDF layout work on top of the MVP, both committed to `main`.

```
776f646 feat: enlarge and center chess diagrams, compact writing space
e24d949 feat: center the document title in the PDF header
```

**1. Centered the document title (commit e24d949).** The header title was left-aligned.
Two failed attempts first: `textAlign: 'center'` with `width: '100%'`, then with `flex: 1`,
both on the title `Text`. Neither worked because in `@react-pdf` a `Text` node does **not**
stretch to fill a `flexDirection: 'row'` parent, so the text box shrank to its content and
`textAlign` had nothing to center within. **Fix:** made the header a **column** container
(`@react-pdf`'s default) with `justifyContent: 'center'` for vertical centering; the title
`Text` then stretches full-width via the default `alignItems: 'stretch'`, so `textAlign:
'center'` takes effect. In `src/components/pdf/PdfPage.tsx`.

**2. Bigger, centered diagrams with a compact writing strip (commit 776f646).** Three
complaints: boards too small, boards not centered (the right-column board hugged the center
gutter because cells used `alignItems: 'flex-start'`), and the writing space too large (a
`flex: 1` filler soaked up all leftover height — ~206pt under a 170pt board at 4/page).
**Fixes:**
- `src/lib/layout.ts` — `boardSize` is now `min(widthBudget, heightBudget)` instead of
  `min(cellWidth, cellHeight) * 0.62`. `widthBudget` fills the column (accounting for the
  active-color circle overhang, `circleFactor 1.07` + `circlePad 8`); `heightBudget` leaves
  room for the optional title (`titleAllow 14`) and a compact writing strip
  (`answerFrac 0.18` of cell height), with a `boardSafety 3` margin. Resulting board sizes
  (was → now): 1/pg 339→~496, 2/pg 170→~241, 3&4/pg 170→~241, 5&6/pg 155→~184.
- `src/components/pdf/PdfExercise.tsx` — each cell now centers its content both ways
  (`alignItems: 'center'` + `justifyContent: 'center'`); the writing space is a fixed-height
  `View` (`answerHeight`) instead of `flex: 1`. The now-unused `centered` prop was dropped
  (also from the `PdfPage.tsx` call site).

**Verified:** numerically checked all six per-page settings fit within the cell with a safety
margin; rendered real PDFs via `renderToFile` (5 FENs → correct page counts, no blank
continuation pages) and rasterized the 4/page sheet with `pdftoppm` to confirm larger,
symmetric, centered boards with a compact writing strip. `npm run typecheck` + `npm run lint`
pass. Docs (SPEC §3.4/3.5, ARCHITECTURE §7, CLAUDE.md) updated to match.

**Known minor limitation:** because the active-color circle sits to the right of the board,
the 8×8 grid lands ~12pt left of exact cell-center. Barely perceptible; not compensated for.

---

## Open idea — B&W print contrast (not started)

Grayscale printing was checked on 2026-07-07 (simulations in `~/chessprint-verification/`: `gray-page1.png`, `bw-crop.png`). Pieces read perfectly in grayscale and even 1-bit dither; the weak point is the board itself — the tan/brown squares (`LIGHT_SQ`/`DARK_SQ` in both ChessBoard components) lose contrast under coarse 1-bit dithering. Possible improvement: raise the luminance gap between the two square colors, or add a "print-friendly" palette option. Two-constant change; user has not decided yet.

---

## Adaptive last page + per-count layout tuning ✅ DONE (2026-07-15)

Two ideas (raised 2026-07-14) shipped together, since both live in `computeLayout`.

**1. Adaptive final page.** `computeLayout` was computed **once** for the whole document, so a
partly-filled final page reused the full-page layout (6 positions at 4/page → page 2 showed 2
diagrams sized as if 4 would fit). Now `PdfDocument.tsx` calls `computeLayout` **per page** with
an effective count = `min(exercisesPerPage, diagramsOnThisPage)`, so the last page adopts the
layout for the count it actually holds and its diagrams fill the page.

**2. Per-count table tuning.** The `columns`/`rows` derivation in `computeLayout` became an
explicit per-count table:
- **2/page → stacked** (1 col × 2 rows instead of 2 cols × 1 row): board ~240 → ~283pt, using
  the tall A4 better.
- **1/page → shrunk** via `boardScale = 0.8` (board ~496 → ~397pt), leaving deliberate empty
  space (pairs with the v2 kid-decorations direction). The cell centers the *board + writing
  strip block*, so the shrunk lone board looked ~69pt above the cell's true center; `PdfExercise`
  now adds a matching spacer above the board in the single-board case (`columns === 1 && rows === 1`)
  so the board itself is vertically centered (measured board center ~438.5 vs cell center 440).
- `centered` is now `columns === 2 && count % 2 === 1` (only the 2-column odd counts 3 and 5).

Because #1 routes the effective count through `computeLayout`, the last page **inherits** the
tuned table automatically — e.g. 2 leftover diagrams now stack too.

Also added a named `ExercisesPerPage` type (`src/types/index.ts`) reused by `ExportConfig` and
`computeLayout`.

**Verified:** rendered all six per-page counts + a 6-at-4/page doc via `renderToFile`; confirmed
page counts (no blank continuation pages) and rasterized 1/page, 2/page, 3/page, and the adaptive
page 2 with `pdftoppm` — stacked 2/page, shrunk 1/page, intact odd-count centering, and the
partial page inheriting the stacked layout. `npm run typecheck` + `npm run lint` pass. Docs
(SPEC §3.5, ARCHITECTURE §7, CLAUDE.md) updated to match.

---

## Lichess puzzle import ✅ DONE (2026-07-16)

A collapsible "Load puzzles from Lichess" panel (`src/components/ui/LichessImport.tsx`) below
the exercise textarea fetches random puzzles anonymously from
`GET https://lichess.org/api/puzzle/batch/{theme}?nb={1-30}&difficulty={easiest…hardest}`
(CORS `*`, no auth — the app's only network call). Logic lives in `src/lib/lichess.ts`:
curated `LICHESS_THEMES` / `LICHESS_DIFFICULTIES`, `pgnToFen` (replays the truncated SAN
movetext move-by-move — `chess.loadPgn` won't parse it, no move numbers), `fetchLichessPuzzles`
(dedupes by id within a batch, skips unreplayable PGNs, friendly errors incl. 429), and
`puzzlesToLines`. Loaded puzzles are **appended** to `fenText` as normal lines
`FEN ; Lichess <id> (<rating>)`, so preview/validation/PDF need no changes; the panel also
shows an ephemeral result list (id linked to `lichess.org/training/<id>` + rating).

**Verified (headless Chromium, recipe saved in `.claude/skills/verify/SKILL.md`):** two batches
append correctly; a loaded FEN cross-checked against `GET /api/puzzle/<id>` matches the puzzle
position; network failure shows a clean in-panel error without touching the textarea; PDF
export with 5 loaded puzzles renders titles/indicators/adaptive last page correctly.

**Known minor limitation:** duplicates across separate anonymous batches are possible (the API
only guarantees no-repeats for authenticated users); duplicates within one batch are filtered.

---

## Open idea — kid coloring line-art in empty space (not started)

Raised 2026-07-15. Fill the deliberate empty space (1/page shrunk board, leftover last-page
cells) with simple black-outline cartoon drawings kids can color in. This is the CLAUDE.md v2
direction "child-friendly decorations to fill empty space when exercisesPerPage < 6".

**1. Feasibility — yes, cleanly.** Reuse the existing SVG-path machinery. Coloring art is the
same problem as the pieces (`src/lib/pieces.ts`): pre-flattened SVG paths rendered through
`@react-pdf` primitives, but as **outlines only** (`stroke="black" fill="none"`) so there's
white space inside to color. Same discipline as the pieces applies: **no arcs, no gradients,
no transforms, no `<image>` bitmaps** — `@react-pdf`'s SVG support is partial. Vector line art
only; **not** raster PNG cartoons (wouldn't be colorable and print poorly).

Proposed shape:
- `src/lib/coloring.ts` — vendored line-art path data (mirror `pieces.ts`: a `Record` of
  named art → flattened path layers, fixed viewBox).
- `src/components/pdf/ColoringArt.tsx` — PDF component, `@react-pdf` SVG primitives only
  (`<Svg>`, `<Path>` with `stroke`/`fill="none"`). Never mix with web React SVG.
- Slot into empty cells / leftover last-page space. Decide scope (below).

**2. Sourcing the art.** License matters — the project already carries a NonCommercial
constraint from the caliente pieces; prefer **CC0** art to avoid stacking another one.
Best-first: **openclipart.org** (CC0, big simple-cartoon library, already SVG); **SVG Repo**
Monocolor/Doodle collections (many CC0/MIT, license-filterable); or generate + vectorize your
own for a consistent themed set. Pipeline for any source: SVG → flatten (SVGO + convert
arcs/transforms to plain paths, e.g. Inkscape "Object to Path" + "Optimized SVG", or
`svg-flatten`) → paste path data into `coloring.ts`. Pick a small themed set (~10–20) of
simple, single-weight outlines — thin outlines survive scaling and B&W printing best.

**3. Random picture per page — yes, but keep it deterministic.** PDF render must stay stable
across re-renders/re-downloads, so **no `Math.random()` during render** (it would reshuffle
art and fight React reconciliation). Instead seed selection: `art[pageIndex % art.length]`,
optionally offset by a per-document seed derived from an exercise `id`. Looks random and
varied, stays stable.

**Open decisions before implementing:**
- **Scope** — only the intentional empty space (1/page shrunk board, leftover last-page
  cells), or decorate every page? CLAUDE.md's idea is specifically `exercisesPerPage < 6`.
- **License** — confirm CC0 to avoid a second NonCommercial dependency.

Suggested first step: prototype one seeded line-art shape in the leftover space of the
adaptive last page as a proof of concept, verify via `renderToFile` + `pdftoppm`.

---

## Dev commands

```bash
npm run dev        # http://localhost:5173 (or 5174 if port taken)
npm run build      # production build → dist/
npm run typecheck  # tsc --noEmit
npm run lint       # ESLint
```

---

## Architecture reminders

- All state in `App.tsx` via `useState` — no external store.
- `src/lib/` contains all business logic; components are thin.
- `ChessBoard.tsx` uses standard React SVG (`<svg>`, `<rect>` …). `ChessBoardPdf.tsx` uses `@react-pdf/renderer` primitives (`<Svg>`, `<Rect>` …). **Never mix them.**
- `computeLayout()` in `src/lib/layout.ts` is the single source of truth for all PDF sizing. PDF components must not hardcode dimensions.
- Tailwind applies only to UI components. PDF components use `StyleSheet.create()` from `@react-pdf/renderer`.
