import { availablePatterns, substituteForEquipment } from './catalog'
import { applyExperienceLevelSplit } from './splitSchedules'
import { enforceRestDayAndSpacing, ensureMinimumMuscleGroupFrequency } from './rules'
import { FOCUS_MUSCLE_GROUPS } from './types'
import type {
  DayFocus,
  DaySlot,
  Equipment,
  ExperienceLevel,
  PlannedExercise,
  WeekProgram,
} from './types'

const DELOAD_EVERY_WEEKS = 5 // every 4-6 weeks — Lorenz & Morrison (2015)
const WARMUP_NOTE = 'Begin met 1-2 lichte opbouwsets vóór je werkgewicht.'

const PROGRAM_NOTES = [
  'Volledige bewegingsuitslag (ROM), tenzij een blessure of beperking dat uitsluit (Wolf et al., 2023).',
  'Dubbele progressie: verhoog eerst de herhalingen binnen de range, pas daarna het gewicht (Schoenfeld, Ogborn & Krieger, 2017; Pelland et al., 2024).',
  `Las elke 4-6 weken een deload-week in met verlaagd volume/intensiteit (Lorenz & Morrison, 2015).`,
]

/** Compound lifts lean strength-oriented; isolation work leans hypertrophy-oriented (Refalo et al., 2024). */
function setsRepsRestFor(kind: 'compound' | 'isolation') {
  return kind === 'compound'
    ? { sets: 3, reps: '6-10', restSeconds: '120-180' }
    : { sets: 3, reps: '10-15', restSeconds: '60-90' }
}

function buildSessionExercises(focus: DayFocus, equipment: Equipment): PlannedExercise[] {
  const exercisesPerMuscleGroup = focus === 'full_body' ? 1 : 2
  const exercises: PlannedExercise[] = []

  for (const muscleGroup of FOCUS_MUSCLE_GROUPS[focus]) {
    const patterns = availablePatterns(muscleGroup, equipment)
    if (patterns.length === 0) {
      throw new Error(`No exercise available for ${muscleGroup} on equipment profile ${equipment}`)
    }

    for (const pattern of patterns.slice(0, exercisesPerMuscleGroup)) {
      const name = substituteForEquipment(pattern, equipment)
      if (!name) continue
      exercises.push({
        patternId: pattern.id,
        name,
        muscleGroup: pattern.muscleGroup,
        secondaryMuscleGroups: pattern.secondaryMuscleGroups,
        rangeOfMotion: 'full',
        progression: 'double-progression',
        ...setsRepsRestFor(pattern.kind),
      })
    }
  }

  return exercises
}

export function generateProgram(
  daysPerWeek: number,
  equipment: Equipment,
  experienceLevel: ExperienceLevel,
): WeekProgram {
  if (daysPerWeek < 2 || daysPerWeek > 6) {
    throw new Error(`daysPerWeek must be between 2 and 6, got ${daysPerWeek}`)
  }

  const schedule = applyExperienceLevelSplit(daysPerWeek, experienceLevel)
  enforceRestDayAndSpacing(schedule)
  ensureMinimumMuscleGroupFrequency(schedule)

  const week: DaySlot[] = schedule.map((slot) =>
    slot === 'rest'
      ? { type: 'rest' }
      : {
          type: 'training',
          focus: slot,
          warmup: WARMUP_NOTE,
          exercises: buildSessionExercises(slot, equipment),
        },
  )

  return {
    daysPerWeek,
    equipment,
    experienceLevel,
    week,
    deloadEveryWeeks: DELOAD_EVERY_WEEKS,
    notes: PROGRAM_NOTES,
  }
}
