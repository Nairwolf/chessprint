# SPEC.md — ChessPrint

## 1. Context and objective

A web application for generating chess exercise sheets as PDFs, aimed at children. The user inputs a list of positions (in FEN format) and gets a print-ready PDF with diagrams large enough for children to write and draw on directly.

## 2. v1 scope (MVP)

- Manual input of positions via FEN.
- Clean chess diagram generation, no decorations.
- PDF export with configurable layout.
- No persistence (stateless site, no accounts, no database).

Out of scope for v1 (future directions):
- Child-friendly decorations / illustrations to fill empty space.
- Import from an external puzzle database (e.g. Lichess).
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

### 3.3 Diagram generation

For each valid exercise, a chess diagram is generated from the FEN:

- 8×8 board with pieces positioned according to the FEN.
- **No coordinates** displayed on the border (no letters a-h, no numbers 1-8) in v1.
- **Active color indicator**: a visual symbol (to be defined at design time — e.g. a black/white dot) displayed outside the board, indicating whose turn it is to play. This information is derived automatically from the FEN; the user inputs nothing extra.
- Diagram sized for child use: squares large enough to allow writing or drawing on or just below them.

### 3.4 Answer space

- Each exercise has a **free space** below the diagram, for the child to draw or annotate their answer by hand (no notation lines, no checkboxes).
- The size of this space varies according to the chosen diagram density per page (see 3.5).

### 3.5 Layout and PDF export

- **No cover page**: the document starts directly with the exercises.
- **Global title as a repeated header** on every page of the PDF (when the document spans multiple pages).
- **Diagrams per page**: a parameter chosen by the user at export time, with a **maximum value of 6** per page (accepted range: 1 to 6).
- The diagram size and the answer space size adjust **dynamically** based on the chosen diagrams-per-page value (fewer diagrams per page = larger diagrams and answer spaces).
- The PDF is generated in a print-friendly format (A4 assumed by default, to be confirmed at the technical phase).

### 3.6 Visual style

- No child-friendly decorations (mascot, illustrations, borders) in v1.
- Planned v2 direction: when the chosen diagrams-per-page count is below 6, fill the remaining empty space with small child-friendly drawings.

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
