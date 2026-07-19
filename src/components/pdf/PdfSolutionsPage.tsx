import { Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import PdfPageNumber from './PdfPageNumber'

export type SolutionRow = {
  ordinal: number // 1-based position of the exercise in the full sheet
  label: string // the diagram's printed title (the on-paper link), e.g. "Lichess abc12 (1600)"
  solution: string // numbered SAN, e.g. "1. Qxf7+ Kxf7 2. Ng5+"
}

type Props = {
  title: string
  rows: SolutionRow[]
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  header: {
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    height: 40,
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  columns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    width: '48%',
  },
  row: {
    flexDirection: 'row',
    marginTop: 8,
  },
  ordinal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333333',
    width: 26,
  },
  body: {
    flex: 1,
  },
  label: {
    fontSize: 8,
    color: '#999999',
    marginBottom: 1,
  },
  solution: {
    fontSize: 10,
    color: '#111111',
  },
})

function Column({ rows }: { rows: SolutionRow[] }) {
  return (
    <View style={styles.column}>
      {rows.map(r => (
        <View key={r.ordinal} style={styles.row} wrap={false}>
          <Text style={styles.ordinal}>{r.ordinal}.</Text>
          <View style={styles.body}>
            <Text style={styles.label}>{r.label}</Text>
            <Text style={styles.solution}>{r.solution}</Text>
          </View>
        </View>
      ))}
    </View>
  )
}

export default function PdfSolutionsPage({ title, rows }: Props) {
  // Fill the left column first, then the right — sequential reading order. A balanced
  // split keeps a short final page from being lopsided (a full 40-row page is 20/20).
  const mid = Math.ceil(rows.length / 2)

  return (
    <Page size="A4">
      <PdfPageNumber />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>{title}</Text>
        </View>
        <View style={styles.columns}>
          <Column rows={rows.slice(0, mid)} />
          <Column rows={rows.slice(mid)} />
        </View>
      </View>
    </Page>
  )
}
