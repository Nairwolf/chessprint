type Props = {
  documentTitle: string
  onTitleChange: (v: string) => void
  fenText: string
  onFenChange: (v: string) => void
}

export default function ExerciseForm({ documentTitle, onTitleChange, fenText, onFenChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700" htmlFor="doc-title">
          Document title
        </label>
        <input
          id="doc-title"
          type="text"
          value={documentTitle}
          onChange={e => onTitleChange(e.target.value)}
          placeholder="e.g. Checkmate in one — Week 12"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700" htmlFor="fen-input">
          Exercises
        </label>
        <textarea
          id="fen-input"
          value={fenText}
          onChange={e => onFenChange(e.target.value)}
          rows={12}
          spellCheck={false}
          placeholder={
            'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1 ; Example exercise'
          }
          className="w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-400">Format: FEN ; optional title — one per line</p>
      </div>
    </div>
  )
}
