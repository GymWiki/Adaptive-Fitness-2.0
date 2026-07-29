import type { ReactNode } from 'react'

type Tone = 'accent' | 'warning' | 'neutral'

const TONE_CLASSES: Record<Tone, string> = {
  accent: 'bg-accent/15 text-accent',
  warning: 'bg-warning/15 text-warning',
  neutral: 'bg-surface-2 text-ink-dim',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  )
}
