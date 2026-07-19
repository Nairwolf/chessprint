import { StyleSheet, Text } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  pageNumber: {
    position: 'absolute',
    top: 16,
    right: 24,
    fontSize: 9,
    color: '#999999',
  },
})

export default function PdfPageNumber() {
  return (
    <Text
      style={styles.pageNumber}
      fixed
      render={({ pageNumber, totalPages }) =>
        totalPages > 1 ? `${pageNumber} / ${totalPages}` : ''
      }
    />
  )
}
