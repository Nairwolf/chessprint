export type Exercise = {
  id: string
  fen: string
  title?: string
  activeColor: 'w' | 'b'
  solution?: string // space-joined SAN solution moves (Lichess-imported puzzles only)
}

export type ParseError = {
  line: number
  raw: string
  reason: string
}

export type OrientationMode = 'white' | 'black' | 'auto'

export type ExercisesPerPage = 1 | 2 | 3 | 4 | 5 | 6

export type ExportConfig = {
  documentTitle: string
  exercisesPerPage: ExercisesPerPage
  orientation: OrientationMode
  allowMissingKings: boolean
  includeSolutions: boolean
}

export type ParsedLine = {
  fen: string
  title?: string
  lineNumber: number
}

export type LichessPuzzle = {
  id: string
  fen: string
  rating: number
  solution: string // space-joined SAN solution moves
}

// One puzzle in a static index band file:
// [id, solver-facing FEN, rating, theme bitmask, space-joined SAN solution]
export type IndexEntry = [string, string, number, number, string]

export type PieceKey = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P' | 'k' | 'q' | 'r' | 'b' | 'n' | 'p'

export type PieceLayer = {
  d: string
  fill: string
  fillRule?: 'nonzero' | 'evenodd'
  stroke?: string
  strokeWidth?: number
  strokeLinecap?: 'round' | 'butt' | 'square'
  strokeLinejoin?: 'round' | 'miter' | 'bevel'
  opacity?: number
}

export type LayoutMetrics = {
  pageWidth: number
  pageHeight: number
  margin: number
  headerHeight: number
  columns: number
  rows: number
  cellWidth: number
  cellHeight: number
  boardSize: number
  answerHeight: number
  centered: boolean
}
