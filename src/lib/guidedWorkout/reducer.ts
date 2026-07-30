import type { Exercise } from '../types'
import type { PlannedExercise } from '../programGenerator'

export type LoggedSet = {
  setRowId: string
  weight: number
  reps: number
  rir: number
}

export type GuidedExerciseState = {
  resolved: Exercise
  planned: PlannedExercise
  targetSets: number
  loggedSets: LoggedSet[]
}

export type GuidedPhase = 'active' | 'resting' | 'done'

export type EditingPointer = { exerciseIndex: number; setIndex: number }

export type GuidedState = {
  exercises: GuidedExerciseState[]
  exerciseIndex: number
  phase: GuidedPhase
  editing: EditingPointer | null
}

export type GuidedAction =
  | { type: 'SET_LOGGED'; setRowId: string; weight: number; reps: number; rir: number }
  | { type: 'CONTINUE' }
  | { type: 'ADD_EXTRA_SET' }
  | { type: 'START_EDIT'; exerciseIndex: number; setIndex: number }
  | { type: 'CANCEL_EDIT' }
  | { type: 'SET_UPDATED'; exerciseIndex: number; setIndex: number; weight: number; reps: number; rir: number }

export function createInitialGuidedState(
  exercises: Array<{ resolved: Exercise; planned: PlannedExercise }>,
): GuidedState {
  return {
    exercises: exercises.map((exercise) => ({
      ...exercise,
      targetSets: exercise.planned.sets,
      loggedSets: [],
    })),
    exerciseIndex: 0,
    phase: exercises.length === 0 ? 'done' : 'active',
    editing: null,
  }
}

export function guidedWorkoutReducer(state: GuidedState, action: GuidedAction): GuidedState {
  switch (action.type) {
    case 'SET_LOGGED': {
      const { exerciseIndex } = state
      const exercises = state.exercises.map((exercise, index) =>
        index === exerciseIndex
          ? {
              ...exercise,
              loggedSets: [
                ...exercise.loggedSets,
                { setRowId: action.setRowId, weight: action.weight, reps: action.reps, rir: action.rir },
              ],
            }
          : exercise,
      )
      const current = exercises[exerciseIndex]
      const isLastExercise = exerciseIndex === exercises.length - 1
      const isFinalSetOfWorkout = isLastExercise && current.loggedSets.length >= current.targetSets
      return { ...state, exercises, phase: isFinalSetOfWorkout ? 'done' : 'resting' }
    }

    case 'CONTINUE': {
      if (state.phase !== 'resting') return state
      const current = state.exercises[state.exerciseIndex]
      const reachedTarget = current.loggedSets.length >= current.targetSets
      const hasNextExercise = state.exerciseIndex < state.exercises.length - 1
      return reachedTarget && hasNextExercise
        ? { ...state, phase: 'active', exerciseIndex: state.exerciseIndex + 1 }
        : { ...state, phase: 'active' }
    }

    case 'ADD_EXTRA_SET': {
      const { exerciseIndex } = state
      const exercises = state.exercises.map((exercise, index) =>
        index === exerciseIndex ? { ...exercise, targetSets: exercise.targetSets + 1 } : exercise,
      )
      return { ...state, exercises }
    }

    case 'START_EDIT':
      return { ...state, editing: { exerciseIndex: action.exerciseIndex, setIndex: action.setIndex } }

    case 'CANCEL_EDIT':
      return { ...state, editing: null }

    case 'SET_UPDATED': {
      const exercises = state.exercises.map((exercise, exIndex) =>
        exIndex === action.exerciseIndex
          ? {
              ...exercise,
              loggedSets: exercise.loggedSets.map((set, setIndex) =>
                setIndex === action.setIndex
                  ? { ...set, weight: action.weight, reps: action.reps, rir: action.rir }
                  : set,
              ),
            }
          : exercise,
      )
      return { ...state, exercises, editing: null }
    }

    default:
      return state
  }
}
