import type { FretboardPosition, StringName } from '../music-theory/MusicTheory'

export interface HighlightSpec {
  position: FretboardPosition
  color: 'amber' | 'green' | 'red'
}

interface Props {
  highlights?: HighlightSpec[]
  isLeftHanded?: boolean
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
  E: 2.2,
  A: 1.85,
  D: 1.55,
  G: 1.3,
  B: 1.05,
  e: 0.85,
}

/** Design-system fill colours for each highlight state. */
const HIGHLIGHT_FILL: Record<HighlightSpec['color'], string> = {
  amber: 'var(--amber)',
  green: 'var(--green)',
  red:   'var(--red)',
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

export default function FretboardSVG({ highlights = [], isLeftHanded = false }: Props) {
  return (
    <div className="fretboard-frame">
      <div style={{ perspective: '800px', width: '100%' }}>
        <svg
          role="img"
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          width="100%"
          style={{ display: 'block', transform: 'rotateX(12deg)', transformOrigin: 'top center' }}
          aria-label="Guitar fretboard"
        >
          <defs>
            {/* Neck background: dark warm gradient, lighter towards centre */}
            <linearGradient id="neck-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   style={{ stopColor: 'var(--neck-start)' }} />
              <stop offset="48%"  style={{ stopColor: 'var(--neck-mid)' }} />
              <stop offset="100%" style={{ stopColor: 'var(--neck-end)' }} />
            </linearGradient>

            {/* Glow effect for highlight dots */}
            <filter id="dot-glow" x="-70%" y="-70%" width="240%" height="240%">
              <feGaussianBlur stdDeviation="4.5" in="SourceGraphic" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g transform={isLeftHanded ? `translate(${SVG_W}, 0) scale(-1, 1)` : undefined}>

          {/* ── Neck background ─────────────────────────────────────── */}
          <rect
            x={NUT_X}
            y={NECK_TOP}
            width={NECK_RIGHT - NUT_X}
            height={NECK_BOTTOM - NECK_TOP}
            fill="url(#neck-bg)"
            rx={2}
          />

          {/* Top-edge warmth line */}
          <line
            x1={NUT_X} y1={NECK_TOP}
            x2={NECK_RIGHT} y2={NECK_TOP}
            stroke="rgba(255,200,120,0.12)"
            strokeWidth={1}
          />

          {/* ── Fret lines + nut ────────────────────────────────────── */}
          {FRET_INDICES.map((fret) => (
            <line
              key={fret}
              data-testid={`fret-line-${fret}`}
              x1={getFretLineX(fret)}
              y1={NECK_TOP}
              x2={getFretLineX(fret)}
              y2={NECK_BOTTOM}
              stroke={fret === 0 ? 'var(--nut-color)' : 'var(--fret-color)'}
              strokeWidth={fret === 0 ? 4 : 1.5}
            />
          ))}

          {/* ── Six strings ─────────────────────────────────────────── */}
          {STRINGS.map((name) => (
            <line
              key={name}
              data-testid={`string-${name}`}
              x1={NUT_X}
              y1={getStringY(name)}
              x2={NECK_RIGHT}
              y2={getStringY(name)}
              stroke="var(--string-color)"
              strokeWidth={STRING_WIDTHS[name]}
            />
          ))}

          {/* ── Inlay dots ──────────────────────────────────────────── */}
          {DOT_FRETS.map((fret) => (
            <circle
              key={`inlay-${fret}`}
              data-testid={`inlay-${fret}`}
              cx={getDotX(fret)}
              cy={NECK_MID_Y}
              r={5}
              style={{ fill: 'var(--dot-color)' }}
            />
          ))}

          {/* Double-dot inlay at fret 12 */}
          <circle
            data-testid={`inlay-${DOUBLE_DOT_FRET}`}
            cx={getDotX(DOUBLE_DOT_FRET)}
            cy={NECK_MID_Y - STRING_SPACING * 1.5}
            r={5}
            style={{ fill: 'var(--dot-color)' }}
          />
          <circle
            data-testid={`inlay-${DOUBLE_DOT_FRET}-b`}
            cx={getDotX(DOUBLE_DOT_FRET)}
            cy={NECK_MID_Y + STRING_SPACING * 1.5}
            r={5}
            style={{ fill: 'var(--dot-color)' }}
          />

          {/* ── String name labels (headstock end) ──────────────────── */}
          {STRINGS.map((name) => (
            <g
              key={`label-${name}`}
              transform={isLeftHanded
                ? `translate(${2 * STRING_LABEL_X}, 0) scale(-1, 1)`
                : undefined}
            >
              <text
                x={STRING_LABEL_X}
                y={getStringY(name)}
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--string-color)"
                fontSize={13}
                fontFamily="'Fira Code', monospace"
              >
                {name}
              </text>
            </g>
          ))}

          {/* ── Fret number labels (below the board) ────────────────── */}
          {FRET_INDICES.map((fret) => (
            <g
              key={`fret-num-${fret}`}
              transform={isLeftHanded
                ? `translate(${2 * getDotX(fret)}, 0) scale(-1, 1)`
                : undefined}
            >
              <text
                x={getDotX(fret)}
                y={FRET_LABEL_Y}
                textAnchor="middle"
                fill="var(--fret-num-color)"
                fontSize={10}
                fontFamily="'Fira Code', monospace"
              >
                {fret}
              </text>
            </g>
          ))}

          {/* ── Highlight dots (with glow) ───────────────────────────── */}
          {highlights.map(({ position, color }) => (
            <g
              key={`highlight-${position.string}-${position.fret}`}
              filter="url(#dot-glow)"
            >
              {/* Outer ring */}
              <circle
                cx={getDotX(position.fret)}
                cy={getStringY(position.string)}
                r={14}
                fill="none"
                stroke={HIGHLIGHT_FILL[color]}
                strokeWidth={1.5}
                opacity={0.45}
              />
              {/* Filled dot */}
              <circle
                data-testid={`highlight-${position.string}-${position.fret}`}
                data-color={color}
                aria-label={`${position.string} string, fret ${position.fret}`}
                cx={getDotX(position.fret)}
                cy={getStringY(position.string)}
                r={9}
                fill={HIGHLIGHT_FILL[color]}
              />
            </g>
          ))}

          </g>
        </svg>
      </div>
    </div>
  )
}
