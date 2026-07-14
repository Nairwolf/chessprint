# ChessPrint

Generate print-ready chess exercise sheets as PDFs, aimed at children. Paste a
list of positions in [FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation)
notation, configure the layout, and download a clean PDF with large diagrams and
free space for kids to write or draw their answers by hand.

ChessPrint is **100% frontend**: a static web app with no backend, no database,
no accounts, and no persistence. Everything runs in your browser.

## Features

- **FEN input** — one exercise per line, format `FEN ; title (optional)`.
- **Automatic active-color detection** — who plays (White/Black) is read from the
  FEN and shown as a dot outside the board; you never type it in.
- **Strict validation** — every FEN is validated with [chess.js](https://github.com/jhlywa/chess.js).
  If any line is invalid, export is blocked and every error is reported with its
  line number and reason.
- **Vector diagrams** — pieces render as SVG paths (Lichess *caliente* set), not
  Unicode glyphs, so they stay crisp at any print size.
- **Configurable layout** — 1 to 6 diagrams per page, sizes computed dynamically.
- **Compact writing space** — a modest strip below each diagram for handwritten
  answers; the diagram stays the focus.
- **A4 PDF** — generated entirely in the browser with
  [@react-pdf/renderer](https://react-pdf.org/), with the document title
  repeated as a centered header on every page.

## Input format

Each line of the exercise textarea:

```
FEN ; title (optional)
```

- The separator between the FEN and the title is a semicolon (`;`).
- The title is optional. If absent, the exercise has no individual title.
- Empty lines are ignored.

Example:

```
r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3 ; Ruy Lopez
8/8/8/8/8/5k2/6q1/7K b - - 0 1 ; Mate in one
```

## Tech stack

- **React 18** + **TypeScript** + **Vite** (static build)
- **Tailwind CSS** (UI styling)
- **chess.js** (FEN parsing and validation)
- **@react-pdf/renderer** (PDF generation)

## Getting started

```bash
npm install
npm run dev        # start the dev server
```

Then open the URL Vite prints (typically <http://localhost:5173>).

### Scripts

```bash
npm run dev        # start development server
npm run build      # production static build (outputs to dist/)
npm run preview    # preview the production build locally
npm run typecheck  # TypeScript type check (no emit)
npm run lint       # ESLint
```

## Project structure

```
src/
├── components/
│   ├── ui/          # ExerciseForm, ExportControls, ErrorMessage, Preview
│   ├── diagram/     # ChessBoard (web SVG) + ChessBoardPdf (@react-pdf SVG)
│   └── pdf/         # PdfDocument, PdfPage, PdfExercise
├── lib/             # parser, validator, fen, layout, pieces (SVG path data)
├── types/           # shared types (Exercise, ParseError, ExportConfig)
└── App.tsx          # root component, global state
```

See [`docs/SPEC.md`](docs/SPEC.md) and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
for the full specification and technical decisions.

## License and attribution

The chess piece graphics are the **caliente** piece set by
[avi](https://github.com/avi-0/caliente), licensed under
[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) and obtained
via the Lichess (`lichess-org/lila`) repository. See [`NOTICE`](NOTICE) for details.

> ⚠️ Because of the piece set's **NonCommercial** clause, any distribution of
> ChessPrint that includes these graphics is restricted to non-commercial use.
