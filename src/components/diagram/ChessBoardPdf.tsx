import { Circle, G, Path, Rect, Svg } from '@react-pdf/renderer'
import { extractActiveColor, fenToBoard, orientBoard } from '../../lib/fen'
import { PIECES } from '../../lib/pieces'
import type { PieceKey } from '../../types'

type Props = {
  fen: string
  size: number
  orientation: 'w' | 'b'
}

const LIGHT_SQ = '#f0d9b5'
const DARK_SQ = '#b58863'

export default function ChessBoardPdf({ fen, size, orientation }: Props) {
  const activeColor = extractActiveColor(fen)
  const board = orientBoard(fenToBoard(fen), orientation)
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
          const layers = piece ? PIECES[piece as PieceKey] : undefined

          return (
            <G key={`${ri}-${fi}`}>
              <Rect x={x} y={y} width={sq} height={sq} fill={light ? LIGHT_SQ : DARK_SQ} />
              {layers && (
                <G transform={`translate(${x},${y}) scale(${sq / 45})`}>
                  {layers.map((layer, li) => (
                    <Path
                      key={li}
                      d={layer.d}
                      fill={layer.fill}
                      fillRule={layer.fillRule}
                      stroke={layer.stroke}
                      strokeWidth={layer.strokeWidth}
                      strokeLinecap={layer.strokeLinecap}
                      strokeLinejoin={layer.strokeLinejoin}
                      opacity={layer.opacity}
                    />
                  ))}
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
