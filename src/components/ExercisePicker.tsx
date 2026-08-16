import { useEffect, useState } from 'react'
import type { Exercise } from '../lib/types'
import { listExercises, insertExercise } from '../lib/sheets/exercises'
import { Button } from './ui/Button'
import { Input, Select } from './ui/Input'

type Props = {
  value: string
  onChange: (exerciseId: string) => void
  onSelectExercise?: (exercise: Exercise) => void
}

export function ExercisePicker({ value, onChange, onSelectExercise }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    loadExercises()
  }, [])

  async function loadExercises() {
    setExercises(await listExercises())
  }

  async function handleAddExercise() {
    if (!newName.trim()) return
    const created = await insertExercise({ name: newName.trim() })
    setExercises((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
    onChange(created.id)
    onSelectExercise?.(created)
    setNewName('')
    setShowAdd(false)
  }

  function handleSelect(exerciseId: string) {
    onChange(exerciseId)
    const exercise = exercises.find((ex) => ex.id === exerciseId)
    if (exercise) onSelectExercise?.(exercise)
  }

  return (
    <div>
      <Select
        value={value}
        onChange={(e) => {
          if (e.target.value === '__add__') {
            setShowAdd(true)
          } else {
            handleSelect(e.target.value)
          }
        }}
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
      </Select>

      {showAdd && (
        <div className="mt-2 flex gap-2">
          <Input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Naam oefening"
            className="flex-1"
          />
          <Button type="button" onClick={handleAddExercise}>
            Toevoegen
          </Button>
        </div>
      )}
    </div>
  )
}
