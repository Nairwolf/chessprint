import type { Exercise, LichessPuzzle } from '../types'

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

export function puzzlesToLines(puzzles: LichessPuzzle[], hideRating: boolean): string {
  return puzzles
    .map(p => `${p.fen} ; Lichess ${p.id}${hideRating ? '' : ` (${p.rating})`}`)
    .join('\n')
}

// Session map so solutions survive without cluttering the FEN textarea. Keyed by
// the Lichess id that also appears in each puzzle's `Lichess <id> (<rating>)` title.
export function puzzlesToSolutionMap(puzzles: LichessPuzzle[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const p of puzzles) if (p.solution) map[p.id] = p.solution
  return map
}

export function lichessIdFromTitle(title?: string): string | null {
  const m = title?.match(/^Lichess (\w+)/)
  return m ? m[1] : null
}

// Attach each exercise's solution by matching the Lichess id embedded in its title
// against the session solution map. Manual (non-Lichess) FENs are left untouched.
export function attachSolutions(
  exercises: Exercise[],
  solutions: Record<string, string>
): Exercise[] {
  return exercises.map(ex => {
    const id = lichessIdFromTitle(ex.title)
    const solution = id ? solutions[id] : undefined
    return solution ? { ...ex, solution } : ex
  })
}

// Turn a space-joined SAN move list into a numbered display string
// (e.g. "1. Qxf7+ Kxf7 2. Ng5+"), using the solver-facing FEN's side-to-move and
// fullmove counter to seed the numbering.
export function formatSolution(fen: string, san: string): string {
  const moves = san.trim().split(/\s+/).filter(Boolean)
  if (moves.length === 0) return ''
  const parts = fen.split(' ')
  let moveNo = parseInt(parts[5], 10) || 1
  let whiteToMove = parts[1] !== 'b'
  const out: string[] = []
  moves.forEach((mv, i) => {
    if (whiteToMove) {
      out.push(`${moveNo}. ${mv}`)
    } else {
      out.push(i === 0 ? `${moveNo}... ${mv}` : mv)
      moveNo++
    }
    whiteToMove = !whiteToMove
  })
  return out.join(' ')
}
