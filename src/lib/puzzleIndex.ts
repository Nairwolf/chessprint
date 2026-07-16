import type { IndexEntry, LichessPuzzle } from '../types'
import { THEME_BITS } from './lichess'

export const BAND_WIDTH = 100
export const RATING_MIN = 500
export const RATING_MAX = 3200

export function bandsFor(min: number, max: number): number[] {
  const bands: number[] = []
  const first = Math.floor(min / BAND_WIDTH) * BAND_WIDTH
  // max is an inclusive bound; a max on a band boundary doesn't need the next band
  const last = Math.floor((max - 1) / BAND_WIDTH) * BAND_WIDTH
  for (let b = first; b <= last; b += BAND_WIDTH) bands.push(b)
  return bands
}

export async function loadPool(min: number, max: number): Promise<IndexEntry[]> {
  const results = await Promise.all(
    bandsFor(min, max).map(async band => {
      try {
        const res = await fetch(`/puzzle-index/${band}.json`)
        if (!res.ok) return []
        return (await res.json()) as IndexEntry[]
      } catch {
        return []
      }
    })
  )
  const pool = results.flat().filter(([, , rating]) => rating >= min && rating <= max)
  if (pool.length === 0 && results.every(r => r.length === 0)) {
    throw new Error('Puzzle index not available — try reloading the page.')
  }
  return pool
}

export function samplePuzzles(
  pool: IndexEntry[],
  count: number,
  themeSlug: string,
  excludeIds: Set<string>
): LichessPuzzle[] {
  const bit = THEME_BITS[themeSlug]
  const candidates = pool.filter(
    ([id, , , mask]) => !excludeIds.has(id) && (bit === undefined || (mask & (1 << bit)) !== 0)
  )
  // Partial Fisher–Yates: shuffle only the first `count` slots
  const n = Math.min(count, candidates.length)
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(Math.random() * (candidates.length - i))
    ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }
  return candidates.slice(0, n).map(([id, fen, rating]) => ({ id, fen, rating }))
}
