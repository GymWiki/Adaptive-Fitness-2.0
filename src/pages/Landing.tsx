import { useEffect, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { InstallCard } from '../components/InstallCard'
import { Button } from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" strokeLinecap="round" />
    </svg>
  )
}

function TrendingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
      <path d="M4 16l5.5-6 4 4L20 6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.5 6H20v5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FlaskIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
      <path d="M9.5 3h5M10 3v6.5L4.8 18a2 2 0 001.7 3h11a2 2 0 001.7-3L14 9.5V3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 15h8" strokeLinecap="round" />
    </svg>
  )
}

function DeviceIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M11 18h2" strokeLinecap="round" />
    </svg>
  )
}

const FEATURES: { icon: ReactNode; title: string; body: string }[] = [
  {
    icon: <CalendarIcon />,
    title: 'Schema op maat',
    body: 'Geef je dagen per week, apparatuur en ervaring op. Je krijgt een compleet schema terug — full body, upper/lower of push/pull/legs, precies zoals de literatuur voorschrijft.',
  },
  {
    icon: <TrendingIcon />,
    title: 'Advies dat meegroeit',
    body: 'Na elke sessie berekenen we of het gewicht omhoog moet, gelijk moet blijven, of terug moet — op basis van wat je daadwerkelijk presteerde. Double progression, geen giswerk.',
  },
  {
    icon: <FlaskIcon />,
    title: 'Onderbouwd, niet verzonnen',
    body: 'Frequentie, volume, restperiodes, deload-weken — elke regel in je schema is te herleiden tot onderzoek. Geen trends, geen bro-science.',
  },
  {
    icon: <DeviceIcon />,
    title: 'Altijd binnen handbereik',
    body: 'Installeer Fitness Log als app op je telefoon. Werkt offline, geen appstore nodig, geen account bij een derde partij.',
  },
]

export function Landing() {
  const { session } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (session) navigate('/app', { replace: true })
  }, [session, navigate])

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-display text-lg font-bold tracking-tight">Fitness Log</span>
        <Link to="/login" className="text-sm font-medium text-ink-dim hover:text-ink">
          Inloggen
        </Link>
      </header>

      <main>
        <section className="relative overflow-hidden px-6 pb-20 pt-10 sm:pt-16">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-accent/15 blur-[120px]"
          />
          <div className="relative mx-auto max-w-3xl text-center">
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Elke sessie een beter schema.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-ink-dim">
              Fitness Log bouwt je trainingsschema op basis van wetenschappelijk onderzoek — en
              past het gewicht na élke sessie automatisch aan.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/login">
                <Button size="md" className="px-8">
                  Start gratis
                </Button>
              </Link>
              <Link to="/login" className="text-sm font-medium text-ink-dim hover:text-ink">
                Heb je al een account? Inloggen →
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-border bg-surface p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  {feature.icon}
                </div>
                <h2 className="mt-4 font-display text-lg font-bold">{feature.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-dim">{feature.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link to="/login">
              <Button size="md" className="px-8">
                Start gratis
              </Button>
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-2xl px-6 py-16">
          <InstallCard />
        </section>

        <section className="border-t border-border px-6 py-16 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight">
            Stop met gokken naar gewichten.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-ink-dim">
            Twee minuten setup, en je hebt een schema dat met je meebeweegt.
          </p>
          <div className="mt-6 flex justify-center">
            <Link to="/login">
              <Button size="md" className="px-8">
                Start gratis
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-5xl px-6 py-8 text-sm text-ink-faint">Fitness Log</footer>
    </div>
  )
}
