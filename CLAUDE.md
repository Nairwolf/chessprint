# ChessPrint — Claude Code Instructions

## What is this project?

ChessPrint is a 100% frontend static web app that generates printable chess exercise PDFs for children. Users paste a list of FEN positions, configure the layout, and download a PDF with large diagrams and free answer spaces for children to write on.

Read SPEC.md and ARCHITECTURE.md in full before doing anything. They are the source of truth for all features and technical decisions.

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
│   └── fonts/                  # Fonts embedded in @react-pdf PDFs
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── ExerciseForm.tsx     # Document title field + FEN textarea
│   │   │   ├── ExportControls.tsx   # Diagrams-per-page selector + export button
│   │   │   ├── ErrorMessage.tsx     # Blocking error display (line number + reason)
│   │   │   └── Preview.tsx          # Parsed exercise list preview
│   │   ├── diagram/
│   │   │   ├── ChessBoard.tsx       # SVG diagram for the web UI (standard React SVG)
│   │   │   └── ChessBoardPdf.tsx    # SVG diagram for @react-pdf (<Svg> primitives only)
│   │   └── pdf/
│   │       ├── PdfDocument.tsx      # Root <Document> component (@react-pdf)
│   │       ├── PdfPage.tsx          # <Page> with repeated header and exercise grid
│   │       └── PdfExercise.tsx      # Single exercise: diagram + free answer space
│   ├── lib/
│   │   ├── parser.ts            # Splits lines on ";", extracts FEN and optional title
│   │   ├── validator.ts         # Validates each FEN via chess.js, returns ParseError[]
│   │   ├── fen.ts               # FEN utilities (extract active color, piece positions)
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
};

type ParseError = {
  line: number;   // 1-indexed line number
  raw: string;    // Raw content of the faulty line
  reason: string; // Human-readable error description
};

type ExportConfig = {
  documentTitle: string;
  exercisesPerPage: 1 | 2 | 3 | 4 | 5 | 6;
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

### Diagram rendering
- Pieces are rendered as **SVG vector paths**, never as Unicode characters
- Use an open-licence piece set (e.g. Merida or `chess-pieces` on npm)
- **No board coordinates** in v1 (no a-h letters, no 1-8 numbers)
- Active color indicator: a filled circle outside the board, bottom-right corner
  - Black filled circle = Black to play
  - White circle with dark border = White to play
- `ChessBoard.tsx` uses standard React SVG elements (`<svg>`, `<rect>`, `<path>`)
- `ChessBoardPdf.tsx` uses **only** `@react-pdf/renderer` SVG primitives (`<Svg>`, `<Rect>`, `<Path>`, `<G>`) — never mix the two

### PDF layout
- Page size: A4 (595 × 842 pt)
- Header: document title, repeated on every page, ~40 pt height
- Grid: always 2 columns, number of rows depends on exercisesPerPage
- Sizes are computed in `layout.ts` — no hardcoded sizes in PDF components

| exercisesPerPage | Columns | Rows | Notes |
|---|---|---|---|
| 1 | 1 centered | 1 | Single large diagram |
| 2 | 2 | 1 | |
| 3 | 2 | 2 | Last cell of row 2 centered |
| 4 | 2 | 2 | |
| 5 | 2 | 3 | Last cell of row 3 centered |
| 6 | 2 | 3 | |

- Answer space fills the remaining vertical space below the diagram in each cell (free space, no lines, no checkboxes)
- No cover page — exercises start on page 1
- Page content (header + grid) must stay **strictly** below the usable page height. If it exactly equals the available height, `@react-pdf` rounds up and spills into a blank continuation page. So: the header takes exactly `headerHeight` (use `borderBottom`, never `marginBottom`), and `computeLayout` subtracts a small `safetyPad` from the grid height.

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
- Do not add board coordinates (a-h / 1-8) in v1
- Do not add any form of persistence (no localStorage, no backend calls)
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
- Import from a Lichess study (feasible in pure frontend via public Lichess API)
- Child-friendly decorations to fill empty space when exercisesPerPage < 6
