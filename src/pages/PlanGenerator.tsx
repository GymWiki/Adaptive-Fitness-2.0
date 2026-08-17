import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { generateCombinedSchedule } from '../lib/combinedSchedule/generateCombinedSchedule'
import type { CombinedWeekProgram } from '../lib/combinedSchedule/generateCombinedSchedule'
import { buildFocusSpecifics } from '../lib/combinedSchedule/buildFocusSpecifics'
import type {
  FocusSpecifics,
  HybridRatio,
  PrimaryFocus,
  RaceDistance,
  RunningExperienceLevel,
  StrengthFocusZone,
  Weekday,
} from '../lib/combinedSchedule/types'
import type { Equipment, ExperienceLevel } from '../lib/programGenerator'
import {
  EQUIPMENT_LABELS,
  EXPERIENCE_LABELS,
  HYBRID_RATIO_LABELS,
  PRIMARY_FOCUS_LABELS,
  RACE_DISTANCE_LABELS,
  RUNNING_EXPERIENCE_LABELS,
  STRENGTH_FOCUS_ZONE_LABELS,
  WEEKDAY_LABELS,
} from '../lib/labels'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input, Select } from '../components/ui/Input'
import { ErrorState } from '../components/ui/States'
import { CombinedWeekList } from '../components/CombinedWeekList'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { updateProfile } from '../lib/sheets/profiles'

const WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

type GeneratedParams = {
  primaryFocus: PrimaryFocus
  specifics: FocusSpecifics
  availableDays: Weekday[]
  equipment: Equipment
  experienceLevel: ExperienceLevel
  runningExperienceLevel: RunningExperienceLevel
}

function sameWeekdaySet(a: Weekday[], b: Weekday[]): boolean {
  return a.length === b.length && [...a].sort().every((day, i) => day === [...b].sort()[i])
}

function specificsMatch(a: FocusSpecifics, b: FocusSpecifics): boolean {
  if (a.primaryFocus !== b.primaryFocus) return false
  if (a.primaryFocus === 'strength' && b.primaryFocus === 'strength') {
    return a.strengthFocusZone === b.strengthFocusZone
  }
  if (a.primaryFocus === 'hybrid' && b.primaryFocus === 'hybrid') {
    return a.hybridRatio === b.hybridRatio
  }
  if (a.primaryFocus === 'running' && b.primaryFocus === 'running') {
    return (
      a.raceDistance === b.raceDistance &&
      a.raceDistanceCustom === b.raceDistanceCustom &&
      a.raceDate === b.raceDate
    )
  }
  return true
}

