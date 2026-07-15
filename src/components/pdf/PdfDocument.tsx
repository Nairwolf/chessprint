import { Document } from '@react-pdf/renderer'
import { computeLayout } from '../../lib/layout'
import type { Exercise, ExercisesPerPage, ExportConfig } from '../../types'
import PdfPage from './PdfPage'

type Props = {
  exercises: Exercise[]
  config: ExportConfig
}

export default function PdfDocument({ exercises, config }: Props) {
  const { documentTitle, exercisesPerPage, orientation } = config

  const pages: Exercise[][] = []
  for (let i = 0; i < exercises.length; i += exercisesPerPage) {
    pages.push(exercises.slice(i, i + exercisesPerPage))
  }

  return (
    <Document title={documentTitle}>
      {pages.map((pageExercises, pi) => (
        <PdfPage
          key={pi}
          exercises={pageExercises}
          // A partial final page uses the layout for the count it actually holds,
          // so leftover diagrams fill the page instead of reusing the full-page sizing.
          layout={computeLayout(
            Math.min(exercisesPerPage, pageExercises.length) as ExercisesPerPage,
          )}
          documentTitle={documentTitle}
          orientation={orientation}
        />
      ))}
    </Document>
  )
}
