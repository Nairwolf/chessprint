import { COORD_GUTTER_FRAC } from './fen'
import type { ExercisesPerPage, LayoutMetrics } from '../types'

export function computeLayout(
  exercisesPerPage: ExercisesPerPage,
  coordinates = false,
): LayoutMetrics {
  const pageWidth = 595
  const pageHeight = 842
  const margin = 24
  const headerHeight = 40

  // Per-count grid shape. 2/page is stacked (1 col × 2 rows) rather than
  // side-by-side, to exploit the tall A4 page for a bigger board.
  const grid: Record<ExercisesPerPage, { columns: number; rows: number }> = {
    1: { columns: 1, rows: 1 },
    2: { columns: 1, rows: 2 },
    3: { columns: 2, rows: 2 },
    4: { columns: 2, rows: 2 },
    5: { columns: 2, rows: 3 },
    6: { columns: 2, rows: 3 },
  }
  const { columns, rows } = grid[exercisesPerPage]
  const centered = columns === 2 && exercisesPerPage % 2 === 1

  // 1/page: shrink the (otherwise very large) single board so there is
  // deliberate empty space around it.
  const boardScale = exercisesPerPage === 1 ? 0.8 : 1

  // Reserve a small buffer so header + grid stays strictly below the page's
  // usable height. Without it the content exactly equals the available space
  // and @react-pdf's rounding spills into a blank continuation page.
  const safetyPad = 2

  const gridWidth = pageWidth - 2 * margin
  const gridHeight = pageHeight - headerHeight - 2 * margin - safetyPad

  const cellWidth = gridWidth / columns
  const cellHeight = gridHeight / rows

  // Boards fill the column width and are centered in the cell; the writing area
  // below is a compact fixed strip. boardSize is the smaller of a width budget
  // (fill the column) and a height budget (leave room for title + writing strip).
  const cellPad = 4 // matches the cell padding in PdfExercise
  const titleAllow = 14 // reserve for the optional exercise-title line (fontSize 9 + margin)
  const answerFrac = 0.18 // compact writing strip, as a fraction of cell height
  const circleFactor = 1.07 // board SVG is ~7% wider than the board (active-color circle overhang)
  const circlePad = 8 // constant part of the SVG width overhang (see ChessBoardPdf.tsx)
  const boardSafety = 3 // keep content strictly inside the cell (avoids @react-pdf rounding overflow)

  // When coordinates are on, the board SVG grows by gutter*boardSize on the left
  // (ranks) and bottom (files). Fold that into both budgets so boardSize shrinks
  // to fit instead of the gutter overflowing the cell. gutter = 0 reduces to the
  // original formulas exactly, so the default (off) path is unchanged.
  const gutter = coordinates ? COORD_GUTTER_FRAC : 0

  const innerWidth = cellWidth - 2 * cellPad
  const innerHeight = cellHeight - 2 * cellPad

  const answerHeight = cellHeight * answerFrac
  const widthBudget = (innerWidth - circlePad) / (circleFactor + gutter)
  const heightBudget = (innerHeight - answerHeight - titleAllow - boardSafety) / (1 + gutter)
  const boardSize = Math.min(widthBudget, heightBudget) * boardScale

  return {
    pageWidth,
    pageHeight,
    margin,
    headerHeight,
    columns,
    rows,
    cellWidth,
    cellHeight,
    boardSize,
    answerHeight,
    centered,
  }
}
