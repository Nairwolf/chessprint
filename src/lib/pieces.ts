// SVG piece paths on a 45×45 viewBox.
// Keyed by lowercase piece letter (p r n b q k).
// Fill and stroke are applied by the rendering component based on piece color.
// License: original shapes based on the cburnett set (CC BY-SA 3.0, Colin Burnett).

export const PIECE_PATHS: Record<string, string> = {
  // Pawn: circle head + tapered body + flat base
  p: [
    'M22.5 9C20.01 9 18 11.01 18 13.5C18 15.99 20.01 18 22.5 18C24.99 18 27 15.99 27 13.5C27 11.01 24.99 9 22.5 9Z',
    'M17 38L18.5 20L22.5 19L26.5 20L28 38Z',
    'M12 38L33 38L33 40L12 40Z',
  ].join(' '),

  // Rook: castle tower with two merlons
  r: 'M11 38L11 16L15 16L15 10L19 10L19 16L26 16L26 10L30 10L30 16L34 16L34 38Z',

  // Knight: stylised horse-head silhouette
  n: 'M22 10C20 9 14 10 13 17C12 21 14 24 16 26L15 28C13 30 12 33 12 38L33 38C33 33 32 30 30 28L29 26C31 24 33 21 32 17C31 10 25 9 22 10Z',

  // Bishop: pointed mitre hat + bell body
  b: [
    'M22.5 7L24.5 12L24.5 18L22.5 20L20.5 18L20.5 12Z',
    'M14 38L14 26C14 22 17.5 20 22.5 20C27.5 20 31 22 31 26L31 38Z',
  ].join(' '),

  // Queen: five-pointed crown + rectangular body
  q: 'M22.5 7L25 13L30 9L28 16L36 12L33 25L33 38L12 38L12 25L9 12L17 16L15 9L20 13Z',

  // King: plus-sign cross + bell body
  k: [
    'M20 5L25 5L25 9L29 9L29 14L25 14L25 18L20 18L20 14L16 14L16 9L20 9Z',
    'M12 38L12 27C12 23 17 21 22.5 21C28 21 33 23 33 27L33 38Z',
  ].join(' '),
}
