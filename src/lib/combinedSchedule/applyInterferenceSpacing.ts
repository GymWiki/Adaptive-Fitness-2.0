import { EXERCISE_CATALOG } from '../programGenerator'
import type { DaySlot, MuscleGroup } from '../programGenerator'
import type { CombinedDaySlot } from './types'

const LEG_MUSCLE_GROUPS: MuscleGroup[] = ['quads', 'hamstrings', 'glutes']

/** A training day is "leg-heavy" if any of its exercises targets quads/hamstrings/glutes. */
export function isLegHeavyStrengthDay(day: DaySlot): boolean {
  if (day.type !== 'training') return false
  return day.exercises.some((exercise) => {
    const pattern = EXERCISE_CATALOG.find((p) => p.id === exercise.patternId)
    return pattern ? LEG_MUSCLE_GROUPS.includes(pattern.muscleGroup) : false
  })
}

function isHardRunningSession(slot: CombinedDaySlot): boolean {
  return (
    slot.type === 'running' &&
    (slot.session.type === 'tempo' || slot.session.type === 'interval' || slot.session.type === 'race_pace')
  )
}

function isAdjacent(a: number, b: number): boolean {
  return Math.abs(a - b) === 1
}

/**
 * Keeps hard running sessions (tempo/interval/race pace) off days adjacent
 * to a leg-heavy strength day — "minimaal 6-8 uur ertussen, bij voorkeur
 * een aparte dag," interpreted as "not the very next/previous day slot"
 * since this architecture has no time-of-day model. Swaps a conflicting
 * hard session with a same-week rest slot when one exists that isn't
 * itself adjacent to a leg day; leaves it in place otherwise (a fully
 * packed week may have no valid alternative).
 */
export function applyInterferenceSpacing(week: CombinedDaySlot[]): CombinedDaySlot[] {
  let result = [...week]

  const legDayIndices = () =>
    result.reduce<number[]>((indices, slot, index) => {
      if (slot.type === 'strength' && isLegHeavyStrengthDay(slot.day)) indices.push(index)
      return indices
    }, [])

  for (let i = 0; i < result.length; i++) {
    if (!isHardRunningSession(result[i])) continue

    const legIndices = legDayIndices()
    const conflicting = legIndices.some((legIndex) => isAdjacent(legIndex, i))
    if (!conflicting) continue

    const restIndex = result.findIndex(
      (slot, index) => slot.type === 'rest' && !legIndices.some((legIndex) => isAdjacent(legIndex, index)),
    )
    if (restIndex === -1) continue

    const swapped = [...result]
    ;[swapped[i], swapped[restIndex]] = [swapped[restIndex], swapped[i]]
    result = swapped
  }

  return result
}
