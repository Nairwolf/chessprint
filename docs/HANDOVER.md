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
