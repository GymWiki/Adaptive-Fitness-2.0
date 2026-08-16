import type { RunningExperienceLevel } from '../combinedSchedule/types'
import type { PhaseSchedule, TrainingPhase } from './determineCurrentPhase'

export type RunningSessionType = 'easy' | 'tempo' | 'interval' | 'race_pace' | 'run_walk'

export type RunningSession = {
  type: RunningSessionType
  label: string
  distanceKm: number
  description: string
}

export type RunningWeekPlan = {
  phase: TrainingPhase | 'ongoing'
  weekLabel: string
  totalDistanceKm: number
  sessions: RunningSession[]
  notes: string[]
}

// Documented assumption — no logged running history exists yet (that's
// Garmin-integration territory, out of scope here), so these are sensible
// starting points, not derived from anything the user reported.
const STARTING_WEEKLY_KM: Record<RunningExperienceLevel, number> = {
  beginner: 8,
  intermediate: 20,
  experienced: 35,
}

/**
 * Weekly volume increase ceiling — 10% is the safe default, especially for
 * beginners; research (Nielsen et al., Gabbett) suggests experienced runners
 * can tolerate 20-25% short-term, so 10% is a conservative floor, not a
 * strict law. See design doc §3 sources.
 */
export function weeklyVolumeIncreaseCeiling(level: RunningExperienceLevel): number {
  if (level === 'beginner') return 0.1
  if (level === 'intermediate') return 0.15
  return 0.2
}

// Taper cuts volume 41-60% while keeping intensity — the midpoint is a
// reasonable single value to apply without adding another tunable input.
const TAPER_VOLUME_REDUCTION = 0.5

function computeWeeklyVolume(
  experienceLevel: RunningExperienceLevel,
  phase: TrainingPhase | 'ongoing',
  weeksElapsedInPlan: number,
): number {
  const start = STARTING_WEEKLY_KM[experienceLevel]
  if (phase === 'ongoing') return start

  const grown = start * Math.pow(1 + weeklyVolumeIncreaseCeiling(experienceLevel), weeksElapsedInPlan)
  return phase === 'taper' ? grown * (1 - TAPER_VOLUME_REDUCTION) : grown
}

/** How far into a run/walk progression a beginner is — longer run segments as weeks pass, until continuous. */
function runWalkDescription(weeksElapsed: number): string {
  const steps = [
    '1 min hardlopen / 2 min wandelen, herhalen',
    '2 min hardlopen / 2 min wandelen, herhalen',
    '3 min hardlopen / 1 min wandelen, herhalen',
    '5 min hardlopen / 1 min wandelen, herhalen',
    '8 min hardlopen / 1 min wandelen, herhalen',
    'Doorlopend hardlopen (geen wandelpauzes meer nodig)',
  ]
  return steps[Math.min(Math.floor(weeksElapsed / 2), steps.length - 1)]
}

/**
 * One week's running sessions — session count matches the allocated running
 * days, distance splits evenly across them, and the easy/tempo/interval mix
 * follows the phase (base/ongoing: mostly easy; build/peak: quality work
 * added) — but ONLY for intermediate/experienced runners. Beginners never
 * get tempo/interval regardless of phase, and get run_walk instead of easy.
 */
export function buildRunningPlan(
  schedule: PhaseSchedule,
  runningDaysCount: number,
  experienceLevel: RunningExperienceLevel,
): RunningWeekPlan {
  const phase = schedule.mode === 'race_targeted' ? schedule.phase : 'ongoing'
  const weeksElapsed = schedule.mode === 'race_targeted' ? schedule.weeksElapsedInPlan : 0
  const totalDistanceKm = Math.round(computeWeeklyVolume(experienceLevel, phase, weeksElapsed) * 10) / 10

  if (runningDaysCount <= 0) {
    return { phase, weekLabel: weekLabel(schedule), totalDistanceKm: 0, sessions: [], notes: [] }
  }

  const perSessionKm = Math.round((totalDistanceKm / runningDaysCount) * 10) / 10
  const sessionTypes = sessionTypesFor(phase, runningDaysCount, experienceLevel)

  const sessions: RunningSession[] = sessionTypes.map((type) => {
    if (type === 'run_walk') {
      return {
        type,
        label: 'Run-walk',
        distanceKm: perSessionKm,
        description: runWalkDescription(weeksElapsed),
      }
    }
    return {
      type,
      label: SESSION_LABELS[type],
      distanceKm: perSessionKm,
      description: SESSION_DESCRIPTIONS[type],
    }
  })

  return {
    phase,
    weekLabel: weekLabel(schedule),
    totalDistanceKm,
    sessions,
    notes:
      experienceLevel === 'beginner'
        ? ['Run-walk-opbouw: verleng de hardloop-intervallen geleidelijk, geen tempo/interval-training als beginner.']
        : [],
  }
}

const SESSION_LABELS: Record<Exclude<RunningSessionType, 'run_walk'>, string> = {
  easy: 'Rustige duurloop',
  tempo: 'Tempotraining',
  interval: 'Intervaltraining',
  race_pace: 'Wedstrijdtempo',
}

const SESSION_DESCRIPTIONS: Record<Exclude<RunningSessionType, 'run_walk'>, string> = {
  easy: 'Zone 2, gesprekstempo.',
  tempo: 'Drempeltempo — comfortabel zwaar, geen gesprek meer mogelijk.',
  interval: 'Korte, snelle intervallen met rust ertussen.',
  race_pace: 'Op je geplande wedstrijdtempo.',
}

function weekLabel(schedule: PhaseSchedule): string {
  if (schedule.mode === 'ongoing') return 'Doorlopend'
  const phaseLabel = { base: 'Base', build: 'Build', peak: 'Peak', taper: 'Taper' }[schedule.phase]
  return `${phaseLabel} — week ${schedule.weekInPhase} van ${schedule.totalWeeksInPhase}`
}

function sessionTypesFor(
  phase: TrainingPhase | 'ongoing',
  runningDaysCount: number,
  experienceLevel: RunningExperienceLevel,
): RunningSessionType[] {
  if (experienceLevel === 'beginner') {
    return Array(runningDaysCount).fill('run_walk')
  }

  const easy = (n: number) => Array(n).fill('easy') as RunningSessionType[]

  if (phase === 'base' || phase === 'ongoing') {
    // ~80% easy — one quality session once there's room for it.
    return runningDaysCount >= 3 ? [...easy(runningDaysCount - 1), 'tempo'] : easy(runningDaysCount)
  }
  if (phase === 'build') {
    // ~70% easy / 20% tempo / 10% interval.
    if (runningDaysCount >= 3) return [...easy(runningDaysCount - 2), 'tempo', 'interval']
    if (runningDaysCount === 2) return ['easy', 'tempo']
    return ['easy']
  }
  if (phase === 'peak') {
    // ~65% easy / 20% race pace / 15% interval.
    if (runningDaysCount >= 3) return [...easy(runningDaysCount - 2), 'race_pace', 'interval']
    if (runningDaysCount === 2) return ['easy', 'race_pace']
    return ['easy']
  }
  // Taper: intensity stays, volume drops — keep the quality session, trim the rest to easy.
  return runningDaysCount >= 2 ? [...easy(runningDaysCount - 1), 'tempo'] : easy(runningDaysCount)
}
