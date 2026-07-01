import { Chess } from 'chess.js'
import { extractActiveColor } from './fen'
import type { Exercise, ParseError, ParsedLine } from '../types'

export function validateExercises(
  parsed: ParsedLine[]
): { exercises: Exercise[]; errors: ParseError[] } {
  const exercises: Exercise[] = []
  const errors: ParseError[] = []

  for (const { fen, title, lineNumber } of parsed) {
    try {
      new Chess(fen)
      exercises.push({
        id: crypto.randomUUID(),
        fen,
        title,
        activeColor: extractActiveColor(fen),
      })
    } catch (e) {
      errors.push({
        line: lineNumber,
        raw: fen,
        reason: e instanceof Error ? e.message : 'Invalid FEN',
      })
    }
  }

  return { exercises, errors }
}
