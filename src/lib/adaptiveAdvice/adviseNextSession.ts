import type { Advice, ExerciseKind, ExerciseTarget, SessionLog } from './types'

const INCREMENT_KG = 1.25

// Compound lifts (bench, squat, deadlift, ...) can absorb a bigger jump than
// small isolation movements. Source: Schoenfeld, Ogborn & Krieger (2017);
// Pelland et al. (2024) — see wetenschappelijk-bronnenoverzicht.md.
const STEP_PERCENTAGE: Record<ExerciseKind, number> = {
  isolation: 0.025,
  compound: 0.05,
}

const DELOAD_PERCENTAGE = 0.1

function roundToIncrement(weightKg: number, increment = INCREMENT_KG): number {
  return Math.round(weightKg / increment) * increment
}

function describeSets(session: SessionLog): string {
  const reps = session.sets.map((set) => set.reps)
  const rirs = session.sets.map((set) => set.rir)
  const repsLabel = reps.every((r) => r === reps[0])
    ? `${reps[0]}`
    : `${Math.min(...reps)}-${Math.max(...reps)}`
  const rirLabel = rirs.every((r) => r === rirs[0])
    ? `${rirs[0]}`
    : `${Math.min(...rirs)}-${Math.max(...rirs)}`
  return `${session.sets.length}×${repsLabel} met RIR ${rirLabel}`
}

/** All sets hit the top of the rep range without digging past the target RIR floor. */
function hitTopOfRangeWithSufficientReserve(session: SessionLog, target: ExerciseTarget): boolean {
  return session.sets.every(
    (set) => set.reps >= target.repRangeMax && set.rir >= target.targetRirMin,
  )
}

/** At least one set fell below the bottom of the rep range — the weight is too heavy. */
function missedFloorOfRange(session: SessionLog, target: ExerciseTarget): boolean {
  return session.sets.some((set) => set.reps < target.repRangeMin)
}

export function adviseNextSession(
  exercise: ExerciseTarget,
  sessionHistory: SessionLog[],
): Advice {
  if (sessionHistory.length === 0) {
    return {
      advies: 'geen_historie',
      gewicht: null,
      reden:
        'Nog geen historie voor deze oefening — kies zelf een startgewicht ' +
        '(richtlijn: RIR 3-4, liever te licht dan te zwaar).',
    }
  }

  const [last, previous] = sessionHistory
  const lastWeight = last.sets[0].weightKg

  if (previous && missedFloorOfRange(last, exercise) && missedFloorOfRange(previous, exercise)) {
    const newWeight = roundToIncrement(lastWeight * (1 - DELOAD_PERCENTAGE))
    return {
      advies: 'omlaag',
      gewicht: newWeight,
      reden: `-10% — twee keer op rij onder de ${exercise.repRangeMin} reps gebleven.`,
    }
  }

  if (hitTopOfRangeWithSufficientReserve(last, exercise)) {
    const stepPercentage = STEP_PERCENTAGE[exercise.kind]
    const rounded = roundToIncrement(lastWeight * (1 + stepPercentage))
    // Rounding a small percentage step can round back down to the current
    // weight (e.g. +2.5% on 20kg rounds to 20kg) — always guarantee at least
    // one practical increment of real progress when advising 'omhoog'.
    const newWeight = rounded > lastWeight ? rounded : lastWeight + INCREMENT_KG
    const deltaKg = newWeight - lastWeight
    return {
      advies: 'omhoog',
      gewicht: newWeight,
      reden: `+${deltaKg.toFixed(2).replace(/\.?0+$/, '')} kg — je haalde vorige keer ${describeSets(last)}.`,
    }
  }

  const worstSet = last.sets.reduce((worst, set) => (set.reps < worst.reps ? set : worst))
  const repsShort = exercise.repRangeMax - worstSet.reps
  const reden =
    repsShort > 0
      ? `Zelfde gewicht — je kwam ${repsShort} rep${repsShort === 1 ? '' : 's'} tekort op de laatste set.`
      : `Zelfde gewicht — je zat dichter bij falen dan het doel (RIR onder ${exercise.targetRirMin}).`

  return {
    advies: 'gelijk',
    gewicht: lastWeight,
    reden,
  }
}
