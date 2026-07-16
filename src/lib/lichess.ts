import type { LichessPuzzle } from '../types'

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

// Bit position per filterable theme (everything except the 'mix' pseudo-theme).
// The indexer imports this too, so the shipped index and the app cannot drift.
export const THEME_BITS: Record<string, number> = Object.fromEntries(
  LICHESS_THEMES.filter(t => t.slug !== 'mix').map((t, i) => [t.slug, i])
)

export function puzzlesToLines(puzzles: LichessPuzzle[]): string {
  return puzzles.map(p => `${p.fen} ; Lichess ${p.id} (${p.rating})`).join('\n')
}
