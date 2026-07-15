import { Document } from '@react-pdf/renderer'
import { computeLayout } from '../../lib/layout'
import type { Exercise, ExportConfig } from '../../types'
import PdfPage from './PdfPage'

type Props = {
  exercises: Exercise[]
  config: ExportConfig
}

export default function PdfDocument({ exercises, config }: Props) {
  const { documentTitle, exercisesPerPage, orientation } = config
  const layout = computeLayout(exercisesPerPage)

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
          layout={layout}
          documentTitle={documentTitle}
          orientation={orientation}
        />
      ))}
    </Document>
  )
}