export function PlanGenerator() {
  const { user } = useAuth()
  const { profile, loading: profileLoading } = useProfile()
  const navigate = useNavigate()

  const [primaryFocus, setPrimaryFocus] = useState<PrimaryFocus>('strength')
  const [strengthFocusZone, setStrengthFocusZone] = useState<StrengthFocusZone | ''>('')
  const [hybridRatio, setHybridRatio] = useState<HybridRatio | ''>('')
  const [raceDistance, setRaceDistance] = useState<RaceDistance | ''>('')
  const [raceDistanceCustom, setRaceDistanceCustom] = useState('')
  const [raceDate, setRaceDate] = useState('')
  const [availableDays, setAvailableDays] = useState<Weekday[]>([])
  const [equipment, setEquipment] = useState<Equipment>('full_gym')
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('intermediate')
  const [runningExperienceLevel, setRunningExperienceLevel] = useState<RunningExperienceLevel>('intermediate')

  const [program, setProgram] = useState<CombinedWeekProgram | null>(null)
  const [generatedParams, setGeneratedParams] = useState<GeneratedParams | null>(null)

  const [confirmingAdopt, setConfirmingAdopt] = useState(false)
  const [adopting, setAdopting] = useState(false)
  const [adopted, setAdopted] = useState(false)
  const [adoptError, setAdoptError] = useState('')

  // Pre-fill the form with the user's current active schema, if they have one.
  useEffect(() => {
    if (!profile) return
    if (profile.primary_focus) setPrimaryFocus(profile.primary_focus)
    if (profile.strength_focus_zone) setStrengthFocusZone(profile.strength_focus_zone)
    if (profile.hybrid_ratio) setHybridRatio(profile.hybrid_ratio)
    if (profile.target_race_distance) setRaceDistance(profile.target_race_distance)
    if (profile.target_race_distance_custom) setRaceDistanceCustom(profile.target_race_distance_custom)
    if (profile.target_race_date) setRaceDate(profile.target_race_date)
    if (profile.available_days.length > 0) setAvailableDays(profile.available_days)
    if (profile.equipment) setEquipment(profile.equipment)
    if (profile.experience_level) setExperienceLevel(profile.experience_level)
    if (profile.running_experience_level) setRunningExperienceLevel(profile.running_experience_level)
  }, [profile])

  function toggleDay(day: Weekday) {
    setAvailableDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  const specifics: FocusSpecifics | null = buildFocusSpecifics({
    primary_focus: primaryFocus,
    strength_focus_zone: strengthFocusZone || null,
    hybrid_ratio: hybridRatio || null,
    target_race_distance: raceDistance || null,
    target_race_distance_custom: raceDistanceCustom.trim() || null,
    target_race_date: raceDate || null,
  })

  const canGenerate =
    specifics !== null &&
    (raceDistance !== 'custom' || raceDistanceCustom.trim() !== '') &&
    availableDays.length >= 2 &&
    availableDays.length <= 6

  function handleGenerate() {
    if (!specifics) return
    const params: GeneratedParams = {
      primaryFocus,
      specifics,
      availableDays,
      equipment,
      experienceLevel,
      runningExperienceLevel,
    }
    setProgram(
      generateCombinedSchedule(
        primaryFocus,
        specifics,
        availableDays,
        equipment,
        experienceLevel,
        runningExperienceLevel,
        new Date(),
      ),
    )
    setGeneratedParams(params)
    setConfirmingAdopt(false)
    setAdopted(false)
    setAdoptError('')
  }

  const profileSpecifics = profile?.primary_focus
    ? buildFocusSpecifics({ ...profile, primary_focus: profile.primary_focus })
    : null

  const isActiveSchema =
    !!profile &&
    !!generatedParams &&
    !!profileSpecifics &&
    profile.schedule_source !== 'custom' &&
    profile.primary_focus === generatedParams.primaryFocus &&
    profile.equipment === generatedParams.equipment &&
    profile.experience_level === generatedParams.experienceLevel &&
    profile.running_experience_level === generatedParams.runningExperienceLevel &&
    sameWeekdaySet(profile.available_days, generatedParams.availableDays) &&
    specificsMatch(generatedParams.specifics, profileSpecifics)

  async function handleAdopt() {
    if (!user || !generatedParams) return
    setAdopting(true)
    setAdoptError('')

    const s = generatedParams.specifics

    try {
      await updateProfile(user.id, {
        primary_focus: generatedParams.primaryFocus,
        strength_focus_zone: s.primaryFocus === 'strength' ? s.strengthFocusZone : null,
        hybrid_ratio: s.primaryFocus === 'hybrid' ? s.hybridRatio : null,
        target_race_distance: s.primaryFocus === 'running' ? s.raceDistance : null,
        target_race_distance_custom: s.primaryFocus === 'running' ? s.raceDistanceCustom : null,
        target_race_date: s.primaryFocus === 'running' ? s.raceDate : null,
        available_days: generatedParams.availableDays,
        equipment: generatedParams.equipment,
        experience_level: generatedParams.experienceLevel,
        running_experience_level: generatedParams.runningExperienceLevel,
        schedule_source: 'generated',
      })
    } catch {
      setAdoptError('Overnemen is mislukt. Probeer opnieuw.')
      setAdopting(false)
      return
    }

    setAdopting(false)
    setConfirmingAdopt(false)
    setAdopted(true)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold">Schema genereren</h1>
      <p className="mt-1 text-sm text-ink-dim">
        Stel je primaire focus en randvoorwaarden in — de generator combineert kracht en hardlopen
        in één weekschema, met periodisering en interferentie-spacing.
      </p>
      <Link to="/app/eigen-schema" className="mt-2 inline-block text-sm font-semibold text-accent hover:underline">
        Of bouw je eigen schema →
      </Link>

      <div className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-dim">
          Primaire focus
          <Select
            value={primaryFocus}
            onChange={(e) => setPrimaryFocus(e.target.value as PrimaryFocus)}
          >
            {(Object.keys(PRIMARY_FOCUS_LABELS) as PrimaryFocus[]).map((key) => (
              <option key={key} value={key}>
                {PRIMARY_FOCUS_LABELS[key]}
              </option>
            ))}
          </Select>
        </label>

        {primaryFocus === 'strength' && (
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-dim">
            Focuszone
            <Select
              value={strengthFocusZone}
              onChange={(e) => setStrengthFocusZone(e.target.value as StrengthFocusZone)}
            >
              <option value="" disabled>
                Kies een focuszone
              </option>
              {(Object.keys(STRENGTH_FOCUS_ZONE_LABELS) as StrengthFocusZone[]).map((key) => (
                <option key={key} value={key}>
                  {STRENGTH_FOCUS_ZONE_LABELS[key]}
                </option>
              ))}
            </Select>
          </label>
        )}

        {primaryFocus === 'hybrid' && (
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-dim">
            Verhouding kracht : hardlopen
            <Select value={hybridRatio} onChange={(e) => setHybridRatio(e.target.value as HybridRatio)}>
              <option value="" disabled>
                Kies een verhouding
              </option>
              {(Object.keys(HYBRID_RATIO_LABELS) as HybridRatio[]).map((key) => (
                <option key={key} value={key}>
                  {HYBRID_RATIO_LABELS[key]}
                </option>
              ))}
            </Select>
          </label>
        )}

        {primaryFocus === 'running' && (
          <>
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-dim">
              Doelafstand
              <Select value={raceDistance} onChange={(e) => setRaceDistance(e.target.value as RaceDistance)}>
                <option value="" disabled>
                  Kies een afstand
                </option>
                {(Object.keys(RACE_DISTANCE_LABELS) as RaceDistance[]).map((key) => (
                  <option key={key} value={key}>
                    {RACE_DISTANCE_LABELS[key]}
                  </option>
                ))}
              </Select>
            </label>
            {raceDistance === 'custom' && (
              <Input
                value={raceDistanceCustom}
                onChange={(e) => setRaceDistanceCustom(e.target.value)}
                placeholder="Welke afstand?"
              />
            )}
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-dim">
              Streefdatum (optioneel)
              <Input type="date" value={raceDate} onChange={(e) => setRaceDate(e.target.value)} />
            </label>
          </>
        )}

        <div>
          <p className="text-sm font-semibold text-ink-dim">Beschikbare dagen (min. 2, max. 6)</p>
          <div className="mt-2 grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`min-h-11 rounded-xl border text-sm font-semibold transition-colors ${
                  availableDays.includes(day)
                    ? 'border-accent bg-accent text-accent-ink'
                    : 'border-border bg-surface-2 text-ink hover:border-border-strong'
                }`}
              >
                {WEEKDAY_LABELS[day]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-dim">
            Apparatuur
            <Select value={equipment} onChange={(e) => setEquipment(e.target.value as Equipment)}>
              {(Object.keys(EQUIPMENT_LABELS) as Equipment[]).map((key) => (
                <option key={key} value={key}>
                  {EQUIPMENT_LABELS[key]}
                </option>
              ))}
            </Select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-dim">
            Ervaring kracht
            <Select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
            >
              {(Object.keys(EXPERIENCE_LABELS) as ExperienceLevel[]).map((key) => (
                <option key={key} value={key}>
                  {EXPERIENCE_LABELS[key]}
                </option>
              ))}
            </Select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-dim">
            Ervaring hardlopen
            <Select
              value={runningExperienceLevel}
              onChange={(e) => setRunningExperienceLevel(e.target.value as RunningExperienceLevel)}
            >
              {(Object.keys(RUNNING_EXPERIENCE_LABELS) as RunningExperienceLevel[]).map((key) => (
                <option key={key} value={key}>
                  {RUNNING_EXPERIENCE_LABELS[key]}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </div>

      <Button onClick={handleGenerate} disabled={!canGenerate} fullWidth className="mt-6">
        Genereer schema
      </Button>

      {program && generatedParams && (
        <div className="mt-8 flex flex-col gap-4">
          {!profileLoading && (
            <Card>
              {isActiveSchema ? (
                <p className="text-sm font-semibold text-accent">
                  ✓ Dit is je huidige actieve schema.
                </p>
              ) : adopted ? (
                <p className="text-sm font-semibold text-accent">
                  ✓ Overgenomen! Dit is nu je actieve schema op het dashboard.
                </p>
              ) : confirmingAdopt ? (
                <div>
                  <p className="text-sm text-ink">
                    Dit vervangt je huidige actieve schema op het dashboard. Weet je het zeker?
                  </p>
                  {adoptError && (
                    <div className="mt-3">
                      <ErrorState message={adoptError} />
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    <Button variant="secondary" onClick={() => setConfirmingAdopt(false)}>
                      Annuleren
                    </Button>
                    <Button onClick={handleAdopt} disabled={adopting} fullWidth>
                      {adopting ? 'Bezig...' : 'Ja, vervang mijn schema'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-ink-dim">
                    Nog niet je actieve schema — de dag-slider op je dashboard volgt dit pas als je
                    het overneemt.
                  </p>
                  <Button size="sm" onClick={() => setConfirmingAdopt(true)} className="shrink-0">
                    Neem over
                  </Button>
                </div>
              )}
            </Card>
          )}

          {adopted && (
            <Button variant="secondary" onClick={() => navigate('/app')} fullWidth>
              Naar dashboard
            </Button>
          )}

          <CombinedWeekList program={program} />
        </div>
      )}
    </div>
  )
}
