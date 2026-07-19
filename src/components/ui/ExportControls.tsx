import type { ExportConfig, OrientationMode } from '../../types'

type Props = {
  exercisesPerPage: ExportConfig['exercisesPerPage']
  onExercisesPerPageChange: (n: ExportConfig['exercisesPerPage']) => void
  orientation: OrientationMode
  onOrientationChange: (m: OrientationMode) => void
  allowMissingKings: boolean
  onAllowMissingKingsChange: (b: boolean) => void
  coordinates: boolean
  onCoordinatesChange: (b: boolean) => void
  onExport: () => void
  disabled: boolean
}

const OPTIONS: ExportConfig['exercisesPerPage'][] = [1, 2, 3, 4, 5, 6]

const ORIENTATION_OPTIONS: { value: OrientationMode; label: string }[] = [
  { value: 'auto', label: 'By turn' },
  { value: 'white', label: 'White' },
  { value: 'black', label: 'Black' },
]

export default function ExportControls({
  exercisesPerPage,
  onExercisesPerPageChange,
  orientation,
  onOrientationChange,
  allowMissingKings,
  onAllowMissingKingsChange,
  coordinates,
  onCoordinatesChange,
  onExport,
  disabled,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="per-page">
          Diagrams per page
        </label>
        <select
          id="per-page"
          value={exercisesPerPage}
          onChange={e =>
            onExercisesPerPageChange(Number(e.target.value) as ExportConfig['exercisesPerPage'])
          }
          className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {OPTIONS.map(n => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Orientation</span>
        <div className="inline-flex overflow-hidden rounded border border-gray-300">
          {ORIENTATION_OPTIONS.map((opt, i) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onOrientationChange(opt.value)}
              aria-pressed={orientation === opt.value}
              className={`px-3 py-1.5 text-sm transition-colors ${
                i > 0 ? 'border-l border-gray-300' : ''
              } ${
                orientation === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          checked={allowMissingKings}
          onChange={e => onAllowMissingKingsChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        Allow positions without kings
      </label>

      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          checked={coordinates}
          onChange={e => onCoordinatesChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        Show board coordinates
      </label>

      <button
        onClick={onExport}
        disabled={disabled}
        className="rounded px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-400 enabled:bg-blue-600 enabled:hover:bg-blue-700"
      >
        Export PDF
      </button>
    </div>
  )
}
