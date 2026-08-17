import { useEffect, useMemo, useState } from 'react'
import type { Exercise } from '../lib/types'
import type { MuscleGroup } from '../lib/programGenerator'
import { MUSCLE_GROUPS } from '../lib/programGenerator'
import { listExercises, insertExercise, findExerciseByName } from '../lib/sheets/exercises'
import { EXERCISE_LIBRARY } from '../lib/exerciseLibrary'
import { filterEntries, groupByMuscleGroup, mergeExerciseSources } from '../lib/exercisePicker'
import type { PickerEntry } from '../lib/exercisePicker'
import { MUSCLE_GROUP_LABELS } from '../lib/labels'
import { Button } from './ui/Button'
import { Input } from './ui/Input'

type Props = {
  value: string
  onChange: (exerciseId: string) => void
  onSelectExercise?: (exercise: Exercise) => void
}

function entryName(entry: PickerEntry): string {
  return entry.source === 'personal' ? entry.exercise.name : entry.name
}

export function ExercisePicker({ value, onChange, onSelectExercise }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [resolving, setResolving] = useState(false)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    listExercises().then(setExercises)
  }, [])

  const selected = exercises.find((exercise) => exercise.id === value)

  const entries = useMemo(() => mergeExerciseSources(exercises, EXERCISE_LIBRARY), [exercises])
  const filtered = useMemo(() => filterEntries(entries, query), [entries, query])
  const isSearching = query.trim() !== ''
  const grouped = useMemo(() => groupByMuscleGroup(filtered), [filtered])
  const groupOrder: (MuscleGroup | null)[] = [...MUSCLE_GROUPS, null].filter((group) => grouped.has(group))

  function toggleGroup(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function finishSelect(exercise: Exercise) {
    onChange(exercise.id)
    onSelectExercise?.(exercise)
    setOpen(false)
    setQuery('')
  }

  async function handleSelectEntry(entry: PickerEntry) {
    if (entry.source === 'personal') {
      finishSelect(entry.exercise)
      return
    }

    setResolving(true)
    setError('')
    try {
      const existing = await findExerciseByName(entry.name)
      const resolved =
        existing ?? (await insertExercise({ name: entry.name, kind: entry.kind, muscle_group: entry.muscleGroup }))
      if (!existing) setExercises((prev) => [...prev, resolved])
      finishSelect(resolved)
    } catch {
      setError('Oefening kiezen is mislukt. Probeer opnieuw.')
    } finally {
      setResolving(false)
    }
  }

  async function handleAddExercise() {
    if (!newName.trim()) return
    setError('')
    try {
      const created = await insertExercise({ name: newName.trim() })
      setExercises((prev) => [...prev, created])
      setNewName('')
      setShowAdd(false)
      finishSelect(created)
    } catch {
      setError('Oefening aanmaken is mislukt. Probeer opnieuw.')
    }
  }

  function renderEntry(entry: PickerEntry) {
    const key = entry.source === 'personal' ? entry.exercise.id : `library:${entry.name}`
    return (
      <button
        key={key}
        type="button"
        onClick={() => handleSelectEntry(entry)}
        disabled={resolving}
        className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm text-ink hover:bg-surface-2 disabled:opacity-50"
      >
        {entryName(entry)}
      </button>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-12 w-full items-center justify-between rounded-xl border border-border bg-surface-2 px-4 text-left text-[15px] text-ink"
      >
        <span className={selected ? '' : 'text-ink-faint'}>{selected ? selected.name : 'Kies een oefening'}</span>
        <span aria-hidden className="text-ink-faint">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-border bg-surface p-3">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek een oefening..."
          />

          <div className="mt-2 max-h-72 overflow-y-auto">
            {isSearching ? (
              filtered.length === 0 ? (
                <p className="px-3 py-2 text-sm text-ink-faint">Geen oefeningen gevonden.</p>
              ) : (
                <div className="flex flex-col gap-0.5">{filtered.map(renderEntry)}</div>
              )
            ) : (
              <div className="flex flex-col gap-1">
                {groupOrder.map((group) => {
                  const groupKey = group ?? 'other'
                  const isOpen = expanded.has(groupKey)
                  const items = grouped.get(group) ?? []
                  return (
                    <div key={groupKey}>
                      <button
                        type="button"
                        onClick={() => toggleGroup(groupKey)}
                        className="flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-left text-sm font-semibold text-ink-dim hover:bg-surface-2"
                      >
                        <span>{group ? MUSCLE_GROUP_LABELS[group] : 'Overig'}</span>
                        <span className="text-xs text-ink-faint">
                          {items.length} {isOpen ? '▲' : '▼'}
                        </span>
                      </button>
                      {isOpen && <div className="flex flex-col gap-0.5 pl-2">{items.map(renderEntry)}</div>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {error && <p className="mt-2 text-xs text-danger">{error}</p>}

          <div className="mt-3 border-t border-border pt-3">
            {showAdd ? (
              <div className="flex gap-2">
                <Input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Naam oefening"
                  className="flex-1"
                />
                <Button type="button" size="sm" onClick={handleAddExercise}>
                  Toevoegen
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="text-sm font-semibold text-accent hover:underline"
              >
                + Nieuwe oefening toevoegen
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
