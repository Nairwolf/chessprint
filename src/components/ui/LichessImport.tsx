import { useState } from 'react'
import { LICHESS_DIFFICULTIES, LICHESS_THEMES, fetchLichessPuzzles, puzzlesToLines } from '../../lib/lichess'
import type { LichessDifficulty, LichessPuzzle } from '../../types'

type Props = {
  onLoaded: (lines: string) => void
}

const COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30]

const selectClass =
  'rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'

export default function LichessImport({ onLoaded }: Props) {
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState('mix')
  const [difficulty, setDifficulty] = useState<LichessDifficulty>('normal')
  const [count, setCount] = useState(6)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastLoaded, setLastLoaded] = useState<LichessPuzzle[]>([])

  async function handleLoad() {
    setLoading(true)
    setError(null)
    try {
      const puzzles = await fetchLichessPuzzles(theme, difficulty, count)
      setLastLoaded(puzzles)
      onLoaded(puzzlesToLines(puzzles))
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
              <label className="text-sm font-medium text-gray-700" htmlFor="lichess-difficulty">
                Difficulty
              </label>
              <select
                id="lichess-difficulty"
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as LichessDifficulty)}
                className={selectClass}
              >
                {LICHESS_DIFFICULTIES.map(d => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="lichess-count">
                Count
              </label>
              <select
                id="lichess-count"
                value={count}
                onChange={e => setCount(Number(e.target.value))}
                className={selectClass}
              >
                {COUNT_OPTIONS.map(n => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
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
