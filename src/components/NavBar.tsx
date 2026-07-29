import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const desktopLinkClasses = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold whitespace-nowrap ${
    isActive ? 'bg-accent text-accent-ink' : 'text-ink-dim hover:text-ink'
  }`

const tabClasses = ({ isActive }: { isActive: boolean }) =>
  `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold ${
    isActive ? 'text-accent' : 'text-ink-faint'
  }`

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M4 11l8-6.5L20 11v8a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 19v-8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" strokeLinecap="round" />
    </svg>
  )
}

function TrendingUpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M4 16l5.5-6 4 4L20 6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 6h5v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const TABS = [
  { to: '/app', end: true, label: 'Overzicht', icon: HomeIcon },
  { to: '/app/log', end: false, label: 'Loggen', icon: PlusIcon },
  { to: '/app/history', end: false, label: 'Historie', icon: ClockIcon },
  { to: '/app/plan', end: false, label: 'Schema', icon: CalendarIcon },
  { to: '/app/progress', end: false, label: 'Progressie', icon: TrendingUpIcon },
]

export function NavBar() {
  const { signOut } = useAuth()

  return (
    <>
      {/* Mobile: slim top bar (wordmark + logout) + fixed bottom tab bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-canvas/90 px-4 py-3 backdrop-blur sm:hidden">
        <span className="font-display text-base font-bold">Fitness Log</span>
        <button
          onClick={() => signOut()}
          className="min-h-9 rounded-lg px-2 text-sm font-medium text-ink-faint hover:text-ink"
        >
          Uitloggen
        </button>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-border bg-canvas/95 backdrop-blur sm:hidden">
        {TABS.map(({ to, end, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={end} className={tabClasses}>
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Desktop/tablet: single horizontal nav bar */}
      <header className="sticky top-0 z-10 hidden border-b border-border bg-canvas/90 backdrop-blur sm:block">
        <nav className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2">
          <div className="flex items-center gap-1">
            <NavLink to="/app" end className={desktopLinkClasses}>
              Overzicht
            </NavLink>
            <NavLink to="/app/log" className={desktopLinkClasses}>
              Loggen
            </NavLink>
            <NavLink to="/app/history" className={desktopLinkClasses}>
              Geschiedenis
            </NavLink>
            <NavLink to="/app/plan" className={desktopLinkClasses}>
              Schema
            </NavLink>
            <NavLink to="/app/progress" className={desktopLinkClasses}>
              Progressie
            </NavLink>
          </div>
          <button
            onClick={() => signOut()}
            className="min-h-11 shrink-0 rounded-lg px-3 text-sm font-medium text-ink-faint hover:text-ink"
          >
            Uitloggen
          </button>
        </nav>
      </header>
    </>
  )
}
