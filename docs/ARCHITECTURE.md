# ARCHITECTURE.md — ChessPrint

## 1. Overview

A 100% frontend static site, with no backend and no persistence. All data lives in browser memory for the duration of the session. The target hosting is a static CDN (Vercel or Netlify).

```
Browser
├── User Interface (React + TypeScript)
│   ├── Input form (document title, FEN list)
│   ├── Real-time preview
│   └── Export settings (diagrams per page, board orientation)
├── Parsing & Validation (chess.js)
│   ├── Parses each "FEN ; title" line
│   └── Validates the FEN, blocks export on error
├── Diagram rendering (custom SVG)
│   └── Generates one SVG per FEN position
└── PDF generation (@react-pdf/renderer)
    └── Assembles and downloads the final PDF
```

## 2. Tech stack

| Role | Choice | Rationale |
|---|---|---|
| Language | TypeScript | Typed data structures (parsed FEN, validated exercise, export config) |
| UI framework | React 18 | Reusable components, ecosystem compatible with chosen libs |
| Bundler | Vite | Fast setup, optimised static build, great DX |
| FEN validation | `chess.js` | Reference JS chess library, parses and validates FEN, extracts active color |
| Diagram rendering | Custom SVG (React) | Full control over rendering, no heavy dependency, compatible with `@react-pdf` |
| PDF generation | `@react-pdf/renderer` | Declarative Flexbox layout, vectorial PDF, direct download without print dialog |
| UI styles | Tailwind CSS | Utility-first, no manual CSS to maintain for the interface |
| Hosting | Vercel or Netlify | Static build, one-command deployment, free tier |

## 3. Project structure

```
chessprint/
├── public/
│   └── fonts/                  # Embedded fonts for @react-pdf
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── ExerciseForm.tsx     # Main form (title + FEN textarea)
│   │   │   ├── ExportControls.tsx   # Diagrams-per-page selector + orientation toggle + export button
│   │   │   ├── ErrorMessage.tsx     # Blocking error display (faulty line)
│   │   │   └── Preview.tsx          # Exercise list preview
│   │   ├── diagram/
│   │   │   ├── ChessBoard.tsx       # SVG diagram for the web interface
│   │   │   └── ChessBoardPdf.tsx    # SVG diagram adapted for @react-pdf
│   │   └── pdf/
│   │       ├── PdfDocument.tsx      # Root <Document> react-pdf component
│   │       ├── PdfPage.tsx          # <Page> component with header and grid
│   │       ├── PdfExercise.tsx      # Exercise component: diagram + answer space
│   │       └── PdfSolutionsPage.tsx # Optional two-column answer-key page(s)
│   ├── lib/
│   │   ├── parser.ts            # Parses "FEN ; title" lines
│   │   ├── validator.ts         # Validates each FEN via chess.js, surfaces errors
│   │   ├── fen.ts               # FEN utilities (active color extraction, piece positions)
│   │   └── layout.ts            # Computes dynamic sizes based on diagrams per page
│   ├── types/
│   │   └── index.ts             # Shared types (Exercise, ParseError, ExportConfig)
│   ├── App.tsx                  # Root component, global state orchestration
│   └── main.tsx                 # Vite entry point
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── SPEC.md
└── ARCHITECTURE.md
```

## 4. Data models

```typescript
// A parsed and validated exercise
type Exercise = {
  id: string;              // UUID generated at import time
  fen: string;             // Raw validated FEN
  title?: string;          // Optional exercise title
  activeColor: 'w' | 'b'; // Extracted automatically from the FEN
  solution?: string;       // Space-joined SAN solution (Lichess-imported puzzles only)
};

// A validation error
type ParseError = {
  line: number;   // Line number (1-indexed)
  raw: string;    // Raw content of the faulty line
  reason: string; // Error description (e.g. "invalid FEN: wrong number of ranks")
};

// Board orientation mode (chosen globally by the user)
type OrientationMode = 'white' | 'black' | 'auto'; // 'auto' = by turn

// Parameters chosen at export time
type ExportConfig = {
  documentTitle: string;
  exercisesPerPage: 1 | 2 | 3 | 4 | 5 | 6;
  orientation: OrientationMode;
  allowMissingKings: boolean; // opt-in: accept positions missing king(s)
  includeSolutions: boolean;  // opt-in: append the answer-key page(s)
};
```

