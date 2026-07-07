export type Exercise = {
  id: string
  fen: string
  title?: string
  activeColor: 'w' | 'b'
}

export type ParseError = {
  line: number
  raw: string
  reason: string
}

export type ExportConfig = {
  documentTitle: string
  exercisesPerPage: 1 | 2 | 3 | 4 | 5 | 6
}

export type ParsedLine = {
  fen: string
  title?: string
  lineNumber: number
}

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
