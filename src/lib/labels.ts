import type { DayFocus, Equipment, ExperienceLevel, WeekProgram } from './programGenerator'

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

export const FOCUS_LABELS: Record<DayFocus, string> = {
  full_body: 'Full Body',
  upper: 'Upper Body',
  lower: 'Lower Body',
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
}

/** Short human label for a program's split, e.g. "Upper Body / Lower Body". */
export function summarizeSplit(program: WeekProgram): string {
  const seen = new Set<DayFocus>()
  const order: DayFocus[] = []
  for (const day of program.week) {
    if (day.type === 'training' && !seen.has(day.focus)) {
      seen.add(day.focus)
      order.push(day.focus)
    }
  }
  return order.map((focus) => FOCUS_LABELS[focus]).join(' / ')
}
