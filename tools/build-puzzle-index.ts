/**
 * Builds the static puzzle index served from public/puzzle-index/.
 *
 * Streams the Lichess puzzle database dump (CSV, zstd-compressed), keeps
 * quality puzzles (low rating deviation, popular, well-played), reservoir-
 * samples PER_BAND puzzles per 100-point rating band, then converts each
 * sampled row's FEN to the solver-facing position (the CSV FEN is the
 * position *before* the opponent's setup move — Moves[0] must be applied).
 *
 * Usage: npm run build:index [-- --per-band 1000 --source <url|file.csv.zst> --out public/puzzle-index]
 * Requires `zstd` and `curl` on PATH. The dump is CC0 (database.lichess.org).
 */
import { Chess } from 'chess.js'
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { THEME_BITS } from '../src/lib/lichess'
import type { IndexEntry } from '../src/types'

const DEFAULT_SOURCE = 'https://database.lichess.org/lichess_db_puzzle.csv.zst'
const BAND_WIDTH = 100
const FILTERS = { maxRatingDeviation: 90, minPopularity: 80, minPlays: 100 }

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const perBand = Number(arg('per-band', '1000'))
const source = arg('source', DEFAULT_SOURCE)
const outDir = arg('out', 'public/puzzle-index')

type Row = { id: string; fen: string; moves: string[]; rating: number; themes: string[] }

// Reservoir sampling (Algorithm R) per rating band
const reservoirs = new Map<number, { rows: Row[]; seen: number }>()

function offer(band: number, row: Row) {
  let r = reservoirs.get(band)
  if (!r) {
    r = { rows: [], seen: 0 }
    reservoirs.set(band, r)
  }
  r.seen++
  if (r.rows.length < perBand) {
    r.rows.push(row)
  } else {
    const j = Math.floor(Math.random() * r.seen)
    if (j < perBand) r.rows[j] = row
  }
}

// Apply Moves[0] (the opponent's setup move) to reach the solver-facing position,
// then replay Moves[1..] (the solution) collecting each move's SAN. Returns both the
// solver-facing FEN and the space-joined SAN solution, or null if any move is illegal.
function solverFacing(csvFen: string, moves: string[]): { fen: string; solution: string } | null {
  try {
    const chess = new Chess(csvFen)
    const play = (uci: string) =>
      chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
    play(moves[0])
    const fen = chess.fen()
    const san: string[] = []
    for (let i = 1; i < moves.length; i++) san.push(play(moves[i]).san)
    return { fen, solution: san.join(' ') }
  } catch {
    return null
  }
}

async function main() {
  const cmd = source.startsWith('http')
    ? `curl -sf '${source}' | zstd -d`
    : `zstd -dc '${source}'`
  const proc = spawn('sh', ['-c', cmd], { stdio: ['ignore', 'pipe', 'inherit'] })
  const lines = createInterface({ input: proc.stdout, crlfDelay: Infinity })

  let total = 0
  let kept = 0
  for await (const line of lines) {
    total++
    if (total === 1) continue // header
    // PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
    const f = line.split(',')
    if (f.length < 8) continue
    const rating = Number(f[3])
    if (
      Number(f[4]) >= FILTERS.maxRatingDeviation ||
      Number(f[5]) <= FILTERS.minPopularity ||
      Number(f[6]) <= FILTERS.minPlays
    )
      continue
    kept++
    offer(Math.floor(rating / BAND_WIDTH) * BAND_WIDTH, {
      id: f[0],
      fen: f[1],
      moves: f[2].split(' '),
      rating,
      themes: f[7].split(' '),
    })
    if (total % 1_000_000 === 0) console.error(`…${total} rows read, ${kept} pass filters`)
  }
  const exitCode: number = await new Promise(res => proc.on('close', res))
  if (exitCode !== 0) throw new Error(`source pipeline exited with code ${exitCode}`)
  console.error(`done reading: ${total} rows, ${kept} pass filters`)

  mkdirSync(outDir, { recursive: true })
  const bands = [...reservoirs.keys()].sort((a, b) => a - b)
  const counts: Record<string, number> = {}
  let dropped = 0
  for (const band of bands) {
    const entries: IndexEntry[] = []
    for (const row of reservoirs.get(band)!.rows) {
      const res = solverFacing(row.fen, row.moves)
      if (!res) {
        dropped++
        continue
      }
      let mask = 0
      for (const t of row.themes) {
        const bit = THEME_BITS[t]
        if (bit !== undefined) mask |= 1 << bit
      }
      entries.push([row.id, res.fen, row.rating, mask, res.solution])
    }
    entries.sort((a, b) => a[2] - b[2])
    writeFileSync(`${outDir}/${band}.json`, JSON.stringify(entries))
    counts[String(band)] = entries.length
    console.log(`band ${band}: ${entries.length} puzzles (from ${reservoirs.get(band)!.seen} candidates)`)
  }
  writeFileSync(
    `${outDir}/manifest.json`,
    JSON.stringify(
      {
        builtAt: new Date().toISOString(),
        source,
        bandWidth: BAND_WIDTH,
        perBand,
        filters: FILTERS,
        themeBits: THEME_BITS,
        bands,
        counts,
      },
      null,
      2
    )
  )
  if (dropped > 0) console.error(`dropped ${dropped} entries with unreplayable moves`)
  console.log(`wrote ${bands.length} band files + manifest.json to ${outDir}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
