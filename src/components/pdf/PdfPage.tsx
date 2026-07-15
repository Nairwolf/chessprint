import { Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { Exercise, LayoutMetrics, OrientationMode } from '../../types'
import PdfExercise from './PdfExercise'

type Props = {
  exercises: Exercise[]
  layout: LayoutMetrics
  documentTitle: string
  orientation: OrientationMode
}

const styles = StyleSheet.create({
  header: {
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})

export default function PdfPage({ exercises, layout, documentTitle, orientation }: Props) {
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
              orientation={orientation}
            />
          ))}
        </View>
      </View>
    </Page>
  )
}
