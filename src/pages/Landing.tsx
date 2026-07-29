import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { InstallCard } from '../components/InstallCard'
import { useAuth } from '../contexts/AuthContext'

export function Landing() {
  const { session } = useAuth()
  const navigate = useNavigate()

  // A confirmation/magic-link click can land here (e.g. via a Supabase Site
  // URL fallback) even after successfully establishing a session — send the
  // user straight into the app instead of showing marketing content.
  useEffect(() => {
    if (session) navigate('/app', { replace: true })
  }, [session, navigate])

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-16">
      <main className="flex-1 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          Log je krachttraining.
          <br />
          Simpel. Snel. Overal.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600 dark:text-slate-400">
          Fitness Log is een gratis PWA om je workouts bij te houden — gewicht, herhalingen en
          voortgang, altijd binnen handbereik op je telefoon.
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <Link
            to={session ? '/app' : '/login'}
            className="rounded-lg bg-brand-600 px-6 py-3 font-medium text-white hover:bg-brand-700"
          >
            {session ? 'Naar mijn workouts' : 'Begin gratis'}
          </Link>
        </div>

        <div className="mt-16 grid gap-4 text-left sm:grid-cols-3">
          <Feature title="Snel loggen" description="Kies een oefening en noteer gewicht x reps per set." />
          <Feature
            title="Altijd bij de hand"
            description="Installeer als app op je telefoon, werkt ook zonder internet."
          />
          <Feature
            title="Binnenkort: schema's"
            description="Wetenschappelijk onderbouwde trainingsschema's, gepersonaliseerd voor jou."
          />
        </div>

        <div className="mt-16">
          <InstallCard />
        </div>
      </main>

      <footer className="mt-16 text-sm text-slate-400">Fitness Log</footer>
    </div>
  )
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  )
}
