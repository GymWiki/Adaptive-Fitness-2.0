import type { ExperienceLevel } from './types'

/**
 * A beginner picking a high-frequency, advanced-oriented template (PHAT/PPL)
 * gets a nudge toward a simpler starting point instead of a silent switch —
 * they can still proceed with the template they picked.
 */
export function getExperienceWarning(daysPerWeek: number, level: ExperienceLevel): string | null {
  if (level === 'beginner' && daysPerWeek >= 5) {
    return (
      'Als beginner raden we aan te starten met 2-4 dagen per week (Full Body). ' +
      'Je kunt dit schema proberen, maar overweeg om eerst rustig op te bouwen.'
    )
  }
  return null
}
