import { useEffect, useMemo, useState } from 'react'
import { useActiveProgram } from '../hooks/useActiveProgram'
import { useWorkoutCount } from '../hooks/useWorkoutCount'
import { computeCycleState } from '../lib/cycleProgress'
import { DaySlider } from './DaySlider'
import { DayDetail } from './DayDetail'

export function ActiveProgramPanel() {
  const { program, loading: programLoading } = useActiveProgram()
  const { count, loading: countLoading } = useWorkoutCount()
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const cycleState = useMemo(() => {
    if (!program || count === null) return null
    return computeCycleState(program.week, count)
  }, [program, count])

  useEffect(() => {
    if (cycleState && selectedIndex === null) {
      setSelectedIndex(cycleState.recommendedIndex)
    }
  }, [cycleState, selectedIndex])

  if (programLoading || countLoading || !program || !cycleState || selectedIndex === null) {
    return null
  }

  return (
    <div className="mb-8">
      <h2 className="font-display text-lg font-bold text-ink">{program.templateName}</h2>
      <div className="mt-3">
        <DaySlider
          week={program.week}
          selectedIndex={selectedIndex}
          recommendedIndex={cycleState.recommendedIndex}
          doneInCycle={cycleState.doneInCycle}
          onSelect={setSelectedIndex}
        />
      </div>
      <div className="mt-4">
        <DayDetail
          day={program.week[selectedIndex]}
          isDone={cycleState.doneInCycle[selectedIndex]}
        />
      </div>
    </div>
  )
}
