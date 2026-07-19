import { Document } from '@react-pdf/renderer'
import { computeLayout } from '../../lib/layout'
import { formatSolution } from '../../lib/lichess'
import type { Exercise, ExercisesPerPage, ExportConfig } from '../../types'
import PdfPage from './PdfPage'
import PdfSolutionsPage, { type SolutionRow } from './PdfSolutionsPage'

// Solutions render in two columns (~25 rows each) to save paper. This fixed chunk
// keeps a page within the usable A4 height even when long solutions wrap in the
// narrower column width; PdfSolutionsPage splits each page's rows across the columns.
const SOLUTION_ROWS_PER_PAGE = 50

type Props = {
  exercises: Exercise[]
  config: ExportConfig
}

export default function PdfDocument({ exercises, config }: Props) {
  const { documentTitle, exercisesPerPage, orientation, includeSolutions, coordinates } = config

  const pages: Exercise[][] = []
  for (let i = 0; i < exercises.length; i += exercisesPerPage) {
    pages.push(exercises.slice(i, i + exercisesPerPage))
  }

  // Answer key: one row per exercise that has a solution, keyed on paper by its
  // printed title. Ordinal is the exercise's position in the full sheet.
  const solutionRows: SolutionRow[] = includeSolutions
    ? exercises
        .map((ex, i) => ({ ex, ordinal: i + 1 }))
        .filter(({ ex }) => ex.solution)
        .map(({ ex, ordinal }) => ({
          ordinal,
          label: ex.title ?? `Exercise ${ordinal}`,
          solution: formatSolution(ex.fen, ex.solution!),
        }))
    : []

  const solutionPages: SolutionRow[][] = []
  for (let i = 0; i < solutionRows.length; i += SOLUTION_ROWS_PER_PAGE) {
    solutionPages.push(solutionRows.slice(i, i + SOLUTION_ROWS_PER_PAGE))
  }
  const solutionTitle = documentTitle ? `${documentTitle} — Solutions` : 'Solutions'

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
            coordinates,
          )}
          documentTitle={documentTitle}
          orientation={orientation}
          coordinates={coordinates}
        />
      ))}
      {solutionPages.map((rows, pi) => (
        <PdfSolutionsPage key={`sol-${pi}`} title={solutionTitle} rows={rows} />
      ))}
    </Document>
  )
}
