import { Chess } from 'chess.js'
import type { LichessDifficulty, LichessPuzzle } from '../types'

export const LICHESS_THEMES: { slug: string; label: string }[] = [
  { slug: 'mix', label: 'Any theme' },
  { slug: 'mateIn1', label: 'Mate in 1' },
  { slug: 'mateIn2', label: 'Mate in 2' },
  { slug: 'fork', label: 'Fork' },
  { slug: 'pin', label: 'Pin' },
  { slug: 'skewer', label: 'Skewer' },
  { slug: 'hangingPiece', label: 'Hanging piece' },
  { slug: 'discoveredAttack', label: 'Discovered attack' },
  { slug: 'backRankMate', label: 'Back-rank mate' },
  { slug: 'doubleCheck', label: 'Double check' },
  { slug: 'promotion', label: 'Promotion' },
  { slug: 'sacrifice', label: 'Sacrifice' },
  { slug: 'defensiveMove', label: 'Defensive move' },
  { slug: 'endgame', label: 'Endgame' },
  { slug: 'opening', label: 'Opening' },
]

export const LICHESS_DIFFICULTIES: { value: LichessDifficulty; label: string }[] = [
  { value: 'easiest', label: 'Easiest' },
  { value: 'easier', label: 'Easier' },
  { value: 'normal', label: 'Normal' },
  { value: 'harder', label: 'Harder' },
  { value: 'hardest', label: 'Hardest' },
]

// The batch API returns bare SAN movetext (no move numbers) truncated at the
// puzzle start, so replaying every move yields the position the solver faces.
export function pgnToFen(pgn: string): string {
  const chess = new Chess()
  for (const san of pgn.split(/\s+/).filter(Boolean)) {
    chess.move(san)
  }
  return chess.fen()
}

type BatchEntry = {
  game: { pgn: string }
  puzzle: { id: string; rating: number; themes: string[] }
}

export async function fetchLichessPuzzles(
  theme: string,
  difficulty: LichessDifficulty,
  count: number
): Promise<LichessPuzzle[]> {
  const url = `https://lichess.org/api/puzzle/batch/${encodeURIComponent(theme)}?nb=${count}&difficulty=${difficulty}`
  let response: Response
  try {
    response = await fetch(url)
  } catch {
    throw new Error('Could not reach lichess.org — check your internet connection.')
  }
  if (response.status === 429) {
    throw new Error('Lichess rate limit reached — wait a minute and retry.')
  }
  if (!response.ok) {
    throw new Error(`Lichess returned an error (HTTP ${response.status}).`)
  }
  const data = (await response.json()) as { puzzles: BatchEntry[] }

  const seen = new Set<string>()
  const puzzles: LichessPuzzle[] = []
  for (const entry of data.puzzles) {
    if (seen.has(entry.puzzle.id)) continue
    seen.add(entry.puzzle.id)
    try {
      puzzles.push({
        id: entry.puzzle.id,
        fen: pgnToFen(entry.game.pgn),
        rating: entry.puzzle.rating,
        themes: entry.puzzle.themes,
      })
    } catch {
      // Unreplayable PGN — skip this puzzle rather than failing the batch
    }
  }
  if (puzzles.length === 0) {
    throw new Error('Lichess returned no usable puzzles for this selection.')
  }
  return puzzles
}

export function puzzlesToLines(puzzles: LichessPuzzle[]): string {
  return puzzles.map(p => `${p.fen} ; Lichess ${p.id} (${p.rating})`).join('\n')
}
