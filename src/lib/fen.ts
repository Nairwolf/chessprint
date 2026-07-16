export function extractActiveColor(fen: string): 'w' | 'b' {
  return fen.split(' ')[1] === 'b' ? 'b' : 'w'
}

import type { OrientationMode } from '../types'

export function resolveOrientation(
  mode: OrientationMode,
  activeColor: 'w' | 'b',
): 'w' | 'b' {
  if (mode === 'white') return 'w'
  if (mode === 'black') return 'b'
  return activeColor // 'auto' — by turn
}

export function orientBoard(
  board: (string | null)[][],
  orientation: 'w' | 'b',
): (string | null)[][] {
  if (orientation === 'w') return board
  return board.slice().reverse().map(row => row.slice().reverse())
}

// Inserts a king for each color that has none, onto an empty square, preserving
// each rank's square count. Used to check whether a FEN is illegal *only* because
// of missing kings: patch it, re-validate with chess.js, keep the original FEN.
// A color that already has a king is left untouched (so "too many kings" is never
// masked). If no empty square is available, the FEN is returned unchanged.
export function withPlaceholderKings(fen: string): string {
  const parts = fen.split(' ')
  let placement = parts[0]

  const insert = (king: 'K' | 'k'): boolean => {
    const idx = [...placement].findIndex(ch => ch >= '1' && ch <= '8')
    if (idx === -1) return false
    const gap = parseInt(placement[idx], 10)
    const replacement = king + (gap - 1 > 0 ? String(gap - 1) : '')
    placement = placement.slice(0, idx) + replacement + placement.slice(idx + 1)
    return true
  }

  if (!placement.includes('K') && !insert('K')) return fen
  if (!placement.includes('k') && !insert('k')) return fen

  parts[0] = placement
  return parts.join(' ')
}

export function fenToBoard(fen: string): (string | null)[][] {
  const ranks = fen.split(' ')[0].split('/')
  return ranks.map(rank => {
    const row: (string | null)[] = []
    for (const ch of rank) {
      const n = parseInt(ch, 10)
      if (!isNaN(n)) {
        for (let i = 0; i < n; i++) row.push(null)
      } else {
        row.push(ch)
      }
    }
    return row
  })
}
