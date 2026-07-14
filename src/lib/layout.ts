import type { LayoutMetrics } from '../types'

export function computeLayout(exercisesPerPage: 1 | 2 | 3 | 4 | 5 | 6): LayoutMetrics {
  const pageWidth = 595
  const pageHeight = 842
  const margin = 24
  const headerHeight = 40

  const columns = exercisesPerPage === 1 ? 1 : 2
  const rows = exercisesPerPage <= 2 ? 1 : exercisesPerPage <= 4 ? 2 : 3
  const centered = exercisesPerPage % 2 === 1

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

  const innerWidth = cellWidth - 2 * cellPad
  const innerHeight = cellHeight - 2 * cellPad

  const answerHeight = cellHeight * answerFrac
  const widthBudget = (innerWidth - circlePad) / circleFactor
  const heightBudget = innerHeight - answerHeight - titleAllow - boardSafety
  const boardSize = Math.min(widthBudget, heightBudget)

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
