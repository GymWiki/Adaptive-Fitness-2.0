import type { Equipment, ExperienceLevel, MuscleGroup } from './programGenerator'
import type {
  HybridRatio,
  PrimaryFocus,
  RaceDistance,
  RunningExperienceLevel,
  SessionDuration,
  StrengthFocusZone,
  Weekday,
} from './combinedSchedule/types'

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  full_gym: 'Volledige sportschool',
  home_dumbbells: 'Thuis met dumbbells',
  bodyweight_only: 'Alleen lichaamsgewicht',
}

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  beginner: 'Beginner (< 6 maanden)',
  intermediate: 'Intermediate (6+ maanden)',
  advanced: 'Advanced (1+ jaar, consistent)',
}

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Borst',
  back: 'Rug',
  shoulders: 'Schouders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  quads: 'Quadriceps',
  hamstrings: 'Hamstrings',
  glutes: 'Bilspieren',
  calves: 'Kuiten',
  core: 'Core',
}

export const PRIMARY_FOCUS_LABELS: Record<PrimaryFocus, string> = {
  strength: 'Kracht & Spieropbouw',
  hybrid: 'Hybride Atleet',
  running: 'Hardloopprestaties',
  general_health: 'Algemene Gezondheid & Vetverlies',
}

export const PRIMARY_FOCUS_DESCRIPTIONS: Record<PrimaryFocus, string> = {
  strength: 'Focus op spiermassa/progressieve overload — hardlopen is conditie-onderhoud, laag volume.',
  hybrid: 'Gelijke balans tussen kracht/spiermassa en hardloopuithoudingsvermogen.',
  running: 'Focus op snelheid/afstand — krachttraining is ondersteunend en blessurepreventief.',
  general_health: 'Duurzaam ritme, mix van lichte weerstand en aerobe cardio.',
}

export const STRENGTH_FOCUS_ZONE_LABELS: Record<StrengthFocusZone, string> = {
  compound_lifts: 'Compound lifts',
  general_hypertrophy: 'Algemene hypertrofie',
  upper_lower_balance: 'Bovenlichaam-onderlichaam-balans',
}

export const HYBRID_RATIO_LABELS: Record<HybridRatio, string> = {
  '50_50': '50 / 50',
  '60_40': '60 / 40 (meer kracht)',
  '40_60': '40 / 60 (meer hardlopen)',
}

export const RACE_DISTANCE_LABELS: Record<RaceDistance, string> = {
  '5k': 'Sub-20 5K',
  '10k': 'Sub-45 10K',
  half_marathon: 'Sub-2:00 halve marathon',
  first_10k: 'Eerste 10K uitlopen',
  custom: 'Andere afstand',
}

export const SESSION_DURATION_LABELS: Record<SessionDuration, string> = {
  '30_45': '30-45 min',
  '45_60': '45-60 min',
  '60_90': '60-90 min',
}

export const RUNNING_EXPERIENCE_LABELS: Record<RunningExperienceLevel, string> = {
  beginner: 'Beginner (nog geen 5K)',
  intermediate: 'Gemiddeld (loopt wekelijks)',
  experienced: 'Ervaren',
}

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: 'Ma',
  tue: 'Di',
  wed: 'Wo',
  thu: 'Do',
  fri: 'Vr',
  sat: 'Za',
  sun: 'Zo',
}
