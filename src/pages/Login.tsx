import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Login() {
  const { session, signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  if (session) return <Navigate to="/app" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus('sending')
    const { error } = await signInWithEmail(email)
    if (error) {
      setErrorMessage(error)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="text-center text-2xl font-bold text-slate-900 dark:text-white">
        Inloggen bij Fitness Log
      </h1>

      {status === 'sent' ? (
        <p className="mt-6 rounded-lg bg-green-50 p-4 text-center text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
          Check je mail! We hebben een inloglink gestuurd naar {email}.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="jij@voorbeeld.nl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-brand-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={status === 'sending'}
            className="rounded-lg bg-brand-600 px-4 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {status === 'sending' ? 'Bezig...' : 'Stuur inloglink'}
          </button>
          {status === 'error' && <p className="text-sm text-red-600">{errorMessage}</p>}
        </form>
      )}
    </div>
  )
}
