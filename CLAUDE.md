# ChessPrint — Claude Code Instructions

## What is this project?

ChessPrint is a 100% frontend static web app that generates printable chess exercise PDFs for children. Users paste a list of FEN positions, configure the layout, and download a PDF with large diagrams and free answer spaces for children to write on.

Read docs/SPEC.md and docs/ARCHITECTURE.md in full before doing anything. They are the source of truth for all features and technical decisions.

---

## Stack

- **React 18** + **TypeScript** + **Vite** (static build)
- **Tailwind CSS** (UI styling only)
- **chess.js** (FEN parsing and validation)
- **@react-pdf/renderer** (PDF generation)
- No backend. No database. No authentication. No persistence.

---

## Commands

```bash
npm run dev        # Start development server
npm run build      # Production static build (outputs to dist/)
npm run typecheck  # TypeScript type check (no emit)
npm run lint       # ESLint
npm run preview    # Preview production build locally
```

---

## Project structure

```
chessprint/
├── public/
│   ├── fonts/                  # Fonts embedded in @react-pdf PDFs
│   └── puzzle-index/           # Generated static puzzle index (band JSONs + manifest) — do not edit by hand
├── tools/
│   └── build-puzzle-index.ts   # Index builder (npm run build:index), run monthly by CI
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── ExerciseForm.tsx     # Document title field + FEN textarea
│   │   │   ├── ExportControls.tsx   # Diagrams-per-page selector + export button
│   │   │   ├── ErrorMessage.tsx     # Blocking error display (line number + reason)
│   │   │   ├── LichessImport.tsx    # Collapsible panel: load Lichess puzzles by theme/rating/count + answer-key toggle
│   │   │   └── Preview.tsx          # Parsed exercise list preview
│   │   ├── diagram/
│   │   │   ├── ChessBoard.tsx       # SVG diagram for the web UI (standard React SVG)
│   │   │   └── ChessBoardPdf.tsx    # SVG diagram for @react-pdf (<Svg> primitives only)
│   │   └── pdf/
│   │       ├── PdfDocument.tsx      # Root <Document> component (@react-pdf)
│   │       ├── PdfPage.tsx          # <Page> with repeated header and exercise grid
│   │       ├── PdfExercise.tsx      # Single exercise: diagram + free answer space
│   │       └── PdfSolutionsPage.tsx # Optional answer-key page(s): two-column list of SAN solutions
│   ├── lib/
│   │   ├── parser.ts            # Splits lines on ";", extracts FEN and optional title
│   │   ├── validator.ts         # Validates each FEN via chess.js, returns ParseError[]
│   │   ├── fen.ts               # FEN utilities (extract active color, piece positions)
│   │   ├── lichess.ts           # Lichess theme constants (THEME_BITS shared with indexer) + line/solution formatting
│   │   ├── puzzleIndex.ts       # Static puzzle index client (band loading, rating filter, sampling)
│   │   └── layout.ts            # Computes dynamic sizes from exercisesPerPage (1–6)
│   ├── types/
│   │   └── index.ts             # Shared types: Exercise, ParseError, ExportConfig
│   ├── App.tsx                  # Root component, global state
│   └── main.tsx                 # Vite entry point
├── CLAUDE.md
├── SPEC.md
├── ARCHITECTURE.md
├── index.html
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.ts
```

---

## Shared types

Always define types in `src/types/index.ts` before implementing any logic. Never redefine types inline in components.

```typescript
type Exercise = {
  id: string;              // UUID generated at parse time
  fen: string;             // Raw validated FEN string
  title?: string;          // Optional exercise title
  activeColor: 'w' | 'b'; // Extracted from FEN automatically
  solution?: string;       // Space-joined SAN solution moves (Lichess-imported puzzles only)
};

type ParseError = {
  line: number;   // 1-indexed line number
  raw: string;    // Raw content of the faulty line
  reason: string; // Human-readable error description
};

type OrientationMode = 'white' | 'black' | 'auto'; // 'auto' = by turn (side to move)

type ExportConfig = {
  documentTitle: string;
  exercisesPerPage: 1 | 2 | 3 | 4 | 5 | 6;
  orientation: OrientationMode;
  allowMissingKings: boolean; // opt-in; see Validation below
  includeSolutions: boolean;  // opt-in answer key; see Lichess puzzle import below
  coordinates: boolean;       // opt-in a-h/1-8 gutter; see Diagram rendering below
};
```

---

## Key implementation rules

