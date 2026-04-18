import type { FretboardPosition, StringName } from '../music-theory/MusicTheory'

export interface HighlightSpec {
  position: FretboardPosition
  color: 'amber' | 'green' | 'red'
}

interface Props {
  highlights?: HighlightSpec[]
}

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const SVG_W = 1000
const SVG_H = 180

/** X coordinate of the left-most string label text. */
const STRING_LABEL_X = 25

/** X coordinate of the nut (start of the fretted area). */
const NUT_X = 65

/** X coordinate of the 12th fret line (right edge of neck). */
const NECK_RIGHT = 985

/** Y coordinate of the topmost string (low E). */
const NECK_TOP = 20

/** Y coordinate of the bottommost string (high e). */
const NECK_BOTTOM = 145

/** Y coordinate for fret-number labels below the board. */
const FRET_LABEL_Y = SVG_H - 8

const FRET_COUNT = 12

const STRING_SPACING = (NECK_BOTTOM - NECK_TOP) / 5 // 6 strings → 5 gaps
const FRET_SPACING = (NECK_RIGHT - NUT_X) / FRET_COUNT
const NECK_MID_Y = (NECK_TOP + NECK_BOTTOM) / 2

/** Low-to-high ordering; rendered top-to-bottom in the SVG. */
const STRINGS: StringName[] = ['E', 'A', 'D', 'G', 'B', 'e']

/** Pre-computed Y coordinate for each string — avoids repeated indexOf scans. */
const STRING_Y: Record<StringName, number> = Object.fromEntries(
  STRINGS.map((name, i) => [name, NECK_TOP + i * STRING_SPACING]),
) as Record<StringName, number>

/**
 * How far to the left of the nut the open-string dot sits.
 * Named so the intent is clear and it stays in sync with the fret-0 label.
 */
const OPEN_STRING_DOT_OFFSET = 18

/** Indices 0–12 used for both fret lines and fret-number labels. */
const FRET_INDICES = Array.from({ length: FRET_COUNT + 1 }, (_, i) => i)

/** Frets with a single dot inlay. */
const DOT_FRETS = [3, 5, 7, 9]

/** Fret with the double dot inlay. */
const DOUBLE_DOT_FRET = 12

/** Visual string thickness, thickest at the top (low E). */
const STRING_WIDTHS: Record<StringName, number> = {
  E: 2.4,
  A: 2.0,
  D: 1.7,
  G: 1.4,
  B: 1.1,
  e: 0.9,
}

/** CSS fill colour for each highlight type. */
const HIGHLIGHT_FILL: Record<HighlightSpec['color'], string> = {
  amber: '#f59e0b',
  green: '#22c55e',
  red: '#ef4444',
}

// ---------------------------------------------------------------------------
// Coordinate helpers
// ---------------------------------------------------------------------------

function getStringY(name: StringName): number {
  return STRING_Y[name]
}

/** X of fret line n: 0 = nut, 1–12 = fret lines. */
function getFretLineX(n: number): number {
  return NUT_X + n * FRET_SPACING
}

/**
 * X centre of a note dot.
 * Fret 0 (open string) sits just before the nut; frets 1–12 sit in the space
 * between adjacent fret lines.
 */
function getDotX(fret: number): number {
  if (fret === 0) return NUT_X - OPEN_STRING_DOT_OFFSET
  return NUT_X + (fret - 0.5) * FRET_SPACING
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FretboardSVG({ highlights = [] }: Props) {
  return (
    <div style={{ perspective: '800px', width: '100%' }}>
      <svg
        role="img"
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width="100%"
        style={{ display: 'block', transform: 'rotateX(12deg)', transformOrigin: 'top center' }}
        aria-label="Guitar fretboard"
      >
        {/* Neck background */}
        <rect
          x={NUT_X}
          y={NECK_TOP}
          width={NECK_RIGHT - NUT_X}
          height={NECK_BOTTOM - NECK_TOP}
          fill="#c8a96e"
          rx={3}
        />

        {/* Six string lines */}
        {STRINGS.map((name) => (
          <line
            key={name}
            data-testid={`string-${name}`}
            x1={NUT_X}
            y1={getStringY(name)}
            x2={NECK_RIGHT}
            y2={getStringY(name)}
            stroke="#888"
            strokeWidth={STRING_WIDTHS[name]}
          />
        ))}

        {/* Nut and fret lines (13 total: fret-line-0 through fret-line-12) */}
        {FRET_INDICES.map((fret) => (
          <line
            key={fret}
            data-testid={`fret-line-${fret}`}
            x1={getFretLineX(fret)}
            y1={NECK_TOP}
            x2={getFretLineX(fret)}
            y2={NECK_BOTTOM}
            stroke={fret === 0 ? '#f0ece0' : '#b0a090'}
            strokeWidth={fret === 0 ? 5 : 1.5}
          />
        ))}

        {/* Standard single dot inlays */}
        {DOT_FRETS.map((fret) => (
          <circle
            key={`inlay-${fret}`}
            data-testid={`inlay-${fret}`}
            cx={getDotX(fret)}
            cy={NECK_MID_Y}
            r={6}
            fill="#8b6914"
            opacity={0.45}
          />
        ))}

        {/* Double dot inlay at fret 12 */}
        <circle
          data-testid={`inlay-${DOUBLE_DOT_FRET}`}
          cx={getDotX(DOUBLE_DOT_FRET)}
          cy={NECK_MID_Y - STRING_SPACING * 1.5}
          r={6}
          fill="#8b6914"
          opacity={0.45}
        />
        <circle
          data-testid={`inlay-${DOUBLE_DOT_FRET}-b`}
          cx={getDotX(DOUBLE_DOT_FRET)}
          cy={NECK_MID_Y + STRING_SPACING * 1.5}
          r={6}
          fill="#8b6914"
          opacity={0.45}
        />

        {/* String name labels (headstock end) */}
        {STRINGS.map((name) => (
          <text
            key={`label-${name}`}
            x={STRING_LABEL_X}
            y={getStringY(name)}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#e5e7eb"
            fontSize={14}
            fontFamily="monospace"
          >
            {name}
          </text>
        ))}

        {/* Fret number labels (below the board) */}
        {FRET_INDICES.map((fret) => (
          <text
            key={`fret-num-${fret}`}
            x={getDotX(fret)}
            y={FRET_LABEL_Y}
            textAnchor="middle"
            fill="#9ca3af"
            fontSize={11}
            fontFamily="monospace"
          >
            {fret}
          </text>
        ))}

        {/* Highlight dots */}
        {highlights.map(({ position, color }) => (
          <circle
            key={`highlight-${position.string}-${position.fret}`}
            data-testid={`highlight-${position.string}-${position.fret}`}
            data-color={color}
            aria-label={`${position.string} string, fret ${position.fret}`}
            cx={getDotX(position.fret)}
            cy={getStringY(position.string)}
            r={10}
            fill={HIGHLIGHT_FILL[color]}
          />
        ))}
      </svg>
    </div>
  )
}
