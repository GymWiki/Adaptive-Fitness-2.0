import type { Equipment, ExperienceLevel } from './programGenerator'

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
