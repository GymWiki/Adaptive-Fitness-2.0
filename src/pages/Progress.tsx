import { useEffect, useState } from 'react'
import { useProgressData } from '../hooks/useProgressData'
import { computeVolume, detectPRs, oneRepMaxTrend } from '../lib/progressStats'
import type { LoggedSet } from '../lib/progressStats'
import { LineChart } from '../components/charts/LineChart'
import { BarChart } from '../components/charts/BarChart'
import { Card } from '../components/ui/Card'
import { Select } from '../components/ui/Input'
import { EmptyState, ErrorState, Spinner } from '../components/ui/States'

function formatKg(value: number): string {
  return `${value.toFixed(1).replace(/\.0$/, '')} kg`
}

export function Progress() {
  const { histories, loading, error } = useProgressData()
  const [selectedId, setSelectedId] = useState('')

  useEffect(() => {
    if (!selectedId && histories.length > 0) {
      setSelectedId(histories[0].exerciseId)
    }
  }, [histories, selectedId])

  const selected = histories.find((h) => h.exerciseId === selectedId) ?? null

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold">Progressie</h1>
      <p className="mt-1 text-sm text-ink-dim">
        Geschat 1RM, volume en persoonlijke records per oefening.
      </p>

      {loading && <Spinner />}

      {!loading && error && (
        <div className="mt-6">
          <ErrorState message="Je progressie kon niet geladen worden. Controleer je verbinding en probeer opnieuw." />
        </div>
      )}

      {!loading && !error && histories.length === 0 && (
        <div className="mt-8">
          <EmptyState
            title="Nog geen data"
            description="Log een paar workouts en je progressie per oefening verschijnt hier."
          />
        </div>
      )}

      {!loading && !error && histories.length > 0 && (
        <>
          <label className="mt-6 flex flex-col gap-1.5 text-sm font-semibold text-ink-dim">
            Oefening
            <Select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              {histories.map((h) => (
                <option key={h.exerciseId} value={h.exerciseId}>
                  {h.exerciseName}
                </option>
              ))}
            </Select>
          </label>

          {selected && <ExerciseProgress key={selected.exerciseId} sets={selected.sets} />}
        </>
      )}
    </div>
  )
}

function ExerciseProgress({ sets }: { sets: LoggedSet[] }) {
  const trend = oneRepMaxTrend(sets)
  const volume = computeVolume(sets)
  const prs = detectPRs(sets).slice().reverse()

  const latest = trend[trend.length - 1] ?? null
  const first = trend[0] ?? null
  const deltaKg = latest && first && trend.length > 1 ? latest.estimated1RM - first.estimated1RM : null

  return (
    <div className="mt-6 flex flex-col gap-4">
      <Card>
        <p className="text-sm font-semibold text-ink-dim">Geschat 1RM</p>
        <div className="mt-1 flex items-baseline gap-2">
          <p className="font-display text-3xl font-bold text-ink">
            {latest ? formatKg(latest.estimated1RM) : '—'}
          </p>
          {deltaKg !== null && (
            <span className={`text-sm font-semibold ${deltaKg >= 0 ? 'text-accent' : 'text-danger'}`}>
              {deltaKg >= 0 ? '+' : ''}
              {formatKg(deltaKg)}
            </span>
          )}
        </div>
        {trend.length > 0 ? (
          <div className="mt-4">
            <LineChart
              points={trend.map((t) => ({ date: t.performedAt, value: t.estimated1RM }))}
              formatValue={formatKg}
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink-faint">Nog te weinig data voor een trend.</p>
        )}
      </Card>

      <Card>
        <p className="text-sm font-semibold text-ink-dim">Volume per workout</p>
        {volume.length > 0 ? (
          <div className="mt-4">
            <BarChart
              points={volume.map((v) => ({ date: v.performedAt, value: v.volumeKg }))}
              formatValue={formatKg}
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink-faint">Nog geen sets gelogd.</p>
        )}
      </Card>

      <Card>
        <p className="text-sm font-semibold text-ink-dim">Persoonlijke records</p>
        {prs.length === 0 ? (
          <p className="mt-2 text-sm text-ink-faint">Nog geen records.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {prs.slice(0, 8).map((pr, index) => (
              <li key={pr.setId} className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-ink">
                    {pr.weightKg} kg × {pr.reps} · RIR {pr.rir}
                  </p>
                  <p className="text-xs text-ink-faint">
                    {new Date(pr.performedAt).toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink-dim">{formatKg(pr.estimated1RM)}</p>
                  {index === 0 && (
                    <span className="text-xs font-semibold text-accent">Nieuwste record</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
