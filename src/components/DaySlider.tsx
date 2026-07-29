import { useEffect, useRef } from 'react'
import type { DaySlot } from '../lib/programGenerator'

function DumbbellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M4 12h16M4 9.5v5M2.5 10.5v3M7 8v8M17 8v8M21.5 10.5v3" strokeLinecap="round" />
    </svg>
  )
}

function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M5 19c8-1 13-6 14-14-8 1-13 6-14 14z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19c2-4 5-7 9-9" strokeLinecap="round" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M20 13.5A8 8 0 1110.5 4a6.5 6.5 0 009.5 9.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function dayIcon(day: DaySlot) {
  if (day.type === 'rest') return <MoonIcon />
  if (day.type === 'active_recovery') return <LeafIcon />
  return <DumbbellIcon />
}

function dayLabel(day: DaySlot) {
  if (day.type === 'rest') return 'Rust'
  if (day.type === 'active_recovery') return 'Herstel'
  return day.label
}

type Props = {
  week: DaySlot[]
  selectedIndex: number
  recommendedIndex: number
  doneInCycle: boolean[]
  onSelect: (index: number) => void
}

export function DaySlider({ week, selectedIndex, recommendedIndex, doneInCycle, onSelect }: Props) {
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    chipRefs.current[selectedIndex]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }, [selectedIndex])

  return (
    <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1">
      {week.map((day, index) => {
        const isSelected = index === selectedIndex
        const isRecommended = index === recommendedIndex
        const isDone = doneInCycle[index]
        return (
          <button
            key={index}
            ref={(el) => {
              chipRefs.current[index] = el
            }}
            type="button"
            onClick={() => onSelect(index)}
            aria-current={isSelected}
            className={`relative flex min-h-16 w-20 shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-xl border px-1 text-center ${
              isSelected
                ? 'border-accent bg-accent text-accent-ink'
                : 'border-border bg-surface text-ink-dim'
            }`}
          >
            {isDone && (
              <span
                aria-label="Al gedaan deze cyclus"
                className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  isSelected ? 'bg-accent-ink text-accent' : 'bg-accent text-accent-ink'
                }`}
              >
                ✓
              </span>
            )}
            {!isDone && isRecommended && (
              <span
                aria-label="Aanbevolen volgende dag"
                className={`absolute -right-1 -top-1 h-3 w-3 rounded-full ${
                  isSelected ? 'bg-accent-ink' : 'bg-accent'
                }`}
              />
            )}
            {dayIcon(day)}
            <span className="line-clamp-2 text-[11px] font-semibold leading-tight">
              {dayLabel(day)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
