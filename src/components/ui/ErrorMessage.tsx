import type { ParseError } from '../../types'

type Props = {
  errors: ParseError[]
}

export default function ErrorMessage({ errors }: Props) {
  if (errors.length === 0) return null

  return (
    <div className="rounded border border-red-300 bg-red-50 p-3">
      <p className="mb-2 text-sm font-semibold text-red-700">
        {errors.length} invalid line{errors.length > 1 ? 's' : ''} — export blocked
      </p>
      <ul className="flex flex-col gap-1">
        {errors.map(err => (
          <li key={err.line} className="font-mono text-xs text-red-600">
            <span className="font-semibold">Line {err.line}</span>
            {err.raw ? ` — "${err.raw}"` : ''}: {err.reason}
          </li>
        ))}
      </ul>
    </div>
  )
}
