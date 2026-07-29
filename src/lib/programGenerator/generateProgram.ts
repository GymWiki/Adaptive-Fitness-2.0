import { EXERCISE_CATALOG, substituteForEquipment } from './catalog'
import { getTemplate } from './templates'
import { getExperienceWarning } from './experienceWarning'
import type {
  DaySlot,
  Equipment,
  ExperienceLevel,
  PlannedExercise,
  TemplateExercisePrescription,
  WeekProgram,
} from './types'

const GLOBAL_NOTES = [
  'Volledige bewegingsuitslag (ROM), tenzij een blessure of beperking dat uitsluit (Wolf et al., 2023).',
  'Dubbele progressie: verhoog eerst de herhalingen binnen de range, pas daarna het gewicht (Schoenfeld, Ogborn & Krieger, 2017; Pelland et al., 2024).',
  'Las elke 4-6 weken een deload-week in met verlaagd volume/intensiteit (Lorenz & Morrison, 2015).',
]

function resolveExercise(
  prescription: TemplateExercisePrescription,
  equipment: Equipment,
): PlannedExercise {
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
): WeekProgram {
  if (daysPerWeek < 1 || daysPerWeek > 7) {
    throw new Error(`daysPerWeek must be between 1 and 7, got ${daysPerWeek}`)
  }

  const template = getTemplate(daysPerWeek)

  const week: DaySlot[] = template.week.map((day) => {
    if (day.type === 'rest') return { type: 'rest' }
    if (day.type === 'active_recovery') return day
    return {
      type: 'training',
      label: day.label,
      kind: day.kind,
      exercises: day.exercises.map((exercise) => resolveExercise(exercise, equipment)),
    }
  })

  return {
    daysPerWeek,
    equipment,
    experienceLevel,
    templateName: template.name,
    source: template.source,
    disclaimer: template.disclaimer ?? null,
    experienceWarning: getExperienceWarning(daysPerWeek, experienceLevel),
    week,
    notes: GLOBAL_NOTES,
  }
}
