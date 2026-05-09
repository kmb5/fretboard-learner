import { getAllPositionsForNote, toCanonicalSharp } from '../music-theory/MusicTheory'
import type { StringName } from '../music-theory/MusicTheory'
import type { HighlightSpec } from './FretboardSVG'
import type { SessionStatus } from '../game/GameSession'
import type { Difficulty } from '../game/GameMode'

/**
 * Derive the set of fretboard highlight dots from the current session state.
 *
 * Rules:
 *   - correct (any difficulty)  → green dots on all valid positions
 *   - wrong   + learning        → red dots on all valid positions
 *   - waiting + learning        → amber dots on all valid positions
 *   - waiting + practice        → no dots (player must recall from memory)
 *   - idle / no note            → no dots
 *
 * `stringFilter` restricts positions to a single string (Random String mode);
 * null means show dots across all strings.
 */
export function computeHighlights(
  status: SessionStatus,
  difficulty: Difficulty,
  currentNote: string,
  stringFilter: StringName | null,
): HighlightSpec[] {
  if (!currentNote) return []

  const allPositions = getAllPositionsForNote(toCanonicalSharp(currentNote))
  const positions =
    stringFilter === null
      ? allPositions
      : allPositions.filter((p) => p.string === stringFilter)

  if (status === 'correct') {
    return positions.map((p) => ({ position: p, color: 'green' as const }))
  }
  if (status === 'wrong' && difficulty === 'learning') {
    return positions.map((p) => ({ position: p, color: 'red' as const }))
  }
  if (status === 'waiting' && difficulty === 'learning') {
    return positions.map((p) => ({ position: p, color: 'amber' as const }))
  }
  return []
}