### Input format
Each line in the textarea follows this format:
```
FEN ; title (optional)
```
- Separator is `;`
- Title is optional — if absent, the exercise has no individual title
- Empty lines must be silently ignored
- Active color (`w` or `b`) is extracted from the FEN itself, never entered by the user

### Validation
- Validate every FEN using `chess.js`
- If **any** line is invalid, block the entire export
- Return all errors at once (not just the first one)
- Each `ParseError` must include the 1-indexed line number and a clear reason
- Validation is triggered on input with a ~300ms debounce, and again on export click
- **Allow missing kings** (`ExportConfig.allowMissingKings`, off by default): when enabled, a FEN that chess.js rejects is retried with phantom kings inserted on empty squares (`withPlaceholderKings` in `src/lib/fen.ts`). If the patched FEN validates, the original (kingless) FEN is accepted for rendering; otherwise the patched attempt's error is reported. This relaxes **only** the king-count check — malformed FENs, back-rank pawns, and *too many* kings stay blocked. Rendering needs no changes: `fenToBoard` parses the raw FEN and never calls chess.js

### Lichess puzzle import (static index)
- `LichessImport.tsx` (below the textarea) loads random puzzles by **theme + rating range [min, max] + count** from a **static, pre-built index** served from `public/puzzle-index/` — no Lichess API calls at runtime (the live API cannot filter by rating). Band files are same-origin fetches (~31 KB gzipped each).
- Index format: one JSON file per 100-pt rating band (`1600.json` = ratings 1600–1699), each a bare array of `IndexEntry = [id, fen, rating, themeMask, solutionSan]`, plus `manifest.json` (build metadata). FENs are already **solver-facing**: the Lichess CSV FEN is the position *before* the opponent's setup move, and the indexer applies `Moves[0]` at build time. `solutionSan` is the rest of the line (`Moves[1..]`) converted to **space-joined SAN** at build time — the printable answer key (see below).
- Runtime logic in `src/lib/puzzleIndex.ts`: `bandsFor`, `loadPool` (missing band → empty; all missing → friendly error), `samplePuzzles` (theme bitmask filter, excludes ids already in the textarea, partial Fisher–Yates; carries `solution` through, defaulting to `''` for any stale 4-tuple band). Theme constants in `src/lib/lichess.ts`: `LICHESS_THEMES` (UI list, `mix` = no filter) and `THEME_BITS` (slug → bit, **imported by the indexer too** so index and app cannot drift).
- Index builder: `npm run build:index` → `tools/build-puzzle-index.ts` (tsx). Streams `lichess_db_puzzle.csv.zst` (CC0) via `curl | zstd -d`, filters quality (`RD < 90`, `Popularity > 80`, `NbPlays > 100`), reservoir-samples 1000/band, then replays each sampled puzzle with chess.js — applying `Moves[0]` for the solver-facing FEN and `Moves[1..]` to collect SAN (a puzzle whose moves don't replay is dropped). Rebuilt monthly by `.github/workflows/rebuild-puzzle-index.yml` (also `workflow_dispatch`); the generated `public/puzzle-index/` is committed.
- Loaded puzzles are **appended** to `fenText` as normal input lines `FEN ; Lichess <id> (<rating>)` — no special downstream handling; the panel also shows an ephemeral result list (id linked to `lichess.org/training/<id>` + rating). Ratings are dump-fresh (≤ ~2 months stale), acceptable for printed sheets.
- **Hide puzzle rating** (off by default, checkbox in the Lichess import panel next to "Include solutions"): when on, `puzzlesToLines(puzzles, hideRating)` (`src/lib/lichess.ts`) omits the `(<rating>)` suffix, so appended lines read `FEN ; Lichess <id>` — this is what prints under the diagram, hiding a difficulty signal from the child. Only affects the embedded title; the ephemeral in-panel result list still always shows the rating (useful to whoever is building the sheet, never printed). `lichessIdFromTitle` only matches the `Lichess <id>` prefix, so answer-key solution matching is unaffected either way. The duplicate-id detection regex in `App.tsx` (`existingLichessIds`) matches `; Lichess (\w+)` without requiring a trailing rating, so dedup still works across loads regardless of the toggle's state at load time.
- **Answer key** (`ExportConfig.includeSolutions`, off by default; toggle lives **in the Lichess import panel**, not `ExportControls`): solutions are kept out of the textarea in a **session map keyed by Lichess id** in `App.tsx` (populated on import via `puzzlesToSolutionMap`, merged across loads). At export, `attachSolutions` (`src/lib/lichess.ts`) matches each exercise to its solution by parsing the id from its `Lichess <id>` title. When enabled and at least one exercise has a solution, `PdfDocument` appends dedicated **solutions page(s)** *after* all diagram pages (never mixed in): `PdfSolutionsPage` renders a **two-column** list (up to 50 rows/page — `SOLUTION_ROWS_PER_PAGE`) of `ordinal · Lichess <id> title · numbered SAN`. `formatSolution(fen, san)` adds move numbers from the solver-facing FEN's side-to-move + fullmove counter (e.g. `1. Qxf7+ Kxf7 2. Ng5+`, or `24... Rd8 25. Qxd8+` when Black starts). Solutions exist only for Lichess-imported puzzles; manual FENs get none.

### Diagram rendering
- Pieces are rendered as **SVG vector paths**, never as Unicode characters
- Piece set: Lichess **caliente** (CC BY-NC-SA 4.0, attribution in `NOTICE` — non-commercial use only), vendored as generated layered-path data in `src/lib/pieces.ts` (`PIECES: Record<PieceKey, PieceLayer[]>`, 45×45 viewBox). Do not edit that file by hand; the data is pre-flattened (no arcs, no gradients, no transforms) so it renders identically in web SVG and `@react-pdf`
- **Board coordinates** (`ExportConfig.coordinates`, off by default; checkbox in `ExportControls`): when on, file letters (a-h) render along the **bottom** edge and rank numbers (1-8) up the **left** edge, in a thin gutter **outside** the 8×8 grid — never overlapping squares or pieces. Orientation-aware via `coordLabels(orientation)` in `src/lib/fen.ts`, which returns labels in the board's current display order (mirrors `orientBoard`'s reordering). Gutter size is `COORD_GUTTER_FRAC` (also in `src/lib/fen.ts`), shared with `computeLayout` so `boardSize` shrinks to leave room for the gutter instead of it overflowing the cell. Rendered in both `ChessBoard.tsx` (web preview) and `ChessBoardPdf.tsx` (PDF export)
- **Board orientation**: both `ChessBoard.tsx` and `ChessBoardPdf.tsx` take an explicit `orientation: 'w' | 'b'` prop and flip the grid via `orientBoard()` in `src/lib/fen.ts`. The user picks a mode (`ExportConfig.orientation: 'white' | 'black' | 'auto'`); resolve it per exercise with `resolveOrientation(mode, activeColor)` (`'auto'` = side to move). The active-color indicator circle is independent of orientation — always driven by the FEN's real side to move
- Active color indicator: a filled circle outside the board, bottom-right corner
  - Black filled circle = Black to play
  - White circle with dark border = White to play
