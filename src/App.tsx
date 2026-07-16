import { pdf } from '@react-pdf/renderer'
import { useEffect, useState } from 'react'
import ExerciseForm from './components/ui/ExerciseForm'
import LichessImport from './components/ui/LichessImport'
import ExportControls from './components/ui/ExportControls'
import ErrorMessage from './components/ui/ErrorMessage'
import Preview from './components/ui/Preview'
import PdfDocument from './components/pdf/PdfDocument'
import { parseInput } from './lib/parser'
import { validateExercises } from './lib/validator'
import type { Exercise, ParseError, ExportConfig, OrientationMode } from './types'

export default function App() {
  const [documentTitle, setDocumentTitle] = useState('')
  const [fenText, setFenText] = useState('')
  const [exercisesPerPage, setExercisesPerPage] = useState<ExportConfig['exercisesPerPage']>(4)
  const [orientation, setOrientation] = useState<OrientationMode>('auto')
  const [allowMissingKings, setAllowMissingKings] = useState(false)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [errors, setErrors] = useState<ParseError[]>([])

  useEffect(() => {
    const timer = setTimeout(() => {
      const { exercises: exs, errors: errs } = validateExercises(
        parseInput(fenText),
        allowMissingKings
      )
      setExercises(exs)
      setErrors(errs)
    }, 300)
    return () => clearTimeout(timer)
  }, [fenText, allowMissingKings])

  function handlePuzzlesLoaded(lines: string) {
    setFenText(prev => (prev.trim() ? prev.replace(/\s+$/, '') + '\n' + lines : lines))
  }

  async function handleExport() {
    const { exercises: exs, errors: errs } = validateExercises(
      parseInput(fenText),
      allowMissingKings
    )
    setExercises(exs)
    setErrors(errs)
    if (errs.length > 0) return

    const blob = await pdf(
      <PdfDocument
        exercises={exs}
        config={{ documentTitle, exercisesPerPage, orientation, allowMissingKings }}
      />
    ).toBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${documentTitle || 'chessprint'}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-8 py-4">
        <h1 className="text-center text-xl font-bold text-gray-900">ChessPrint</h1>
      </header>
      <main className="mx-auto max-w-6xl px-8 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <ExerciseForm
              documentTitle={documentTitle}
              onTitleChange={setDocumentTitle}
              fenText={fenText}
              onFenChange={setFenText}
            />
            <LichessImport onLoaded={handlePuzzlesLoaded} />
            <ErrorMessage errors={errors} />
            <ExportControls
              exercisesPerPage={exercisesPerPage}
              onExercisesPerPageChange={setExercisesPerPage}
              orientation={orientation}
              onOrientationChange={setOrientation}
              allowMissingKings={allowMissingKings}
              onAllowMissingKingsChange={setAllowMissingKings}
              onExport={handleExport}
              disabled={errors.length > 0 || exercises.length === 0}
            />
          </div>
          <div>
            <Preview exercises={exercises} orientation={orientation} />
          </div>
        </div>
      </main>
    </div>
  )
}
