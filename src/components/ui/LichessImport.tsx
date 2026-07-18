import { useState } from 'react'
import { LICHESS_THEMES, puzzlesToLines, puzzlesToSolutionMap } from '../../lib/lichess'
import { RATING_MAX, RATING_MIN, loadPool, samplePuzzles } from '../../lib/puzzleIndex'
import type { LichessPuzzle } from '../../types'

type Props = {
  onLoaded: (lines: string, solutions: Record<string, string>) => void
  existingIds: Set<string>
  includeSolutions: boolean
  onIncludeSolutionsChange: (b: boolean) => void
}

const COUNT_MIN = 1
const COUNT_MAX = 50

const clampCount = (n: number) => Math.min(COUNT_MAX, Math.max(COUNT_MIN, n))

const RATING_STEPS: number[] = []
for (let r = RATING_MIN; r <= RATING_MAX; r += 100) RATING_STEPS.push(r)

const selectClass =
  'rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'

export default function LichessImport({
  onLoaded,
  existingIds,
  includeSolutions,
  onIncludeSolutionsChange,
}: Props) {
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState('mix')
  const [minRating, setMinRating] = useState(600)
  const [maxRating, setMaxRating] = useState(1500)
  const [count, setCount] = useState(6)
  const [countStr, setCountStr] = useState('6')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shortfall, setShortfall] = useState<number | null>(null)
  const [lastLoaded, setLastLoaded] = useState<LichessPuzzle[]>([])

  function commitCount(raw: string): number {
    const n = clampCount(Math.round(Number(raw)) || COUNT_MIN)
    setCount(n)
    setCountStr(String(n))
    return n
  }

  async function handleLoad() {
    setLoading(true)
    setError(null)
    setShortfall(null)
    const count = commitCount(countStr)
    const lo = Math.min(minRating, maxRating)
    const hi = Math.max(minRating, maxRating)
    try {
      const pool = await loadPool(lo, hi)
      const puzzles = samplePuzzles(pool, count, theme, existingIds)
      if (puzzles.length === 0) {
        setError('No puzzles found for this rating range and theme.')
        return
      }
      if (puzzles.length < count) setShortfall(puzzles.length)
      setLastLoaded(puzzles)
      onLoaded(puzzlesToLines(puzzles), puzzlesToSolutionMap(puzzles))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load puzzles.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <span aria-hidden="true" className="text-xs text-gray-400">
          {open ? '▼' : '▶'}
        </span>
        Load puzzles from Lichess
      </button>

      {open && (
        <div className="flex flex-col gap-4 border-t border-gray-200 p-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="lichess-theme">
                Theme
              </label>
              <select
                id="lichess-theme"
                value={theme}
                onChange={e => setTheme(e.target.value)}
                className={selectClass}
              >
                {LICHESS_THEMES.map(t => (
                  <option key={t.slug} value={t.slug}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="lichess-min-rating">
                Rating
              </label>
              <select
                id="lichess-min-rating"
                value={minRating}
                onChange={e => setMinRating(Number(e.target.value))}
                className={selectClass}
              >
                {RATING_STEPS.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-500">–</span>
              <select
                id="lichess-max-rating"
                aria-label="Maximum rating"
                value={maxRating}
                onChange={e => setMaxRating(Number(e.target.value))}
                className={selectClass}
              >
                {RATING_STEPS.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="lichess-count">
                Count
              </label>
              <input
                id="lichess-count"
                type="number"
                min={COUNT_MIN}
                max={COUNT_MAX}
                step={1}
                value={countStr}
                onChange={e => setCountStr(e.target.value)}
                onBlur={() => commitCount(countStr)}
                className={`${selectClass} w-16`}
              />
            </div>

            <button
              type="button"
              onClick={handleLoad}
              disabled={loading}
              className="rounded px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-400 enabled:bg-blue-600 enabled:hover:bg-blue-700"
            >
              {loading ? 'Loading…' : 'Load puzzles'}
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={includeSolutions}
              onChange={e => onIncludeSolutionsChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Include solutions (answer key) in the exported PDF
          </label>

          {error && (
            <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {lastLoaded.length > 0 && !error && (
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-gray-700">
                Loaded {lastLoaded.length} puzzle{lastLoaded.length > 1 ? 's' : ''}:
              </p>
              {shortfall !== null && (
                <p className="text-xs text-amber-600">
                  Only {shortfall} of {count} requested puzzles available for this rating range
                  and theme.
                </p>
              )}
              <ul className="flex flex-col gap-0.5">
                {lastLoaded.map(p => (
                  <li key={p.id} className="text-sm text-gray-700">
                    <a
                      href={`https://lichess.org/training/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-blue-600 hover:underline"
                    >
                      {p.id}
                    </a>{' '}
                    — rating {p.rating}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-gray-400">Puzzles from lichess.org</p>
        </div>
      )}
    </div>
  )
}