## 5. Main data flow

```
User input (textarea)
        │
        ▼
    parser.ts
    ─────────────────────────────────────
    For each line:
    • Split on ";"
    • Extract FEN and title (optional)
    • Pass FEN to validator.ts
        │
        ├─── Invalid FEN ──► ParseError[] ──► ErrorMessage.tsx (blocks export)
        │
        └─── Valid FEN ─────► Exercise[]
                                  │
                    ┌─────────────┴──────────────────────┐
                    ▼                                    ▼
              Preview.tsx                       [Export button]
           (list display)                               │
                                                        ▼
                                               PdfDocument.tsx
                                           (@react-pdf assembly)
                                                        │
                                                        ▼
                                               PDF download
```

## 6. Diagram rendering

The diagram is an SVG generated in React from the FEN. Two distinct components are required:

- `ChessBoard.tsx` — for the web interface (standard React SVG, used in the preview)
- `ChessBoardPdf.tsx` — for the PDF (SVG rewritten with `@react-pdf` primitives: `<Svg>`, `<Rect>`, `<G>`, `<Path>`)

**Piece rendering:** pieces are drawn as SVG vector paths. The piece set is Lichess's **caliente** (by avi, CC BY-NC-SA 4.0 — see `NOTICE`; non-commercial use only), vendored as generated data in `src/lib/pieces.ts`: `PIECES: Record<PieceKey, PieceLayer[]>` on a 45×45 viewBox. Each piece is an ordered array of layers (path + fill/stroke/opacity); white and black pieces are distinct artwork keyed by the raw FEN letter. The data is pre-flattened for `@react-pdf` compatibility: transforms baked into the geometry, single-stop gradients resolved to solid fills, circles/ellipses converted to cubic béziers, no arc commands. This guarantees identical rendering in the web SVG and the PDF at any size, with no dependency on Unicode fonts whose rendering is inconsistent across operating systems.

**Active color indicator:** a filled circle (filled black = Black to play, white with border = White to play) displayed outside the board, bottom right. Extracted automatically from the FEN's `activeColor` field, independently of board orientation.

**Board orientation:** both diagram components take an explicit `orientation: 'w' | 'b'` prop and flip the grid via `orientBoard()` in `src/lib/fen.ts` (a Black orientation reverses both the rank and file order — a 180° rotation). The user picks a mode (`'white' | 'black' | 'auto'`) once; each render site resolves it to a concrete `'w' | 'b'` with `resolveOrientation(mode, activeColor)` — `'auto'` yields the exercise's own side to move. The indicator circle is unaffected by orientation.

**No coordinates** (no letters a-h, no numbers 1-8) in v1.

## 7. Dynamic PDF layout

Diagram size and answer space size are computed dynamically in `layout.ts` based on the chosen diagrams-per-page value.

A4 page (595 × 842 pt in PDF coordinates):

```
┌─────────────────────────────────┐
│     Document title (centered)   │  ~40 pt
├─────────────────────────────────┤
│  Exercise grid                  │  remaining space
│  ┌───────────┐  ┌───────────┐   │  Each cell: the diagram + a
│  │  Diagram  │  │  Diagram  │   │  compact writing strip form
│  │    SVG    │  │    SVG    │   │  a block that is centered in
│  │           │  │           │   │  the cell, both horizontally
│  │  writing  │  │  writing  │   │  and vertically. Diagrams are
│  └───────────┘  └───────────┘   │  sized to fill the column
│       ...            ...        │  width.
└─────────────────────────────────┘
```

Grid shape (columns × rows) is a **per-count table** in `computeLayout`. Diagrams are sized to
the smaller of a **width budget** (fill the column, accounting for the active-color circle
overhang) and a **height budget** (leave room for the optional title and a compact writing
strip), then multiplied by `boardScale` (`0.8` for the 1/page single board, `1` otherwise).
Approximate diagram sizes:

| Diagrams/page | Columns | Rows | Diagram size (approx.) | Limited by |
|---|---|---|---|---|
| 1 | 1 | 1 | ~397 pt | width × 0.8 (shrunk) |
| 2 | 1 (stacked) | 2 | ~283 pt | height |
| 3 | 2 (+ 1 centered) | 2 | ~240 pt | width |
| 4 | 2 | 2 | ~240 pt | width |
| 5 | 2 (+ 1 centered) | 3 | ~180 pt | height |
| 6 | 2 | 3 | ~180 pt | height |

