import type { ExportConfig } from '../../types'

type Props = {
  exercisesPerPage: ExportConfig['exercisesPerPage']
  onExercisesPerPageChange: (n: ExportConfig['exercisesPerPage']) => void
  onExport: () => void
  disabled: boolean
}

const OPTIONS: ExportConfig['exercisesPerPage'][] = [1, 2, 3, 4, 5, 6]

export default function ExportControls({
  exercisesPerPage,
  onExercisesPerPageChange,
  onExport,
  disabled,
}: Props) {
  return (
    <div className="flex items-center gap-4">
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
