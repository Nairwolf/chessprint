import { resolveOrientation } from '../../lib/fen'
import type { Exercise, OrientationMode } from '../../types'
import ChessBoard from '../diagram/ChessBoard'

type Props = {
  exercises: Exercise[]
  orientation: OrientationMode
  coordinates: boolean
}

export default function Preview({ exercises, orientation, coordinates }: Props) {
  if (exercises.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-gray-600">
        {exercises.length} exercise{exercises.length > 1 ? 's' : ''}
      </p>
      <ul className="flex flex-col gap-3">
        {exercises.map((ex, i) => (
          <li key={ex.id} className="flex items-center gap-3">
            <ChessBoard
              fen={ex.fen}
              size={96}
              orientation={resolveOrientation(orientation, ex.activeColor)}
              coordinates={coordinates}
            />
            <span className="text-sm text-gray-700">
              {ex.title ?? `Exercise ${i + 1}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
