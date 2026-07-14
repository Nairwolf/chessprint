# ChessPrint — Handover

## Status

MVP implemented and committed on `main`. All 9 steps from CLAUDE.md are done.
The app runs, validates FENs, previews boards in the browser, and exports a PDF via `@react-pdf/renderer`.

**Bug 1 (extra empty PDF page) and Bug 2 (unrecognizable pieces) are both FIXED and committed.**

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

## Bug 1 — Extra empty page in PDF ✅ FIXED (commit d88e953)

**Symptom:** 5 FENs with 4 diagrams/page produced 3 pages: page 1 had 4 diagrams, page 2 was empty, page 3 had the 5th diagram. Expected: 2 pages.

**Root cause:** After removing the header's `marginBottom: 8`, the page content (header 40 + grid 2×377 = 754 → **794pt**) exactly equaled the usable height (842 − 2×24 = **794pt**). At exact equality `@react-pdf`'s rounding still spills into a blank continuation page. So removing `marginBottom` alone was necessary but not sufficient.

**Fix applied:**
1. Removed `marginBottom: 8` from `styles.header` in `src/components/pdf/PdfPage.tsx` (header now occupies exactly `headerHeight`).
2. Added a `safetyPad = 2` in `src/lib/layout.ts`, subtracted from `gridHeight`, so content stays *strictly* below the page height.

**Verified:** Rendered the real `PdfDocument` in Node via `@react-pdf/renderer`'s `renderToFile`, counted pages with `pdfinfo`, and rasterized with `pdftoppm`. Results: 4/page × 5 FENs → 2 pages; full pages (4/page×4, 6/page×6) → 1 page; 2/page × 5 FENs → 3 pages. Page 2 now correctly holds the 5th diagram (no blank page). `npm run typecheck` passes.

**Docs:** The single-page containment rule is documented in `CLAUDE.md` (PDF layout rules) and `ARCHITECTURE.md` §7 (commit 3a80ce8) so it isn't reintroduced.

---

## Bug 2 — Chess pieces are unrecognizable ✅ FIXED (2026-07-07)

**Symptom:** Pieces on both the web preview and the PDF were ugly and unrecognizable (hand-crafted SVG approximations).

**Fix applied:** Replaced with the Lichess **caliente** set (by avi, **CC BY-NC-SA 4.0 — non-commercial only**; attribution in `NOTICE` + `pieces.ts` header), chosen by the user over the originally planned cburnett. `src/lib/pieces.ts` is now a generated file: `PIECES: Record<PieceKey, PieceLayer[]>` on a 45×45 viewBox, keyed by raw FEN letter. A one-time scratchpad extraction script (not committed) flattened the 12 source SVGs from `lila/public/piece/caliente/`: single-stop gradients → solid fill + opacity, group/matrix transforms baked into geometry, circles/ellipses → cubic béziers, rescaled from the 16.933 viewBox, no arc commands. Both board components map over the layer array; the `toLowerCase()`/`isWhitePiece` logic is gone. New types `PieceKey`/`PieceLayer` in `src/types/index.ts`.

