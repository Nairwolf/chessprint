import type { LayoutMetrics } from '../types'

export function computeLayout(exercisesPerPage: 1 | 2 | 3 | 4 | 5 | 6): LayoutMetrics {
  const pageWidth = 595
  const pageHeight = 842
  const margin = 24
  const headerHeight = 40
  const innerPad = 8

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
  const boardSize = Math.min(cellWidth, cellHeight) * 0.62
  const answerHeight = cellHeight - boardSize - innerPad

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