- `ChessBoard.tsx` uses standard React SVG elements (`<svg>`, `<rect>`, `<path>`)
- `ChessBoardPdf.tsx` uses **only** `@react-pdf/renderer` SVG primitives (`<Svg>`, `<Rect>`, `<Path>`, `<G>`) — never mix the two

### PDF layout
- Page size: A4 (595 × 842 pt)
- Header: document title, **horizontally centered**, repeated on every page, ~40 pt height
- Grid shape (columns × rows) is a per-count table in `computeLayout`, not a formula
- Sizes are computed in `layout.ts` — no hardcoded sizes in PDF components

| exercisesPerPage | Columns | Rows | Notes |
|---|---|---|---|
| 1 | 1 | 1 | Single diagram, deliberately shrunk (`boardScale 0.8`) to leave empty space |
| 2 | 1 | 2 | **Stacked** — one diagram on top, one below (bigger boards on the tall A4) |
| 3 | 2 | 2 | Last cell of row 2 centered |
| 4 | 2 | 2 | |
| 5 | 2 | 3 | Last cell of row 3 centered |
| 6 | 2 | 3 | |

- **Adaptive final page:** `computeLayout` is called **per page** in `PdfDocument.tsx` with an effective count `min(exercisesPerPage, diagramsOnThisPage)`, so a partly-filled last page uses the layout for the number of diagrams it actually holds (e.g. 2 leftovers use the stacked 2/page layout) instead of reusing the full-page sizing.
- `centered` is `columns === 2 && count % 2 === 1` (only the 2-column odd counts, 3 and 5, center their last cell across the full grid width).
- Each cell centers its content (`alignItems: 'center'` + `justifyContent: 'center'`): the diagram + writing strip block is centered both horizontally and vertically. Diagrams are sized to fill the column width.
- **Single-board centering (1/page):** because the writing strip is part of the centered block, it pushes the diagram above the cell's true center — invisible on dense pages but obvious for the lone, shrunk 1/page board. `PdfExercise` detects the single-board case (`columns === 1 && rows === 1`) and adds a matching spacer **above** the board, so the board itself is vertically centered with symmetric empty space and a real writing strip still below. Do not apply this to multi-diagram layouts — the extra spacer would overflow their tighter cells.
- Diagram size (`boardSize` in `layout.ts`) is `min(widthBudget, heightBudget) * boardScale`: `widthBudget` fills the column (accounting for the active-color circle overhang, ~7% + a constant); `heightBudget` leaves room for the optional title and a compact writing strip; `boardScale` is `0.8` for the 1/page single board (deliberate empty space) and `1` otherwise. Never the old `min(cellWidth, cellHeight) * constant`.
- Answer space is a **compact fixed strip** below the diagram (`answerHeight`, a small fraction of cell height), rendered as a fixed-height `View` — **not** `flex: 1` (which would soak up all leftover height). No lines, no checkboxes.
- No cover page — exercises start on page 1
- Page content (header + grid) must stay **strictly** below the usable page height. If it exactly equals the available height, `@react-pdf` rounds up and spills into a blank continuation page. So: the header takes exactly `headerHeight` (use `borderBottom`, never `marginBottom`), and `computeLayout` subtracts a small `safetyPad` from the grid height.
- Header title centering: the header `View` is a **column** container (default `flexDirection`) with `justifyContent: 'center'` (vertical centering); the title `Text` stretches full-width via the default `alignItems: 'stretch'`, so `textAlign: 'center'` works. Do **not** use a `flexDirection: 'row'` header with `flex: 1` / `width: '100%'` on the `Text` — `@react-pdf` does not reliably stretch a `Text` node to fill a row parent, so `textAlign` has no effect.
- **Page numbers:** `PdfPageNumber.tsx` renders a `fixed` `<Text>` (top-right, `position: 'absolute'`) using `@react-pdf`'s built-in `render={({ pageNumber, totalPages }) => ...}`, shown only when `totalPages > 1`. It's placed as a direct child of `<Page>` in both `PdfPage.tsx` and `PdfSolutionsPage.tsx`, independent of the centered header `View` (no risk of the row/flex Text-stretch quirk above). Because `pageNumber`/`totalPages` count every page in the single `<Document>`, solution pages share the same continuous numbering as diagram pages by default — no manual index-threading needed.