**Adaptive final page:** `computeLayout` runs **per page** in `PdfDocument.tsx` with an
effective count `min(exercisesPerPage, diagramsOnThisPage)`, so a partly-filled last page adopts
the layout for the count it actually holds (e.g. 2 leftover diagrams use the stacked 2/page
layout) rather than reusing the full-page sizing.

The writing space below each diagram is a **compact fixed strip** (`answerHeight`, a small
fraction of cell height) — not a `flex: 1` filler. Any leftover cell height becomes balanced
top/bottom margin because the diagram + writing block is vertically centered.

**Single-page containment:** `layout.ts` is the single source of truth for every dimension, and the total content of one page (header + grid) must stay *strictly* below the usable page height. If it exactly equals the available height, `@react-pdf`'s rounding overflows into a blank continuation page. Two rules follow from this:

- The header occupies exactly `headerHeight` — it must not add any extra margin/padding on top of it (use `borderBottom` for the separator, never `marginBottom`).
- `computeLayout` reserves a small `safetyPad` (a couple of points) subtracted from the grid height, guaranteeing the content never reaches the page edge.

The document title is **horizontally centered** in the header. The header `View` is a
**column** container (`@react-pdf`'s default `flexDirection`) with `justifyContent: 'center'`
for vertical centering; the title `Text` then stretches to the full header width via the
default `alignItems: 'stretch'`, so `textAlign: 'center'` on it takes effect. Do **not** use a
`flexDirection: 'row'` header with `flex: 1` / `width: '100%'` on the `Text` — `@react-pdf`
does not reliably stretch a `Text` node to fill a row parent, so the text box shrinks to its
content and `textAlign` has no effect.

**Answer-key pages (optional):** when `ExportConfig.includeSolutions` is on and at least one
exercise carries a `solution`, `PdfDocument` appends dedicated solutions page(s) **after** all
diagram pages. `App.tsx` keeps solutions in a session map keyed by Lichess id (populated on
import, out of the textarea) and `attachSolutions` (`src/lib/lichess.ts`) binds them to
exercises by the id in each `Lichess <id>` title. `PdfSolutionsPage` renders a **two-column**
list (chunked at `SOLUTION_ROWS_PER_PAGE = 50`, split `Math.ceil(n/2)` down the left column
first) of `ordinal · title · numbered SAN`; `formatSolution(fen, san)` derives the move numbers
from the solver-facing FEN. The outer `Page` stays A4 with the same single-page-containment
discipline as the diagram pages.

## 8. Validation error handling

Validation is triggered on input (with a ~300ms debounce to avoid blocking typing) and on clicking "Export".

If at least one line is invalid:
- The export is entirely blocked (button disabled).
- A clear error message is displayed above the input area.
- Each error shows: the line number (1-indexed), the raw content of the faulty line, and the reason (e.g. "invalid FEN: wrong number of ranks", "invalid FEN: unrecognised character").
- The faulty line is highlighted in the textarea if technically feasible (bonus).

## 9. Hosting and deployment

Static build produced by `vite build` → `dist/` folder. Deployable directly on:
- **Vercel**: `vercel --prod` or GitHub connection for automatic deployment.
- **Netlify**: drag & drop the `dist/` folder or connect to GitHub.

No environment variables, no server, no database.

## 10. Backend evolution paths (v2+)

If the following features are added, a Go backend will be required:

| Feature | What it implies |
|---|---|
| Cross-device sheet saving | Server storage (PostgreSQL) + Go REST API |
| Short URL sharing | Server storage + slug generation |
| Import from a Lichess study | Feasible in pure frontend (public API, no CORS) — random-puzzle import by theme/rating range is already implemented via a static puzzle index (`public/puzzle-index/`, built monthly by CI from the CC0 Lichess DB dump; runtime client in `src/lib/puzzleIndex.ts`, UI in `LichessImport.tsx`). The live API is not used at runtime (it cannot filter by rating) |
| High-fidelity PDF generation | Go backend + headless Chromium (`go-rod`) |

The current frontend will not need to be rewritten: v2 additions plug in by replacing local calls with API calls.
