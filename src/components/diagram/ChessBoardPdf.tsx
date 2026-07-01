import { Circle, G, Path, Rect, Svg } from '@react-pdf/renderer'
import { extractActiveColor, fenToBoard } from '../../lib/fen'
import { PIECE_PATHS } from '../../lib/pieces'

type Props = {
  fen: string
  size: number
}

const LIGHT_SQ = '#f0d9b5'
const DARK_SQ = '#b58863'

export default function ChessBoardPdf({ fen, size }: Props) {
  const board = fenToBoard(fen)
  const activeColor = extractActiveColor(fen)
  const sq = size / 8
  const indicatorR = sq * 0.28
  const svgWidth = size + indicatorR * 2 + 8

  return (
    <Svg viewBox={`0 0 ${svgWidth} ${size}`} width={svgWidth} height={size}>
      {board.flatMap((row, ri) =>
        row.map((piece, fi) => {
          const light = (ri + fi) % 2 === 1
          const x = fi * sq
          const y = ri * sq
          const isWhitePiece = piece !== null && piece === piece.toUpperCase()
          const pathD = piece ? PIECE_PATHS[piece.toLowerCase()] : undefined

          return (
            <G key={`${ri}-${fi}`}>
              <Rect x={x} y={y} width={sq} height={sq} fill={light ? LIGHT_SQ : DARK_SQ} />
              {pathD && (
                <G transform={`translate(${x},${y}) scale(${sq / 45})`}>
                  <Path
                    d={pathD}
                    fill={isWhitePiece ? '#ffffff' : '#1a1a1a'}
                    stroke={isWhitePiece ? '#333333' : '#cccccc'}
                    strokeWidth={1.5}
                  />
                </G>
              )}
            </G>
          )
        })
      )}
      <Rect x={0} y={0} width={size} height={size} fill="none" stroke="#555555" strokeWidth={1} />
      <Circle
        cx={size + indicatorR + 4}
        cy={size - indicatorR - 4}
        r={indicatorR}
        fill={activeColor === 'b' ? '#1a1a1a' : '#ffffff'}
        stroke="#333333"
        strokeWidth={1.5}
      />
    </Svg>
  )
}
