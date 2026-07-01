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