**Verified:** typecheck + lint + build; real `PdfDocument` rendered via Node/`renderToFile`, rasterized at 300 dpi (crisp pieces, shadow opacity correct, 5 FENs @ 4/page → still 2 pages); built app driven in headless Chromium via raw CDP (Node's built-in WebSocket, no puppeteer) — web preview matches the PDF.

The plan below is kept for reference (it was written for cburnett; the caliente implementation followed the same structure).

### Planned approach (from a planning session — superseded by the caliente implementation above)

**1. Data structure.** cburnett white and black pieces are genuinely different artwork (not one shape recolored), and each piece is multiple `<path>` layers with per-path fill/stroke. So the current `PIECE_PATHS: Record<string,string>` (single path, color decided by the component) must become a per-layer structure keyed by the **raw FEN letter** (12 keys: `K Q R B N P k q r b n p`). `fenToBoard` already preserves FEN case, so `PIECES[piece]` replaces both the `.toLowerCase()` lookup and the `isWhitePiece` fill/stroke branching.

Proposed types (in `src/types/index.ts`):
```ts
type PieceLayer = { d: string; fill: string; stroke?: string; strokeWidth?: number; fillRule?: 'nonzero'|'evenodd'; opacity?: number }
type PieceKey = 'K'|'Q'|'R'|'B'|'N'|'P'|'k'|'q'|'r'|'b'|'n'|'p'
```
Data in `src/lib/pieces.ts`: `export const PIECES: Record<PieceKey, PieceLayer[]>`.

**2. Sourcing = vendor, not npm (recommended).** Aligns with the "custom SVG, no heavy dependency" principle and avoids the `allowScripts` gate. Fetch the 12 canonical cburnett SVGs (Lichess `lila` repo `public/piece/cburnett/*.svg`, already 45×45) and run a **one-time scratchpad extraction script** (kept out of the repo). The committed artifact is the generated `pieces.ts`. The extraction script must:
   - Flatten `<g>`-inherited fill/stroke/fill-rule/opacity down onto each `<path>` (we re-emit paths individually, so inheritance can't be relied on).
   - Bake any ancestor `transform` into the geometry so the only runtime transform stays `translate(x,y) scale(sq/45)`.
   - **Convert all arc commands (`A`/`a`) to cubic béziers** (e.g. `svgpath(d).unarc().abs().round(3)`), because `@react-pdf`'s `<Path>` has weak/buggy arc support — arc-free `M/L/C/Z` data renders identically in the web SVG and the PDF. This is the single biggest risk; **must be verified by actually rendering a PDF.**

**3. Component changes** (`ChessBoard.tsx` and `ChessBoardPdf.tsx`, kept as mirror images):
   - Import `PIECES` instead of `PIECE_PATHS`; drop `toLowerCase()` and `isWhitePiece`.
   - Inside the existing `translate+scale(sq/45)` wrapper (`<g>` / `<G>`), **map over the layer array**, rendering one `<path>` / `<Path>` per layer honoring `fill`, `stroke`, `strokeWidth`, `fillRule`, `opacity`.
   - Board squares, outer border, and the side-to-move indicator are **untouched**. No layout/props changes, so `PdfPage`/`PdfExercise`/`computeLayout` are unaffected.

**4. Attribution (CC BY-SA 3.0, share-alike).** Keep an attribution header in `pieces.ts`, and add a project-level NOTICE/README credit (the header comment is stripped from minified `dist/`, so a separate notice is the robust choice). **Open decision — confirm with user:** exact attribution placement, and whether the extraction script should be committed under `scripts/` or left in scratchpad.

### Verification (reuse the Bug 1 technique)
1. `npm run typecheck` + `npm run lint`.
2. `npm run dev` — load a FEN exercising all 12 glyphs; check identity, white/black contrast, no clipped `evenodd` regions, crisp scaling.
3. **PDF parity (critical):** bundle `PdfDocument` with `node_modules/.bin/esbuild` (`--bundle --packages=external --platform=node --format=esm`, output *inside* the project dir so `node_modules` resolves), call `renderToFile` to `scratchpad/out.pdf`, then `pdftoppm -png` and inspect. Confirm arcs render as smooth curves, `evenodd` holes are correct, and black-piece internal white details show.
4. Side-by-side web vs rasterized PDF for the same FEN — they must match.

**Files affected:** `src/types/index.ts`, `src/lib/pieces.ts`, `src/components/diagram/ChessBoard.tsx`, `src/components/diagram/ChessBoardPdf.tsx` (+ a NOTICE/README for attribution).

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

## Open idea — adapt the last page to its diagram count (not started)

Raised by the user on 2026-07-14. Today `computeLayout(exercisesPerPage)` is computed **once**
for the whole document, so a partly-filled final page reuses the full-page layout. Example: 6
positions at 4/page → page 2 shows only 2 diagrams, but sized as if 4 would fit, wasting space.

**Desired rule:** on the final (partial) page, use the layout that matches the number of
diagrams that actually remain — e.g. 2 leftover diagrams should use the 2-per-page layout.

**Implementation sketch:** `PdfDocument.tsx` already slices exercises into per-page groups
(`App.tsx`/`PdfDocument.tsx`). `computeLayout` would be called per page with an effective count
= `min(exercisesPerPage, remainingOnThisPage)`, and that page's layout passed to `PdfPage`.
Watch: the odd-count centering logic (`isCentered` / `centered`) and the single-page
containment rule (`safetyPad`) must still hold for the recomputed layout. Interacts with the
"per-layout tuning" idea below — the last page would inherit whatever layout each count uses.

## Open idea — per-count layout tuning (not started)

Raised by the user on 2026-07-14. Some diagrams-per-page layouts could be better:

- **2 per page:** prefer **one diagram on top, one on the bottom** (stacked, 1 column × 2 rows)
  rather than the current 2 columns × 1 row — bigger boards, better use of the tall A4 page.
  Would make `columns`/`rows` in `computeLayout` a per-count choice rather than the current
  "1 column only when count is 1, else 2 columns" rule.
- **1 per page:** the single board is now ~496pt — probably **too big**. Shrink it a bit so
  there's deliberate empty space, which pairs with the existing v2 direction of adding
  child-friendly illustrations/decorations to fill the space when the sheet is for kids.

Both are tuning of `computeLayout` (`src/lib/layout.ts`) and would want a fresh render + visual
check per count. Best done together with the last-page-adaptation idea above.

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
