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
