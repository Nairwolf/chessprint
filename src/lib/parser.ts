import type { ParsedLine } from '../types'

export function parseInput(raw: string): ParsedLine[] {
  const lines = raw.split('\n')
  const result: ParsedLine[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === '') continue

    const parts = line.split(';')
    const fen = parts[0].trim()
    const title = parts[1]?.trim() || undefined

    result.push({ fen, title, lineNumber: i + 1 })
  }

  return result
}
