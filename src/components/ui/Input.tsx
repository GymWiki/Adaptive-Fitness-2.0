import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react'

const FIELD_CLASSES =
  'min-h-12 w-full rounded-xl border border-border bg-surface-2 px-4 text-[15px] text-ink placeholder:text-ink-faint focus-visible:border-accent'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${FIELD_CLASSES} ${props.className ?? ''}`} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${FIELD_CLASSES} ${props.className ?? ''}`} />
}
