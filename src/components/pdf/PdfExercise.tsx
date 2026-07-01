import { StyleSheet, Text, View } from '@react-pdf/renderer'
import type { Exercise, LayoutMetrics } from '../../types'
import ChessBoardPdf from '../diagram/ChessBoardPdf'

type Props = {
  exercise: Exercise
  layout: LayoutMetrics
  width: number
  centered: boolean
}

const styles = StyleSheet.create({
  title: {
    fontSize: 9,
    marginTop: 4,
    color: '#555555',
  },
  answerSpace: {
    flex: 1,
  },
})

export default function PdfExercise({ exercise, layout, width, centered }: Props) {
  const { cellHeight, boardSize } = layout

  return (
    <View
      style={{
        width,
        height: cellHeight,
        alignItems: centered ? 'center' : 'flex-start',
        padding: 4,
      }}
    >
      <ChessBoardPdf fen={exercise.fen} size={boardSize} />
      {exercise.title && <Text style={styles.title}>{exercise.title}</Text>}
      <View style={styles.answerSpace} />
    </View>
  )
}
