import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium ${
    isActive
      ? 'bg-brand-600 text-white'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`

export function NavBar() {
  const { signOut } = useAuth()

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <nav className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-1">
          <NavLink to="/app" end className={linkClasses}>
            Overzicht
          </NavLink>
          <NavLink to="/app/log" className={linkClasses}>
            Loggen
          </NavLink>
          <NavLink to="/app/history" className={linkClasses}>
            Geschiedenis
          </NavLink>
        </div>
        <button
          onClick={() => signOut()}
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Uitloggen
        </button>
      </nav>
    </header>
  )
}
