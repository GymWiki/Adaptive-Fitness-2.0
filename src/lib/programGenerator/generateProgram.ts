import { EXERCISE_CATALOG, substituteForEquipment } from './catalog'
import { getTemplate } from './templates'
import { getExperienceWarning } from './experienceWarning'
import { applyGoal } from './applyGoal'
import { applyCardio } from './applyCardio'
import type {
  DaySlot,
  Equipment,
  ExerciseKind,
  ExperienceLevel,
  Goal,
  PlannedExercise,
  TemplateExercisePrescription,
  WeekProgram,
} from './types'

const GLOBAL_NOTES = [
  'Volledige bewegingsuitslag (ROM), tenzij een blessure of beperking dat uitsluit (Wolf et al., 2023).',
  'Dubbele progressie: verhoog eerst de herhalingen binnen de range, pas daarna het gewicht (Schoenfeld, Ogborn & Krieger, 2017; Pelland et al., 2024).',
  'Las elke 4-6 weken een deload-week in met verlaagd volume/intensiteit (Lorenz & Morrison, 2015).',
]

const EXERCISE_KIND_BY_PATTERN_ID: Record<string, ExerciseKind> = Object.fromEntries(
  EXERCISE_CATALOG.map((pattern) => [pattern.id, pattern.kind]),
)

function resolveExercise(
  prescription: TemplateExercisePrescription,
  equipment: Equipment,
): Omit<PlannedExercise, 'rir'> {
  const pattern = EXERCISE_CATALOG.find((p) => p.id === prescription.patternId)
  if (!pattern) {
    throw new Error(`Unknown movement pattern id: ${prescription.patternId}`)
  }
  const name = substituteForEquipment(pattern, equipment)
  if (!name) {
    throw new Error(`No exercise available for pattern ${prescription.patternId} on ${equipment}`)
  }
  return {
    patternId: prescription.patternId,
    name,
    sets: prescription.sets,
    reps: prescription.reps,
    restSeconds: prescription.restSeconds,
    note: prescription.note,
  }
}

export function generateProgram(
  daysPerWeek: number,
  equipment: Equipment,
  experienceLevel: ExperienceLevel,
  goal: Goal,
): WeekProgram {
  if (daysPerWeek < 1 || daysPerWeek > 7) {
    throw new Error(`daysPerWeek must be between 1 and 7, got ${daysPerWeek}`)
  }

  const template = getTemplate(daysPerWeek)
  const exempt = template.goalOverrideExempt ?? false

  const resolvedWeek: DaySlot[] = template.week.map((day) => {
    if (day.type === 'rest') return { type: 'rest' }
    if (day.type === 'active_recovery') return day
    const resolved = day.exercises.map((exercise) => resolveExercise(exercise, equipment))
    return {
      type: 'training',
      label: day.label,
      kind: day.kind,
      exercises: applyGoal(
        resolved.map((exercise) => ({ ...exercise, rir: '' })),
        EXERCISE_KIND_BY_PATTERN_ID,
        day.kind,
        goal,
        exempt,
      ),
    }
  })

  const { week, extraNotes } = applyCardio(resolvedWeek, goal)

  return {
    daysPerWeek,
    equipment,
    experienceLevel,
    goal,
    templateName: template.name,
    source: template.source,
    disclaimer: template.disclaimer ?? null,
    experienceWarning: getExperienceWarning(daysPerWeek, experienceLevel),
    week,
    notes: [...GLOBAL_NOTES, ...extraNotes],
  }
}
