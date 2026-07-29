import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ErrorState } from '../components/ui/States'

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
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <Link to="/" className="mb-8 text-center font-display text-lg font-bold">
        Fitness Log
      </Link>
      <h1 className="text-center font-display text-2xl font-bold">Inloggen</h1>
      <p className="mt-2 text-center text-sm text-ink-dim">
        Geen wachtwoord nodig — we sturen je een inloglink.
      </p>

      {status === 'sent' ? (
        <div className="mt-6 rounded-xl border border-accent/30 bg-accent/10 p-4 text-center text-sm text-ink">
          Check je mail! We hebben een inloglink gestuurd naar <strong>{email}</strong>.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <Input
            type="email"
            required
            placeholder="jij@voorbeeld.nl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" disabled={status === 'sending'} fullWidth>
            {status === 'sending' ? 'Bezig...' : 'Stuur inloglink'}
          </Button>
          {status === 'error' && <ErrorState message={errorMessage} />}
        </form>
      )}
    </div>
  )
}
