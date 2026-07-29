import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Exercise } from '../lib/types'

type Props = {
  value: string
  onChange: (exerciseId: string) => void
}

export function ExercisePicker({ value, onChange }: Props) {
  const { user } = useAuth()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    loadExercises()
  }, [])

  async function loadExercises() {
    const { data } = await supabase
      .from('exercises')
      .select('id, name, muscle_group')
      .order('name')
    if (data) setExercises(data)
  }

  async function handleAddExercise() {
    if (!newName.trim() || !user) return
    const { data, error } = await supabase
      .from('exercises')
      .insert({ name: newName.trim(), user_id: user.id })
      .select('id, name, muscle_group')
      .single()
    if (!error && data) {
      setExercises((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      onChange(data.id)
      setNewName('')
      setShowAdd(false)
    }
  }

  return (
    <div>
      <select
        value={value}
        onChange={(e) => {
          if (e.target.value === '__add__') {
            setShowAdd(true)
          } else {
            onChange(e.target.value)
          }
        }}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
      >
        <option value="" disabled>
          Kies een oefening
        </option>
        {exercises.map((ex) => (
          <option key={ex.id} value={ex.id}>
            {ex.name}
          </option>
        ))}
        <option value="__add__">+ Nieuwe oefening toevoegen</option>
      </select>

      {showAdd && (
        <div className="mt-2 flex gap-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Naam oefening"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <button
            type="button"
            onClick={handleAddExercise}
            className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Toevoegen
          </button>
        </div>
      )}
    </div>
  )
}
