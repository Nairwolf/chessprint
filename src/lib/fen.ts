export function extractActiveColor(fen: string): 'w' | 'b' {
  return fen.split(' ')[1] === 'b' ? 'b' : 'w'
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
