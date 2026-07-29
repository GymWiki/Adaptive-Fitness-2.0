import type { ReactNode } from 'react'

export function Spinner({ label = 'Laden' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-ink-dim"
    >
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-border-strong border-t-accent" />
      <span className="text-sm">{label}...</span>
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center">
      <p className="font-display text-lg font-bold text-ink">{title}</p>
      <p className="mt-1.5 text-sm text-ink-dim">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
    >
      {message}
    </div>
  )
}
