# SPEC.md — ChessPrint

## 1. Context and objective

A web application for generating chess exercise sheets as PDFs, aimed at children. The user inputs a list of positions (in FEN format) and gets a print-ready PDF with diagrams large enough for children to write and draw on directly.

## 2. v1 scope (MVP)

- Manual input of positions via FEN.
- Clean chess diagram generation, no decorations.
- PDF export with configurable layout.
- No persistence (stateless site, no accounts, no database).

Implemented post-v1:
- Import from an external puzzle database (Lichess, see 3.7).

Out of scope for v1 (future directions):
- Child-friendly decorations / illustrations to fill empty space.
- Board coordinates display (letters a-h, numbers 1-8).
- Exercise list saving / persistence.
- Last move display (arrow, square highlight).

## 3. Features

### 3.1 Data input

The user fills in two elements:

1. **Global document title** — free text field, mandatory or optional to be decided at implementation, intended to appear as a header on every page of the PDF.
2. **Exercise list** — block text area, one exercise per line, in the following format:

   ```
   FEN ; title (optional)
   ```

   - The separator between the FEN and the title is a semicolon (`;`).
   - The title is optional; if absent, the exercise displays no individual title.
   - The active color (who plays, White or Black) is not entered separately: it is extracted automatically from the FEN's "active color" field (`w` or `b`).
   - No per-exercise instruction field: the general instruction is carried by the global document title.

### 3.2 Data validation

- Each line of the exercise list is parsed and its FEN is validated.
- If a line contains an invalid FEN (incorrect syntax, wrong number of squares, etc.), the export is **entirely blocked**.
- The error message must clearly indicate **the faulty line number**, and when possible the nature of the error (malformed FEN, missing field, etc.).
- No partial export is generated as long as a validation error is present.
- **Allow positions without kings** (opt-in): an off-by-default toggle lets the user accept
  otherwise-legal positions that are missing one or both kings, for educational sheets (e.g.
  isolated material). Only the king requirement is relaxed — all other checks still apply, so
  malformed FENs, pawns on the back rank, and positions with *too many* kings remain blocked.

### 3.3 Diagram generation

For each valid exercise, a chess diagram is generated from the FEN:

- 8×8 board with pieces positioned according to the FEN.
- **No coordinates** displayed on the border (no letters a-h, no numbers 1-8) in v1.
- **Active color indicator**: a visual symbol (to be defined at design time — e.g. a black/white dot) displayed outside the board, indicating whose turn it is to play. This information is derived automatically from the FEN; the user inputs nothing extra.
- **Board orientation**: the diagram can be drawn from White's side, from Black's side, or oriented toward whoever is to move. The mode is chosen globally by the user (see 3.5); the default is **by turn** (the side to move sits at the bottom). The orientation only rotates the 8×8 grid — the active-color indicator still reflects the real side to move and stays at the bottom-right corner.
- Diagram sized for child use: squares large enough to allow writing or drawing on or just below them.

### 3.4 Answer space

- Each exercise has a **compact free space** below the diagram, for the child to write or annotate their answer by hand (no notation lines, no checkboxes). The space is intentionally modest — the diagram is the focus and fills the column width.
- The size of this space varies according to the chosen diagram density per page (see 3.5).

### 3.5 Layout and PDF export

- **No cover page**: the document starts directly with the exercises.
- **Global title as a repeated header** on every page of the PDF (when the document spans multiple pages).
- **Diagrams per page**: a parameter chosen by the user at export time, with a **maximum value of 6** per page (accepted range: 1 to 6).
- **Board orientation**: a global parameter chosen by the user — *By turn* (default), *White*, or *Black* — applied to every diagram in both the preview and the exported PDF.
- Diagrams are **centered** within their cell (both horizontally and vertically), with a compact writing strip below. The diagram and answer-space sizes adjust **dynamically** based on the chosen diagrams-per-page value (fewer diagrams per page = larger diagrams). The grid shape is tuned per count: **2/page is stacked** (one diagram above the other) to use the tall page, and the **1/page** board is deliberately shrunk to leave empty space.
- **Adaptive final page**: when the last page is only partly filled, its diagrams are sized using the layout for the number that actually remain (e.g. 2 leftover diagrams use the 2/page stacked layout), so they fill the page instead of reusing the full-page sizing.
- The PDF is generated in a print-friendly format (A4 assumed by default, to be confirmed at the technical phase).

### 3.6 Visual style

- No child-friendly decorations (mascot, illustrations, borders) in v1.
- Planned v2 direction: when the chosen diagrams-per-page count is below 6, fill the remaining empty space with small child-friendly drawings.

### 3.7 Lichess puzzle import

A collapsible "Load puzzles from Lichess" panel below the exercise textarea fetches random puzzles from the Lichess public API (no account, no API key):

- The user picks a **theme** (curated list: mate in 1/2, fork, pin, skewer, etc., or "Any theme"), a **difficulty** (5 Lichess buckets, relative to a 1500 rating for anonymous requests), and a **count** (1–30).
- One request to `GET https://lichess.org/api/puzzle/batch/{theme}?nb={count}&difficulty={difficulty}` (CORS-enabled). Each returned puzzle's position is derived by replaying the truncated PGN with chess.js.
- Loaded puzzles are **appended** to the textarea as regular input lines: `FEN ; Lichess <id> (<rating>)` — they then flow through the normal parse/validate/preview/export pipeline with no special handling.
- The panel also lists the loaded puzzles (id linking to `lichess.org/training/<id>`, plus rating). This list is ephemeral (replaced on each load, lost on page refresh); the id/rating embedded in each line's title is the durable copy.
- Network failures and rate limiting (HTTP 429) show a friendly error inside the panel; the textarea is never modified on failure.
- This is the app's only network call and does not change the no-persistence rule.

## 4. Persistence and user accounts

- **No persistence in v1.** No user accounts, no server-side saving.
- All entered data (title, exercise list) lives only in browser memory for the duration of the session.
- Closing or refreshing the page causes all entered data to be lost.

## 5. Input format summary

```
Document title: [free text]

Exercises:
FEN_1 ; title_1
FEN_2 ; title_2
FEN_3
...
```

Example:

```
Document title: Checkmate in one — Week 12

Exercises:
6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1 ; Exercise 1
r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 4 4
```

## 6. Open questions (to be resolved at the technical architecture phase)

- Technical stack (frontend only vs. frontend + light backend).
- Diagram rendering library (custom SVG, existing lib).
- PDF generation library (jsPDF, pdf-lib, HTML/CSS + browser print, etc.).
- Exact page format (A4 by default, margins, technical handling of the repeated header).
- Whether the global title is mandatory or optional.
- Handling the case where the number of exercises does not fill the last page exactly (incomplete last page).
