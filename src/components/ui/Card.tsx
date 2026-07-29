import type { HTMLAttributes, ReactNode } from 'react'

type Props = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean
  children: ReactNode
}

export function Card({ interactive = false, className = '', children, ...rest }: Props) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface p-4 ${interactive ? 'transition-colors hover:border-border-strong' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