### State management
- All state lives in `App.tsx` via `useState`
- No external state library (no Redux, no Zustand) for v1
- No `localStorage`, no `sessionStorage`, no cookies — the app is fully stateless

### Styling
- Tailwind CSS for all UI components
- No inline styles in UI components
- `@react-pdf/renderer` uses its own StyleSheet API — Tailwind does not apply inside PDF components

---

## What NOT to do

- Do not use `jsPDF`, `html2canvas`, or browser `window.print()` — PDF generation is `@react-pdf/renderer` only
- Do not render Unicode chess pieces (♔♕♖...) — use SVG vector paths
- Do not add any form of persistence (no localStorage, no own backend — puzzle data ships as static files in `public/puzzle-index/`; the app makes no third-party network calls at runtime)
- Do not put business logic inside components — keep it in `src/lib/`
- Do not create a cover page
- Do not mix React SVG elements with @react-pdf SVG primitives

---

## Suggested implementation order

Follow this order to build on solid foundations at each step:

1. **Types** — `src/types/index.ts`
2. **FEN utilities** — `src/lib/fen.ts`, `src/lib/parser.ts`, `src/lib/validator.ts`
3. **Layout calculator** — `src/lib/layout.ts`
4. **Web diagram** — `src/components/diagram/ChessBoard.tsx`
5. **UI components** — `ExerciseForm`, `ExportControls`, `ErrorMessage`, `Preview`
6. **App wiring** — `App.tsx`
7. **PDF diagram** — `src/components/diagram/ChessBoardPdf.tsx`
8. **PDF document** — `PdfExercise`, `PdfPage`, `PdfDocument`
9. **Export button** — wire PDF download in `ExportControls`

---

## v2 directions (do not implement, for context only)

- Cross-device sheet saving (requires Go backend + PostgreSQL)
- Short URL sharing (requires server-side slug storage)
- Import from a Lichess **study** (random-puzzle import is done — see "Lichess puzzle import" above)
- Child-friendly decorations to fill empty space when exercisesPerPage < 6
