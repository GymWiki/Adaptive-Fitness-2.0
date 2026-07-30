import type { DaySlot, Goal } from './types'

const BASE_CARDIO_NOTE =
  'Kleine cardio-basis voor algemene gezondheid (bv. 15 min, 1x/week) — geen dominant onderdeel van dit schema.'

const ADD_ON_NOTE =
  'Kon niet als aparte dag ingepland worden zonder je enige rustdag te laten vervallen — daarom hier aangehangen.'

type CardioProfile = {
  sessionsPerWeek: number
  durationMinutes: string
  description: string
}

// Weekly cardio dose by goal — polarized 80/20 framing for conditioning per
// Oliveira, Boppre & Fonseca (2024); see wetenschappelijk-bronnenoverzicht.md.
const CARDIO_PROFILES: Partial<Record<Goal, CardioProfile>> = {
  fat_loss: {
    sessionsPerWeek: 2,
    durationMinutes: '25',
    description: 'Matige intensiteit (zone 2) cardio voor extra calorieverbruik tijdens je tekort.',
  },
  conditioning: {
    sessionsPerWeek: 3,
    durationMinutes: '25',
    description:
      'Voornamelijk rustig tempo (zone 2), af en toe een kort intensief interval (polarized 80/20).',
  },
  mix: {
    sessionsPerWeek: 1,
    durationMinutes: '20',
    description: 'Gebalanceerde toevoeging van cardio naast je krachttraining.',
  },
}

export type CardioResult = {
  week: DaySlot[]
  extraNotes: string[]
}

/**
 * Adds a goal-appropriate cardio dose on top of an already-generated week,
 * never at the cost of the "≤6 actieve dagen, ≥1 rustdag" invariant — it
 * only ever converts rest days it doesn't need to keep in reserve, and
 * falls back to a short add-on on training days when rest days run out.
 */
export function applyCardio(week: DaySlot[], goal: Goal): CardioResult {
  const profile = CARDIO_PROFILES[goal]
  if (!profile) {
    return { week, extraNotes: [BASE_CARDIO_NOTE] }
  }

  if (week.some((day) => day.type === 'active_recovery')) {
    return { week, extraNotes: [] }
  }

  const restIndices: number[] = []
  const trainingIndices: number[] = []
  week.forEach((day, index) => {
    if (day.type === 'rest') restIndices.push(index)
    if (day.type === 'training') trainingIndices.push(index)
  })

  const reservable = Math.max(restIndices.length - 1, 0)
  const dedicated = Math.min(reservable, profile.sessionsPerWeek)
  const remaining = Math.min(profile.sessionsPerWeek - dedicated, trainingIndices.length)

  const nextWeek = [...week]

  for (let i = 0; i < dedicated; i++) {
    nextWeek[restIndices[i]] = {
      type: 'cardio',
      label: 'Cardio',
      description: profile.description,
      durationMinutes: profile.durationMinutes,
    }
  }

  for (let i = 0; i < remaining; i++) {
    const index = trainingIndices[i]
    const day = nextWeek[index]
    if (day.type === 'training') {
      nextWeek[index] = {
        ...day,
        cardioAddOn: { description: `${profile.description} ${ADD_ON_NOTE}`, durationMinutes: '10-15' },
      }
    }
  }

  return { week: nextWeek, extraNotes: [] }
}
