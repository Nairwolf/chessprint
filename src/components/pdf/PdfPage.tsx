import { Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { Exercise, LayoutMetrics } from '../../types'
import PdfExercise from './PdfExercise'

type Props = {
  exercises: Exercise[]
  layout: LayoutMetrics
  documentTitle: string
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    marginBottom: 8,
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})

export default function PdfPage({ exercises, layout, documentTitle }: Props) {
  const { margin, headerHeight, cellWidth, centered, columns } = layout
  const gridWidth = cellWidth * columns

  function isCentered(i: number) {
    return centered && i === exercises.length - 1 && exercises.length % 2 === 1
  }

  return (
    <Page size="A4">
      <View style={{ padding: margin }}>
        <View style={[styles.header, { height: headerHeight }]}>
          <Text style={styles.headerText}>{documentTitle}</Text>
        </View>
        <View style={styles.grid}>
          {exercises.map((ex, i) => (
            <PdfExercise
              key={ex.id}
              exercise={ex}
              layout={layout}
              width={isCentered(i) ? gridWidth : cellWidth}
              centered={isCentered(i)}
            />
          ))}
        </View>
      </View>
    </Page>
  )
}
