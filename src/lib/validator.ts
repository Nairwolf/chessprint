import { Chess } from 'chess.js'
import { extractActiveColor, withPlaceholderKings } from './fen'
import type { Exercise, ParseError, ParsedLine } from '../types'

export function validateExercises(
  parsed: ParsedLine[],
  allowMissingKings = false
): { exercises: Exercise[]; errors: ParseError[] } {
  const exercises: Exercise[] = []
  const errors: ParseError[] = []

  for (const { fen, title, lineNumber } of parsed) {
    const accept = () =>
      exercises.push({
        id: crypto.randomUUID(),
        fen,
        title,
        activeColor: extractActiveColor(fen),
      })

    try {
      new Chess(fen)
      accept()
    } catch (e) {
      let error = e
      // When allowed, retry with phantom kings: if the position becomes valid, it
      // was illegal only because of missing king(s), so keep the original FEN. If it
      // still fails, report *that* error — the real problem left once kings are
      // ignored (e.g. back-rank pawns) — rather than the "missing king" message.
      if (allowMissingKings) {
        const patched = withPlaceholderKings(fen)
        if (patched !== fen) {
          try {
            new Chess(patched)
            accept()
            continue
          } catch (patchedError) {
            error = patchedError
          }
        }
      }
      errors.push({
        line: lineNumber,
        raw: fen,
        reason: error instanceof Error ? error.message : 'Invalid FEN',
      })
    }
  }

  return { exercises, errors }
}
