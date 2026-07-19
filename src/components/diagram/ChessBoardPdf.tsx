import { Circle, G, Path, Rect, Svg, Text } from '@react-pdf/renderer'
import { COORD_GUTTER_FRAC, coordLabels, extractActiveColor, fenToBoard, orientBoard } from '../../lib/fen'
import { PIECES } from '../../lib/pieces'
import type { PieceKey } from '../../types'

type Props = {
  fen: string
  size: number
  orientation: 'w' | 'b'
  coordinates?: boolean
}

const LIGHT_SQ = '#f0d9b5'
const DARK_SQ = '#b58863'
const COORD_COLOR = '#555555'

export default function ChessBoardPdf({ fen, size, orientation, coordinates = false }: Props) {
  const activeColor = extractActiveColor(fen)
  const board = orientBoard(fenToBoard(fen), orientation)
  const sq = size / 8
  const indicatorR = sq * 0.28
  const gutter = coordinates ? size * COORD_GUTTER_FRAC : 0
  const fontSize = size * 0.032
  const svgWidth = size + indicatorR * 2 + 8 + gutter
  const svgHeight = size + gutter
  const { files, ranks } = coordLabels(orientation)

  return (
    <Svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width={svgWidth} height={svgHeight}>
      <G transform={`translate(${gutter},0)`}>
        {board.flatMap((row, ri) =>
          row.map((piece, fi) => {
            const light = (ri + fi) % 2 === 0
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
        {coordinates &&
          files.map((label, fi) => {
            // fontSize isn't in @react-pdf's SVGTextProps type, but the SVG
            // renderer does support it (see SVG_INHERITED_PROPS) — spread a
            // typed variable so TS's structural excess-property check allows it.
            const textProps = {
              x: (fi + 0.5) * sq,
              y: size + gutter * 0.75,
              fontSize,
              fill: COORD_COLOR,
              textAnchor: 'middle' as const,
            }
            return (
              <Text key={`f-${fi}`} {...textProps}>
                {label}
              </Text>
            )
          })}
        {coordinates &&
          ranks.map((label, ri) => {
            const textProps = {
              x: -gutter * 0.4,
              y: (ri + 0.5) * sq + fontSize * 0.35,
              fontSize,
              fill: COORD_COLOR,
              textAnchor: 'middle' as const,
            }
            return (
              <Text key={`r-${ri}`} {...textProps}>
                {label}
              </Text>
            )
          })}
      </G>
    </Svg>
  )
}
