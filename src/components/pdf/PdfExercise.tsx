import { StyleSheet, Text, View } from '@react-pdf/renderer'
import { resolveOrientation } from '../../lib/fen'
import type { Exercise, LayoutMetrics, OrientationMode } from '../../types'
import ChessBoardPdf from '../diagram/ChessBoardPdf'

type Props = {
  exercise: Exercise
  layout: LayoutMetrics
  width: number
  orientation: OrientationMode
}

const styles = StyleSheet.create({
  title: {
    fontSize: 9,
    marginTop: 4,
    color: '#555555',
  },
})

export default function PdfExercise({ exercise, layout, width, orientation }: Props) {
  const { cellHeight, boardSize, answerHeight, columns, rows } = layout

  // The cell centers the (board + writing strip) block. For a partly-filled
  // multi-diagram page that reads as centered, but for the lone 1/page board —
  // shrunk with lots of slack around it — the invisible strip below pushes the
  // board visibly above the cell's center. Add a matching spacer above so the
  // board itself is vertically centered, with a real writing strip still below.
  const isSingle = columns === 1 && rows === 1

  return (
    <View
      style={{
        width,
        height: cellHeight,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
      }}
    >
      {isSingle && <View style={{ height: answerHeight, width: '100%' }} />}
      <ChessBoardPdf
        fen={exercise.fen}
        size={boardSize}
        orientation={resolveOrientation(orientation, exercise.activeColor)}
      />
      {exercise.title && <Text style={styles.title}>{exercise.title}</Text>}
      <View style={{ height: answerHeight, width: '100%' }} />
    </View>
  )
}
