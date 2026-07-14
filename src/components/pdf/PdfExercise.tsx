import { StyleSheet, Text, View } from '@react-pdf/renderer'
import type { Exercise, LayoutMetrics } from '../../types'
import ChessBoardPdf from '../diagram/ChessBoardPdf'

type Props = {
  exercise: Exercise
  layout: LayoutMetrics
  width: number
}

const styles = StyleSheet.create({
  title: {
    fontSize: 9,
    marginTop: 4,
    color: '#555555',
  },
})

export default function PdfExercise({ exercise, layout, width }: Props) {
  const { cellHeight, boardSize, answerHeight } = layout

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
      <ChessBoardPdf fen={exercise.fen} size={boardSize} />
      {exercise.title && <Text style={styles.title}>{exercise.title}</Text>}
      <View style={{ height: answerHeight, width: '100%' }} />
    </View>
  )
}
