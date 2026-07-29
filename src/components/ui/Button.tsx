import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'sm'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  children: ReactNode
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink hover:bg-accent-dim disabled:opacity-40',
  secondary:
    'bg-surface-2 text-ink border border-border-strong hover:border-ink-faint disabled:opacity-40',
  ghost: 'text-ink-dim hover:text-ink disabled:opacity-40',
  danger: 'bg-surface-2 text-danger border border-border-strong hover:border-danger disabled:opacity-40',
}

const SIZE_CLASSES: Record<Size, string> = {
  md: 'min-h-12 px-5 text-[15px]',
  sm: 'min-h-10 px-3.5 text-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...rest
}: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-tight transition-colors ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
